'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { getSummary, type TruckStatus } from '@/lib/api/operations';

const today = () => new Date().toISOString().slice(0, 10);
// Step calendar days on a YYYY-MM-DD string in UTC, so the picker never drifts
// by a day in non-UTC timezones (same fix as the trip-entry day bar).
const addDays = (iso: string, days: number) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
};

const cellClass: Record<TruckStatus, string> = {
  confirmed: 'g',
  draft: 'b',
  none: 'x',
};

export function DashboardView() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const [date, setDate] = useState(today());
  const isToday = date === today();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['ops-summary', date],
    queryFn: () => getSummary(date),
  });

  const dayLabel = new Date(date + 'T00:00:00Z').toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });

  const counts = data?.counts;
  const entered = counts ? counts.confirmed + counts.draft : null;
  const pct = (n: number) => (counts && counts.trucks ? Math.round((n / counts.trucks) * 100) : 0);

  return (
    <div className="page">
      {/* Day bar — pick any day; drives the shared ops-summary query */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexWrap: 'wrap' }}>
          <button className="btn ghost sm" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day">◀</button>
          <b style={{ fontSize: 15, minWidth: 190, textAlign: 'center' }}>{dayLabel}</b>
          <button className="btn ghost sm" disabled={isToday} onClick={() => setDate(addDays(date, 1))} aria-label="Next day">▶</button>
          <input
            className="input"
            type="date"
            value={date}
            max={today()}
            onChange={(e) => setDate(e.target.value || today())}
            style={{ width: 160 }}
          />
          {!isToday && (
            <button className="btn ghost sm" onClick={() => setDate(today())}>{t('today')}</button>
          )}
        </div>
      </div>

      {/* KPI strip — "Trucks entered" is live; the rest stay placeholder until their endpoints exist */}
      <div className="kpibar reveal d1">
        <div className="kpi">
          <span className="tile blue">
            <svg className="ico" viewBox="0 0 24 24">
              <path d="M10 17h4V5H2v12h3" />
              <path d="M20 17h2v-3.3a1 1 0 0 0-.3-.7l-2.7-2.7a1 1 0 0 0-.7-.3H14v7h2" />
              <circle cx="7.5" cy="17.5" r="2.5" />
              <circle cx="17.5" cy="17.5" r="2.5" />
            </svg>
          </span>
          <div className="m">
            <div className="l">{t('trucksEntered')}</div>
            <div className="v">
              {entered ?? '—'}{' '}
              <span className="muted" style={{ fontSize: 14 }}>/{counts?.trucks ?? '—'}</span>
            </div>
          </div>
        </div>
        <div className="kpi">
          <span className="tile green">
            <svg className="ico" viewBox="0 0 24 24">
              <path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
            </svg>
          </span>
          <div className="m">
            <div className="l">{isToday ? t('tripsToday') : t('tripsOnDay')}</div>
            <div className="v">{data ? data.trucks.reduce((s, t) => s + t.tripCount, 0) : '—'}</div>
          </div>
        </div>
        <div className="kpi">
          <span className="tile amber">
            <svg className="ico" viewBox="0 0 24 24">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </span>
          <div className="m">
            <div className="l">{t('fleetInUse')}</div>
            <div className="v">{counts ? `${pct(counts.confirmed + counts.draft)}%` : '—'}</div>
          </div>
        </div>
        <div className="kpi">
          <span className="tile red">
            <svg className="ico" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              <path d="M14 2v6h6M9 13h6M9 17h6" />
            </svg>
          </span>
          <div className="m">
            <div className="l">{t('pendingEntry')} 🔒</div>
            <div className="v">{counts?.none ?? '—'}</div>
          </div>
        </div>
      </div>

      {/* Fleet status — live from /operations/summary */}
      <div className="card reveal d3" style={{ marginTop: 14 }}>
        <div className="bd">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ font: '800 16px var(--font)', margin: 0 }}>{isToday ? t('fleetStatusToday') : t('fleetStatusOn', { day: dayLabel })}</h2>
            <div className="spacer" />
            <span className="helper">{counts ? t('trucksCount', { count: counts.trucks }) : ''}</span>
          </div>

          {isLoading && <p className="helper">{t('loadingFleet')}</p>}
          {isError && <p className="helper" style={{ color: 'var(--bad)' }}>{t('loadError')}</p>}

          {data && (
            <>
              <div className="segbar">
                <div className="s g" style={{ flex: Math.max(counts!.confirmed, 0.0001) }}>
                  {counts!.confirmed} / {pct(counts!.confirmed)}%
                </div>
                <div className="s a" style={{ flex: Math.max(counts!.draft, 0.0001) }}>
                  {counts!.draft} / {pct(counts!.draft)}%
                </div>
                <div className="s empty" style={{ flex: Math.max(counts!.none, 0.0001) }}>
                  {counts!.none} / {pct(counts!.none)}%
                </div>
              </div>
              <div className="legrow">
                <span className="li"><span className="sw" style={{ background: 'var(--ok-bg)', borderColor: '#BFE8D4' }} /> {t('confirmed')}</span>
                <span className="li"><span className="sw" style={{ background: '#E9EDFF', borderColor: '#C5D0FF' }} /> {t('draft')}</span>
                <span className="li"><span className="sw" style={{ background: '#fff' }} /> {t('notYet')}</span>
              </div>
              <div className="cellgrid" style={{ marginTop: 14 }}>
                {data.trucks.map((t) => (
                  <div className={`cell ${cellClass[t.status]}`} key={t.truckId} title={`${t.truckCode} · ${t.status} · ${t.tripCount} trip(s)`}>
                    {t.truckCode.replace(/\D+/g, '') || '?'}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
