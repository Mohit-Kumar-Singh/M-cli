# 0009 — Build sequence

- **Status:** Accepted
- **Date:** 2026-09-09

One build track (0001 "everything together"), but sequenced so a usable core
lands first. November 2026 is the aim for **Milestone 1**; the full feature set
(0007) follows right after — not all on day one.

## Milestone 0 — Scaffold ✅ in progress

- `web/` — Vite + React + TS + Tailwind + PWA, app shell, routing, auth.
- `supabase/` — project config, core schema migration, RLS, roles.
- Auth + role gating (owner / delivery runner).
- Deploy pipeline (Vercel + Supabase) wired.

## Milestone 1 — Usable core (target: November launch)

- **Herd** — register, list, animal detail, add/edit/dispose.
- **Production** — session-entry grid, herd/animal rollups.
- **Retail sales** — customers, Tomorrow's orders (manual entry + standing
  orders + cutoff), Today's delivery list, mark delivered + collect payment.
- **Wholesale sales** — customers, daily dispatch entry, dues.
- **Daily milk balance** — the reconciliation screen.
- **Basic dashboard** — today's milk + money, regulars-vs-15.

## Milestone 2 — Depth

- **Feed** — items, purchases, consumption, cost/kg-milk.
- **Expenses** — categorized, recurring templates.
- **Health** — log, vaccination schedule, withdrawal periods feeding the daily
  balance.
- **Financials** — cost/kg, contribution by channel, receivables.

## Milestone 3 — Breeding & automation

- **Breeding** — events, calving → new herd record, calendar, dry-off
  reminders.
- **WhatsApp bot** — order + pause via Meta Cloud API webhook.
- **Nightly cutoff job** — freeze tomorrow's list, generate standing orders.

## Milestone 4 — Customer-facing & offline

- Customer login: self-serve order / pause / balance.
- Recharge wallet + monthly invoicing for regulars (0003).
- Offline delivery marking (PWA + local queue).

## Not scheduled

- Multi-product (curd / paneer / ghee).
- Multi-farm / third-party vendor milk intake (0006 growth path).
