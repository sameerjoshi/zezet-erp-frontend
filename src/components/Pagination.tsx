'use client';

import { useTranslations } from 'next-intl';
import type { Paged } from '@/lib/usePaged';

// Footer pager for a paginated table. Renders nothing for a single page so short
// lists stay clean. Pass a Paged<T> from usePaged().
export function Pagination<T>({ paged }: { paged: Paged<T> }) {
  const t = useTranslations('pager');
  const { page, pageCount, from, to, total, setPage } = paged;
  if (total === 0) return null;
  return (
    <div className="pager">
      <span className="pager-info">{t('showing', { from, to, total })}</span>
      <div className="spacer" />
      {pageCount > 1 && (
        <>
          <button className="btn ghost sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {t('prev')}
          </button>
          <span className="pager-page">{t('page', { page, pages: pageCount })}</span>
          <button className="btn ghost sm" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>
            {t('next')}
          </button>
        </>
      )}
    </div>
  );
}
