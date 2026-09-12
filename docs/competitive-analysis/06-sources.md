# Source Index

Every URL touched in this research pass, its fetch status, and what it was
used for. Re-fetch dates should be added below when a page is re-verified
later (marketing pages and pricing change).

| # | URL | Fetched | Status | Used for |
|---|---|---|---|---|
| 1 | https://milkmaster.co/ | 2026-09-13 | 403 Forbidden | Platform entry (snippet-only, `01-platforms.md`) |
| 2 | https://milkmaster.co/pricing | 2026-09-13 | 403 Forbidden | Pricing (unresolved, `03-pricing.md`) |
| 3 | https://dairykhata.in/milk-delivery-customer-app | 2026-09-13 | 403 Forbidden | Platform entry (snippet-only) |
| 4 | https://dairykhata.in/ | 2026-09-13 | 403 Forbidden | Retry, same result |
| 5 | https://www.milkdeliverysolutions.com/ | 2026-09-13 | Fetched OK | `01-platforms.md`, `02-features.md` (full module list) |
| 6 | https://milkride.com/milk-delivery-software/ | 2026-09-13 | Fetched OK | `01-platforms.md`, `02-features.md` (AssignIQ, modules) |
| 7 | https://milkride.com/top-10-milk-delivery-apps-for-dairy-businesses-worldwide/ | not fetched | — | Found via search only, not opened |
| 8 | https://simpledairy.com/ | 2026-09-13 | Fetched OK | `01-platforms.md`, `02-features.md`, `03-pricing.md` (explicit pricing) |
| 9 | https://swadhaagri.com/saas/dairy-management-software | 2026-09-13 | Empty (no scrapable text) | Platform entry (snippet-only) |
| 10 | https://swadhaagri.com/ | 2026-09-13 | Empty (no scrapable text) | Retry, same result |
| 11 | https://www.milkingcloud.com/solutions/dairy-farm/ | 2026-09-13 | Fetched OK | `01-platforms.md`, `02-features.md` (hardware devices) |
| 12 | https://deonde.co/blog/milk-subscription-management-software/ | not fetched | — | Found via search only, not opened |
| 13 | https://ozrit.com/milk-delivery-app-development | not fetched | — | Found via search only, not opened |
| 14 | https://www.mastersoftwaresolutions.com/milk-delivery-app-development/ | not fetched | — | Found via search only, not opened |
| 15 | https://sourceforge.net/software/dairy-management/saas/ | not fetched | — | Directory listing, found via search only |
| 16 | https://foodready.ai/app/dairy-management-software/ | not fetched | — | Directory listing, found via search only |
| 17 | https://vas.com/ | not fetched | — | Herd management, found via search only |
| 18 | https://deonde.co/blog/dairy-management-software/ | not fetched | — | Found via search only, not opened |

## Search queries used (this session, 2026-09-13)

1. `"milk delivery subscription app software for dairy business India customer ordering"`
2. `"dairy farm management app herd milk production billing delivery software SaaS"`

## Milk Garage internal sources cross-referenced

- `docs/decisions/0001` — combined business model, 3 owners
- `docs/decisions/0005` — regular-customer pricing/target (15 regulars)
- `docs/decisions/0006` — capacity, growth path (buy from external vendors)
- `docs/decisions/0007` — full application spec
- `docs/decisions/0009` — build sequence / milestone status (WhatsApp bot,
  cutoff job, conversion candidates, financials all listed as open)
- `supabase/migrations/0001_core_schema.sql` — `payment_mode` enum
  (`monthly` unused), `retail_order_source`/`created_via` (`'bot'`,
  `'whatsapp'` reserved values)
- `web/src/pages/*.tsx` — actual current Milk Garage workflows, read
  directly rather than inferred

## Re-verification checklist (for next time this KB is opened)

- [ ] Re-fetch MilkMaster and DairyKhata from a real browser (not
      automated fetch) — both are currently snippet-only.
- [ ] Re-fetch Swadha with a rendering-capable fetch (its page is
      JS-heavy) or via browser screenshot.
- [ ] Find and fetch actual pricing pages for Milk Delivery Solutions,
      Milkride, MilkingCloud (all confirmed to exist but not located this
      pass).
- [ ] If SNF/Fat milk pricing ever becomes relevant (`0006` growth path),
      research the actual formula from a dairy-industry source, not a
      competitor's marketing copy.
