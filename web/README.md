# web/ — Milk Garage front-end

React + Vite + TypeScript + Tailwind v4. Mobile-first, installable PWA, with a
light/dark design-token system.

See [`../docs/decisions/0007-application-spec.md`](../docs/decisions/0007-application-spec.md)
for features and [`0009`](../docs/decisions/0009-build-sequence.md) for build order.

## Run

```bash
npm install
cp .env.example .env.local   # fill from your Supabase project
npm run dev
```

The app renders without Supabase configured so screens can be built before the
backend exists. To browse the signed-in UI locally without an account, set
`VITE_PREVIEW_ROLE=owner` in `.env.local` (dev only — ignored in prod builds).

## Scripts

| Command | |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build (also emits the PWA service worker) |
| `npm run lint` | `tsc --noEmit` |
| `npm run icons` | Regenerate app icons from `scripts/gen-icons.mjs` |

## Layout

| Path | |
|---|---|
| `src/index.css` | Design tokens (CSS variables) + Tailwind `@theme` mapping + component primitives (`.mg-*`) |
| `src/lib/theme.tsx` | Theme context — system / light / dark, persisted, flash-free |
| `src/lib/auth.tsx` | Session + profile/role context |
| `src/lib/supabase.ts` | Client |
| `src/lib/dates.ts` | Local-tz ISO helpers + 9 pm order-cutoff logic |
| `src/ui/` | Reusable components — `Button`, `Card`, `Field`/`Input`/`Select`, `PageHeader`, `EmptyState`, `Skeleton`, `Badge`, `Segmented`, `StatTile`, `DateStepper`, `ThemeToggle` |
| `src/components/Layout.tsx` | Desktop sidebar + mobile bottom nav + "More" sheet |
| `src/components/Wordmark.tsx` | Brand mark + name |
| `src/pages/` | One file per screen |

## Theming

Never hard-code a colour. Use the tokens: `bg-page`, `bg-card`, `bg-sunken`,
`text-ink` / `text-ink-soft` / `text-ink-mute`, `border-line`, `text-accent`,
`bg-accent-weak`, `text-danger` / `bg-danger-weak`, `text-success`, `text-gold`.
Each is a CSS variable defined for light in `:root` and re-defined for dark
under both `@media (prefers-color-scheme: dark)` and `:root[data-theme="dark"]`.

## PWA

`vite-plugin-pwa` (`generateSW`). Manifest name **Milk Garage**, standalone,
maskable icon, offline shell + `public/offline.html` fallback. The service
worker never caches Supabase traffic (different origin), so auth and data are
always live. `devOptions.enabled` is `false` — no SW in `vite dev`.

## Deploy (Vercel)

Root directory `web`, framework preset Vite. Env vars: `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`. `vercel.json` handles SPA rewrites and cache headers.

## Status (Milestone 0/1 — see ../docs/decisions/0009)

- ✅ Rebrand to Milk Garage · design-token system · light/dark · reusable UI kit
- ✅ Responsive: desktop sidebar, mobile bottom nav + sheet
- ✅ PWA: manifest, icons, service worker, offline fallback
- ✅ Dashboard · Herd · Production · Retail customers · Orders · Delivery list · Wholesale · Milk balance
- ⬜ Animal detail/dispose, pause-management UI, dashboard money rollups
