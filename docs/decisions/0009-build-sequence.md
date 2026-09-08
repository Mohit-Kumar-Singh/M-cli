# 0009 — Build sequence

- **Status:** Accepted
- **Date:** 2026-09-09

One build track (0001 "everything together"), but sequenced so a usable core
lands first. November 2026 is the aim for **Milestone 1**; the full feature set
(0007) follows right after — not all on day one.

## Milestone 0 — Scaffold ✅ done

- `web/` — Vite + React + TS + Tailwind, app shell, routing, auth.
- **Rebrand to Milk Garage** — design-token system, system/light/dark theme,
  reusable UI kit, desktop-sidebar / mobile-bottom-nav layout, brand mark +
  icons.
- **PWA** — manifest, maskable icons, service worker (`vite-plugin-pwa`),
  offline shell + `public/offline.html`. SW excludes Supabase traffic.
- `supabase/` — core schema migration `0001`, RLS, roles. Project provisioned
  (`pcwelnsubcbmftksnsjf`, ap-south-1), migration applied, RLS verified by
  scoped query as owner / delivery_runner / unknown.
- Auth + role-gated nav (owner / delivery_runner / dairy_hand).
- **Deploy pipeline** — Vercel (root `web/`, Vite preset, `vercel.json`).

## Milestone 1 — Usable core (target: November launch)

- ✅ **Herd** — register, list, add. (Animal detail / dispose still to do.)
- ✅ **Production** — session-entry grid, day/session totals.
- ✅ **Retail sales** — customers (+ 6-month price lock on regulars),
  Orders-for-a-day (standing orders + casual add + 9 pm cutoff freeze),
  Delivery list (round order, mark delivered/skipped + collect payment).
- ✅ **Wholesale sales** — customers with running dues, daily dispatch entry.
- ✅ **Daily milk balance** — computed produced/wholesale/retail + entered
  own-use/wastage/buffer, unaccounted-kg check, cash/UPI/unpaid.
- ◑ **Dashboard** — live counts done; milk/money rollups still to add.
- ⬜ Animal detail page, retail pause management UI, conversion-candidates view.

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
