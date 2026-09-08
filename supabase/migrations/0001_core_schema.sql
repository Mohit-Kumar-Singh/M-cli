-- 0001 core schema — M-cli (see docs/decisions/0007, 0008)
-- Milestone 0/1 tables: profiles + roles, herd, production, both sales
-- channels, daily balance. Feed / expenses / health / breeding come in later
-- migrations (0009 milestones M2–M3).

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type app_role as enum ('owner', 'delivery_runner', 'dairy_hand');
create type animal_status as enum
  ('heifer', 'milking', 'dry', 'pregnant', 'sick', 'sold', 'dead');
create type milk_session as enum ('morning', 'evening');
create type retail_customer_type as enum ('casual', 'regular');
create type retail_order_source as enum ('standing', 'bot', 'manual');
create type retail_order_status as enum
  ('pending', 'delivered', 'skipped', 'cancelled');
create type payment_method as enum ('upi', 'cash', 'none');
create type retail_payment_mode as enum ('per_delivery', 'recharge', 'monthly');

-- ---------------------------------------------------------------------------
-- profiles  (one row per auth user)
-- ---------------------------------------------------------------------------
create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  role        app_role not null default 'delivery_runner',
  created_at  timestamptz not null default now()
);

-- SECURITY DEFINER helper: read the caller's role without tripping RLS on
-- profiles (avoids the recursive-policy trap — see CLAUDE.md).
create or replace function auth_role()
returns app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth_role() = 'owner', false)
$$;

-- ---------------------------------------------------------------------------
-- Herd
-- ---------------------------------------------------------------------------
create table animals (
  id                uuid primary key default gen_random_uuid(),
  tag_no            text not null unique,
  name             text,
  breed            text,
  sex              text not null default 'female' check (sex in ('female', 'male')),
  dob              date,
  source           text check (source in ('born_on_farm', 'purchased')),
  purchase_date    date,
  purchase_cost    numeric(10, 2),
  dam_id           uuid references animals (id),
  status           animal_status not null default 'milking',
  lactation_number int,
  photo_path       text,
  disposal_date    date,
  disposal_reason  text,
  sale_amount      numeric(10, 2),
  notes            text,
  created_at       timestamptz not null default now()
);
create index animals_status_idx on animals (status);

-- ---------------------------------------------------------------------------
-- Production
-- ---------------------------------------------------------------------------
create table milk_production (
  id           uuid primary key default gen_random_uuid(),
  date         date not null default current_date,
  session      milk_session not null,
  animal_id    uuid references animals (id),
  qty_kg       numeric(6, 2) not null check (qty_kg >= 0),
  recorded_by  uuid references profiles (id),
  created_at   timestamptz not null default now(),
  unique (date, session, animal_id)
);
create index milk_production_date_idx on milk_production (date);

-- ---------------------------------------------------------------------------
-- Wholesale
-- ---------------------------------------------------------------------------
create table wholesale_customers (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  shop           text,
  phone          text,
  address        text,
  rate_per_kg    numeric(6, 2) not null default 0,
  payment_terms  text,
  notes          text,
  created_at     timestamptz not null default now()
);

create table wholesale_deliveries (
  id               uuid primary key default gen_random_uuid(),
  date             date not null default current_date,
  customer_id      uuid not null references wholesale_customers (id),
  qty_kg           numeric(7, 2) not null check (qty_kg >= 0),
  rate_per_kg      numeric(6, 2) not null,
  amount           numeric(10, 2) not null,
  paid             boolean not null default false,
  payment_method   payment_method not null default 'none',
  amount_received  numeric(10, 2),
  notes            text,
  created_at       timestamptz not null default now()
);
create index wholesale_deliveries_date_idx on wholesale_deliveries (date);

-- ---------------------------------------------------------------------------
-- Retail
-- ---------------------------------------------------------------------------
create table retail_customers (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  phone               text,
  address_text        text,
  area                text,
  type                retail_customer_type not null default 'casual',
  status              text not null default 'active' check (status in ('active', 'inactive')),
  fixed_daily_qty_kg  numeric(5, 2),
  price_per_kg        numeric(6, 2) not null default 60,
  regular_since       date,
  price_lock_until    date,
  payment_mode        retail_payment_mode not null default 'per_delivery',
  referral_source     text,
  round_sequence      int,
  notes               text,
  created_at          timestamptz not null default now()
);
create index retail_customers_status_idx on retail_customers (status);

create table retail_orders (
  id                uuid primary key default gen_random_uuid(),
  customer_id       uuid not null references retail_customers (id),
  delivery_date     date not null,
  product           text not null default 'buffalo milk',
  ordered_qty_kg    numeric(5, 2) not null check (ordered_qty_kg >= 0),
  source            retail_order_source not null default 'manual',
  status            retail_order_status not null default 'pending',
  delivered_qty_kg  numeric(5, 2),
  delivered_at      timestamptz,
  delivered_by      uuid references profiles (id),
  paid              boolean not null default false,
  payment_method    payment_method not null default 'none',
  amount_collected  numeric(10, 2),
  created_at        timestamptz not null default now(),
  unique (customer_id, delivery_date, product)
);
create index retail_orders_date_idx on retail_orders (delivery_date);

create table retail_pauses (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references retail_customers (id),
  date_from    date not null,
  date_to      date not null,
  created_via  text not null default 'manual' check (created_via in ('whatsapp', 'bot', 'manual')),
  reason       text,
  created_at   timestamptz not null default now(),
  check (date_to >= date_from)
);

-- ---------------------------------------------------------------------------
-- Daily milk balance
-- ---------------------------------------------------------------------------
create table daily_balance (
  date             date primary key,
  produced_kg      numeric(8, 2),
  sellable_kg      numeric(8, 2),
  wholesale_kg     numeric(8, 2),
  retail_kg        numeric(8, 2),
  own_use_kg       numeric(6, 2),
  wastage_kg       numeric(6, 2),
  buffer_start_kg  numeric(6, 2),
  buffer_end_kg    numeric(6, 2),
  cash_total       numeric(10, 2),
  upi_total        numeric(10, 2),
  unpaid_total     numeric(10, 2),
  notes            text
);

-- ---------------------------------------------------------------------------
-- Row-Level Security
--   owner        → full access to everything
--   dairy_hand   → read/write production only
--   delivery_run → read retail customers + today's orders, update those orders
-- Verify by querying as each role before trusting this (CLAUDE.md).
-- ---------------------------------------------------------------------------
alter table profiles             enable row level security;
alter table animals              enable row level security;
alter table milk_production       enable row level security;
alter table wholesale_customers   enable row level security;
alter table wholesale_deliveries  enable row level security;
alter table retail_customers      enable row level security;
alter table retail_orders         enable row level security;
alter table retail_pauses         enable row level security;
alter table daily_balance         enable row level security;

-- profiles: see your own row; owners see all; owners manage roles
create policy profiles_self_read on profiles
  for select using (id = auth.uid() or is_owner());
create policy profiles_owner_write on profiles
  for all using (is_owner()) with check (is_owner());

-- owner-only tables (full CRUD)
create policy animals_owner on animals
  for all using (is_owner()) with check (is_owner());
create policy wholesale_customers_owner on wholesale_customers
  for all using (is_owner()) with check (is_owner());
create policy wholesale_deliveries_owner on wholesale_deliveries
  for all using (is_owner()) with check (is_owner());
create policy retail_pauses_owner on retail_pauses
  for all using (is_owner()) with check (is_owner());
create policy daily_balance_owner on daily_balance
  for all using (is_owner()) with check (is_owner());

-- production: owner full; dairy_hand read + insert + update
create policy milk_production_owner on milk_production
  for all using (is_owner()) with check (is_owner());
create policy milk_production_hand_read on milk_production
  for select using (auth_role() = 'dairy_hand');
create policy milk_production_hand_write on milk_production
  for insert with check (auth_role() = 'dairy_hand');
create policy milk_production_hand_update on milk_production
  for update using (auth_role() = 'dairy_hand') with check (auth_role() = 'dairy_hand');

-- retail customers: owner full; delivery_runner read-only
create policy retail_customers_owner on retail_customers
  for all using (is_owner()) with check (is_owner());
create policy retail_customers_runner_read on retail_customers
  for select using (auth_role() = 'delivery_runner');

-- retail orders: owner full; delivery_runner read + update (mark delivered/paid)
create policy retail_orders_owner on retail_orders
  for all using (is_owner()) with check (is_owner());
create policy retail_orders_runner_read on retail_orders
  for select using (auth_role() = 'delivery_runner');
create policy retail_orders_runner_update on retail_orders
  for update using (auth_role() = 'delivery_runner')
  with check (auth_role() = 'delivery_runner');
