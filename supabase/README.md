# supabase/

Database migrations and (later) Edge Functions for M-cli. Stack rationale in
[`../docs/decisions/0008-tech-stack.md`](../docs/decisions/0008-tech-stack.md).

## Provisioned

- Project ref: **`pcwelnsubcbmftksnsjf`**, region ap-south-1 (Mumbai), free tier.
- URL: `https://pcwelnsubcbmftksnsjf.supabase.co`
- Migration `0001_core_schema.sql` is **applied**. RLS verified by scoped query
  as owner / delivery_runner / unknown user.
- `../web/.env.local` is set with the URL + publishable key.

## Remaining one-time step — create the logins (an owner does this)

1. In the Supabase dashboard → **Authentication → Users → Add user**, create a
   login (email + password) for the operator, Aman, and Manjeet.
2. Copy each user's UID, then in **SQL Editor** run:
   ```sql
   insert into profiles (id, full_name, role) values
     ('<operator-uid>', 'Operator', 'owner'),
     ('<aman-uid>',     'Aman',     'owner'),
     ('<manjeet-uid>',  'Manjeet',  'owner');
   ```
   (New signups default to `role = 'delivery_runner'` until promoted here.)
3. The delivery runner gets their own login later, left at
   `role = 'delivery_runner'`.

## Applying later migrations

```bash
npx supabase link --project-ref pcwelnsubcbmftksnsjf
npx supabase db push
```

## Migrations

| File | Adds |
|---|---|
| `0001_core_schema.sql` | profiles + roles, herd, production, wholesale, retail, daily balance, RLS |

Later migrations add feed, expenses, health, breeding (0009 milestones M2–M3).

**Rule:** never edit an applied migration — add a new one. After any RLS change,
run a scoped query as each affected role before trusting it.
