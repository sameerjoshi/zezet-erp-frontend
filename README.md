# Zezet ERP — Frontend

Web client for the Zezet ERP (trucking/logistics, Panama). Next.js (App Router) · TypeScript.
Bilingual EN/ES. Built for non-technical operators — simple, plain-language, forgiving.

See `CLAUDE.md` for stack, conventions, and product principles.
Visual contract (locked design tokens): `design/BRAND.md` + `design/wireframes-v4/` in the management hub.

## Stack
- Next.js (App Router) + TypeScript (strict)
- TanStack Query · next-intl (EN/ES) · Zod
- pnpm
- Typed API client generated from the backend OpenAPI spec

## Getting started
> Scaffolding pending (trial Day 3). Once initialized:
```bash
pnpm install
cp .env.example .env   # set NEXT_PUBLIC_API_URL
pnpm dev
```
