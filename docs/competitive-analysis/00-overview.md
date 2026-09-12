# Competitive Analysis — Overview

Persistent knowledge base of dairy/milk-delivery software platforms, built to
support Milk Garage feature decisions ("what does Platform X do here, and how
would we build the same thing"). Read this file first; it explains what's in
the other files and how confident each piece of information is.

## How to use this knowledge base

When a future request is "add the feature we saw on Platform X" or "let's do
what MilkRide does for delivery routing":

1. Check [`02-features.md`](02-features.md) for the feature by name or platform.
2. Check [`05-reverse-engineering.md`](05-reverse-engineering.md) for the
   implementation-relevant breakdown (data model, roles, workflow, edge cases).
3. Check [`06-sources.md`](06-sources.md) to re-fetch the original page if the
   feature needs re-verification (marketing pages change).
4. If the feature is marked `UNKNOWN — REQUIRES VERIFICATION`, say so — don't
   assume the inferred behavior is exact; re-fetch or ask the user to check
   the live product (most of these platforms gate real dashboards behind a
   login/trial signup that wasn't created for this research).

## Confidence levels used throughout

- **Confirmed** — extracted directly from a live fetch of the platform's own
  page in this session (2026-09-13). Marketing-page claims, not verified
  in-product.
- **Likely** — stated on the page but vague, or inferred from very similar
  language across multiple competing platforms in the same category.
- **Inferred** — not stated anywhere; reasoned from how this category of
  product typically works. Always labeled `INFERRED` with the reasoning.
- **Unknown — requires verification** — the page couldn't be fetched (blocked,
  empty, or not attempted), or the detail (e.g. exact in-app screens, exact
  API shapes, exact pricing tiers) isn't publicly visible on a marketing page.

## What this research is (and isn't)

This pass covers **public marketing/pricing pages only**, fetched 2026-09-13.
No logins, trials, or accounts were created to inspect real dashboards or
admin panels (creating accounts is outside what this assistant does). Where a
feature's *existence* is confirmed but its *exact UI/workflow* isn't publicly
documented, that gap is called out explicitly rather than invented — per the
instruction not to fabricate implementation details.

Two platforms found in the initial search (MilkMaster, DairyKhata) return
`403 Forbidden` to automated fetches (bot-blocking, likely Cloudflare) —
their entries are built from the original search-result snippets only, and
are lower-confidence. Swadha's page returned no scrapable content (likely a
JS-rendered SPA) — re-fetch attempts didn't help; its entry is thin.

## Platforms indexed so far

| Platform | Category | Fetch status |
|---|---|---|
| MilkMaster | Milk delivery / subscription SaaS | Blocked (403) — search snippet only |
| DairyKhata | Milk delivery / subscription SaaS | Blocked (403) — search snippet only |
| Milk Delivery Solutions | Milk delivery / subscription SaaS | Fetched — confirmed |
| Milkride | Milk delivery / subscription SaaS | Fetched — confirmed |
| Simple Dairy | Milk delivery + collection + POS (India) | Fetched — confirmed |
| Swadha | Milk collection + dairy ops | Empty fetch — search snippet only |
| MilkingCloud | Herd/cattle management | Fetched — confirmed |

Not yet researched (found in search, not fetched this pass): Ozrit,
Master Software Solutions, Deonde, FoodReady's dairy roundup, Afimilk, VAS.
Add these on request rather than assuming they add anything not already
covered by the platforms above — several are directory/blog listings, not
distinct products.

## Relevance to Milk Garage

Milk Garage (this repo) already covers a meaningful slice of what these
platforms sell as paid features: retail subscriptions with pause/resume,
9pm cutoff freezing, wholesale customer dues, herd/breeding tracking, feed
and expense logging, and now (v0.11.0) a self-service customer portal with
phone+PIN, email magic-link, and Google sign-in. See
[`04-workflows.md`](04-workflows.md) for a side-by-side of what's built vs.
what these platforms offer, to spot genuine gaps worth adding.
