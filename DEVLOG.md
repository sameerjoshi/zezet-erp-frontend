# DEVLOG — Zezet ERP Frontend

Dev log. Newest entry on top. One entry per task / notable change.
Format per entry: **What changed · Decisions/deviations · Gotchas/risks · Next.**

---

## 2026-06-16 · Billing / AR UI
**What changed**
- New **Billing** screen (`src/features/billing/BillingView.tsx`, route `/billing`, finance-gated nav link with lock). Invoices tab: list with status filter + pagination, click-through to a detail modal. Create modal: client select + from/to → live billable preview (count + total via `/invoices/billable`) → create; Create disabled when 0 billable. Detail modal: frozen line items + actions (mark sent / mark paid / void / delete draft). AR aging tab (current/30/60/90 per client + grand total).
- `src/lib/api/billing.ts` typed client; status pills (draft amber / sent blue / paid green / void grey); regenerated `schema.d.ts`; EN/ES strings + `nav.billing`, status sent/paid/void, common.delete.

**Verified live:** INV-2026-0001 TLA/May $112,238.57 (404 trips, matches dashboard); re-bill shows "no unbilled trips".

**Next:** Payroll UI (#2).

## 2026-06-15 · Operational tracking UI (3-state status + operating %)
**What changed**
- **Enter Trips**: per-truck-day state control (`.seg`) Operating / No clients / Broken on the panel header, bound to `DailyLogDetail.operStatus` via `updateDailyLog`. Idle/broken hide the trips table and show a banner; adding a trip auto-marks the day operating; fuel/odo shown only when operating. Truck-rail dots now colour by state (broken=red, no-clients=amber, then confirmed/draft/none).
- **Trucks**: `inServiceDate` field in the form.
- **Dashboard**: "Avg. fleet use" KPI replaced by **Operating %** from `getOperational` (`totals.operatingPct`); dropped the utilization query.
- **Reports**: new **Operational** tab (operating/no-clients/broken counts + % per day, paginated); now the default tab.
- Regenerated `src/lib/api/schema.d.ts` from the deployed API; added `OperStatus`, `inServiceDate`, `OperationalReport` to the hand-written clients. EN/ES strings added.

**Decisions/deviations**
- Operating % excludes unrecorded days (null operStatus) by design — matches Xavier's blank-Sunday rule. Historical data is all-operating, so past periods read ~100% until idle/broken get recorded going forward.
- `gen:api` points at localhost:3001; regenerated against `https://api.zezet.amplyfit.com/docs-json` since there's no local DB/API.

**Gotchas/risks**
- Client-side: the % is only as good as the chief's daily marking discipline.

**Next:** sales-vs-mechanics split reporting; surface in-service date on the Trucks list; consider a dashboard 3-state breakdown chart.

## 2026-06-14 · Trip Entry redesign — scales to many trucks ✅
**What changed**
- Replaced the wrapping **truck chips** (unusable at 38 trucks) with a **master-detail layout**: a sticky, scrollable **left rail** listing all trucks (status dot · code · trip count · ✓ when confirmed) + the entry panel on the right.
- Rail has a **search box** and an **All / Pending** filter; day bar gains a **"Next pending →"** jump to advance through unentered trucks fast.
- Empty/placeholder states: "Select a truck…", "No trucks found." New i18n keys (EN/ES).
- Seeded the fleet to **38 active trucks** (via API) so the design is exercised under real load.

**Decisions / deviations**
- Rail max-height `calc(100vh - 250px)` with internal scroll → handles any fleet size without pushing the page.
- "Pending" = status !== confirmed (none or draft).

**Gotchas / risks**
- The 35 extra trucks are dev seed data (Camión 4–38, plates PA-0004…); deactivate if not wanted.

**Next**
- Optional: keyboard nav (J=next pending, Enter=add trip); All-trips view.

## 2026-06-13 · Fixes from test-drive feedback ✅
**What changed**
- **Sidebar:** removed the dead **"All trips"** link (`/trips` was never built → the source of the "random 404s"). Replaced collision-prone `pathname.startsWith(href)` active-matching with segment-aware `pathname === href || startsWith(href + '/')` so `/trips/entry` no longer also lights up `/trips`.
- **Trip Entry:** removed the `maxWidth:1100` cap (card now extends full-width like other pages); moved the add-trip row **into the table as a `<tfoot>` row** so its columns align with the headers (was a separate misaligned CSS grid).
- Self-reviewed in a real browser (login → trip-entry): one active nav item, aligned table, full-width card.

**Decisions / deviations**
- "All trips" log view is deferred — it needs a new backend list-trips-by-range endpoint; removing the dead link is the correct fix until then.

**Gotchas / risks**
- Root cause of "random 404s" was a nav link to an unbuilt page, NOT server flakiness.
- Reminder: do NOT run `pnpm build` while the dev server is up — it corrupts the shared `.next` and 404s every route (use `tsc --noEmit` to typecheck instead).

**Next**
- Optional: build the All-trips view (+ backend endpoint); further visual polish.

## 2026-06-12 · Master-data screens + full i18n pass ✅
**What changed**
- New screens (server page + client feature view, mirroring dashboard): `/trucks`, `/people`, `/clients`, `/settings` (Users, admin-only). Each has list + create/edit (modal) + deactivate, with loading/empty/error states.
- `/clients` is master-detail: selecting a client shows its rate cards + rates with add-rate and close-rate; prices are finance-gated.
- `useAuth` hook (`src/lib/auth/useAuth.ts`): shared `['me']` TanStack query exposing `roles`, `isAdmin`, `canSeeMoney` (admin/finance/investor). `AuthGate` and `Sidebar` now consume it (single profile fetch; sidebar shows the real user).
- API helpers: extended `masterdata.ts` (full Truck/Worker/Client CRUD), new `pricing.ts` (rate cards/rates) and `admin.ts` (users/roles).
- i18n: extracted ALL user-facing strings (login, dashboard, sidebar, topbar, trip-entry, new screens) into `messages/{en,es}.json` under namespaces `common/status/nav/shell/login/dashboard/tripEntry/trucks/people/clients/users`. Spanish uses operator vocabulary (Camiones, Conductor, Ayudante, Kilometraje, Combustible, Cliente, Registrar viajes, Listo, Guardar).
- Polish: added the missing `.input`, `table`, modal, form-grid and helper classes to `globals.css` (referenced but previously undefined).

**Decisions / deviations**
- `POST /users` body field is `roles` (per `schema.d.ts`), not `roleKeys` as the brief stated — followed the schema.
- Finance gating mirrors the backend: money columns/fields hidden unless `canSeeMoney`. Backend still strips the data regardless.
- Users screen lives at `/settings` (matches the existing sidebar link). Non-admins see an "admins only" notice.
- Trip-entry touched only for string extraction + one `eslint-disable` on the pre-existing auto-select effect (new React 19 `set-state-in-effect` rule flagged existing code; no logic change).

**Gotchas / risks**
- Screens are wired against the live API (not exercised this session — backend not running). Money-stripped responses render `—`.
- Topbar "last updated" is now `new Date()` with `suppressHydrationWarning` (SSG build-time vs client).

**Next**
- `/trips` (all trips) and `/reports` still 404.

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
