# supabase/

Database migrations and (later) Edge Functions for M-cli. Stack rationale in
[`../docs/decisions/0008-tech-stack.md`](../docs/decisions/0008-tech-stack.md).

## Provision (one owner does this once)

1. Create a project at supabase.com. Note the project URL + anon key.
2. Link and push migrations:
   ```bash
   npx supabase link --project-ref <ref>
   npx supabase db push
   ```
3. Create the three owner logins in Auth → Users, then set each one's role:
   ```sql
   insert into profiles (id, full_name, role) values
     ('<auth-user-uuid>', 'Operator', 'owner'),
     ('<auth-user-uuid>', 'Aman', 'owner'),
     ('<auth-user-uuid>', 'Manjeet', 'owner');
   ```
   The delivery runner gets a login later with `role = 'delivery_runner'`.
4. Put the URL + anon key in `../web/.env.local` (see `../web/.env.example`).

## Migrations

| File | Adds |
|---|---|
| `0001_core_schema.sql` | profiles + roles, herd, production, wholesale, retail, daily balance, RLS |

Later migrations add feed, expenses, health, breeding (0009 milestones M2–M3).

**Rule:** never edit an applied migration — add a new one. After any RLS change,
run a scoped query as each affected role before trusting it.
