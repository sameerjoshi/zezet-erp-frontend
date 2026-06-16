'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { logout } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/useAuth';

type Item = { href: string; label: string; icon: ReactNode; lock?: boolean };

export function Sidebar() {
  const t = useTranslations('nav');
  const ts = useTranslations('shell');
  const pathname = usePathname();
  const router = useRouter();
  const qc = useQueryClient();
  const { user, roles } = useAuth();

  const onSignOut = async () => {
    await logout();
    qc.removeQueries({ queryKey: ['me'] });
    router.replace('/login');
  };

  const username = user?.username ?? '';
  const initials = username.slice(0, 2).toUpperCase() || '··';
  const roleLabel = roles[0] ?? ts('owner');

  // Active when on the exact route or a nested child — avoids `/trips` matching `/trips/entry`.
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const items: Item[] = [
    { href: '/dashboard', label: t('dashboard'), icon: I.grid },
    { href: '/trips/entry', label: t('enterTrips'), icon: I.edit },
    { href: '/trucks', label: t('trucks'), icon: I.truck },
    { href: '/people', label: t('people'), icon: I.people },
    { href: '/clients', label: t('clientsPrices'), icon: I.tag },
  ];

  return (
    <aside className="side">
      <div className="brandmark">
        <span className="z">Z</span>
        <span className="w">
          zezet<small>FLEET · PANAMÁ</small>
        </span>
      </div>

      <nav className="nav">
        {items.map((it) => (
          <Link key={it.href} href={it.href} className={isActive(it.href) ? 'active' : ''}>
            {it.icon} {it.label}
          </Link>
        ))}
        <div className="sep" />
        <Link href="/billing" className={isActive('/billing') ? 'active' : ''}>
          {I.invoice} {t('billing')} <span className="lock">🔒</span>
        </Link>
        <Link href="/payroll" className={isActive('/payroll') ? 'active' : ''}>
          {I.cash} {t('payroll')} <span className="lock">🔒</span>
        </Link>
        <Link href="/reports" className={isActive('/reports') ? 'active' : ''}>
          {I.report} {t('reports')} <span className="lock">🔒</span>
        </Link>
        <Link href="/settings" className={isActive('/settings') ? 'active' : ''}>
          {I.gear} {t('settings')}
        </Link>
      </nav>

      <div className="sep" />
      <div className="me">
        <span className="ph">{initials}</span>
        <div>
          <b>{username}</b>
          <small>{roleLabel}</small>
        </div>
      </div>
      <button className="signout" onClick={onSignOut}>
        {I.out} {ts('signOut')}
      </button>
    </aside>
  );
}

// Inline stroke icons (thin outline) — match the v4 design.
const svg = (d: ReactNode) => (
  <svg className="ico" viewBox="0 0 24 24">
    {d}
  </svg>
);
const I = {
  grid: svg(
    <>
      <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
    </>,
  ),
  edit: svg(
    <>
      <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>,
  ),
  list: svg(
    <>
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </>,
  ),
  truck: svg(
    <>
      <path d="M10 17h4V5H2v12h3" />
      <path d="M20 17h2v-3.3a1 1 0 0 0-.3-.7l-2.7-2.7a1 1 0 0 0-.7-.3H14v7h2" />
      <circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
    </>,
  ),
  people: svg(
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.9" />
    </>,
  ),
  tag: svg(
    <>
      <path d="M20 7h-9" /><path d="M14 17H5" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" />
    </>,
  ),
  report: svg(
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" /><path d="M8 13h8M8 17h5" />
    </>,
  ),
  invoice: svg(
    <>
      <path d="M6 2h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" />
      <path d="M14 2v6h6" /><path d="M9 13h6M9 17h6M9 9h2" />
    </>,
  ),
  cash: svg(
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </>,
  ),
  gear: svg(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.2.61.78 1.03 1.42 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </>,
  ),
  out: svg(
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
    </>,
  ),
};
