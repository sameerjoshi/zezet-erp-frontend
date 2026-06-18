'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth/useAuth';
import {
  getTripsReport,
  getUtilization,
  getOperational,
  getWorkerPay,
  getClientBillables,
  getTruckPnl,
  type Range,
} from '@/lib/api/reports';
import { usePaged } from '@/lib/usePaged';
import { Pagination } from '@/components/Pagination';

type Tab =
  | 'operational'
  | 'pnl'
  | 'trips'
  | 'utilization'
  | 'workerPay'
  | 'clientBillables';

const isoBack = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

export function ReportsView() {
  const t = useTranslations('reports');
  const { canSeeMoney, isLoading: authLoading } = useAuth();
  const [from, setFrom] = useState(isoBack(29));
  const [to, setTo] = useState(isoBack(0));
  const [tab, setTab] = useState<Tab>('operational');

  if (authLoading) return <div className="page helper">…</div>;
  if (!canSeeMoney) {
    return (
      <div className="page">
        <div className="card">
          <div className="bd helper">{t('financeOnly')}</div>
        </div>
      </div>
    );
  }

  const range: Range = { from, to };
  const tabs: { key: Tab; label: string }[] = [
    { key: 'operational', label: t('tabOperational') },
    { key: 'pnl', label: t('tabPnl') },
    { key: 'trips', label: t('tabTrips') },
    { key: 'utilization', label: t('tabUtilization') },
    { key: 'workerPay', label: t('tabWorkerPay') },
    { key: 'clientBillables', label: t('tabClientBillables') },
  ];

  return (
    <div className="page">
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexWrap: 'wrap' }}>
          <span className="helper" style={{ fontWeight: 700 }}>{t('from')}</span>
          <input className="input" type="date" style={{ width: 160 }} value={from} onChange={(e) => setFrom(e.target.value)} />
          <span className="helper" style={{ fontWeight: 700 }}>{t('to')}</span>
          <input className="input" type="date" style={{ width: 160 }} value={to} onChange={(e) => setTo(e.target.value)} />
          <div className="spacer" />
          <span className="seg">
            {tabs.map((x) => (
              <button key={x.key} className={tab === x.key ? 'on' : ''} onClick={() => setTab(x.key)}>
                {x.label}
              </button>
            ))}
          </span>
        </div>
      </div>

      {tab === 'operational' && <OperationalPanel range={range} />}
      {tab === 'pnl' && <PnlPanel range={range} />}
      {tab === 'trips' && <TripsPanel range={range} />}
      {tab === 'utilization' && <UtilizationPanel range={range} />}
      {tab === 'workerPay' && <WorkerPayPanel range={range} />}
      {tab === 'clientBillables' && <ClientBillablesPanel range={range} />}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="hd"><h2>{title}</h2></div>
      {children}
    </div>
  );
}
function Empty() {
  const t = useTranslations('reports');
  return <div className="bd helper">{t('noData')}</div>;
}

const money = (s: string) => '$' + Number(s).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function PnlPanel({ range }: { range: Range }) {
  const t = useTranslations('reports');
  const q = useQuery({ queryKey: ['rep-pnl', range], queryFn: () => getTruckPnl(range) });
  const rows = q.data?.perTruck ?? [];
  const pg = usePaged(rows, 20);
  const tot = q.data?.totals;
  return (
    <Panel title={`${t('tabPnl')}${tot ? ` · ${money(tot.profit)} ${t('profit')}` : ''}`}>
      {q.isLoading ? (
        <div className="bd helper">…</div>
      ) : rows.length === 0 ? (
        <Empty />
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>{t('truck')}</th>
                <th style={{ textAlign: 'right' }}>{t('revenue')}</th>
                <th style={{ textAlign: 'right' }}>{t('fuel')}</th>
                <th style={{ textAlign: 'right' }}>{t('pay')}</th>
                <th style={{ textAlign: 'right' }}>{t('costs')}</th>
                <th style={{ textAlign: 'right' }}>{t('profit')}</th>
              </tr>
            </thead>
            <tbody>
              {pg.pageItems.map((r) => {
                const pay = (Number(r.driverPay) + Number(r.helperPay)).toFixed(2);
                const neg = Number(r.profit) < 0;
                return (
                  <tr key={r.truckId}>
                    <td><b>{r.truckCode}</b></td>
                    <td className="tnum" style={{ textAlign: 'right' }}>{money(r.revenue)}</td>
                    <td className="tnum" style={{ textAlign: 'right' }}>{money(r.fuel)}</td>
                    <td className="tnum" style={{ textAlign: 'right' }}>{money(pay)}</td>
                    <td className="tnum" style={{ textAlign: 'right' }}>{money(r.costs)}</td>
                    <td className="tnum" style={{ textAlign: 'right', fontWeight: 700, color: neg ? 'var(--bad)' : 'var(--ok)' }}>{money(r.profit)}</td>
                  </tr>
                );
              })}
            </tbody>
            {tot && (
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--line-2)', fontWeight: 800 }}>
                  <td>{t('total')}</td>
                  <td className="tnum" style={{ textAlign: 'right' }}>{money(tot.revenue)}</td>
                  <td className="tnum" style={{ textAlign: 'right' }}>{money(tot.fuel)}</td>
                  <td className="tnum" style={{ textAlign: 'right' }}>{money((Number(tot.driverPay) + Number(tot.helperPay)).toFixed(2))}</td>
                  <td className="tnum" style={{ textAlign: 'right' }}>{money(tot.costs)}</td>
                  <td className="tnum" style={{ textAlign: 'right', color: Number(tot.profit) < 0 ? 'var(--bad)' : 'var(--ok)' }}>{money(tot.profit)}</td>
                </tr>
              </tfoot>
            )}
          </table>
          <Pagination paged={pg} />
        </>
      )}
    </Panel>
  );
}

function OperationalPanel({ range }: { range: Range }) {
  const t = useTranslations('reports');
  const q = useQuery({ queryKey: ['rep-oper', range], queryFn: () => getOperational(range) });
  const recordedDays = (q.data?.perDay ?? []).filter((d) => d.recorded > 0);
  const pg = usePaged(recordedDays, 20);
  const tot = q.data?.totals;
  const pctTotal = tot ? Math.round(tot.operatingPct * 100) : null;
  return (
    <Panel
      title={`${t('tabOperational')}${pctTotal == null ? '' : ` · ${pctTotal}% ${t('operating')}`}`}
    >
      {q.isLoading ? (
        <div className="bd helper">…</div>
      ) : recordedDays.length === 0 ? (
        <Empty />
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>{t('date')}</th>
                <th style={{ textAlign: 'right' }}>{t('operating')}</th>
                <th style={{ textAlign: 'right' }}>{t('noClients')}</th>
                <th style={{ textAlign: 'right' }}>{t('broken')}</th>
                <th style={{ textAlign: 'right' }}>{t('operatingPct')}</th>
              </tr>
            </thead>
            <tbody>
              {pg.pageItems.map((d) => (
                <tr key={d.date}>
                  <td>{d.date}</td>
                  <td className="tnum" style={{ textAlign: 'right' }}>{d.operating}</td>
                  <td className="tnum" style={{ textAlign: 'right' }}>{d.noClients}</td>
                  <td className="tnum" style={{ textAlign: 'right' }}>{d.broken}</td>
                  <td className="tnum" style={{ textAlign: 'right', fontWeight: 700 }}>{Math.round(d.operatingPct * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination paged={pg} />
        </>
      )}
    </Panel>
  );
}

function TripsPanel({ range }: { range: Range }) {
  const t = useTranslations('reports');
  const q = useQuery({ queryKey: ['rep-trips', range], queryFn: () => getTripsReport(range) });
  const pg = usePaged(q.data?.perTruck ?? [], 20);
  return (
    <Panel title={`${t('tabTrips')} · ${q.data?.totalTrips ?? '—'} ${t('totalTrips')}`}>
      {q.isLoading ? <div className="bd helper">…</div> : !q.data?.perTruck.length ? <Empty /> : (
        <>
        <table>
          <thead><tr><th>{t('truck')}</th><th style={{ textAlign: 'right' }}>{t('trips')}</th></tr></thead>
          <tbody>
            {pg.pageItems.map((r) => (
              <tr key={r.truckId}><td>{r.truckCode}</td><td className="tnum" style={{ textAlign: 'right' }}>{r.tripCount}</td></tr>
            ))}
          </tbody>
        </table>
        <Pagination paged={pg} />
        </>
      )}
    </Panel>
  );
}

function UtilizationPanel({ range }: { range: Range }) {
  const t = useTranslations('reports');
  const q = useQuery({ queryKey: ['rep-util', range], queryFn: () => getUtilization(range) });
  const active = (q.data?.perDay ?? []).filter((d) => d.trucksWithTrips > 0);
  const pg = usePaged(active, 20);
  return (
    <Panel title={t('tabUtilization')}>
      {q.isLoading ? <div className="bd helper">…</div> : active.length === 0 ? <Empty /> : (
        <>
        <table>
          <thead><tr><th>{t('date')}</th><th style={{ textAlign: 'right' }}>{t('trucksWithTrips')}</th><th style={{ textAlign: 'right' }}>{t('utilization')}</th></tr></thead>
          <tbody>
            {pg.pageItems.map((r) => (
              <tr key={r.date}>
                <td>{r.date}</td>
                <td className="tnum" style={{ textAlign: 'right' }}>{r.trucksWithTrips} / {r.activeTrucks}</td>
                <td className="tnum" style={{ textAlign: 'right' }}>{Math.round(r.utilization * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination paged={pg} />
        </>
      )}
    </Panel>
  );
}

function WorkerPayPanel({ range }: { range: Range }) {
  const t = useTranslations('reports');
  const q = useQuery({ queryKey: ['rep-pay', range], queryFn: () => getWorkerPay(range) });
  const pg = usePaged(q.data?.workers ?? [], 20);
  return (
    <Panel title={t('tabWorkerPay')}>
      {q.isLoading ? <div className="bd helper">…</div> : !q.data?.workers.length ? <Empty /> : (
        <>
        <table>
          <thead><tr><th>{t('worker')}</th><th style={{ textAlign: 'right' }}>{t('driverPay')}</th><th style={{ textAlign: 'right' }}>{t('helperPay')}</th><th style={{ textAlign: 'right' }}>{t('total')}</th></tr></thead>
          <tbody>
            {pg.pageItems.map((r) => (
              <tr key={r.workerId}>
                <td>{r.workerName}</td>
                <td className="tnum" style={{ textAlign: 'right' }}>{r.driverPay}</td>
                <td className="tnum" style={{ textAlign: 'right' }}>{r.helperPay}</td>
                <td className="tnum" style={{ textAlign: 'right', fontWeight: 700 }}>{r.totalPay}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination paged={pg} />
        </>
      )}
    </Panel>
  );
}

function ClientBillablesPanel({ range }: { range: Range }) {
  const t = useTranslations('reports');
  const q = useQuery({ queryKey: ['rep-bill', range], queryFn: () => getClientBillables(range) });
  const pg = usePaged(q.data?.clients ?? [], 20);
  return (
    <Panel title={t('tabClientBillables')}>
      {q.isLoading ? <div className="bd helper">…</div> : !q.data?.clients.length ? <Empty /> : (
        <>
        <table>
          <thead><tr><th>{t('client')}</th><th style={{ textAlign: 'right' }}>{t('trips')}</th><th style={{ textAlign: 'right' }}>{t('billable')}</th></tr></thead>
          <tbody>
            {pg.pageItems.map((r) => (
              <tr key={r.clientId}>
                <td>{r.clientName}</td>
                <td className="tnum" style={{ textAlign: 'right' }}>{r.tripCount}</td>
                <td className="tnum" style={{ textAlign: 'right', fontWeight: 700 }}>{r.billAmount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination paged={pg} />
        </>
      )}
    </Panel>
  );
}
