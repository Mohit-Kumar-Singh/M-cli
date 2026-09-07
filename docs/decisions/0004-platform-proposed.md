# 0004 — Platform and tooling (PROPOSED, not locked)

- **Status:** Proposed — not decided. Kept here only so we have a starting point.
- **Date:** 2026-09-07

We agreed to keep technology discussion light for now. This records a
recommendation to react to later, not a commitment.

## Phase 1 is mostly manual

Launch does not need a customer-facing app. WhatsApp for orders/pause + a
simple internal way to build the morning delivery list is enough to reach the
15-regular-customer gate.

## Recommended shape when we do build

- **Mobile-first web app**, installable as a PWA. Reason: delivery boy is
  phone-first in the field, customers are phone-first, only the operator needs
  a laptop view. A terminal CLI serves none of them — the repo name "M-cli" is
  just a name.
- **Internal tool first**, customer self-service second.

## Phase-1 tool scope (when built)

1. Capture casual orders before the nightly cutoff.
2. Generate the morning delivery list (regulars + casual, per address).
3. Mark each stop delivered + payment collected (UPI/cash).
4. Track customers as casual vs. regular; surface conversion candidates.
5. Daily reconciliation: milk taken vs. sold vs. returned to dairy.

## Open items

- [ ] Confirm we want a web app (vs. staying on WhatsApp + a spreadsheet longer).
- [ ] Pick the stack when the time comes.
