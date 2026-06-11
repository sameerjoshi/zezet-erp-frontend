import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Landing />;
}

function Landing() {
  const t = useTranslations('common');
  return (
    <main className="min-h-screen grid place-items-center p-8">
      <div className="bg-surface border border-line rounded-[var(--radius)] shadow-sm p-8 max-w-md w-full text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-[var(--radius)] bg-side text-white text-xl font-black">
          Z
        </div>
        <h1 className="text-xl font-extrabold">{t('appName')}</h1>
        <p className="text-muted mt-1">{t('tagline')}</p>
        <p className="text-faint mt-6 text-xs">
          Scaffold ready · Next.js · next-intl (EN/ES) · TanStack Query · v4 design tokens
        </p>
      </div>
    </main>
  );
}
