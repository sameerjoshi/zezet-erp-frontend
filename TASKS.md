# TASKS — Zezet ERP Frontend (Phase 0–1 / trial)

Working backlog for **this repo**. Read `CLAUDE.md` first for stack, design system, and product principles.
Check items off as you complete them and commit the change — this file is the live status for the frontend.
Status: ⬜ todo · 🟡 in progress · ✅ done · ⛔ blocked.

> Scaffold is done: app builds and serves `/en` + `/es`; next-intl, TanStack Query, Mulish, and the
> v4 design tokens (`src/app/globals.css`) are wired.

---

## 0 · Foundations  ⬜
- [ ] Generate the **typed API client** from the backend OpenAPI spec into `src/lib/api/generated/` + query hooks
- [ ] Auth flow: login screen, access token in memory + refresh, route guards (redirect when unauthenticated)
- [ ] CI: lint / typecheck / build on push

## 1 · App shell  ⬜
- [ ] Layout: **deep-ink sidebar** + topbar, per the design tokens
- [ ] **Role-gated nav** (Reports/finance hidden for ops roles, driven by abilities from the API)
- [ ] **EN/ES toggle** working (persist per user) using next-intl + `src/i18n/navigation.ts`

## 2 · Reusable UI (from tokens)  ⬜
- [ ] Card · Pill (ok/warn/bad/info) · KPI tile · DataTable · SlideOver · inputs · buttons
- [ ] **Permission-aware rendering** helper — financial fields/columns (`.fin`) don't render for ops roles

## 3 · Master data screens  ⬜
- [ ] Trucks · Workers (employee/contractor) · Clients · Rate cards · Users — list + edit (can be minimal first)

## 4 · ⭐ Daily Trip Entry (flagship)  ⬜
- [ ] Date stepper → active trucks → add **N trips** (no cap)
- [ ] Client select → **rate prepopulation** (charge + driver/helper pay) that **stays editable**
- [ ] Driver + helper selectors; fuel + odometer
- [ ] **Warn, don't block** (e.g. odometer); inline validation; optimistic save
- [ ] Keyboard-fast desktop batch UX (one operator, end of day)

## 5 · Reports  ⬜
- [ ] Role-gated Phase-1 reports (trips / utilization / worker-pay / client-billables) — owner/finance only

## Always
- [ ] Plain words, no jargon ("Done ✓", "Save for later", "Not yet", "check this")
- [ ] Use design tokens (`src/app/globals.css`) — don't hardcode colours; respect EN/ES string length
- [ ] Handle loading/empty/error states explicitly

---
**Out of scope this phase:** Payroll, Billing, Finance, Treasury, Driver mobile app, GPS (later phases).
