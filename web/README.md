# web/

M-cli front-end — React + Vite + TypeScript + Tailwind, mobile-first PWA.
See [`../docs/decisions/0007-application-spec.md`](../docs/decisions/0007-application-spec.md)
for features and [`0009`](../docs/decisions/0009-build-sequence.md) for build order.

## Run

```bash
npm install
cp .env.example .env.local   # fill from your Supabase project
npm run dev
```

The app renders without Supabase configured (screens can be built before the
backend exists) — sign-in and data loading are disabled until `.env.local` is
set.

## Layout

| Path | |
|---|---|
| `src/lib/supabase.ts` | client |
| `src/lib/auth.tsx` | session + profile/role context |
| `src/components/Layout.tsx` | header + role-filtered nav |
| `src/pages/` | one file per screen; `Placeholder.tsx` stands in for unbuilt modules |
| `src/types/db.ts` | hand-written DB types — regenerate from Supabase once linked |

## Status (Milestone 0/1 — see ../docs/decisions/0009)

- ✅ Scaffold, auth, role-gated nav
- ✅ Dashboard counts · Herd (list + add)
- ✅ Production (session grid) · Retail customers · Orders-for-a-day · Delivery list
- ✅ Wholesale (customers + dispatch + dues) · Daily milk balance
- ⬜ Animal detail/dispose, pause-management UI, dashboard milk/money rollups,
  PWA plugin, Vercel deploy

Supabase project `pcwelnsubcbmftksnsjf` is live and `.env.local` is set. The
app is fully usable once the three owner logins exist (see `../supabase/README.md`).
