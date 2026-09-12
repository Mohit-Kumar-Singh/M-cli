# Reverse-Engineering Reference

Implementation-ready breakdowns for the concrete gaps identified in
[`02-features.md`](02-features.md) and [`04-workflows.md`](04-workflows.md).
When a future request is "add feature X," check here first before
re-researching. Each entry only covers *how it would be built into Milk
Garage* — not proprietary internals of the reference platform, which
weren't accessible anyway (marketing pages only).

---

## Weekday-pattern subscriptions (e.g. "milk only Mon/Wed/Fri")

- **Reference platforms**: Milk Delivery Solutions, Milkride (both
  "Subscription Management" — feature named, mechanics `UNKNOWN`)
- **Current Milk Garage model**: `retail_customers.fixed_daily_qty_kg` —
  one quantity, applies every day unless a `retail_pauses` row covers that
  date.
- **Likely user flow**: owner (or customer, self-service) picks which
  weekdays a standing order applies to when marking someone `regular`.
- **Data model change**: add `standing_days smallint[]` (or a bitmask int)
  to `retail_customers`, e.g. `{1,3,5}` for Mon/Wed/Fri (ISO weekday
  numbers). `NULL`/empty = every day (current default behavior,
  backward-compatible).
- **Backend logic**: `RetailOrders.tsx`'s regular-line prefill logic
  (currently: "existing order, else if paused blank, else
  `fixed_daily_qty_kg`") needs a new branch: if `standing_days` is set and
  today's ISO weekday isn't in it, treat as if paused (blank, no
  auto-fill). Same logic needs mirroring in `customer_get_orders`/the
  `/book` Order screen's default-quantity display, and in whatever nightly
  job (still unbuilt per `0009`) eventually auto-generates standing
  orders.
- **Frontend**: a day-of-week multi-select (7 toggle chips) in
  RetailCustomers.tsx's `CustomerForm`, shown only when `type === "regular"`.
- **Edge cases**: customer's pattern changes mid-cycle (existing pending
  orders on now-excluded days — auto-cancel like a pause does, or leave
  them as manually-placed exceptions?); interaction with the 9pm cutoff
  when the *next* applicable weekday is several days out.
- **Verify before building**: confirm this is an actual customer request,
  not a speculative gap — `docs/decisions/0009` explicitly favors shipping
  the simple case first and only extending when real usage demands it.

---

## WhatsApp integration (billing + reminders + bot ordering)

- **Reference platforms**: Simple Dairy ("Bills on WhatsApp, paid on UPI,"
  "WhatsApp daily reports," "dues lists with WhatsApp reminders" — all
  Confirmed feature names, exact API/integration `UNKNOWN`)
- **Current Milk Garage state**: `retail_orders.source` enum already has
  a `'bot'` value reserved (migration `0001`), and
  `retail_pauses.created_via` has `'whatsapp'` as an allowed value — the
  schema was clearly designed anticipating this, but **no integration
  code exists yet**. Matches the open item in `docs/decisions/0009`:
  "WhatsApp bot — order + pause via Meta Cloud API webhook (needs Meta
  Business onboarding)."
- **Required infra** (not Milk Garage code — external prerequisite):
  a Meta Business account + WhatsApp Cloud API access, which needs the
  user's own business verification — same category of "only the user can
  set this up" step as the Google OAuth credentials from this session.
- **Likely architecture**: a Supabase Edge Function as the webhook
  receiver for inbound WhatsApp messages (Meta posts to a webhook URL);
  outbound sends (order confirmations, dues reminders, daily reports) via
  the Cloud API's send-message endpoint, triggered either on-demand
  (owner taps "send reminder") or on a cron schedule (Supabase's
  `pg_cron` extension, or an external scheduler hitting an Edge Function).
- **Data model**: reuse the existing `'bot'`/`'whatsapp'` enum values —
  no new tables needed for basic order/pause-via-WhatsApp. A dues-reminder
  feature would want a `retail_customers.whatsapp_opted_in boolean` (
  consent tracking — WhatsApp Business API requires opt-in for template
  messages outside a 24h reply window) and a log table for what was sent
  when (avoid duplicate reminders).
- **Edge cases**: WhatsApp Business API template-message approval process
  (Meta reviews message templates before they can be sent outside active
  conversations — adds lead time), rate limits, phone number format
  matching (`retail_customers.phone` isn't currently validated/normalized
  to E.164 format — would need cleanup before WhatsApp API calls, which
  require it).
- **Verify before building**: this is a multi-week effort gated entirely
  on the user completing Meta Business verification first — confirm that
  step is done before writing integration code.

---

## Dues list with reminders

- **Reference platform**: Simple Dairy ("dues lists with WhatsApp
  reminders" under Reports & Money)
- **Current Milk Garage state**: no aggregated view — `paid`/`unpaid` is
  tracked per-order (`retail_orders`) and per-delivery
  (`wholesale_deliveries`), but nothing sums "total owed by customer X
  across all unpaid orders."
- **Likely user flow**: owner opens a new "Dues" view (or a section on
  Balance.tsx / a new page), sees a list of customers with
  `sum(unpaid amounts)` > 0, sorted by amount descending; taps a customer
  to see the unpaid order list; optionally taps "remind" (requires
  WhatsApp integration above, or falls back to a `tel:`/`sms:` link as an
  MVP without full API integration).
- **Backend**: a SQL view or a plain query —
  `select customer_id, sum(ordered_qty_kg * price_per_kg) as owed from
  retail_orders where status='delivered' and paid=false group by
  customer_id` (this exact aggregate already exists as the *portal's own*
  `customer_get_dues` RPC, migration `0005` — the owner-side dues list is
  the same query, un-scoped to a single customer, exposed to the owner
  role instead of via token).
- **Frontend**: new `Dues.tsx` page or a card on Balance.tsx — reuses
  existing `ListCard`/`Badge` UI components, straightforward given the
  query already exists in the customer-portal RPC.
- **Dependencies**: none — this is the cheapest gap to close in this
  entire document since half the logic (`customer_get_dues`) is already
  written; it just needs an owner-facing view of the same aggregate
  across all customers instead of one.

---

## Multi-address support per customer

- **Reference platform**: Simple Dairy ("multi-address support" under
  Online Store)
- **Current Milk Garage state**: `retail_customers.address_text` — one
  free-text field, one address per customer.
- **Likely user flow**: customer (or owner) adds multiple named addresses
  (e.g. "Home," "Office"); each order specifies which address it's for.
- **Data model**: new `customer_addresses` table
  (`id, customer_id, label, address_text, is_default`), and
  `retail_orders.address_id uuid references customer_addresses(id)`
  (nullable, defaults to the customer's default address for
  backward-compat with existing single-address customers).
- **Backend**: `customer_place_order` RPC gains an optional `p_address_id`
  param; `RetailOrders.tsx`/Deliveries.tsx need to display which address
  each stop is for when a customer has more than one.
- **Edge cases**: round sequencing (`round_sequence`) is per-customer, not
  per-address — if one customer has two addresses on the same round,
  does the route visit both as separate stops? Likely yes, meaning
  `round_sequence` conceptually needs to move to the address level, not
  the customer level, if this is ever built — a real design decision, not
  just an additive migration.
- **Verify before building**: confirm at least one real customer actually
  needs split-address delivery before restructuring `round_sequence` —
  this is the most structurally invasive gap in this document.

---

## Delivery route optimization

- **Reference platforms**: Milk Delivery Solutions ("Delivery
  Management"), Milkride ("Delivery Path Optimization," "AssignIQ")
- **Current Milk Garage state**: `retail_customers.round_sequence` — a
  manually-entered integer the owner sets by hand, sorted ascending in
  Deliveries.tsx/RetailOrders.tsx.
- **Likely reference approach** (**INFERRED**, not confirmed from either
  platform's page): geocode each address, run a nearest-neighbor or
  proper TSP-solver route optimization (e.g. Google's OR-Tools, or a
  third-party routing API like Google Maps Directions/OSRM), output an
  ordered stop list.
- **Required infra**: geocoding needs real addresses with lat/lng —
  Milk Garage's `address_text` is unstructured free text today, would
  need either manual lat/lng entry per customer or an integration with a
  geocoding API (Google Maps Geocoding API, has a cost per lookup beyond
  a small free tier).
- **Verify before building**: at 8-15 customers on presumably one
  neighborhood's worth of a round, this is very likely premature — the
  owner manually setting `round_sequence` once and rarely changing it is
  almost certainly faster than building/maintaining a geocoding +
  optimization pipeline. Flag this as **low priority given current
  scale** unless the round grows to dozens of stops across a wider area.

---

## Bottle/crate deposit tracking

- **Reference platforms**: Milk Delivery Solutions (driver app: "empty
  bottle return tracking"), Simple Dairy ("bottle/crate deposits" under
  Products & Stock)
- **Current Milk Garage state**: none — no concept of returnable
  containers anywhere in the schema.
- **Verify before building — this is a business-model question, not a
  technical one**: does Milk Garage actually deliver in reusable
  bottles/crates that need tracking, or is milk delivered in disposable
  packaging / poured directly? `docs/business-overview.md` /
  `docs/decisions/0001`–`0007` don't specify packaging. **Do not build
  this speculatively** — confirm the actual delivery format with the user
  first, since the two reference platforms both assume a reusable-bottle
  model that may not apply here at all.
- **If confirmed relevant**: likely model —
  `retail_customers.bottles_out int default 0` (running count of
  bottles/crates currently with the customer), incremented on delivery,
  decremented on return, surfaced in Deliveries.tsx as a quick +/- control
  alongside the existing delivered/unpaid/skip buttons.

---

## Monthly invoicing for `payment_mode = 'monthly'` customers

- **Reference platform**: implied by every platform's "invoice
  generation (weekly/monthly)" language (Milk Delivery Solutions,
  Milkride) — none show the actual invoice document/template.
- **Current Milk Garage state**: `retail_customers.payment_mode` already
  has `'monthly'` as a valid enum value (migration `0001`) — **the data
  model anticipated this from day one, but no code path reads or acts on
  it.** A `monthly` customer today behaves identically to `per_delivery`
  in every screen — this is a modeled-but-dead field.
- **Likely user flow**: at month-end, owner opens a "Generate invoices"
  action; system sums each `monthly` customer's delivered, unpaid orders
  for that month into a single invoice; owner shares it (WhatsApp/print)
  and marks it paid in bulk once settled.
- **Data model**: new `invoices` table
  (`id, customer_id, period_start, period_end, total_amount, status,
  created_at`), plus a linking mechanism from `retail_orders` to the
  invoice that settled them (`invoice_id uuid` nullable FK on
  `retail_orders`, set when generated; `paid`/`payment_method` stay
  per-order but get a bulk-update path when an invoice is marked settled).
- **Backend**: a function/RPC that, given a customer + month, aggregates
  unbilled delivered orders into a new `invoices` row and stamps
  `invoice_id` on each.
- **Frontend**: new section on RetailCustomers.tsx (for `monthly`
  customers) or a dedicated Invoices page; a simple printable/shareable
  summary view (reuse `Card`/`ListCard`).
- **Dependencies**: none blocking — this is fully buildable today with
  existing data (`payment_mode` already exists); the only reason it isn't
  built is that no customer has actually used `monthly` mode yet
  (`docs/decisions/0009` doesn't list it as started).

---

## Excel/CSV export

- **Reference platform**: Simple Dairy ("Excel export," "free data export
  anytime")
- **Current Milk Garage state**: none — no export functionality anywhere.
- **Likely implementation**: client-side CSV generation (no backend
  needed) — take whatever's already loaded in a screen's state (e.g.
  Expenses.tsx's `rows`, Balance.tsx's computed figures) and serialize to
  CSV via a small helper (`Array.map(...).join(",")` + `Blob` +
  download link), no new dependency required for basic CSV. A real
  `.xlsx` (not CSV) would need a library like `sheetjs`/`xlsx` — heavier,
  probably not needed since CSV opens fine in Excel/Sheets already.
- **Frontend**: an "Export" button on Expenses.tsx, Feed.tsx, Wholesale.tsx
  — wherever there's a `rows` list already in memory.
- **Dependencies**: none — cheapest gap to close alongside the Dues list
  above; purely additive, no schema changes.

---

## SNF/Fat-based milk pricing (for buying from external farmers)

- **Reference platforms**: Simple Dairy (Milk Collection module —
  Confirmed feature names), Swadha (page unfetchable, search-snippet only)
- **Current Milk Garage state**: not applicable — Milk Garage doesn't buy
  milk from anyone; it's produced by the owners' own herd. This entire
  workflow only becomes relevant if `docs/decisions/0006`'s growth path
  ("securing good milk from other milk vendor and redistributing it") is
  activated.
- **Domain background** (**INFERRED** general dairy-industry knowledge,
  not from either platform's page — would need dedicated verification
  before implementing): milk is commonly priced by **Fat %** and
  **SNF % (solids-not-fat)** content, tested per delivery with a
  lactometer/fat analyzer; price = base rate adjusted by a
  fat/SNF formula (e.g. "Rate per kg-fat" × fat% + "Rate per kg-SNF" ×
  SNF%). Exact formula varies by region/cooperative and would need
  real verification (with the user or a dairy-industry source) before
  building, not assumed from a competitor's marketing page.
- **Data model** (if built): `milk_purchases` table
  (`id, date, vendor_id, qty_kg, fat_pct, snf_pct, rate_per_kg, amount,
  paid`), a `milk_vendors` table (parallel to `wholesale_customers` but
  for the buy-side), and rate-chart logic to compute `rate_per_kg` from
  `fat_pct`/`snf_pct`.
- **Verify before building**: this entire feature is speculative until
  the business actually starts buying external milk — flagged in
  `docs/decisions/0006` as a *possible* growth path, not a committed one.
