-- 0002 — Milestone 2 depth: Feed, Expenses, Health (docs/decisions/0007 M4-M6)
-- Adds feed stock tracking, categorised expenses + recurring templates, and a
-- health log whose milk-withdrawal dates feed the daily balance.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type feed_category as enum
  ('green_fodder', 'dry_fodder', 'concentrate', 'mineral', 'other');
create type feed_scope as enum ('herd', 'group', 'animal');
create type expense_category as enum
  ('labour', 'electricity', 'water', 'equipment', 'maintenance',
   'transport', 'vet', 'feed', 'rent', 'misc');
create type expense_cadence as enum ('weekly', 'monthly');
create type health_scope as enum ('animal', 'herd');
create type health_event_type as enum
  ('vaccination', 'deworming', 'illness', 'treatment', 'vet_visit', 'injury');

-- ---------------------------------------------------------------------------
-- Feed
-- ---------------------------------------------------------------------------
create table feed_items (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  category       feed_category not null default 'other',
  unit           text not null default 'kg',
  current_stock  numeric(10, 2) not null default 0,
  notes          text,
  created_at     timestamptz not null default now()
);

create table feed_purchases (
  id            uuid primary key default gen_random_uuid(),
  date          date not null default current_date,
  feed_item_id  uuid not null references feed_items (id) on delete restrict,
  qty           numeric(10, 2) not null check (qty > 0),
  cost          numeric(10, 2) not null check (cost >= 0),
  supplier      text,
  notes         text,
  created_at    timestamptz not null default now()
);
create index feed_purchases_date_idx on feed_purchases (date);

create table feed_consumption (
  id            uuid primary key default gen_random_uuid(),
  date          date not null default current_date,
  feed_item_id  uuid not null references feed_items (id) on delete restrict,
  qty           numeric(10, 2) not null check (qty > 0),
  scope         feed_scope not null default 'herd',
  animal_id     uuid references animals (id),
  notes         text,
  created_at    timestamptz not null default now()
);
create index feed_consumption_date_idx on feed_consumption (date);

-- keep feed_items.current_stock in step with purchases / consumption
create or replace function feed_stock_apply()
returns trigger
language plpgsql
as $$
declare
  sign int := case tg_argv[0] when 'add' then 1 else -1 end;
begin
  if tg_op = 'INSERT' then
    update feed_items set current_stock = current_stock + sign * new.qty
      where id = new.feed_item_id;
    return new;
  elsif tg_op = 'DELETE' then
    update feed_items set current_stock = current_stock - sign * old.qty
      where id = old.feed_item_id;
    return old;
  end if;
  return null;
end $$;

create trigger feed_purchases_stock
  after insert or delete on feed_purchases
  for each row execute function feed_stock_apply('add');
create trigger feed_consumption_stock
  after insert or delete on feed_consumption
  for each row execute function feed_stock_apply('sub');

-- ---------------------------------------------------------------------------
-- Expenses
-- ---------------------------------------------------------------------------
create table expenses (
  id              uuid primary key default gen_random_uuid(),
  date            date not null default current_date,
  category        expense_category not null default 'misc',
  amount          numeric(10, 2) not null check (amount >= 0),
  paid_to         text,
  payment_method  payment_method not null default 'none',
  linked_ref      text,
  notes           text,
  created_at      timestamptz not null default now()
);
create index expenses_date_idx on expenses (date);

create table expense_templates (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  category    expense_category not null default 'misc',
  amount      numeric(10, 2) not null check (amount >= 0),
  cadence     expense_cadence not null default 'monthly',
  active      boolean not null default true,
  notes       text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Health
-- ---------------------------------------------------------------------------
create table health_events (
  id                    uuid primary key default gen_random_uuid(),
  scope                 health_scope not null default 'animal',
  animal_id             uuid references animals (id),
  event_type            health_event_type not null,
  event_date            date not null default current_date,
  product_used          text,
  dose                  text,
  milk_withdrawal_until  date,
  meat_withdrawal_until  date,
  cost                  numeric(10, 2) not null default 0 check (cost >= 0),
  vet_name              text,
  next_due_date         date,
  notes                 text,
  created_at            timestamptz not null default now(),
  check (scope = 'herd' or animal_id is not null)
);
create index health_events_date_idx on health_events (event_date);
create index health_events_withdrawal_idx on health_events (milk_withdrawal_until);

-- a health event with a cost also lands in expenses (category 'vet')
create or replace function health_event_expense()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' and new.cost > 0 then
    insert into expenses (date, category, amount, paid_to, notes, linked_ref)
    values (new.event_date, 'vet', new.cost, new.vet_name,
            'Auto from health event', 'health:' || new.id);
  elsif tg_op = 'DELETE' then
    delete from expenses where linked_ref = 'health:' || old.id;
  end if;
  return coalesce(new, old);
end $$;

create trigger health_events_expense
  after insert or delete on health_events
  for each row execute function health_event_expense();

-- ---------------------------------------------------------------------------
-- View: milk that is not sellable on a given date because the animal is under
-- a veterinary withdrawal. The daily balance subtracts this from production.
-- ---------------------------------------------------------------------------
create or replace function withdrawn_milk_kg(on_date date)
returns numeric
language sql
stable
as $$
  select coalesce(sum(mp.qty_kg), 0)
  from milk_production mp
  where mp.date = on_date
    and mp.animal_id in (
      select he.animal_id from health_events he
      where he.scope = 'animal'
        and he.milk_withdrawal_until is not null
        and he.event_date <= on_date
        and he.milk_withdrawal_until >= on_date
    )
$$;

-- ---------------------------------------------------------------------------
-- RLS
--   owner       -> full on everything
--   dairy_hand  -> feed items/purchases/consumption (read + insert)
-- ---------------------------------------------------------------------------
alter table feed_items        enable row level security;
alter table feed_purchases    enable row level security;
alter table feed_consumption  enable row level security;
alter table expenses          enable row level security;
alter table expense_templates enable row level security;
alter table health_events     enable row level security;

create policy feed_items_owner on feed_items
  for all using (is_owner()) with check (is_owner());
create policy feed_purchases_owner on feed_purchases
  for all using (is_owner()) with check (is_owner());
create policy feed_consumption_owner on feed_consumption
  for all using (is_owner()) with check (is_owner());
create policy expenses_owner on expenses
  for all using (is_owner()) with check (is_owner());
create policy expense_templates_owner on expense_templates
  for all using (is_owner()) with check (is_owner());
create policy health_events_owner on health_events
  for all using (is_owner()) with check (is_owner());

create policy feed_items_hand_read on feed_items
  for select using (auth_role() = 'dairy_hand');
create policy feed_purchases_hand on feed_purchases
  for select using (auth_role() = 'dairy_hand');
create policy feed_purchases_hand_ins on feed_purchases
  for insert with check (auth_role() = 'dairy_hand');
create policy feed_consumption_hand on feed_consumption
  for select using (auth_role() = 'dairy_hand');
create policy feed_consumption_hand_ins on feed_consumption
  for insert with check (auth_role() = 'dairy_hand');
