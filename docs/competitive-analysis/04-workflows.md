# Workflow Catalogue

End-to-end workflows, compared side-by-side where a reference platform
describes one that overlaps with Milk Garage. Milk Garage's own workflow is
described from the actual current code (`web/src/pages/*`), not inferred.

---

## Workflow: Customer places a recurring order

**Milk Garage (confirmed, from code)**:
1. Owner marks a customer `regular` with a `fixed_daily_qty_kg` — this
   becomes the default quantity every day automatically (RetailOrders.tsx
   pre-fills it).
2. Customer (via `/book`) can override any single day's quantity or set it
   to 0 to skip, up to the 9pm cutoff for that delivery date
   (`customer_place_order` RPC, migration `0005`).
3. After 9pm, that date is frozen; the earliest editable date rolls to the
   day after tomorrow (`nextDeliveryDate()` in `lib/dates.ts`).
4. A pause (date range) auto-cancels any pending order already placed in
   that range (`customer_add_pause` RPC deletes overlapping pending
   orders).

**Reference platforms (Milk Delivery Solutions / Milkride, both "Subscription
Management" — Confirmed feature existence, `UNKNOWN — REQUIRES
VERIFICATION` exact mechanics)**:
- **INFERRED** difference: likely support arbitrary weekday patterns
  (e.g., "Mon/Wed/Fri only"), not just "daily unless paused." Milk Garage
  cannot currently express "skip Sundays every week" without manually
  adding a pause each week — a real, buildable gap if this pattern comes
  up in practice (worth waiting for a real customer request before
  building, per the project's own bias toward not over-engineering ahead
  of need).

---

## Workflow: New customer signs up without owner involvement

**Milk Garage (confirmed, from code, v0.10.0–v0.11.0)**:
1. Customer opens `/book` → "New — sign up" tab.
2. Either: (a) enters name + email → gets a magic link → taps it → lands
   back in-app signed in, or (b) taps "Continue with Google" → OAuth
   consent → lands back in-app signed in.
3. `customer_email_login` RPC (migration `0006`/`0007`) creates a `casual`
   `retail_customers` row automatically on first successful verification,
   or links to an existing row if the owner had already pre-added them by
   that email.
4. A `customer_sessions` token is minted — same token system phone+PIN
   customers use, so the rest of the app doesn't need to know which login
   method was used.

**Reference platforms**: `UNKNOWN — REQUIRES VERIFICATION` whether any of
the six researched platforms support *fully self-service* signup at all —
none of the fetched pages describe a "customer signs themselves up with no
admin action" flow; the language throughout (Milk Delivery Solutions'
"Create, edit and remove customer profiles" under **Admin** actions,
Simple Dairy's "customer book") suggests these platforms assume the dairy
owner adds each customer, matching Milk Garage's *original* design before
this session's email/Google addition. **This is plausibly a genuine
differentiator for Milk Garage** — self-service signup via email/Google
with zero SMS cost — but this can't be stated as confirmed without
directly testing each platform's actual signup flow (none were tested;
marketing pages don't show the login screen).

---

## Workflow: Daily delivery round execution

**Milk Garage (confirmed, from code)**:
1. Owner builds the day's order list (RetailOrders.tsx) from standing
   quantities + casual add-ons, before the 9pm cutoff the prior night.
2. Next day, Deliveries.tsx shows the frozen list sorted by
   `round_sequence`; whoever runs the round marks each stop
   delivered/skipped, enters actual quantity + payment method inline.
3. Daily balance (Balance.tsx) reconciles produced vs. wholesale + retail
   + own-use + wastage + buffer, flags any unaccounted kg.

**Reference platforms (Milk Delivery Solutions' Driver App, Milkride's
Driver App + AssignIQ — Confirmed feature existence)**:
- Both name a **separate driver-facing app** with GPS navigation,
  proof-of-delivery capture (photo/signature/OTP), and (Milkride) an
  assignment engine to route stops to specific drivers.
- **Gap vs. Milk Garage**: Milk Garage has no separate driver identity —
  the `delivery_runner` role exists in the schema
  (`app_role` enum, migration `0001`) and the Deliveries screen is already
  gated to `owner`/`delivery_runner`, but there's no GPS/photo/signature
  capture, and no auto-assignment (moot with one delivery round).
  **INFERRED**: not worth building until there's a delivery person who
  isn't also the one checking the dashboard.

---

## Workflow: Reconciling money at day's end

**Milk Garage (confirmed, from code)**: Balance.tsx computes accounted-for
kg and cash/UPI/unpaid totals from the day's `retail_orders` +
`wholesale_deliveries` + manually entered own-use/wastage/buffer figures,
flags a >0.5kg discrepancy as `danger`.

**Reference platforms (Simple Dairy's "Reports & Money" module — Confirmed
features, not exact mechanics)**:
- Named features: daily sales (detail + product-wise), **dues list with
  WhatsApp reminders**, expense categories, Excel export.
- **Gap vs. Milk Garage**: no aggregated "who owes money right now" view
  (Milk Garage tracks `paid`/`unpaid` per individual order, but nothing
  rolls that up into a per-customer running balance the way a
  `wholesale_customers` "outstanding" figure might). No WhatsApp reminder
  mechanism at all (matches the still-open WhatsApp bot item in
  `docs/decisions/0009`). No Excel/CSV export anywhere in Milk Garage.

---

## Workflow: Milk collection from external farmers/vendors

**Milk Garage**: not built — `docs/decisions/0006` names "securing good
milk from other milk vendor and redistributing it" as a growth-path option
if production needs to scale beyond the herd, but no schema or screen
exists for it yet.

**Reference platform (Swadha — Confirmed feature existence via search
snippet only, page unfetchable)**: dedicated collection-side module —
farmer payment history, SNF/Fat-based auto-pricing, per-farmer rate
charts, WhatsApp daily reports to farmers (this last point actually from
Simple Dairy's Milk Collection module, which was fetched and confirmed —
Swadha's exact mechanics remain `UNKNOWN — REQUIRES VERIFICATION`).
- **If this growth path is pursued**: Simple Dairy's "Milk Collection"
  module (see `02-features.md`) is the best-documented reference so far
  for what this needs — farmer records, per-farmer rate, SNF/Fat pricing
  formula (formula itself not yet researched — flag as a follow-up if
  this becomes real).

---

## Workflow: Owner resets a customer's forgotten portal credential

**Milk Garage (confirmed, from code)**: Owner opens the customer's edit
form in RetailCustomers.tsx → "Reset PIN" button → calls
`admin_reset_customer_pin` RPC → `pin_hash` cleared → customer can sign in
again with phone + last-4-digits default.

**Reference platforms**: `UNKNOWN — REQUIRES VERIFICATION` — no fetched
page describes admin-side credential recovery for the customer app. Likely
exists in some form (standard support-desk operation for any platform with
customer accounts) but no evidence either way.
