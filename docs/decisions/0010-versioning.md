# 0010 — Versioning

- **Status:** Accepted
- **Date:** 2026-09-09

## Decision

Version the web app with **semver in `web/package.json`** plus a matching
**`vX.Y.Z` git tag**, bumped on **every user-visible push** (not only formal
releases). Classify the bump honestly:

- **patch** — a fix or copy tweak, no new capability
- **minor** — a new screen, field, or behaviour
- **major** — a breaking change to how the app or its data works

`CHANGELOG.md` at the repo root gets a one-block entry per version.

## Shown in the portal

The build stamps `__APP_VERSION__` (from `package.json`), `__GIT_SHA__`
(`git rev-parse --short HEAD`, or `VERCEL_GIT_COMMIT_SHA` on Vercel) and
`__BUILD_TIME__` into the bundle (`vite.config.ts` `define`). `AppVersion`
renders `vX.Y.Z`, with `vX.Y.Z · <sha> · built <date>` in the tooltip. It
appears in the desktop sidebar footer, the mobile "More" sheet, and the
sign-in screen.

## Flow for a push

```bash
# bump web/package.json version, update CHANGELOG.md, then:
git commit -m "vX.Y.Z: <summary>"
git tag vX.Y.Z
git push --follow-tags
```

## Baseline

Tagging started at **v0.3.0**. Earlier states (v0.1.0 scaffold+M1, v0.2.0
rebrand+PWA) are recorded in `CHANGELOG.md` but were not tagged in git.
