# 0003 — Customer and delivery model

- **Status:** Accepted (with open items)
- **Date:** 2026-09-07

## Context

The offer is "buy milk daily, no commitment." We still want most customers to
end up as reliable regulars. Two customer types fall out of this.

## Decision

**Casual / daily customers**

- Place an order before a **fixed nightly cutoff** (target ~9 pm) for
  next-morning delivery.
- No standing quantity, no commitment.
- **Pay per delivery** — the delivery boy collects **UPI or cash** on the spot.

**Regular / fixed customers**

- Standing daily quantity, delivered every morning.
- **Pause anytime** — via **WhatsApp** initially; self-service in the app later.
- Payment: **prepaid recharge** or **monthly bill** — final model to be decided.

**Delivery**

- One delivery boy, single morning round.
- Small / single locality to start.

**Expansion gate**

- Do **not** scale up (more area, more staff, price changes, full app build)
  until **15 regular fixed customers** are on board.

## Consequences

- The tool's phase-1 job is narrow: take casual orders before the cutoff,
  produce the morning delivery list, record delivered + payment collected, and
  track who is casual vs. regular so we can chase conversions.
- WhatsApp is the customer comms channel at first; no customer-facing app is
  needed to launch.

## Open items

- [ ] Lock the exact **order cutoff time**.
- [ ] Decide **regular-customer payment**: prepaid wallet vs. monthly invoice.
- [ ] Define the **delivery area boundary** and a realistic **daily capacity
      ceiling**.
- [ ] Decide what incentive (if any) moves a casual customer to regular.
