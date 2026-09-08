# 0008 — Tech stack

- **Status:** Accepted
- **Date:** 2026-09-09

## Decision

| Layer | Choice |
|---|---|
| Frontend | **React + Vite + TypeScript**, mobile-first, PWA (`vite-plugin-pwa`) |
| Styling | **Tailwind CSS** + CSS custom properties for light/dark |
| Data / auth / backend | **Supabase** — Postgres, Auth, Row-Level Security, Realtime, Edge Functions, Storage (animal photos, delivery proof) |
| Routing | `react-router` |
| WhatsApp bot | **Meta WhatsApp Cloud API**, webhook → Supabase Edge Function |
| Hosting | Frontend on **Vercel** (or Netlify); backend on Supabase |
| Repo layout | `web/` for the app, `supabase/` for migrations + functions |

## Why

- One managed backend covers auth (owner / runner / dairy-hand roles via RLS),
  the relational data in 0007, realtime for the live delivery list, Edge
  Functions for the bot webhook and the nightly cutoff job, and Storage for
  photos. Minimal ops for a 3-person team.
- Meta Cloud API's free tier covers 15–50 retail customers; no paid BSP needed
  yet.
- Cost at launch ≈ ₹0/month.

## Rejected

- **No-code (Glide / AppSheet on Sheets):** faster to a v1 but the WhatsApp bot
  is awkward and migrating off later is a rewrite. We have the dev capability,
  so code it.
- **Next.js:** SSR/public-site benefits don't matter for a logged-in ops tool;
  extra complexity now.
- **Firebase:** the data here is deeply relational (herd ↔ breeding ↔ calves ↔
  production ↔ balance); Postgres fits, NoSQL fights it.

## Conventions

- Migrations: `supabase/migrations/NNNN_description.sql`, sequential, never edit
  an applied one — write a new migration to change it.
- **RLS is the authorization layer.** A `select` policy grants the whole row —
  keep sensitive columns behind narrow `security definer` resolvers, not broad
  row grants. Verify policies by running a scoped query as the affected role,
  not by reading the SQL.
- Version bump + tag on every user-visible deploy.

## Open items

- [ ] Create the Supabase project (needs an owner to provision + confirm cost).
- [ ] Vercel project + env wiring.
- [ ] Meta WhatsApp Business onboarding.
