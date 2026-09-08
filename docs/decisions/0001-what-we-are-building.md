# 0001 — What we are building

- **Status:** Accepted (revised 2026-09-09 — combined business)
- **Date:** 2026-09-07, revised 2026-09-09

## Context

Originally scoped as two separate businesses — Aman & Manjeet's dairy
(production, bulk sales to halwais) and a separate retail home-delivery venture.
On 2026-09-09 we merged them: **one business, three equal co-owners** (the
operator, Aman, Manjeet), one set of books, one application.

## Decision

Build and run **one milk business** that:

1. **Produces** buffalo milk from an 8–10 buffalo herd.
2. **Sells through two channels:**
   - **Wholesale** — bulk to sweet shops (halwais). Core volume.
   - **Retail** — household home delivery at ₹60/kg, no monthly lock-in,
     order as little as you want (see 0003, 0005).

And build **one application** to manage the whole operation — herd, production,
breeding, health, feed, expenses, both sales channels, and combined financials
(see 0007).

## Consequences

- **No inter-company transfer.** The old ₹55/kg "dairy → retail" price is not a
  transaction anymore — see 0002. Cost of milk = actual cost of production.
- **One P&L** with revenue and contribution split by channel for visibility.
- **Equal access:** all three co-owners get full access to everything in the
  app. The delivery runner is the only restricted role (0007).
- Bigger build than the original "thin internal app" — sequenced core-first
  (0009), not all shipped on day one.
- Project ownership, cost, and branding are shared three ways. The name "M-cli"
  is still a placeholder.
