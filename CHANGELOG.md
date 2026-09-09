# Changelog

Milk Garage web app. Versions are `web/package.json` + a matching `vX.Y.Z` git
tag, bumped on every user-visible push (see `docs/decisions/0010-versioning.md`).
The running version is shown in the app (sidebar, "More" sheet, sign-in screen).

## v0.3.0 — 2026-09-09

- Show the build version (`vX.Y.Z`, with commit SHA + build date on hover) in
  the portal — sidebar footer, mobile "More" sheet, and the sign-in screen.
- Version stamped into the bundle at build time from `package.json` + `git`.

## v0.2.0 — 2026-09-09 _(pre-tag; released as this baseline)_

- **Rebrand to Milk Garage** — brand mark, wordmark, favicon + app icons.
- Design-token system (light / dark, system-aware, persisted toggle), reusable
  UI kit, desktop-sidebar / mobile-bottom-nav layout.
- PWA — manifest, maskable icons, service worker, offline fallback.
- Fixed the iOS PWA status-bar overlap; safe-area insets across header, bottom
  nav, sheets and the sign-in screen; responsive down to 320 px.
- Vercel config (`vercel.json`, `.env.production`).

## v0.1.0 — 2026-09-07 _(pre-tag)_

- Milestone 0 scaffold + Supabase schema (`0001`), RLS, roles.
- Milestone 1 screens: Dashboard, Herd, Production, Retail customers, Orders,
  Delivery list, Wholesale, Daily milk balance.
