# Changelog

Milk Garage web app. Versions are `web/package.json` + a matching `vX.Y.Z` git
tag, bumped on every user-visible push (see `docs/decisions/0010-versioning.md`).
The running version is shown in the app (sidebar, "More" sheet, sign-in screen).

## v0.10.0 — 2026-09-13 — Self-service sign-up via email

- New customers who haven't been added by the owner yet can now sign up on
  `/book` with just their name + email — no SMS cost or DLT registration.
  Verified via Supabase Auth's email magic link; on first successful
  verification a casual `retail_customers` row is created automatically
  (or linked, if the owner had already added them by that email).
- Existing phone+PIN customers are unaffected — both paths mint the same
  `customer_sessions` token, so the rest of the portal (Order/Pauses/
  Account) needed no changes.
- New RPC `customer_email_login` (migration `0006`), grantable only to
  `authenticated` (a real, Supabase-Auth-verified session) — a spoofed
  `auth.uid()` is rejected by the `auth.users` foreign key, verified by
  attempting exactly that as `authenticated` with a fabricated JWT claim.
- **Requires one manual step in the Supabase dashboard**: add
  `https://m-cli.vercel.app/book/verify` under Authentication → URL
  Configuration → Redirect URLs, or the magic link will fail to return to
  the app. Supabase's built-in mailer is rate-limited — fine for early
  testing, but wire up custom SMTP (e.g. Resend's free tier) there before
  relying on this for real customer growth.

## v0.9.0 — 2026-09-12 — /book installs as its own app

- The customer portal now installs to the home screen as a **separate app**
  from the owner console — its own name ("Milk Garage — Order"), its own
  `manifest-customer.webmanifest` (`start_url`/`scope` `/book`), distinct
  iOS home-screen title. Same deployment, same service worker, same
  Supabase backend as the owner dashboard — just a distinct installable
  identity so a customer's phone shows a dedicated "order milk" icon
  instead of the staff console.
- `web/src/lib/appShell.ts` swaps the `<link rel="manifest">`, page title,
  and `apple-mobile-web-app-title` on route mount (owner shell vs `/book`).

## v0.8.1 — 2026-09-12 — Fix quantity inputs squeezed on narrow screens

- `.mg-input { width: 100% }` in `web/src/index.css` beat Tailwind's `w-*`
  utilities applied directly to `<Input>` (same-specificity, later in the
  stylesheet), so the qty inputs in Retail orders, Production, and
  Deliveries stretched to fill their flex row instead of holding a fixed
  width — overlapping sibling text on narrow (~375px) viewports.
- Fixed by wrapping each `<Input>` in a `<div className="w-XX shrink-0">`
  and dropping the width utility from the `Input` itself, matching the
  pattern already used in the customer portal's order screen.

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
