'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';

export function Topbar({ title }: { title: string }) {
  const locale = useLocale();
  const t = useTranslations('common');
  const ts = useTranslations('shell');
  const router = useRouter();
  const pathname = usePathname();

  const setLocale = (next: 'en' | 'es') => {
    if (next !== locale) router.replace(pathname, { locale: next });
  };

  const updated = new Date().toLocaleDateString(locale === 'es' ? 'es-PA' : 'en-GB');

  return (
    <header className="topbar">
      <span className="upd">
        {ts('lastUpdated')}: <b suppressHydrationWarning>{updated}</b>
      </span>
      <h1 style={{ font: '900 18px var(--font)', margin: 0 }}>{title}</h1>
      <div className="spacer" />

      <div className="search">
        <svg className="ico" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4-4" />
        </svg>
        <input placeholder={t('search')} />
      </div>

      <button className="iconbtn" aria-label="Notifications">
        <svg className="ico" viewBox="0 0 24 24">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        <span className="dotb" />
      </button>

      <span className="lang">
        <button className={locale === 'en' ? 'on' : ''} onClick={() => setLocale('en')}>
          EN
        </button>
        <button className={locale === 'es' ? 'on' : ''} onClick={() => setLocale('es')}>
          ES
        </button>
      </span>
    </header>
  );
}
