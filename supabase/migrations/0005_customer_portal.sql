-- 0005 customer portal — Milestone 4 (docs/decisions/0009)
-- Self-serve login for retail customers: phone + PIN, no Supabase Auth
-- account. Access goes only through SECURITY DEFINER functions below —
-- retail_customers/retail_orders/retail_pauses keep their existing
-- owner/delivery_runner-only RLS policies untouched (CLAUDE.md: narrow
-- resolver functions instead of a row-level grant to anon).
-- Requires 0004 (adds the 'customer' retail_order_source enum value).

create extension if not exists pgcrypto;

alter table retail_customers
  add column pin_hash text,
  add column portal_enabled boolean not null default true;

create index retail_customers_phone_idx on retail_customers (phone);

-- Distinguish self-service rows from owner/runner/whatsapp-bot-entered ones.
alter table retail_pauses drop constraint retail_pauses_created_via_check;
alter table retail_pauses add constraint retail_pauses_created_via_check
  check (created_via in ('whatsapp', 'bot', 'manual', 'customer'));

-- ---------------------------------------------------------------------------
-- Sessions
-- ---------------------------------------------------------------------------
create table customer_sessions (
  token       uuid primary key default gen_random_uuid(),
  customer_id uuid not null references retail_customers (id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '60 days'
);
create index customer_sessions_customer_idx on customer_sessions (customer_id);

-- RLS enabled, no policies: the table is reachable only via the
-- SECURITY DEFINER functions below (owned by the migration role, which
-- bypasses RLS as the table owner — same pattern as auth_role()/is_owner()).
alter table customer_sessions enable row level security;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function customer_from_token(p_token uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select customer_id from customer_sessions
  where token = p_token and expires_at > now()
$$;

-- ---------------------------------------------------------------------------
-- Auth
-- ---------------------------------------------------------------------------
create or replace function customer_login(p_phone text, p_pin text)
returns table(session_token uuid, customer_id uuid, customer_name text)
language plpgsql
security definer
set search_path = public, extensions -- crypt()/gen_salt() live in `extensions` on Supabase
as $$
declare
  v_customer retail_customers%rowtype;
  v_token    uuid;
begin
  select * into v_customer
  from retail_customers
  where phone = p_phone and status = 'active' and portal_enabled
  order by created_at
  limit 1;

  if v_customer.id is null then
    raise exception 'invalid_credentials';
  end if;

  if v_customer.pin_hash is null then
    -- first login: default PIN is the last 4 digits of the registered phone
    if p_pin is distinct from right(regexp_replace(coalesce(v_customer.phone, ''), '\D', '', 'g'), 4)
       or length(p_pin) < 4 then
      raise exception 'invalid_credentials';
    end if;
    update retail_customers set pin_hash = crypt(p_pin, gen_salt('bf'))
      where id = v_customer.id;
  elsif v_customer.pin_hash is distinct from crypt(p_pin, v_customer.pin_hash) then
    raise exception 'invalid_credentials';
  end if;

  insert into customer_sessions (customer_id) values (v_customer.id)
    returning token into v_token;

  return query select v_token, v_customer.id, v_customer.name;
end;
$$;

create or replace function customer_logout(p_token uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from customer_sessions where token = p_token
$$;

create or replace function customer_change_pin(p_token uuid, p_old_pin text, p_new_pin text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_customer_id uuid := customer_from_token(p_token);
  v_hash text;
begin
  if v_customer_id is null then raise exception 'not_authenticated'; end if;
  if p_new_pin !~ '^[0-9]{4,6}$' then raise exception 'invalid_pin'; end if;

  select pin_hash into v_hash from retail_customers where id = v_customer_id;
  if v_hash is distinct from crypt(p_old_pin, v_hash) then
    raise exception 'invalid_credentials';
  end if;

  update retail_customers set pin_hash = crypt(p_new_pin, gen_salt('bf'))
    where id = v_customer_id;
end;
$$;

-- Owner-side reset (drops the PIN back to "first login" / last-4-digits).
-- Called by an authenticated owner, not the customer portal — reuses is_owner().
create or replace function admin_reset_customer_pin(p_customer_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update retail_customers set pin_hash = null
  where id = p_customer_id and is_owner()
$$;

-- ---------------------------------------------------------------------------
-- Reads
-- ---------------------------------------------------------------------------
create or replace function customer_get_profile(p_token uuid)
returns table(
  id uuid, name text, phone text, area text, type retail_customer_type,
  fixed_daily_qty_kg numeric, price_per_kg numeric, payment_mode retail_payment_mode
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.name, c.phone, c.area, c.type, c.fixed_daily_qty_kg, c.price_per_kg, c.payment_mode
  from retail_customers c
  where c.id = customer_from_token(p_token)
$$;

create or replace function customer_get_orders(p_token uuid, p_from date, p_to date)
returns setof retail_orders
language sql
stable
security definer
set search_path = public
as $$
  select * from retail_orders
  where customer_id = customer_from_token(p_token)
    and delivery_date between p_from and p_to
  order by delivery_date
$$;

create or replace function customer_get_pauses(p_token uuid)
returns setof retail_pauses
language sql
stable
security definer
set search_path = public
as $$
  select * from retail_pauses
  where customer_id = customer_from_token(p_token)
  order by date_from desc
$$;

create or replace function customer_get_dues(p_token uuid)
returns table(pending_amount numeric, pending_deliveries int)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(sum(o.delivered_qty_kg * c.price_per_kg), 0)::numeric as pending_amount,
    count(*)::int as pending_deliveries
  from retail_orders o
  join retail_customers c on c.id = o.customer_id
  where o.customer_id = customer_from_token(p_token)
    and o.status = 'delivered' and o.paid = false
$$;

-- ---------------------------------------------------------------------------
-- Writes — orders & pauses
-- Cutoff mirrors web/src/lib/dates.ts (21:00 IST); enforced here too since
-- these functions are reachable directly with the anon key.
-- ---------------------------------------------------------------------------
create or replace function customer_place_order(p_token uuid, p_date date, p_qty numeric)
returns retail_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid := customer_from_token(p_token);
  v_now_ist     timestamp := now() at time zone 'Asia/Kolkata';
  v_min_date    date := case when extract(hour from v_now_ist) >= 21
                              then (v_now_ist::date + 2) else (v_now_ist::date + 1) end;
  v_row         retail_orders%rowtype;
begin
  if v_customer_id is null then raise exception 'not_authenticated'; end if;
  if p_qty < 0 or p_qty > 50 then raise exception 'invalid_quantity'; end if;
  if p_date < v_min_date then raise exception 'past_cutoff'; end if;

  select * into v_row from retail_orders
    where customer_id = v_customer_id and delivery_date = p_date and product = 'buffalo milk';

  if v_row.id is not null and v_row.status <> 'pending' then
    raise exception 'already_finalized';
  end if;

  if p_qty = 0 then
    if v_row.id is not null then
      delete from retail_orders where id = v_row.id;
    end if;
    return null;
  end if;

  insert into retail_orders (customer_id, delivery_date, product, ordered_qty_kg, source, status)
  values (v_customer_id, p_date, 'buffalo milk', p_qty, 'customer', 'pending')
  on conflict (customer_id, delivery_date, product)
  do update set ordered_qty_kg = excluded.ordered_qty_kg, source = 'customer'
  where retail_orders.status = 'pending'
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function customer_add_pause(p_token uuid, p_from date, p_to date, p_reason text default null)
returns retail_pauses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid := customer_from_token(p_token);
  v_min_date    date := ((now() at time zone 'Asia/Kolkata')::date) + 1;
  v_row         retail_pauses%rowtype;
begin
  if v_customer_id is null then raise exception 'not_authenticated'; end if;
  if p_to < p_from then raise exception 'invalid_range'; end if;
  if p_from < v_min_date then raise exception 'past_cutoff'; end if;

  insert into retail_pauses (customer_id, date_from, date_to, created_via, reason)
  values (v_customer_id, p_from, p_to, 'customer', p_reason)
  returning * into v_row;

  delete from retail_orders
    where customer_id = v_customer_id
      and delivery_date between p_from and p_to
      and status = 'pending';

  return v_row;
end;
$$;

create or replace function customer_remove_pause(p_token uuid, p_pause_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid := customer_from_token(p_token);
begin
  if v_customer_id is null then raise exception 'not_authenticated'; end if;
  delete from retail_pauses
    where id = p_pause_id and customer_id = v_customer_id
      and date_from > (now() at time zone 'Asia/Kolkata')::date;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants — functions only, never the underlying tables
-- ---------------------------------------------------------------------------
grant execute on function customer_login(text, text) to anon, authenticated;
grant execute on function customer_logout(uuid) to anon, authenticated;
grant execute on function customer_change_pin(uuid, text, text) to anon, authenticated;
grant execute on function customer_get_profile(uuid) to anon, authenticated;
grant execute on function customer_get_orders(uuid, date, date) to anon, authenticated;
grant execute on function customer_get_pauses(uuid) to anon, authenticated;
grant execute on function customer_get_dues(uuid) to anon, authenticated;
grant execute on function customer_place_order(uuid, date, numeric) to anon, authenticated;
grant execute on function customer_add_pause(uuid, date, date, text) to anon, authenticated;
grant execute on function customer_remove_pause(uuid, uuid) to anon, authenticated;
revoke execute on function admin_reset_customer_pin(uuid) from public;
grant execute on function admin_reset_customer_pin(uuid) to authenticated;
