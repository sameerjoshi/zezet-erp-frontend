# CLAUDE.md — Zezet ERP · Frontend (Next.js)

> Web client for the Zezet ERP. Planning/requirements live in the repo root
> (`../../CLAUDE.md`, `../../PLAN.md`, `../../SPEC_Trial_Phase0-1.md`). The **visual contract** is
> `../../design/BRAND.md` + `../../design/wireframes-v4/`. Global `~/.claude/CLAUDE.md` applies on top.

---

## Stack
- **Next.js** (App Router) + **TypeScript** (strict; no `any` without justification).
- **pnpm** (detect lockfile; don't switch package managers).
- **TanStack Query** for server state; minimal client state (URL/state only where needed).
- **next-intl** for i18n — **English + Spanish**, per-user toggle. Every user-facing string is a key.
- Forms: **Zod**-validated (mirror backend DTO rules).
- API access: typed client **generated from the backend OpenAPI** spec (the two codebases are separate;
  do not import backend source). Base URL via `NEXT_PUBLIC_API_URL`.
- Auth: JWT access token in memory + refresh flow against the backend; never store secrets in localStorage.

## Design system (do not invent — follow the tokens)
Source of truth: `../../design/BRAND.md` (locked **v4 "Fleet Blue"**) and `../../design/wireframes-v4/styles.css`.
Port these into the app theme (CSS variables / Tailwind config) **exactly**:
- Canvas grey `#EEF0F4`, white cards, **deep-ink sidebar** `#15171F`, royal-blue accent `#3D52E0`.
- **5px** radius everywhere (dots/avatars/donuts stay round). **Mulish** font, **13px** base, compact density.
- Semantic colour only: green=done · amber=draft · red=check · blue=action. Chrome stays neutral.
- KPI icons in soft colour tiles; subtle staggered load (`prefers-reduced-motion` respected).

## Product principles (audience: non-technical Panama operators)
1. **Plain words, no jargon** — "Done ✓", "Save for later", "Not yet", "check this". Never "Submit/Validation error".
2. **One clear primary action** per screen (blue).
3. **Permission-aware UI** — financial fields/columns/pages (mark `.fin`) **must not render** for operations
   roles. Drive from the user's abilities returned by the API (CASL on the backend).
4. **Forgiving** — warnings never block; everything editable; nothing lost silently.
5. **Compact & scannable**, **bilingual**, layouts tolerate longer Spanish strings (no fixed-width clipping).
6. **Desktop-first** for the entry desk (one operator, batch entry at night), responsive; mobile driver app is a later phase.

## Structure (proposed)
```
src/app/            App Router routes (locale-segmented: /[locale]/…)
src/components/      Reusable UI (Sidebar, Card, KPI, Pill, DataTable, SlideOver…)
src/features/<domain>/   trip-entry, fleet, people, clients, auth — colocated UI+hooks
src/lib/api/        generated OpenAPI client + query hooks
src/lib/i18n/       next-intl config; messages/en.json, messages/es.json
src/styles/         theme tokens ported from BRAND.md
```

## Trial scope (Phase 0–1) — what to build first
Login → app shell (sidebar/topbar, role-gated nav, EN/ES) → **Daily Trip Entry** (the flagship:
date → trucks → trips with rate-prepopulated-but-editable prices, driver/helper, fuel, odometer) →
basic role-gated lists/reports. Master-data admin can be minimal/seed-driven at first.
Reference screens already designed: `dashboard`, `trip-entry` (+ `trip-entry-es`), `people`, `login`.

## Conventions
- Keep components presentational; data via query hooks. Handle loading/empty/error states explicitly.
- Accessibility basics (labels, focus, contrast). Validate inputs at the boundary; show friendly messages.
- No secrets in the bundle. No AI/Claude signatures in code or commits.
