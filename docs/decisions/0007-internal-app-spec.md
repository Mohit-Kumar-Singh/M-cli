# 0007 — Thin internal app: spec

- **Status:** Accepted (v1 scope; details open)
- **Date:** 2026-09-08

Scope is the day-one internal app from [0004](0004-platform-and-tooling.md) —
used by the **operator** and the **delivery runner** only. No customer logins,
no in-app payment. Stack is still unchosen (0004); this spec is
stack-independent.

## Design rules

- **Never delete history.** Skipped/cancelled orders stay as rows — they are
  demand data.
- **Every order and delivery is tied to a `date` and a `customer`.**
- **Record the source** of each order (`bot` / `manual` / `standing`) so we can
  measure WhatsApp-bot adoption later.
- One product for now (`buffalo milk`), but leave a `product` field so curd /
  paneer can be added later without a schema rewrite.
- Quantities in **kg**. Money in **₹**.

## Entities

### Customer

| Field | Notes |
|---|---|
| `id` | |
| `name` | |
| `phone` | E.164; also the key the WhatsApp bot matches on |
| `address_text` | free text (house, lane, landmark) |
| `area` / `lane` | short tag, used to order the delivery round |
| `type` | `casual` \| `regular` |
| `status` | `active` \| `inactive` |
| `fixed_daily_qty_kg` | regulars only; drives the standing order |
| `price_per_kg` | default ₹60; override for >10 kg/day buyers (0002) |
| `regular_since` | date; starts the 6-month price-lock (0005) |
| `price_lock_until` | `regular_since` + 6 months |
| `payment_mode` | `per_delivery` (casual) \| `recharge` \| `monthly` (regular — TBD, 0003) |
| `referral_source` | free text / customer id |
| `round_sequence` | integer; delivery order within the round |
| `notes` | |
| `created_at` | |

### Order (one per customer per delivery date)

| Field | Notes |
|---|---|
| `id` | |
| `customer_id` | |
| `delivery_date` | |
| `product` | default `buffalo milk` |
| `ordered_qty_kg` | |
| `source` | `standing` \| `bot` \| `manual` |
| `status` | `pending` \| `delivered` \| `skipped` \| `cancelled` |
| `delivered_qty_kg` | filled on the round; may differ from ordered (partial) |
| `delivered_at` | |
| `delivered_by` | user id of the runner |
| `paid` | bool |
| `payment_method` | `upi` \| `cash` \| `none` (for recharge/monthly regulars) |
| `amount_collected` | ₹ |
| `created_at`, `created_by` | |

Regulars: a `standing` order is auto-generated for every active regular for the
next date, using `fixed_daily_qty_kg`, **unless** a Pause covers that date.

### Pause (regulars)

| Field | Notes |
|---|---|
| `id`, `customer_id` | |
| `date_from`, `date_to` | single day = same value both |
| `created_via` | `whatsapp` \| `bot` \| `manual` |
| `reason` | optional |
| `created_at` | |

A Pause covering `delivery_date` suppresses that day's standing order.

### DailyReconciliation (one per date)

| Field | Notes |
|---|---|
| `date` | |
| `milk_taken_kg` | pulled from the dairy that morning (entered) |
| `buffer_start_kg`, `buffer_end_kg` | fridge buffer, entered |
| `milk_sold_kg` | computed: Σ `delivered_qty_kg` |
| `milk_returned_kg` | surplus sent back to the halwais (entered) |
| `cash_total`, `upi_total` | computed from orders |
| `unpaid_total` | computed |
| `notes` | |

### Payment (ledger — light for v1, needed when regulars go prepaid/monthly)

`id`, `customer_id`, `date`, `amount`, `method`, `type`
(`delivery_collection` \| `recharge` \| `monthly_settlement`), `note`.
For v1, per-delivery collections can live on the Order; this table matters once
`recharge` / `monthly` is decided.

## Screens

1. **Customers** — list (filter by type / status / area), add / edit. Shows
   fixed qty, price, price-lock date, payment mode.
2. **Tomorrow's orders** — the build screen. Pre-fills every active regular's
   standing order (minus pauses); operator adds casual orders and edits
   quantities. **Freezes at the ~9 pm cutoff** — edits after cutoff apply to the
   day after (0003).
3. **Delivery list (today)** — the run sheet, sorted by `round_sequence`,
   regulars first (0005 perk). Per row: name, address, qty, ₹ due. Runner
   marks: delivered (full / partial qty) or skipped; paid y/n + UPI/cash +
   amount.
4. **Daily reconciliation** — end of day: enter milk taken, buffer in/out, milk
   returned; review computed sold / cash / UPI / unpaid.
5. **Dashboard** — today's kg, # stops, regulars vs the 15 target, collections,
   outstanding.

## Roles

- **Operator** — everything.
- **Delivery runner** — Delivery list + mark stops only. (At launch this is the
  operator; the role still exists so a hired runner needs no rework — 0006.)
- Aman & Manjeet sell but don't need app access in v1; they hand customer
  details to the operator.

## Daily flow

1. **Evening** — casual orders arrive (bot → or operator keys them from
   WhatsApp). Standing orders auto-added for regulars. **9 pm: tomorrow's list
   freezes.**
2. **Early morning** — operator collects milk from the dairy, records
   `milk_taken_kg`. Delivery list is ready.
3. **Round** — runner marks each stop delivered / skipped, collects and records
   payment.
4. **After the round** — surplus returned to the halwais and recorded;
   reconciliation tallies cash / UPI / unpaid.

## Open items

- [ ] Round ordering: manual `round_sequence` vs. auto-group by `area`.
- [ ] Partial-delivery handling — does short-delivered still bill full ordered?
- [ ] Bot ↔ customer matching for an unknown number (auto-create casual?).
- [ ] Cutoff edge cases (late order, same-day cancel after cutoff).
- [ ] When `recharge` / `monthly` lands (0003), wire the Payment ledger +
      per-customer balance and show it on the Delivery list.
