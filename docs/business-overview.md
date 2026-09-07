# Business overview

_Last updated: 2026-09-07. This is a living summary; the `decisions/` files are
the authoritative record of each individual choice._

## The idea

There are two businesses:

1. **The dairy** — run by Aman & Manjeet as a **separate entity**. 8–10
   buffalo. Their core business is selling whole buffalo milk **in bulk to
   sweet shops (halwais)**. Build timeline is not fixed yet.

2. **M-cli (this venture)** — a **retail** business sitting between that dairy
   and households. We take milk from the dairy and deliver it to homes daily.

Our edge: we can pull a **flexible** quantity from the dairy day to day
(a few kg or ~20 kg) instead of committing to a fixed volume, so we can afford
to offer customers the same flexibility.

## Supply

- **Source:** Aman & Manjeet's dairy. They **guarantee** our supply.
- **Buffer:** we hold **15–20 kg** of milk in our own fridge to cover a spike
  in next-day demand, so both businesses can operate smoothly.
- **Overflow / spoilage:** milk we take but don't sell **recirculates back to
  the halwais**, who can absorb effectively unlimited quantity. This is the
  single most important fact in the whole plan — it means unsold stock is
  **not a write-off**, which is what makes a no-commitment customer offer safe
  to give.
- **Cost to us:** assume **₹55/kg** for now. Not firmly negotiated.

## Pricing

- **₹60/kg**, home delivery included, for the **first 10 kg/day per customer**.
- Above 10 kg/day per customer (tea stalls, small shops) — price negotiated
  case by case.
- **No delivery fee at start.** Revisit price and/or add a delivery fee once
  volume is proven.
- Gross margin at retail is **~₹5/kg (~8%)** — thin. See risks.

## Customers

Two types:

| Type | How they order | How they pay | Perks |
|---|---|---|---|
| **Casual / daily** | Order before a fixed nightly **cutoff** (~9 pm) for next-morning delivery. No commitment. | Per delivery — UPI or cash on the spot. | None |
| **Regular / fixed** | Standing daily quantity. Pause anytime before the cutoff — WhatsApp first, app later. Pays even if they forget to pause. | **Prepaid recharge** or **monthly bill** — TBD. | Guaranteed supply on short days; ₹60/kg locked for 6 months; earlier slot; priority on extras. |

**Goal:** convince casual customers to become regular fixed customers.

## Capacity and economics (see 0006)

- Herd: **8–10 buffalo → ~70–80 kg/day max**, and only if halwais are bypassed.
  Retail gets a **carve-out** of that, not all of it.
- **50 households (~50–75 kg/day) ≈ the whole herd** — a medium-term ceiling,
  not a launch number. Launch is really ~15–20 households / ~20–30 kg/day.
- Margin ₹5/kg → ~₹2,700/month gross at 15 regulars. **Net negative until
  ~40–50 kg/day.**
- Therefore: **operator delivers themselves at launch**; paid delivery boy and
  the price step-up both wait until ~40–50 kg/day. Herd expansion is the growth
  lever.

## Operations

- **Delivery:** morning round, run by the operator at launch (hired help later).
- **Sellers:** operator + Aman + Manjeet all bring in customers (word of mouth).
- **Area:** one locality, ~50 households in reach.
- **Launch target:** November 2026 (real trigger: dairy producing).
- **Go / no-go gate:** do **not** expand area / hire / change price until
  **15 regular fixed customers** are signed — target within 1 month of launch.
- **Tooling from day one:** thin internal app (operator + delivery runner) plus
  a WhatsApp ordering bot. No customer logins/payments in-app at launch. (0004)

## Open questions / risks

1. **No written supply agreement.** Friends + verbal terms is the classic
   blow-up. Need on paper: the daily kg **carve-out** reserved for retail,
   price, notice period, and priority when halwai demand spikes and milk is
   tight.
2. **Cost price is a placeholder.** ₹55/kg is assumed, not agreed.
3. **Loss-making at launch scale.** ~₹2,700/month gross at 15 regulars won't
   cover a delivery wage. Mitigation is decided (operator delivers, price
   step-up at ~40–50 kg/day) but the plan runs thin until volume grows.
4. **Herd size caps growth.** Can't reach 50 households without more buffalo or
   pulling volume off the halwais — needs a conversation with the dairy.
5. **Regular-customer payment model** (prepaid vs monthly) is undecided.
6. **Business name and legal structure** not decided (repo name "M-cli" is a
   placeholder).
7. **WhatsApp bot cost/setup** — real bot needs WhatsApp Business API via a
   provider (verification + per-message cost). May start manual and switch on
   the bot once volume justifies it.
