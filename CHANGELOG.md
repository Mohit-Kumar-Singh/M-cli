# Changelog

Milk Garage web app. Versions are `web/package.json` + a matching `vX.Y.Z` git
tag, bumped on every user-visible push (see `docs/decisions/0010-versioning.md`).
The running version is shown in the app (sidebar, "More" sheet, sign-in screen).

## v0.8.0 — 2026-09-12 — Milestone 4: Customer portal

- **Customer booking portal** at `/book` — phone + PIN sign-in (no Supabase
  Auth account; first login defaults the PIN to the last 4 digits of the
  registered phone). Customers can place/edit their own daily order up to
  the 9 pm cutoff, add/remove delivery pauses, see upcoming and recent
  orders, check pending dues, and change their PIN.
- Access goes only through new `SECURITY DEFINER` RPC functions
  (`customer_login`, `customer_get_orders`, `customer_place_order`, etc.) —
  `retail_customers`/`retail_orders`/`retail_pauses` keep their existing
  owner/delivery_runner-only RLS; verified as `anon` against a real customer
  row, with the test writes cleaned up afterward.
- Owner-side: a "Customer portal" link and a "Reset PIN" action on each
  customer in Retail customers.
- Migrations `0004` (enum value) + `0005` (portal schema, functions, grants).

## v0.7.0 — 2026-09-09 — Milestone 3: Breeding

- **Breeding & reproduction** screen: log heat / service / pregnancy check /
  calving / dry-off / abortion. A service auto-sets expected calving at
  +310 days; a positive PD marks the dam pregnant; a calving bumps her
  lactation number, sets her back to milking, and (optionally) registers the
  calf as a heifer with the dam linked. Upcoming-calvings list with dry-off
  dates.
- Migration `0003`; RLS + triggers verified.
- Placeholder screens removed — every nav item is now live.

## v0.6.0 — 2026-09-09 — Milestone 1 leftovers

- **Animal detail** (`/herd/:id`): identity, edit, 30-day production history,
  per-animal health log, and a "mark sold / died" flow (date, reason, sale
  amount). Herd rows are now tappable.
- **Retail pauses UI**: on a regular customer, an "Upcoming pauses" section to
  add / remove pause date-ranges (previously only settable via the DB).

## v0.5.0 — 2026-09-09 — Milestone 2: depth

- **Feed & inputs**: feed items with live stock, purchase and consumption
  entry (stock auto-adjusts via DB triggers), recent movements, month spend.
- **Expenses**: categorised expense log, month total + per-category breakdown,
  recurring templates with one-tap "post this month".
- **Health & veterinary**: event log (vaccination / deworming / illness /
  treatment / vet visit / injury), vaccination schedule with overdue flags,
  active milk-withdrawal list. A cost on an event auto-creates a "vet" expense.
- **Daily milk balance** now subtracts milk under vet withdrawal from the
  sellable total (`withdrawn_milk_kg` DB function).
- **Dashboard**: revenue this month, spend this month, and cost per kg
  (feed + expenses ÷ kg produced).
- Migration `0002`; RLS verified (owner full, dairy_hand → feed only).

## v0.4.0 — 2026-09-09

- New **Settings** screen (`/settings`): Account (name, email, role, sign out),
  Appearance (System / Light / Dark theme picker), About (app version, commit,
  build date, "Reload app"). Reachable from a gear in the mobile top bar, the
  desktop sidebar, and the "More" sheet.
- Version is now shown in the phone app in Settings › About as well as the
  "More" sheet.

## v0.3.0 — 2026-09-09

- Show the build version (`vX.Y.Z`, with commit SHA + build date on hover) in
  the portal — sidebar footer, mobile "More" sheet, and the sign-in screen.
- Version stamped into the bundle at build time from `package.json` + `git`.

## v0.2.0 — 2026-09-09 _(pre-tag; released as this baseline)_

- **Rebrand to Milk Garage** — brand mark, wordmark, favicon + app icons.
- Design-token system (light / dark, system-aware, persisted toggle), reusable
  UI kit, desktop-sidebar / mobile-bottom-nav layout.
- PWA — manifest, maskable icons, service worker, offline fallback.
- Fixed the iOS PWA status-bar overlap; safe-area insets across header, bottom
  nav, sheets and the sign-in screen; responsive down to 320 px.
- Vercel config (`vercel.json`, `.env.production`).

## v0.1.0 — 2026-09-07 _(pre-tag)_

- Milestone 0 scaffold + Supabase schema (`0001`), RLS, roles.
- Milestone 1 screens: Dashboard, Herd, Production, Retail customers, Orders,
  Delivery list, Wholesale, Daily milk balance.
