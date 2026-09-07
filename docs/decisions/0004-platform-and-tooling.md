# 0004 — Platform and tooling

- **Status:** Accepted (supersedes the earlier "proposed / mostly manual" version)
- **Date:** 2026-09-07

## Decision

Build from day one, not after the 15-regular gate:

1. **A thin internal app** — used by the operator and the delivery boy only.
2. **A WhatsApp ordering bot** — customers place tomorrow's order (and regulars
   pause/skip) by messaging the bot; it books straight into the same system.

All order and delivery data lives in the app from the first day. Customers do
**not** get logins, self-serve dashboards, or online payment at launch — those
come later once the daily round has been run enough to know how it works.

## Day-one scope

**Internal app**

- Customer list: name, address, phone, casual/regular, fixed daily qty,
  referral source.
- Orders for tomorrow (from the bot, or keyed in manually as fallback).
- Auto-built morning delivery list, ordered by round sequence (regulars first).
- Delivery boy marks each stop: delivered y/n, delivered qty, paid y/n,
  method (UPI/cash), amount.
- Daily reconciliation: milk taken from dairy vs. sold vs. returned.

**WhatsApp bot**

- Casual customer: "order 2kg for tomorrow" → bot confirms → booked.
- Regular customer: "pause tomorrow" / "skip Friday" → booked.
- Cutoff enforced: orders/pauses after the nightly cutoff roll to the day after.
- May launch as a simple keyword/number flow and get smarter later.
- Needs a WhatsApp Business API provider (has setup + per-message cost +
  business verification).

## Later (post-launch, not scoped yet)

- Customer-facing app: login, self-serve ordering, pause, balance, payment.
- Prepaid wallet / monthly invoicing for regulars.
- Offline delivery marking.

## Open items

- [ ] Pick the tech stack when build starts.
- [ ] Pick the WhatsApp Business API provider.
- [ ] Decide manual-order fallback UX for when the bot is down.
