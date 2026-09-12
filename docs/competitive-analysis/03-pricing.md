# Pricing Catalogue

Matrix format: Platform → Plan → Price → Billing cycle → Included features →
Limits → Add-ons → Extra charges → Conditions. No price is assumed where
not explicitly published — most platforms in this category hide pricing
behind a "Contact us" / "Start Free Trial" CTA.

---

## Simple Dairy

**The only platform in this pass with explicit, confirmed public pricing.**

| Plan | Price | Billing | Included | Limits | Conditions |
|---|---|---|---|---|---|
| Free Trial | ₹0 | 30 days | Full feature access (implied, not explicitly scoped down) | Time-boxed to 30 days | "No card required" |
| Business | ₹1.09/customer/month | Annual (quoted as ₹109/mo for 100 customers) | All 6 core modules | Scales per-customer — cost grows linearly with customer count | — |
| Enterprise | Custom (not disclosed) | Custom | White-label branded app + multi-branch support | N/A | Contact-sales pricing |

- **Confidence**: Confirmed (explicit numbers on the fetched page,
  2026-09-13).
- **Add-on**: White-label app (Google Play/App Store, custom
  logo/colors/domain) — described as "zero commission model," priced as
  part of/upgrade to Enterprise. Exact incremental price:
  `UNKNOWN — REQUIRES VERIFICATION`.
- **Note for Milk Garage comparison**: at Milk Garage's actual scale
  (target 15 regular customers per `docs/decisions/0005`), Simple Dairy's
  Business plan would cost roughly ₹16–17/month (15 × ₹1.09) — i.e.
  trivially cheap even before considering that Milk Garage is free/custom.
  This confirms the "why build custom" answer isn't cost-avoidance at
  this scale; it's **control and exact-fit customization** (₹60/kg
  pricing model, 9pm cutoff, WhatsApp-first customer base, wholesale +
  retail in one system) that these generic platforms don't tailor to.

---

## MilkMaster

- **Pricing**: `UNKNOWN — REQUIRES VERIFICATION` — homepage and `/pricing`
  both blocked automated fetch (403). Not found in the original search
  snippet either.
- **To verify**: open https://milkmaster.co/pricing in a real browser.

---

## DairyKhata

- **Pricing**: `UNKNOWN — REQUIRES VERIFICATION` — page blocked (403), and
  the specific page fetched (`/milk-delivery-customer-app`) is a feature
  page, not a pricing page; no pricing URL identified yet.
- **To verify**: browse the site manually for a `/pricing` or
  `/plans` path.

---

## Milk Delivery Solutions

- **Pricing**: Not displayed on the fetched homepage — "directs to a
  separate pricing page" (page reference, but the pricing page itself
  wasn't fetched this pass).
- **Confidence**: Confirmed that pricing is gated behind a separate page;
  actual numbers `UNKNOWN — REQUIRES VERIFICATION`.

---

## Milkride

- **Pricing**: "cost-effective pricing plans" (marketing language only) +
  "Start Free Trial" CTA. No tier names, no numbers.
- **Confidence**: Confirmed that no numbers are public; actual pricing
  `UNKNOWN — REQUIRES VERIFICATION`.

---

## Swadha

- **Pricing**: Not captured — page returned no scrapable content this
  pass. `UNKNOWN — REQUIRES VERIFICATION`.

---

## MilkingCloud

| Plan | Price | Conditions |
|---|---|---|
| Free | ₹0 (implied — currency not specified, likely USD given global positioning) | "Features scaled to herd size" — exact scaling rule `UNKNOWN — REQUIRES VERIFICATION` |
| Paid tier(s) | Not disclosed | Mentioned to exist, no names/numbers on fetched page |

- **Confidence**: Confirmed that a free plan exists; everything else about
  it (herd-size thresholds, paid tier names/prices) is `UNKNOWN —
  REQUIRES VERIFICATION`.

---

## Cross-platform pricing pattern (observed, not confirmed per-platform)

Every platform in this pass except Simple Dairy hides exact pricing behind
a sales-contact or trial-signup flow — **standard B2B SaaS pattern**, not
specific to dairy software. Simple Dairy is the outlier by publishing a
simple per-customer/month number, likely because it targets much smaller
individual dairy operators (village milkmen) who wouldn't tolerate a
sales-call-gated pricing page the way a multi-branch enterprise buyer
would. This is **INFERRED** market-segmentation reasoning, not stated by
any platform directly.
