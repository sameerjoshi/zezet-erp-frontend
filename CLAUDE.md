# CLAUDE.md — Zezet ERP · Frontend (Next.js)

Web client for the **Zezet ERP** — a custom ERP for **Zezet** (zezet.net), a trucking/logistics company in
**Panama**, replacing a legacy Excel workbook. **Bilingual EN/ES.** Built for non-technical operators —
simple, plain-language, forgiving.

The backend is a separate repo (`zezet-erp-backend`). Talk to it only over HTTP; never import its source.
Types come from a **typed client generated off the backend's OpenAPI spec** (served at the API's `/docs`).
API base URL via `NEXT_PUBLIC_API_URL`.

---

## Domain in one paragraph
A fleet (~38 trucks) runs daily **trips ("tournos")** for clients. Drivers + helpers (employees or
contractors) are paid **per trip**. The **daily trip-entry screen is the flagship** — one operator enters
each truck's trips at the end of the day. Financial data (charges, pay, reports) is **hidden from operations
roles**. The product must feel obvious to people who don't use software much.

## Stack
- **Next.js** (App Router) + **TypeScript** (strict; no `any` without justification).
- **pnpm** (detect lockfile; don't switch package managers). Native build approvals live in `pnpm-workspace.yaml`.
- **TanStack Query** for server state (provider in `src/app/providers.tsx`); minimal client state.
- **next-intl** for i18n — **English + Spanish**, locale-routed under `src/app/[locale]/`. Every
  user-facing string is a key in `messages/{en,es}.json`. Use `src/i18n/navigation.ts` helpers (not raw
  next/link / next/navigation) for locale-aware routing.
- Forms: **Zod**-validated (mirror backend DTO rules).
- Auth: **access token in memory only**; the **refresh token is an httpOnly cookie** set by the backend
  (never readable/stored by JS). Send all auth requests with credentials (`fetch(..., { credentials:
  'include' }))` / axios `withCredentials`). On a 401, call `/auth/refresh` (the cookie is sent
  automatically), then retry. Never put any token in localStorage. This is a settled contract — see the
  backend's `docs/decisions/0001-refresh-token-httponly-cookie.md`.

## Local setup
```bash
pnpm install
cp .env.example .env.local     # NEXT_PUBLIC_API_URL
pnpm dev                       # :3000, redirects to /en
```

## Design system — follow the tokens, don't invent
The locked design system ("Fleet Blue") is encoded as CSS variables + a Tailwind v4 `@theme` in
**`src/app/globals.css`** — that file is the source of truth. Use those tokens; don't hardcode colours.
- Canvas grey `#EEF0F4`, white cards, **deep-ink sidebar** `#15171F`, royal-blue accent `#3D52E0`.
- **5px** radius everywhere (`--radius`); genuinely-round things (status dots, avatars, donuts) stay round.
- **Mulish** font (wired via `next/font` in the layout), **13px** base, compact/dense layout.
- Semantic colour only: green = done · amber = draft · red = check · blue = action. Chrome stays neutral.
- KPI icons sit in soft colour tiles; keep load animation subtle and respect `prefers-reduced-motion`.

## Product principles (audience: non-technical Panama operators)
1. **Plain words, no jargon** — "Done ✓", "Save for later", "Not yet", "check this". Never "Submit/Validation error".
2. **One clear primary action** per screen (blue).
3. **Permission-aware UI** — financial fields/columns/pages **must not render** for operations roles. Drive
   from the user's abilities returned by the API (CASL on the backend).
4. **Forgiving** — warnings never block; everything editable; nothing lost silently.
5. **Compact & scannable**, **bilingual**; layouts tolerate longer Spanish strings (no fixed-width clipping).
6. **Desktop-first** for the entry desk (one operator, batch entry at night), responsive; mobile driver app
   is a later phase.

## Structure (target)
```
src/app/[locale]/        locale-routed App Router pages
src/app/providers.tsx    TanStack Query provider
src/app/globals.css      design tokens (source of truth)
src/components/           reusable UI (Sidebar, Card, KPI, Pill, DataTable, SlideOver…)
src/features/<domain>/    trip-entry, fleet, people, clients, auth — colocated UI + hooks
src/lib/api/             generated OpenAPI client + query hooks
src/i18n/                next-intl routing/request/navigation
messages/                en.json, es.json
```

## Trial scope (Phase 0–1) — build order
Login → app shell (sidebar/topbar, role-gated nav, EN/ES toggle) → **Daily Trip Entry** (the flagship:
date → trucks → trips with rate-prepopulated-but-editable prices, driver/helper, fuel, odometer) →
basic role-gated lists/reports. Master-data admin can be minimal/seed-driven at first.

## Working rhythm & handoff (READ THIS)
Work **one TASKS.md item at a time**: plan briefly → implement → verify (build/run) → tick the box →
commit. Keep `TASKS.md`, `DEVLOG.md`, and the code in the **same commit**.

**Maintain `DEVLOG.md`** — it's the handoff the planning/review session reads, so comms don't depend on
chat. After each task (or notable change), add a dated entry at the **top** with: **What changed** ·
**Decisions / deviations** (anything not obvious from the diff — config, env, trade-offs) ·
**Gotchas / risks** · **Next** (the next unchecked TASKS.md item). Keep it short and skimmable; this is the
single place the hub checks to see where the frontend is.

## Conventions
- Keep components presentational; data via query hooks. Handle loading/empty/error states explicitly.
- Accessibility basics (labels, focus, contrast). Validate at the boundary; show friendly messages.
- No secrets in the bundle. Write clear, obvious code. **No AI-assistant signatures** in code or commits.
