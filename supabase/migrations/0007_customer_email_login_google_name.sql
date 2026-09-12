-- 0007 — Google sign-in reuses customer_email_login (0006) unchanged, since
-- it only needs auth.uid()/auth.email() which Google OAuth populates the
-- same way email OTP does. The one gap: Google sign-in has no form step to
-- collect a name, so fall back to the name Google puts in user_metadata
-- before falling back to the email's local part.
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
    select * into v_customer from retail_customers
      where lower(email) = lower(v_email) and auth_user_id is null
      limit 1;

    if v_customer.id is not null then
      update retail_customers set auth_user_id = v_uid where id = v_customer.id
        returning * into v_customer;
    else
      insert into retail_customers (name, email, phone, auth_user_id, type, status, price_per_kg)
      values (
        coalesce(
          nullif(trim(p_name), ''),
          nullif(trim(auth.jwt()->'user_metadata'->>'full_name'), ''),
          nullif(trim(auth.jwt()->'user_metadata'->>'name'), ''),
          split_part(v_email, '@', 1)
        ),
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
