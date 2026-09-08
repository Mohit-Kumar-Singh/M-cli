# Business overview

_Last updated: 2026-09-09. Living summary; the `decisions/` files are the
authoritative record of each choice._

## The business

**One milk business, three equal co-owners** — the operator, Aman, Manjeet.
(Originally two separate ventures — a dairy and a retail reseller — merged on
2026-09-09 into one business with one set of books. See 0001.)

- **Production:** an 8–10 buffalo herd. ~70–80 kg/day at capacity.
- **Two sales channels:**
  - **Wholesale** — bulk to sweet shops (halwais). Core volume. Absorbs any
    surplus, so retail milk is never wasted.
  - **Retail** — household home delivery. **₹60/kg**, delivery included, order
    as little as you want, **no monthly lock-in**.

## Positioning (retail)

> Pure, unadulterated buffalo milk. Delivered. Order as little as you want.
> No monthly lock-in.

Against packet milk (Amul / Mother Dairy): fresh buffalo milk, not toned
packet milk, at the door. Against the local doodhwala: no dilution, no forced
fixed quantity or monthly commitment.

## Retail customers

| Type | Orders | Pays | Perks |
|---|---|---|---|
| **Casual** | Before the ~9 pm cutoff for next morning. No commitment. | Per delivery — UPI/cash on the spot. | None |
| **Regular** | Standing daily qty. Pause anytime before the cutoff — WhatsApp first, app later. Pays even if they forget to pause. | Prepaid recharge or monthly bill — TBD. | Guaranteed supply on short days; ₹60/kg locked 6 months; earlier slot; priority on extras. |

Goal: convert casual customers into regulars.

## Money

- One combined P&L. **Cost of milk = real cost of production** (feed + labour +
  vet + transport + herd depreciation ÷ kg produced) — the app tracks this.
  The old ₹55/kg internal price is dropped (0002).
- Dashboard shows **revenue and contribution by channel**.
- Retail at ₹60/kg is thin once delivery is costed. At ~15 regulars it doesn't
  cover a delivery wage — so **the operator runs the round at launch**; a paid
  runner and any price step-up wait until retail hits ~40–50 kg/day (0006).

## Capacity & growth

- 50 retail households ≈ the whole herd's output — a **medium-term ceiling, not
  a launch number**. Launch is ~15–20 households / ~20–30 kg/day.
- Grow supply to match demand: more buffalo, or vetted third-party vendors
  redistributed under the same quality standard. Add supply just ahead of
  demand; never sign customers we can't supply.

## The application

One web app for the whole operation (0004, 0007): **Herd, Production, Breeding,
Health, Feed, Expenses, Wholesale sales, Retail sales, Daily milk balance,
Dashboard/financials**. Plus a **WhatsApp ordering bot** for retail.

- Mobile-first, installable PWA.
- **Roles:** Owner (all three, full access) · Delivery runner (delivery list
  only) · Dairy hand (production + feed entry, later).
- Stack: React + Vite + TS + Tailwind on Supabase; Meta WhatsApp Cloud API
  (0008).
- Built core-first for a November 2026 target, full feature set after (0009).

## Operations

- **Delivery:** morning round, run by the operator at launch.
- **Sellers:** all three co-owners, word of mouth.
- **Area:** one locality, ~50 households in reach.
- **Gate:** no retail expansion (area / hiring / price) until **15 regular
  fixed customers** — target within 1 month of launch.

## Open questions / risks

1. **No written co-ownership agreement.** Three-way split of ownership,
   contributions, profit, decision-making, exit — get it on paper early.
2. **Cost price is data-dependent.** Real cost/kg only becomes trustworthy once
   Feed + Expenses + Production are being logged consistently.
3. **Loss-making at launch retail scale** (accepted) — mitigation is decided
   (operator delivers; step-up at ~40–50 kg/day).
4. **Supply caps growth** (accepted) — expand herd or add vetted vendors ahead
   of demand.
5. **Regular-customer payment model** (prepaid vs monthly) undecided.
6. **Business name / legal structure** undecided ("M-cli" is a placeholder).
7. **Scope vs. November** — full app (0007) won't all land by launch; core-first
   sequencing (0009) is the plan.
8. **WhatsApp bot** needs Meta Business onboarding; may start manual.
