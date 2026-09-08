# 0002 — Cost of milk and pricing

- **Status:** Accepted (revised 2026-09-09 — combined business)
- **Date:** 2026-09-07, revised 2026-09-09

## Context

Before the merge (0001), the retail venture "bought" milk from the dairy at an
assumed ₹55/kg. With one combined business there is no such purchase.

## Decision

**Cost of milk**

- Cost of milk = **actual cost of production per kg**, derived from the app's
  own data: feed + labour + veterinary + transport + herd depreciation, divided
  by kg produced over the period (see 0007 Feed / Expenses / Production
  modules).
- **₹55/kg is dropped as a transaction.** It may be kept only as an optional
  internal yardstick to check the retail channel is contributing margin.

**Pricing**

- **Retail: ₹60/kg**, home delivery included, for the first 10 kg/day per
  customer. Above that (tea stalls, small shops) — negotiated case by case.
- **No retail delivery fee at launch.** Revisit price / add a fee once daily
  retail volume proves out (~40–50 kg/day — see 0006).
- **Wholesale:** per-halwai negotiated rate, recorded per customer (0007
  Wholesale module).

## Consequences

- The app must track feed and expense data well enough to produce a real
  cost/kg — this is not optional, it's how we know if either channel is
  profitable.
- Dashboard shows **contribution by channel** (revenue − attributable cost).

## Open items

- [ ] Decide whether to keep ₹55 as an internal yardstick or drop entirely.
- [ ] Define how shared costs (labour, transport) are split across channels for
      the contribution view — simple per-kg allocation to start.
- [ ] Confirm the retail price step-up trigger in kg/day.
