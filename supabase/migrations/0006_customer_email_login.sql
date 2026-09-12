-- 0006 — customer self-service sign-up via email (magic link)
-- New customers (not yet added by the owner) can sign in with just an
-- email, verified via Supabase Auth's magic link — no SMS/DLT cost or
-- paperwork (see docs/decisions discussion). On first successful email
-- verification this creates their retail_customers row automatically.
-- Existing phone+PIN customers (0005) are untouched; both paths mint the
-- same customer_sessions token so the rest of the app (Order/Pauses/
-- Account, all keyed on p_token) needs no changes.

alter table retail_customers
  add column email text,
  add column auth_user_id uuid references auth.users (id) on delete set null;

create unique index retail_customers_auth_user_id_idx
  on retail_customers (auth_user_id) where auth_user_id is not null;
create index retail_customers_email_idx on retail_customers (lower(email));

-- Called by the browser right after Supabase Auth verifies the magic link,
-- while the caller still holds that short-lived Auth session (role
-- `authenticated`, auth.uid()/auth.email() populated). Links to an existing
-- row by email if the owner had already added this person, otherwise
-- creates a new casual customer. Mints a normal customer_sessions token so
-- every other customer_* RPC keeps working unchanged.
create or replace function customer_email_login(p_name text default null, p_phone text default null)
returns table(session_token uuid, customer_id uuid, customer_name text, is_new boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email    text := auth.email();
  v_uid      uuid := auth.uid();
  v_customer retail_customers%rowtype;
  v_token    uuid;
  v_new      boolean := false;
begin
  if v_email is null or v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_customer from retail_customers where auth_user_id = v_uid;

  if v_customer.id is null then
    -- owner may have already added this person by email without a login yet
    select * into v_customer from retail_customers
      where lower(email) = lower(v_email) and auth_user_id is null
      limit 1;

    if v_customer.id is not null then
      update retail_customers set auth_user_id = v_uid where id = v_customer.id
        returning * into v_customer;
    else
      insert into retail_customers (name, email, phone, auth_user_id, type, status, price_per_kg)
      values (
        coalesce(nullif(trim(p_name), ''), split_part(v_email, '@', 1)),
        v_email,
        nullif(trim(p_phone), ''),
        v_uid,
        'casual',
        'active',
        60
      )
      returning * into v_customer;
      v_new := true;
    end if;
  end if;

  insert into customer_sessions (customer_id) values (v_customer.id)
    returning token into v_token;

  return query select v_token, v_customer.id, v_customer.name, v_new;
end;
$$;

grant execute on function customer_email_login(text, text) to authenticated;
revoke execute on function customer_email_login(text, text) from public, anon;

-- Surface email on the profile the portal already reads.
drop function customer_get_profile(uuid);

create or replace function customer_get_profile(p_token uuid)
returns table(
  id uuid, name text, phone text, email text, area text, type retail_customer_type,
  fixed_daily_qty_kg numeric, price_per_kg numeric, payment_mode retail_payment_mode
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.name, c.phone, c.email, c.area, c.type, c.fixed_daily_qty_kg, c.price_per_kg, c.payment_mode
  from retail_customers c
  where c.id = customer_from_token(p_token)
$$;

grant execute on function customer_get_profile(uuid) to anon, authenticated;
