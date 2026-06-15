'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { DateRangePicker, formatRange, type DateRange } from '@/components/DateRangePicker';
import { useAuth } from '@/lib/auth/useAuth';
import { getTripsReport, getOperational, getClientBillables } from '@/lib/api/reports';

const today = () => new Date().toISOString().slice(0, 10);
const money = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Every calendar day in [from, to], UTC. Backend reports only return days that
// have activity, so we fill the gaps to get a continuous day-by-day axis.
const dayList = (from: string, to: string): string[] => {
  const out: string[] = [];
  const [fy, fm, fd] = from.split('-').map(Number);
  const d = new Date(Date.UTC(fy, fm - 1, fd));
  const end = to;
  for (let i = 0; i < 400; i++) {
    const s = d.toISOString().slice(0, 10);
    out.push(s);
    if (s >= end) break;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
};

export function DashboardView() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const { canSeeMoney } = useAuth();
  const [range, setRange] = useState<DateRange>({ from: today(), to: today() });

  const trips = useQuery({
    queryKey: ['rep-trips', range.from, range.to],
    queryFn: () => getTripsReport(range),
  });
  const oper = useQuery({
    queryKey: ['rep-oper', range.from, range.to],
    queryFn: () => getOperational(range),
  });
  const bill = useQuery({
    queryKey: ['rep-bill', range.from, range.to],
    queryFn: () => getClientBillables(range),
    enabled: canSeeMoney,
  });

  const totalTrips = trips.data?.totalTrips ?? null;
  const trucksUsed = trips.data?.perTruck.length ?? null;

  const days = dayList(range.from, range.to);

  // Operating % over the range: of the truck-days that were recorded (operating /
  // no-clients / broken), how many were operating. Unrecorded days are excluded,
  // so Sundays and not-in-service trucks don't deflate it.
  const operatingPct = oper.data
    ? Math.round(oper.data.totals.operatingPct * 100)
    : null;

  const totalBill = bill.data
    ? bill.data.clients.reduce((s, c) => s + Number(c.billAmount), 0)
    : null;

  const tripMap = new Map((trips.data?.perDay ?? []).map((d) => [d.date, d.tripCount]));
  const perDay = days.map((d) => ({ date: d, tripCount: tripMap.get(d) ?? 0 }));
  const maxDay = Math.max(1, ...perDay.map((d) => d.tripCount));
  const topTrucks = [...(trips.data?.perTruck ?? [])].sort((a, b) => b.tripCount - a.tripCount).slice(0, 8);
  const maxTruck = Math.max(1, ...topTrucks.map((d) => d.tripCount));
  const topClients = [...(bill.data?.clients ?? [])]
    .sort((a, b) => Number(b.billAmount) - Number(a.billAmount))
    .slice(0, 6);
  const maxClient = Math.max(1, ...topClients.map((c) => Number(c.billAmount)));

  const isLoading = trips.isLoading || oper.isLoading;
  const empty = !isLoading && (totalTrips ?? 0) === 0;
  // few days -> show every label; long ranges -> thin them out so they don't collide
  const labelEvery = perDay.length > 16 ? Math.ceil(perDay.length / 12) : 1;

  return (
    <div className="page">
      {/* Range bar */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexWrap: 'wrap' }}>
          <h2 style={{ font: '800 16px var(--font)', margin: 0 }}>{t('overview')}</h2>
          <span className="helper">{formatRange(range, locale)}</span>
          <div className="spacer" />
          <DateRangePicker value={range} onChange={setRange} locale={locale} />
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpibar reveal d1">
        <Kpi tone="blue" label={t('totalTrips')} value={totalTrips} />
        <Kpi tone="green" label={t('trucksUsed')} value={trucksUsed} />
        <Kpi tone="amber" label={t('operatingPct')} value={operatingPct == null ? null : `${operatingPct}%`} />
        {canSeeMoney ? (
          <Kpi tone="red" label={t('amountToBill')} value={totalBill == null ? null : money(totalBill)} />
        ) : (
          <Kpi tone="red" label={`${t('amountToBill')} 🔒`} value="—" />
        )}
      </div>

      {empty && (
        <div className="card reveal d3" style={{ marginTop: 14 }}>
          <div className="empty">{t('noRange')}</div>
        </div>
      )}

      {!empty && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 14, marginTop: 14, alignItems: 'start' }}>
          {/* Trips per day */}
          <div className="card reveal d2">
            <div className="bd">
              <h2 style={{ font: '800 15px var(--font)', margin: '0 0 4px' }}>{t('tripsPerDay')}</h2>
              {isLoading ? (
                <p className="helper">{t('loadingFleet')}</p>
              ) : (
                <div className="bars">
                  {perDay.map((d, i) => (
                    <div className="col" key={d.date} title={`${d.date}: ${d.tripCount}`}>
                      <div
                        className={`bar${d.tripCount === 0 ? ' zero' : ''}`}
                        style={{ height: `${Math.round((d.tripCount / maxDay) * 100)}%` }}
                      />
                      <span className="blab">{i % labelEvery === 0 ? Number(d.date.slice(8)) : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Most active trucks */}
          <div className="card reveal d3">
            <div className="bd">
              <h2 style={{ font: '800 15px var(--font)', margin: '0 0 8px' }}>{t('mostActiveTrucks')}</h2>
              {topTrucks.length === 0 && <p className="helper">{t('noRange')}</p>}
              {topTrucks.map((tr) => (
                <div className="barrow" key={tr.truckId}>
                  <span className="nm">{tr.truckCode}</span>
                  <span className="track"><span className="fill" style={{ width: `${(tr.tripCount / maxTruck) * 100}%` }} /></span>
                  <span className="val">{tr.tripCount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top clients by amount — finance only */}
          {canSeeMoney && topClients.length > 0 && (
            <div className="card reveal d3" style={{ gridColumn: '1 / -1' }}>
              <div className="bd">
                <h2 style={{ font: '800 15px var(--font)', margin: '0 0 8px' }}>{t('topClients')}</h2>
                {topClients.map((c) => (
                  <div className="barrow" key={c.clientId}>
                    <span className="nm" style={{ width: 160 }}>{c.clientName}</span>
                    <span className="track"><span className="fill" style={{ width: `${(Number(c.billAmount) / maxClient) * 100}%` }} /></span>
                    <span className="val" style={{ width: 80 }}>{money(Number(c.billAmount))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Kpi({ tone, label, value }: { tone: string; label: string; value: string | number | null }) {
  return (
    <div className="kpi">
      <span className={`tile ${tone}`}>
        <svg className="ico" viewBox="0 0 24 24">
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
      </span>
      <div className="m">
        <div className="l">{label}</div>
        <div className="v">{value ?? '—'}</div>
      </div>
    </div>
  );
}
