# 0007 — Application spec

- **Status:** Accepted (revised 2026-09-09 — full operation app)
- **Date:** 2026-09-08, revised 2026-09-09

The one app that runs the combined business (0001). Stack in 0008, build order
in 0009. This doc is the feature + data reference.

## Design rules

- **Never delete history.** Skipped orders, sold animals, closed customers stay
  as rows — they are data.
- Everything transactional carries a **date** and links to who created it.
- **Record the source** of retail orders (`bot` / `manual` / `standing`).
- Quantities in **kg**, volumes of feed in kg/units, money in **₹**.
- Milk under a **veterinary withdrawal period is not sellable** — the app must
  block/flag it in the daily balance.
- One product today (`buffalo milk`); keep a `product` field so curd / paneer /
  ghee can be added later.

## Roles

| Role | Access |
|---|---|
| **Owner** | Everything. The operator, Aman, Manjeet. |
| **Delivery runner** | Today's retail delivery list + mark stops. Nothing else. |
| **Dairy hand** _(later)_ | Production log + feed entry only. |

---

## Module 1 — Herd

Per-animal register.

| Field | Notes |
|---|---|
| `id`, `tag_no`, `name` | tag_no = ear tag / local id |
| `species` | buffalo (cow later) |
| `breed` | Murrah, etc. |
| `sex` | female / male |
| `dob` / `age_est` | date of birth or estimate |
| `source` | born-on-farm / purchased |
| `purchase_date`, `purchase_cost` | if purchased |
| `dam_id`, `sire_ref` | parentage; `dam_id` links another animal |
| `status` | heifer / milking / dry / pregnant / sick / sold / dead |
| `lactation_number` | current lactation |
| `photo` | |
| `disposal_date`, `disposal_reason`, `sale_amount` | on sold/dead |
| `notes` | |

Screens: herd list (filter by status), animal detail (production history,
breeding timeline, health log, feed share), add / edit / dispose.

## Module 2 — Production (milk log)

| Field | Notes |
|---|---|
| `id`, `date`, `session` | session = morning / evening |
| `animal_id` | nullable — allow herd-total entry when per-animal isn't practical |
| `qty_kg` | |
| `recorded_by` | |

Rollups: per animal per day, per session, herd/day, herd/month. Flags: sharp
drop vs. animal's trailing average (possible illness).

Screens: quick session-entry grid (all milking animals, tab down the column),
production trends.

## Module 3 — Breeding & reproduction

| Field | Notes |
|---|---|
| `id`, `animal_id` | |
| `event_type` | heat / service (AI or natural) / pregnancy-check / calving / dry-off / abortion |
| `event_date` | |
| `method`, `sire_ref` | for service |
| `pd_result` | positive / negative / unknown |
| `expected_calving_date` | derived from service date |
| `calf_animal_id` | on calving — links the new Herd record |
| `notes` | |

Derived: pregnancy status + expected calving on the animal, lactation number
increment on calving, dry-off reminders.

Screens: breeding calendar (upcoming calvings, due dry-offs, heat watch),
per-animal breeding timeline.

## Module 4 — Health & veterinary

| Field | Notes |
|---|---|
| `id`, `animal_id` (or `herd` for whole-herd events) | |
| `event_type` | vaccination / deworming / illness / treatment / vet-visit / injury |
| `event_date` | |
| `product_used`, `dose` | medicine / vaccine |
| `milk_withdrawal_until` | date; milk from this animal not sellable until then |
| `meat_withdrawal_until` | optional |
| `cost` | flows into Expenses |
| `vet_name`, `notes` | |
| `next_due_date` | for vaccination/deworming schedules |

Screens: health log, vaccination schedule (overdue / upcoming), active
withdrawals (feeds the daily balance).

## Module 5 — Feed & inputs

**Feed items:** `id`, `name`, `category` (green fodder / dry fodder /
concentrate / mineral / other), `unit`, `current_stock`.

**Feed purchases:** `id`, `date`, `feed_item_id`, `qty`, `cost`, `supplier`,
`notes` → increments stock, flows into Expenses.

**Feed consumption:** `id`, `date`, `feed_item_id`, `qty`, `scope` (herd /
group / animal), `animal_id?` → decrements stock. Herd-level daily entry is the
default; per-animal optional.

Rollups: feed cost/day, feed cost/kg-milk, stock on hand, low-stock flags.

## Module 6 — Expenses (non-feed)

| Field | Notes |
|---|---|
| `id`, `date`, `category` | labour / electricity / water / equipment / maintenance / transport / vet / rent / misc |
| `amount`, `paid_to`, `payment_method` | |
| `linked_ref` | optional link to a health event, feed purchase, etc. |
| `notes` | |

Recurring templates for monthly items (wages, electricity).

## Module 7 — Wholesale sales (halwais)

**Wholesale customers:** `id`, `name`, `shop`, `phone`, `address`,
`rate_per_kg`, `payment_terms`, `notes`.

**Wholesale deliveries:** `id`, `date`, `customer_id`, `qty_kg`,
`rate_per_kg` (snapshot), `amount`, `paid`, `payment_method`,
`amount_received`, `notes`.

**Wholesale payments** (ledger): `id`, `customer_id`, `date`, `amount`,
`method`, `note` — for settling running dues.

Screens: wholesale customer list + balances, daily wholesale dispatch entry,
outstanding dues, payment recording.

## Module 8 — Retail sales (households)

Carried over from the earlier thin-app spec.

**Retail customer:** `id`, `name`, `phone` (WhatsApp-bot match key),
`address_text`, `area`/`lane`, `type` (casual / regular), `status`,
`fixed_daily_qty_kg` (regulars), `price_per_kg` (default ₹60),
`regular_since`, `price_lock_until` (regular_since + 6 months),
`payment_mode` (per_delivery / recharge / monthly — recharge/monthly TBD, 0003),
`referral_source`, `round_sequence`, `notes`.

**Retail order** (one per customer per delivery date): `id`, `customer_id`,
`delivery_date`, `product`, `ordered_qty_kg`, `source`
(standing / bot / manual), `status` (pending / delivered / skipped /
cancelled), `delivered_qty_kg`, `delivered_at`, `delivered_by`, `paid`,
`payment_method` (upi / cash / none), `amount_collected`.

- Regulars auto-get a `standing` order for the next date from
  `fixed_daily_qty_kg`, unless a Pause covers it.
- **Tomorrow's list freezes at the ~9 pm cutoff**; later edits apply to the
  day after (0003).

**Retail pause** (regulars): `id`, `customer_id`, `date_from`, `date_to`,
`created_via` (whatsapp / bot / manual), `reason`.

**Retail payments** (ledger — needed when recharge/monthly lands): `id`,
`customer_id`, `date`, `amount`, `method`, `type` (delivery_collection /
recharge / monthly_settlement), `note`; plus a per-customer running balance.

Screens: retail customer list, **Tomorrow's orders** (pre-fills regulars,
add casual, freezes at cutoff), **Today's delivery list** (sorted by
`round_sequence`, regulars first, mark delivered/skipped + payment),
conversion candidates (casual customers with a good history).

## Module 9 — Daily milk balance

One record per date, the reconciliation point for everything.

| Field | Notes |
|---|---|
| `date` | |
| `produced_kg` | computed from Production |
| `sellable_kg` | produced − milk under withdrawal |
| `wholesale_kg` | computed from wholesale deliveries |
| `retail_kg` | computed from retail deliveries |
| `own_use_kg`, `wastage_kg` | entered |
| `buffer_start_kg`, `buffer_end_kg` | fridge buffer, entered |
| `balance_kg` | sellable − wholesale − retail − own_use − wastage ± buffer Δ |
| `cash_total`, `upi_total`, `unpaid_total` | computed across both channels |
| `notes` | |

## Module 10 — Dashboard & financials

- Today: milk produced / sold by channel / balance, stops done, collections
  (cash vs UPI), unpaid.
- Herd: counts by status, upcoming calvings, overdue vaccinations, active
  withdrawals.
- Money (period): revenue by channel, feed cost, labour, other expenses,
  **cost per kg**, **contribution by channel**, outstanding receivables by
  channel.
- Retail progress: regulars vs the 15 target (0005).

---

## Open items

- [ ] Per-animal vs herd-total granularity default for Production and Feed
      consumption (per-animal is more work in the shed).
- [ ] Shared-cost allocation method for the contribution view (start: per-kg).
- [ ] Round ordering: manual `round_sequence` vs auto-group by `area`.
- [ ] Partial-delivery billing — bill ordered or delivered qty?
- [ ] WhatsApp bot: matching an unknown number, auto-create casual?
- [ ] Recharge / monthly retail payments — trigger to build (0003).
