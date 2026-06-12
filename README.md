# Zezet ERP — Frontend

Web client for the Zezet ERP — a custom ERP for a trucking/logistics company in Panama.
**Next.js (App Router) · TypeScript.** Bilingual **EN/ES**. Built for non-technical operators —
simple, plain-language, forgiving.

Talks to the backend (`zezet-erp-backend`) only over HTTP; types come from a client generated off its
OpenAPI spec. Design tokens (locked "Fleet Blue" system) live in `src/app/globals.css` — use them, don't
hardcode colours. Progress in `DEVLOG.md`.

## Getting started
```bash
pnpm install
cp .env.example .env.local     # NEXT_PUBLIC_API_URL
pnpm dev                       # :3000, redirects to /en
```

## Conventions (essentials)
- **next-intl** EN/ES routing under `src/app/[locale]/`; every user-facing string is a key in `messages/`.
- Auth: access token in **memory**; refresh via **httpOnly cookie** (`credentials: 'include'`, on-401 → refresh → retry). Never put tokens in localStorage.
- **Permission-aware UI** — financial fields/pages don't render for operations roles.
- Plain words ("Done", "Save for later", "Not yet"); one clear primary action per screen; warnings never block.
- No AI-assistant signatures in commits/code.
