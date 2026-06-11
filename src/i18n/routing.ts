import { defineRouting } from 'next-intl/routing';

// Zezet ERP is bilingual from day one. English is the default; the Panama team uses Spanish.
export const routing = defineRouting({
  locales: ['en', 'es'],
  defaultLocale: 'en',
});
