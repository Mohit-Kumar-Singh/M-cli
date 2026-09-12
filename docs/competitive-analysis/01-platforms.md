# Platform Overview

One record per platform. See [`06-sources.md`](06-sources.md) for exact
fetch dates/URLs.

---

## MilkMaster

- **Category**: Milk/D2C subscription delivery SaaS
- **URL**: https://milkmaster.co/
- **Fetch status**: `UNKNOWN — REQUIRES VERIFICATION` (403 Forbidden on both
  `/` and `/pricing`; bot-blocked). Entry below is from the search-result
  snippet only — **Confidence: Likely**, not Confirmed.
- **Positioning**: automates subscriptions, route operations, CRM and
  billing for subscription-based D2C delivery businesses — not just milk;
  also organic dairy, fresh produce, tiffin services, water delivery,
  egg/poultry subscriptions.
- **Customer types served**: B2C (households) and B2B (offices, hotels,
  cafes).
- **Scale claim**: "trusted by 200+ dairy brands across India and the UK."
- **To verify directly**: open https://milkmaster.co/ in a real browser
  (not an automated fetch) to get past the bot block, or ask the user to
  screenshot it.

---

## DairyKhata

- **Category**: Milk delivery subscription SaaS
- **URL**: https://dairykhata.in/milk-delivery-customer-app
- **Fetch status**: `UNKNOWN — REQUIRES VERIFICATION` (403 Forbidden on
  both the specific page and site root). Entry from search snippet only —
  **Confidence: Likely**.
- **Positioning**: "manage customer subscriptions, delivery schedules, and
  billing for dairy business" — has a dedicated customer-facing app
  (closest direct comparison to Milk Garage's `/book`).
- **To verify directly**: open in a real browser; the URL path
  `/milk-delivery-customer-app` suggests a dedicated marketing page for
  exactly the customer-app feature set worth comparing against `/book`.

---

## Milk Delivery Solutions

- **Category**: Dairy ERP / milk delivery SaaS
- **URL**: https://www.milkdeliverysolutions.com/
- **Fetch status**: **Confirmed** (fetched 2026-09-13)
- **Positioning**: "Dairy ERP Software to manage subscriptions, milk
  rounds, CRM, inventory, & production."
- **User roles** (confirmed on page): Admin, Customer, Driver — three
  distinct apps/surfaces (back-office admin panel, customer app, driver
  app). This 3-surface split is the same shape as Milk Garage
  (owner console, `/book` customer portal) minus a dedicated driver app —
  Milk Garage folds "driver" into the owner-console Deliveries screen
  instead of a separate app.
- **Business models supported**: prepaid, post-paid, hybrid payment
  options.
- **Scale claim**: 15+ named dairy brand clients, 100+ total clients,
  5+ years in operation.
- **Modules**: see [`02-features.md`](02-features.md#milk-delivery-solutions).

---

## Milkride

- **Category**: SaaS milk/tiffin/water/grocery delivery platform (multi-vertical)
- **URL**: https://milkride.com/milk-delivery-software/
- **Fetch status**: **Confirmed** (fetched 2026-09-13)
- **Positioning**: multi-vertical delivery SaaS — same core product
  re-skinned for Milk, Tiffin, Salad & Juice, Distribution, Grocery, Water.
- **Products/surfaces** (confirmed): Merchant Dashboard, Ordering App,
  Driver App, **AssignIQ** (a named routing/assignment tool — distinct
  branded feature, likely an algorithmic delivery-assignment engine).
- **User roles**: Customers, Drivers, Managers, Business owners/SMEs.
- **Pricing**: not disclosed on the fetched page — only "cost-effective
  pricing plans" and a "Start Free Trial" CTA. `UNKNOWN — REQUIRES
  VERIFICATION` for actual numbers.
- **Modules**: see [`02-features.md`](02-features.md#milkride).

---

## Simple Dairy

- **Category**: Dairy management SaaS (India-focused — village milkmen
  through multi-branch plants)
- **URL**: https://simpledairy.com/
- **Fetch status**: **Confirmed** (fetched 2026-09-13) — richest, most
  concrete source of this pass (explicit pricing found).
- **Positioning**: "powers dairies across the whole of India" — six core
  modules (see below), WhatsApp + UPI as first-class payment/notification
  rails (notably India-specific, unlike the more generic Western-style
  copy on Milkride/Milk Delivery Solutions).
- **Language support**: 9+ languages (Hindi, English, Hinglish, Marathi,
  Gujarati, Punjabi, Tamil, Telugu, Odia) — a genuine differentiator vs.
  Milk Garage, which is English-only.
- **User roles** (confirmed): dairy owner/operator, delivery boys (app
  access), collection persons (shift-based), counter staff (multi-booth),
  farmers (payment-slip recipients only, not full accounts).
- **Modules**: see [`02-features.md`](02-features.md#simple-dairy).
- **Pricing**: see [`03-pricing.md`](03-pricing.md#simple-dairy) — the one
  platform in this pass with confirmed, explicit numbers.

---

## Swadha

- **Category**: Dairy collection + operations SaaS (farmer-facing)
- **URL**: https://swadhaagri.com/saas/dairy-management-software
- **Fetch status**: `UNKNOWN — REQUIRES VERIFICATION` (page fetched twice,
  returned no scrapable text both times — likely a JS-rendered SPA that
  WebFetch's HTML→text conversion can't see through). Entry from search
  snippet only — **Confidence: Likely**.
- **Positioning**: "end-to-end management of milk collection, quality
  control, delivery and payment processes," with a **bilingual farmer
  app** to manage supplies, milk quality, complaints, bills, payments.
- **Distinguishing angle**: unlike the other platforms (which are
  delivery/subscription-first), Swadha's marketing centers the **farmer
  side** (milk collection from producers) more than the end-consumer
  delivery side — closer to Milk Garage's own milk-collection needs if it
  ever buys from outside vendors (see `docs/decisions/0006` growth path:
  "securing good milk from other milk vendor and redistributing it").
- **To verify directly**: open in a real browser; screenshot the feature
  list and farmer-app screens if this becomes relevant to Milk Garage's
  vendor-milk growth path.

---

## MilkingCloud

- **Category**: Herd/cattle management SaaS (not delivery — production
  side only)
- **URL**: https://www.milkingcloud.com/solutions/dairy-farm/
- **Fetch status**: **Confirmed** (fetched 2026-09-13)
- **Positioning**: integrates herd health, reproduction, nutrition, and
  milk production into one system; also serves beef and breeding
  operations, not just dairy. Claims 15,000+ farmers worldwide.
- **Closest match to Milk Garage's own modules**: Herd, Production, Health,
  Breeding — MilkingCloud's equivalents are more clinically detailed (see
  hardware devices below) than Milk Garage's manual-entry approach.
- **Hardware integrations** (confirmed, named products — genuinely
  distinctive vs. every other platform in this pass, all of which are
  software-only):
  - **MastiPro** — automated mastitis test device (ion analysis during
    milking)
  - **M2Moo** — heat-detection via movement/motion analysis
  - **PartuSense** — calving prediction/detection device
  - **WashLog** — milking-line wash-quality monitoring
- **Software integrations**: Slack, Trello (notifications/task management
  — unusual for this category, suggests a more "ops team" oriented buyer
  than the family-dairy Milk Garage targets).
- **Pricing**: free plan exists, "scaled to herd size"; paid tiers not
  disclosed. `UNKNOWN — REQUIRES VERIFICATION` for numbers.
- **Modules**: see [`02-features.md`](02-features.md#milkingcloud).
