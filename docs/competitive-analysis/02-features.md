# Complete Feature Catalogue

Organized by platform, then module. Each feature record follows the same
shape: Description · Purpose · User role · How it works · Inputs/Outputs ·
Business logic · Dependencies · Pricing/tier · Related features · Source ·
Confidence · Notes. Where a field is genuinely unknown it's marked
`UNKNOWN — REQUIRES VERIFICATION` rather than omitted, so gaps are visible.

---

## Milk Delivery Solutions

### Customer Management
- **Module**: Back Office Admin Panel
- **Description**: "Create, edit and remove customer profiles from the
  system easily."
- **Purpose**: central customer record for a delivery round.
- **Role**: Admin.
- **Confidence**: Confirmed (page text).
- **Milk Garage equivalent**: `retail_customers` table + RetailCustomers
  page — already implemented, feature parity here.

### Subscription Management
- **Module**: Back Office Admin Panel
- **Description**: "Place, modify, cancel and resume order subscriptions."
- **Purpose**: recurring order management without daily manual entry.
- **Role**: Admin (back office); Customer (self-service, per Customer App
  section).
- **How it works**: `UNKNOWN — REQUIRES VERIFICATION` — page doesn't
  specify whether "subscription" means a fixed daily quantity (Milk
  Garage's `fixed_daily_qty_kg` on `regular` customers) or a more general
  recurrence rule (e.g. "MWF only", "every 2 days"). **INFERRED**: likely
  supports arbitrary day-of-week patterns, not just daily, since it's
  marketed as a generic subscription engine covering water/tiffin/grocery
  too (per Milkride's identical "Subscription Management" feature, same
  category convention).
- **Milk Garage equivalent**: `retail_customers.fixed_daily_qty_kg` +
  `retail_pauses` — supports daily-fixed + date-range pause, but **not**
  arbitrary weekday patterns (e.g. "deliver only Mon/Wed/Fri"). This is a
  **genuine gap** if a customer wants "milk only on weekdays."
- **Related features**: Retail pauses (Milk Garage), Order pause/resume
  (this platform's Customer App).

### Catalogue Management
- **Description**: "Manage categories, sub-categories and brands. Define
  product types."
- **Milk Garage equivalent**: none — Milk Garage sells one product
  ("buffalo milk"), hardcoded. Multi-product (curd/paneer/ghee) is listed
  in `docs/decisions/0009` as "Not scheduled" — this platform's catalogue
  module is what that would need if prioritized.

### Stock Management
- **Description**: "Generate live stock reports with demand forecasting."
- **Confidence**: Confirmed existence; **UNKNOWN — REQUIRES VERIFICATION**
  for what "demand forecasting" actually computes (moving average? ML
  model? Both platforms using this phrase — Milkride too — never explain
  the method).
- **Milk Garage equivalent**: Feed stock tracking exists
  (`feed_items.current_stock`, auto-adjusted by triggers) but that's
  input-side (cattle feed), not output-side (finished milk demand
  forecasting for the delivery round). No equivalent for predicting next
  week's milk demand from order history.

### Delivery Management
- **Description**: "Optimise your delivery route to create the shortest
  path."
- **Purpose**: route optimization (traveling-salesman style) across
  delivery stops.
- **Milk Garage equivalent**: `retail_customers.round_sequence` (manual,
  owner-assigned order) — no automatic route optimization. **Genuine
  gap**, but likely low priority at Milk Garage's scale (8–10 buffalo,
  target 15 regulars — a manual round sequence is probably fine until
  much larger).

### Reports & Dashboard
- **Description**: auto-generated sales, product, and payment reports.
- **Milk Garage equivalent**: Dashboard page (revenue/spend/cost-per-kg
  this month) — partial parity; no product-wise breakdown (moot, single
  product) and no dedicated "reports" export screen.

### Promotions/Coupons
- **Description**: referrals, rewards, discounts, cashback options.
- **Milk Garage equivalent**: none. `referral_source` field exists on
  `retail_customers` (tracks *how* they heard about the dairy) but no
  reward/discount mechanic. Matches decision `0001`'s "word of mouth"
  growth strategy — a coupon engine is likely premature at this scale.

### Automated Notifications
- **Description**: Email, SMS, push notifications.
- **Milk Garage equivalent**: none built yet — `docs/decisions/0009`
  lists a WhatsApp bot + nightly cutoff job as open Milestone 3 items,
  not started. This is the most directly comparable gap.

### Accounting & Billing
- **Description**: invoice generation (weekly/monthly), multiple payment
  models (prepaid/postpaid/hybrid).
- **Milk Garage equivalent**: `daily_balance` (cash/UPI/unpaid totals) +
  per-order `paid`/`payment_method`/`amount_collected` — transaction-level
  tracking exists, but no generated invoice document (PDF/WhatsApp
  message) and no formal "monthly bill" concept for `per_delivery`
  customers. `retail_customers.payment_mode` already has `monthly` as an
  enum value but **no code path implements monthly billing yet** — this
  is a real, already-modeled-but-unbuilt gap.

### Customer App — Real-time order tracking with ETA sharing
- **Description**: live location/ETA sharing for the customer's delivery.
- **Milk Garage equivalent**: none. Requires driver-side GPS, which Milk
  Garage doesn't have (no separate driver app — Deliveries screen is
  owner-console-only, used by whoever runs the round). **INFERRED**: not
  worth building until there's a dedicated delivery person separate from
  the owner checking their own dashboard.

### Driver App — full feature set
- **Description**: runtime order editing, digital proof of delivery
  (photo/signature/OTP), empty-bottle return tracking, cash payment
  recording, GPS navigation, daily task list.
- **Milk Garage equivalent**: Deliveries screen covers "mark delivered/
  skipped, record payment" but has none of: proof-of-delivery capture,
  bottle-return tracking, GPS navigation. **Bottle/crate deposit tracking**
  in particular is a common dairy-specific feature (see Simple Dairy's
  "bottle/crate deposits" too) that Milk Garage has no equivalent for at
  all — worth a decision on whether bottles are even reused in this
  business model before building it.

---

## Milkride

### Digital Ordering
- **Description**: order placement via mobile app or website.
- **Milk Garage equivalent**: `/book` (this repo, v0.8.0+) — direct
  parity, arguably ahead in that Milk Garage now also supports
  phone+PIN/email/Google login (v0.11.0) vs. `UNKNOWN` what Milkride's
  auth options are (not stated on fetched page).

### Automated Invoicing
- Same gap as Milk Delivery Solutions' Accounting & Billing above — no
  Milk Garage equivalent yet.

### Subscription Management
- Same as Milk Delivery Solutions' entry — arbitrary recurrence patterns
  vs. Milk Garage's daily-fixed + pause-range model.

### Real-Time Order Tracking / Live Order Updates
- Push notifications + ETA — same gap noted under Milk Delivery
  Solutions' customer-tracking entry.

### Delivery Path Optimization
- "reduce fuel costs," route planning based on location/traffic —
  same gap as Milk Delivery Solutions' Delivery Management.

### Customer Data Analysis
- **Description**: "for B2B and B2C interactions" — `UNKNOWN — REQUIRES
  VERIFICATION` what specific analysis (segmentation? churn prediction?
  lifetime value?) — page doesn't elaborate.
- **Milk Garage equivalent**: none — Dashboard has aggregate counts only,
  no per-customer analytics beyond what's visible on their own row.

### Sales Analytics
- **Description**: "reporting on sales, distribution, and P&L."
- **Milk Garage equivalent**: Dashboard's revenue/spend/cost-per-kg is a
  simplified version of P&L; no distribution-specific breakdown (e.g.
  wholesale-vs-retail channel contribution) — flagged as an open item in
  `docs/decisions/0009` under "Financials: contribution-by-channel."

### AssignIQ
- **Description**: named routing/assignment tool, distinct branded
  feature.
- **How it works**: `UNKNOWN — REQUIRES VERIFICATION` — the fetched page
  names it but doesn't explain the algorithm. **INFERRED** (from the name
  and category): likely auto-assigns delivery stops to available
  drivers/rounds, possibly with load-balancing by route or volume.
- **Milk Garage equivalent**: none — single-person delivery round,
  manually sequenced (`round_sequence`). Not relevant until Milk Garage
  has multiple delivery runners needing auto-assignment.

---

## Simple Dairy

Six confirmed modules, richest source in this pass because Simple Dairy's
marketing page enumerates feature counts per module (e.g. "+50 features")
even where it doesn't name every one.

### 1. Sales & Customers (+50 features, not all named)
- **Confirmed named features**: "Bills on WhatsApp, paid on UPI," customer
  book, auto invoices, special/custom rates per customer, delivery-boy
  role-based access.
- **Milk Garage equivalent**: `retail_customers.price_per_kg` (per-customer
  rate) — parity. WhatsApp billing / UPI payment integration — **gap**,
  matches the open "WhatsApp bot" item in `0009`.
- **Notes**: "+50 features" total, only ~5 named on the page — the
  remaining ~45 are `UNKNOWN — REQUIRES VERIFICATION`, likely small CRUD
  variations (filters, edit history, etc.) rather than distinct concepts.

### 2. Milk Collection (+25 features)
- **Confirmed named features**: farmer payment history, SNF/Fat auto-rate
  (fat/solids-not-fat content determines the price paid to the farmer),
  per-farmer rate charts, WhatsApp daily reports to farmers.
- **Purpose**: this module is for buying milk *from* farmers (a collection
  center), not selling to end customers — a completely different business
  role than Milk Garage's (which is itself a producer, not a collector).
- **Milk Garage relevance**: directly relevant **only if** Milk Garage
  pursues the growth path in `docs/decisions/0006` — "securing good milk
  from other milk vendor and redistributing it." If that happens, this
  module (SNF/Fat-based auto-pricing especially) is the reference
  implementation to study.
- **Confidence**: Confirmed (page text), but **SNF/Fat auto-rate
  calculation formula is UNKNOWN — REQUIRES VERIFICATION** (standard dairy
  industry formulas exist for this, e.g. Fat+SNF-based "Fat kg" pricing —
  would need dedicated research if this module becomes relevant).

### 3. Online Store ("Customer's own app")
- **Confirmed named features**: white-label branded app, "2-tap ordering,"
  subscriptions (daily/weekly/monthly), live tracking, multi-address
  support (+20 features total).
- **Milk Garage equivalent**: `/book` portal — parity on ordering and
  subscriptions (daily-fixed). **Gaps**: no live tracking (see delivery-app
  gap above), **no multi-address support** — Milk Garage's
  `retail_customers` has exactly one `address_text` field, no concept of
  multiple delivery addresses per customer. This is a real, concrete,
  buildable gap if ever needed (e.g. a customer wanting deliveries split
  between home and office).
- **"2-tap ordering"**: `UNKNOWN — REQUIRES VERIFICATION` exact UI, but
  **INFERRED** to mean a home-screen quick-order widget (tap product, tap
  confirm) vs. Milk Garage's current flow (open app → Order tab → type
  quantity → tap Place order — closer to "2-3 tap" already, arguably
  comparable).

### 4. Counter Sales POS (+15 features)
- **Confirmed named features**: 3-tap billing, multi-counter dashboard,
  receipt printing/WhatsApp sharing, payment filters.
- **Purpose**: walk-in retail sales at a physical shop counter — distinct
  from home-delivery subscriptions.
- **Milk Garage equivalent**: none — Milk Garage has no walk-in/counter
  sales concept at all (matches the business plan: home delivery + bulk
  wholesale only, no shop counter per `docs/decisions/0001`). Not a gap
  unless the business model changes.

### 5. Products & Stock (+18 features)
- **Confirmed named features**: catalog management, pack sizes, daily
  load/unload per route, **bottle/crate deposits**, low-stock alerts.
- **Milk Garage equivalent**: Feed stock module covers cattle-feed
  inventory (parity for that specific use); **no equivalent for
  bottle/crate deposit tracking** (same gap flagged under Milk Delivery
  Solutions' driver app above — this confirms it's a common
  category-standard feature, not a one-off).

### 6. Reports & Money (+30 features)
- **Confirmed named features**: daily sales (detail + product-wise), dues
  lists with WhatsApp reminders, expense categories, Excel export.
- **Milk Garage equivalent**: `daily_balance` + Expenses page — partial
  parity (expense categories: yes, matches `ExpenseCategory` enum). **Dues
  list with WhatsApp reminders**: gap — Milk Garage tracks `paid`/`unpaid`
  per order but has no aggregated "who owes money" list nor any reminder
  mechanism. **Excel export**: gap — no export functionality anywhere in
  Milk Garage currently.

### Add-on: White-Label Apps
- **Description**: custom-branded dairy apps on Google Play/App Store with
  the buyer's own logo/colors/domain, "zero commission model," sold as an
  upgrade from the base plan.
- **Pricing**: see [`03-pricing.md`](03-pricing.md#simple-dairy).
- **Milk Garage equivalent**: N/A — Milk Garage *is* already a
  custom-branded app by construction (it's bespoke code, not a shared
  multi-tenant SaaS), so this entire add-on category doesn't apply; Milk
  Garage gets this "for free" by being custom-built rather than a
  configured tenant of a shared platform. Worth mentioning to the user as
  a genuine advantage of the custom-build approach over subscribing to one
  of these platforms.

---

## MilkingCloud

### Herd Management Software
- **Description**: manage multiple herds with grouping capabilities.
- **Milk Garage equivalent**: Herd screen — Milk Garage has one implicit
  herd (no grouping/sub-herd concept); fine at 8–10 animals, would need
  a `herd_group` concept only at much larger scale.

### Milk Yield Records
- **Milk Garage equivalent**: Production screen (session-based logging,
  morning/evening) — parity.

### Weight Monitoring
- **Milk Garage equivalent**: none — `animals` table has no weight field
  or history. Gap, likely low-priority (weight tracking matters more for
  beef/growth operations than a small milking herd).

### Feed Management ("100+ predefined feeds")
- **Milk Garage equivalent**: Feed screen — parity on the concept
  (items/purchases/consumption), but Milk Garage has **no predefined feed
  catalog** — every feed item is manually created per-dairy. A
  starter-catalog of common Indian dairy feeds (wheat straw, cottonseed
  cake, mineral mixture, etc.) could be a nice small addition, not a
  structural gap.

### Milk Ration Management
- **Description**: ration *calculation* for dairy cows (i.e. computing how
  much of each feed an animal should get based on yield/weight/stage).
- **Milk Garage equivalent**: none — Feed module records what was
  consumed, but has no calculator for what *should* be fed. **Genuine
  gap** if precision feeding becomes a priority; likely not urgent at
  8-10 buffalo fed by eye/experience.

### Health Management / Heat and Breeding Operations / Gestation
- **Milk Garage equivalent**: Health screen + Breeding screen — solid
  parity on the software side (event logs, next-due dates, expected
  calving via +310 days). MilkingCloud's edge is entirely in the
  **hardware devices** below, not the software concepts.

### Hardware: MastiPro / M2Moo / PartuSense / WashLog
- **Description**: physical IoT-style devices for automated mastitis
  detection, heat detection, calving prediction, and wash-quality
  monitoring, respectively.
- **Milk Garage equivalent**: none, and **not a realistic gap to close**
  — these are hardware products with per-unit cost and integration
  complexity far beyond an 8-10 buffalo operation's needs. Documented here
  only so it's not re-discovered and mistaken for a software gap later.
- **Confidence**: Confirmed as named products exist; exact specs/pricing
  `UNKNOWN — REQUIRES VERIFICATION`.

### Financial record-keeping / bookkeeping
- **Milk Garage equivalent**: Expenses + Daily balance — likely rough
  parity, exact MilkingCloud feature set `UNKNOWN — REQUIRES
  VERIFICATION` (page mentions this only in passing).
