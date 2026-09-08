# 0004 — Platform and tooling

- **Status:** Accepted (revised 2026-09-09 — full operation app)
- **Date:** 2026-09-07, revised 2026-09-09

## Decision

Build **one web application** that manages the whole combined milk business
(0001): herd, production, breeding, health, feed, expenses, wholesale sales,
retail sales, milk balance, and combined financials. Full feature list in 0007;
build sequence in 0009.

Supporting piece: a **WhatsApp ordering bot** for retail customers to place /
pause orders, feeding the same backend.

- **Mobile-first, installable as a PWA.** Field use (delivery round, milking
  shed, feed entry) is phone-first; owners also use a laptop for financials.
- **Roles:** *Owner* (operator, Aman, Manjeet) — full access. *Delivery
  runner* — retail delivery list only. *Dairy hand* (optional, later) —
  production + feed entry only.
- Customer-facing self-service (login, in-app payment, self-serve pause) is
  **later**, after the round has been run enough to know how it works.

## Stack

See **0008** — React + Vite + TypeScript + Tailwind on Supabase; Meta WhatsApp
Cloud API for the bot.

## Open items

- [ ] WhatsApp Business API onboarding (verification, phone number).
- [ ] Manual-order fallback UX for when the bot is down.
- [ ] PWA offline scope (delivery marking first).
