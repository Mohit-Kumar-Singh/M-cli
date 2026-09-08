# M-cli

One milk business, three equal co-owners. An 8–10 buffalo herd producing
buffalo milk, sold through two channels:

- **Wholesale** — bulk to sweet shops (halwais)
- **Retail** — household home delivery at ₹60/kg, no monthly lock-in

This repo is the **management application** for the whole operation — herd,
production, breeding, health, feed, expenses, both sales channels, and combined
financials — plus a WhatsApp ordering bot for retail customers.

## Layout

| Path | What |
|---|---|
| `docs/business-overview.md` | The whole plan on one page |
| `docs/decisions/` | Numbered decision records (0001–0009) — the authoritative history |
| `web/` | The app — Vite + React + TS + Tailwind (see `web/README.md`) |
| `supabase/` | Database migrations + Edge Functions |

Start with [`docs/business-overview.md`](docs/business-overview.md), then
[`docs/decisions/0007-application-spec.md`](docs/decisions/0007-application-spec.md)
for features and [`docs/decisions/0009-build-sequence.md`](docs/decisions/0009-build-sequence.md)
for what's being built in what order.

## Status

Pre-launch. Building **Milestone 1** (usable core) for a November 2026 target;
full feature set follows (0009). Retail expansion is gated: no scaling area /
hiring / price changes until **15 regular fixed customers**.
