# DEVLOG — Zezet ERP Frontend

Dev log. Newest entry on top. One entry per task / notable change.
Format per entry: **What changed · Decisions/deviations · Gotchas/risks · Next.**

---

## 2026-06-12 · App shell + dashboard (visible) ✅
**What changed**
- Ported the locked v4 component CSS into `src/app/globals.css` (sidebar, topbar, KPI, cards, donuts, segbar, cells, pills).
- `Sidebar.tsx` + `Topbar.tsx` (client components): deep-ink rail with i18n nav + active highlighting; topbar with a **working EN/ES toggle** (next-intl router locale switch).
- Route group `[locale]/(app)/` with `layout.tsx` (frame+sidebar) and `dashboard/page.tsx` (KPI strip, 2 donuts, fleet status bar + 38-cell grid). `[locale]/page.tsx` redirects → `/dashboard`.
- Verified EN renders English, ES renders Spanish (Camiones/Registrar viajes/Reportes). Build green.

**Decisions / deviations**
- Reused the proven wireframe CSS verbatim (added compat aliases `--font/--rc/--rb/--green/--red/--shadow` in globals.css) for speed and pixel-fidelity. Can migrate to Tailwind utilities later.
- All dashboard numbers are **hardcoded placeholders** — no API yet.

**Gotchas / risks**
- Nav links other than `/dashboard` 404 (pages not built yet).
- Runs under pm2 as `zezet-web` on **port 3010** (3000 taken by another local stack). Dev server, not a saved pm2 config.

**Next**
- Login screen, then wire auth (ADR 0001 cookie flow) once convenient; then real data via the generated API client.

## 2026-06-11 · Scaffold ✅
**What changed**
- Next.js (App Router) app generated; builds and serves `/en` + `/es`.
- Wired: next-intl EN/ES locale routing (`src/app/[locale]/`, middleware, `messages/{en,es}.json`),
  TanStack Query provider, Mulish font, and the locked **v4 design tokens** in `src/app/globals.css`.

**Decisions / deviations**
- Two-repo setup (separate from backend) → API types come via **OpenAPI codegen**, not shared package.
- Next 16 deprecated `middleware.ts` in favour of `proxy.ts`; left as `middleware.ts` (works) — revisit if it warns harder.

**Gotchas / risks**
- Task 0 (generate API client) needs the **backend running** so its OpenAPI spec exists at `/docs`. If the
  backend isn't up yet, start on **Section 1 (App shell)** instead.

**Next**
- Section 0: generate the typed API client + auth flow.
