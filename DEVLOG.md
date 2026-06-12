# DEVLOG — Zezet ERP Frontend

Handoff log. Newest entry on top. One entry per task / notable change.
This is what the planning/review session reads to see where the frontend is and what's next.
See `CLAUDE.md` → "Working rhythm & handoff" for the format. Status of items lives in `TASKS.md`.

---

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
