'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClients, getWorkers } from '@/lib/api/masterdata';
import {
  ensureDailyLog,
  updateDailyLog,
  confirmDailyLog,
  createTrip,
  deleteTrip,
  lookupRate,
  getSummary,
  type CreateTripInput,
  type OperStatus,
} from '@/lib/api/operations';

const todayStr = () => new Date().toISOString().slice(0, 10);
// Add/subtract calendar days on a YYYY-MM-DD string, all in UTC — avoids the
// local-vs-UTC drift that made stepping jump 2 days in non-UTC timezones.
const addDays = (iso: string, days: number) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
};
const num = (s: string) => (s.trim() === '' ? undefined : Number(s));

export function TripEntryView() {
  const tr = useTranslations('tripEntry');
  const ts = useTranslations('status');
  const qc = useQueryClient();
  const [date, setDate] = useState(todayStr());
  const [truckId, setTruckId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending'>('all');

  const summary = useQuery({ queryKey: ['ops-summary', date], queryFn: () => getSummary(date) });
  const clients = useQuery({ queryKey: ['clients'], queryFn: getClients });
  const workers = useQuery({ queryKey: ['workers'], queryFn: getWorkers });

  // auto-select first truck when the day loads
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-shot auto-select
    if (!truckId && summary.data?.trucks.length) setTruckId(summary.data.trucks[0].truckId);
  }, [summary.data, truckId]);

  const log = useQuery({
    queryKey: ['daily-log', date, truckId],
    queryFn: () => ensureDailyLog(date, truckId!),
    enabled: !!truckId,
  });

  const clientName = useMemo(() => {
    const m = new Map(clients.data?.map((c) => [c.id, c.name]));
    return (id: string) => m.get(id) ?? id;
  }, [clients.data]);
  const workerName = useMemo(() => {
    const m = new Map(workers.data?.map((w) => [w.id, w.fullName]));
    return (id: string | null) => (id ? (m.get(id) ?? id) : '—');
  }, [workers.data]);

  const refetchAll = () => {
    qc.invalidateQueries({ queryKey: ['daily-log', date, truckId] });
    qc.invalidateQueries({ queryKey: ['ops-summary', date] });
  };

  const saveLog = useMutation({
    mutationFn: (b: { fuelCost?: number; odometerStart?: number; odometerEnd?: number }) =>
      updateDailyLog(log.data!.id, b),
    onSuccess: refetchAll,
  });
  const setOper = useMutation({
    mutationFn: (s: OperStatus) => updateDailyLog(log.data!.id, { operStatus: s }),
    onSuccess: refetchAll,
  });
  const confirm = useMutation({
    mutationFn: () => confirmDailyLog(log.data!.id),
    onSuccess: refetchAll,
  });
  const addTrip = useMutation({
    mutationFn: (b: CreateTripInput) => createTrip(log.data!.id, b),
    onSuccess: refetchAll,
  });
  const removeTrip = useMutation({
    mutationFn: (id: string) => deleteTrip(id),
    onSuccess: refetchAll,
  });

  const stepDate = (days: number) => {
    setDate(addDays(date, days));
    setTruckId(null);
  };

  const counts = summary.data?.counts;
  const detail = log.data;
  const driverOptions = workers.data?.filter((w) => w.canDrive) ?? [];
  const helperOptions = workers.data?.filter((w) => w.canHelp) ?? [];

  const allTrucks = summary.data?.trucks ?? [];
  const pendingCount = allTrucks.filter((t) => t.status !== 'confirmed').length;
  const visibleTrucks = allTrucks.filter((t) => {
    if (filter === 'pending' && t.status === 'confirmed') return false;
    if (search && !t.truckCode.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  // Dot colour reflects operational state first (broken/no-clients), then the
  // entry workflow status. Draft uses amber to match the "Draft" pill; confirmed
  // green; none grey. no-clients gets blue so it stays distinct from draft.
  const dotColor = (t: { status: string; operStatus: string | null }) =>
    t.operStatus === 'broken'
      ? 'var(--bad)'
      : t.operStatus === 'no_clients'
        ? 'var(--blue)'
        : t.status === 'confirmed'
          ? 'var(--ok)'
          : t.status === 'draft'
            ? 'var(--warn)'
            : 'var(--line-2)';
  const goNextPending = () => {
    const pend = allTrucks.filter((t) => t.status !== 'confirmed');
    if (!pend.length) return;
    const idx = pend.findIndex((t) => t.truckId === truckId);
    setTruckId((pend[(idx + 1) % pend.length] ?? pend[0]).truckId);
  };
  const selectedCode = allTrucks.find((t) => t.truckId === truckId)?.truckCode;

  return (
    <div className="page">
      {/* Day bar */}
      <div className="card" style={{ marginBottom: 14, maxWidth: 1240 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', flexWrap: 'wrap' }}>
          <button className="btn ghost sm" onClick={() => stepDate(-1)}>◀</button>
          <b style={{ fontSize: 15 }}>{new Date(date + 'T00:00:00Z').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}</b>
          <button className="btn ghost sm" onClick={() => stepDate(1)}>▶</button>
          {counts && (
            <span className="pill info" style={{ marginLeft: 8 }}>
              {tr('trucksEntered', { entered: counts.confirmed + counts.draft, total: counts.trucks })}
            </span>
          )}
          <div className="spacer" />
          <button className="btn ghost sm" disabled={pendingCount === 0} onClick={goNextPending}>
            {tr('nextPending')} →
          </button>
        </div>
      </div>

      {/* Master-detail: scalable truck rail + entry panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '256px minmax(0, 1fr)', gap: 14, alignItems: 'start', maxWidth: 1240 }}>
        {/* Left rail — scrollable, searchable list (scales to many trucks) */}
        <div className="card" style={{ position: 'sticky', top: 14, overflow: 'hidden' }}>
          <div style={{ padding: 10, borderBottom: '1px solid var(--line)' }}>
            <input className="input" placeholder={tr('searchTruck')} value={search} onChange={(e) => setSearch(e.target.value)} />
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button className={`btn sm ${filter === 'all' ? '' : 'ghost'}`} onClick={() => setFilter('all')}>
                {tr('filterAll')} {allTrucks.length}
              </button>
              <button className={`btn sm ${filter === 'pending' ? '' : 'ghost'}`} onClick={() => setFilter('pending')}>
                {tr('filterPending')} {pendingCount}
              </button>
            </div>
          </div>
          <div style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
            {visibleTrucks.map((t) => {
              const sel = t.truckId === truckId;
              return (
                <button
                  key={t.truckId}
                  onClick={() => setTruckId(t.truckId)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px',
                    border: 0, borderLeft: sel ? '3px solid var(--blue)' : '3px solid transparent',
                    borderBottom: '1px solid var(--line)', background: sel ? 'var(--peri)' : 'transparent',
                    cursor: 'pointer', font: '600 13px var(--font)', color: 'var(--ink)', textAlign: 'left',
                  }}
                >
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: dotColor(t), flex: 'none' }} />
                  <span style={{ flex: 1 }}>{t.truckCode}</span>
                  {t.tripCount > 0 && <span className="muted" style={{ fontWeight: 700 }}>{t.tripCount}</span>}
                  {t.status === 'confirmed' && <span style={{ color: 'var(--ok)', fontWeight: 800 }}>✓</span>}
                </button>
              );
            })}
            {visibleTrucks.length === 0 && <div className="helper" style={{ padding: 14 }}>{tr('noTrucksFound')}</div>}
          </div>
        </div>

        {/* Right — entry panel for the selected truck */}
        <div className="card">
          {!truckId && <div className="bd helper">{tr('selectTruck')}</div>}
          {truckId && log.isLoading && <div className="bd helper">{tr('loading')}</div>}
          {truckId && detail && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: '1px solid var(--line)', flexWrap: 'wrap' }}>
                <b style={{ fontSize: 16 }}>{selectedCode}</b>
                <span className={`pill ${detail.status === 'confirmed' ? 'ok' : 'warn'}`}>{ts(detail.status)}</span>
                <span className="seg">
                  {(['operating', 'no_clients', 'broken'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={detail.operStatus === s ? 'on' : ''}
                      disabled={setOper.isPending}
                      onClick={() => setOper.mutate(s)}
                    >
                      {tr(s === 'operating' ? 'stOperating' : s === 'no_clients' ? 'stNoClients' : 'stBroken')}
                    </button>
                  ))}
                </span>
                <div className="spacer" />
                {detail.operStatus !== 'no_clients' && detail.operStatus !== 'broken' && (
                  <FuelOdometer detail={detail} onSave={(b) => saveLog.mutate(b)} saving={saveLog.isPending} />
                )}
              </div>

              {detail.warnings && detail.warnings.length > 0 && (
                <div style={{ padding: '10px 18px', background: 'var(--warn-bg)', color: 'var(--warn)', fontSize: 13, fontWeight: 600, borderBottom: '1px solid var(--line)' }}>
                  ⚠ {detail.warnings.join(' · ')}
                </div>
              )}

              {(detail.operStatus === 'no_clients' || detail.operStatus === 'broken') ? (
                <div className="bd" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '22px 18px' }}>
                  <span style={{ width: 11, height: 11, borderRadius: '50%', flex: 'none', background: detail.operStatus === 'broken' ? 'var(--bad)' : 'var(--warn)' }} />
                  <span style={{ fontWeight: 600 }}>{tr(detail.operStatus === 'broken' ? 'idleBroken' : 'idleNoClients')}</span>
                </div>
              ) : (
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 34, textAlign: 'center' }}>#</th><th>{tr('client')}</th><th>{tr('route')}</th><th>{tr('driver')}</th><th>{tr('helper')}</th>
                    <th style={{ width: 96, textAlign: 'right' }}>{tr('charge')}</th><th style={{ width: 96, textAlign: 'right' }}>{tr('driverPay')}</th><th style={{ width: 96, textAlign: 'right' }}>{tr('helperPay')}</th><th style={{ width: 44 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {detail.trips.map((t) => (
                    <tr key={t.id}>
                      <td className="tnum" style={{ textAlign: 'center', color: 'var(--muted)' }}>{t.seq}</td>
                      <td>{clientName(t.clientId)}</td>
                      <td className="muted">{t.routeLabel ?? '—'}</td>
                      <td>{workerName(t.driverWorkerId)}</td>
                      <td className="muted">{workerName(t.helperWorkerId)}</td>
                      <td className="tnum" style={{ textAlign: 'right' }}>{t.billAmount ?? '🔒'}</td>
                      <td className="tnum" style={{ textAlign: 'right' }}>{t.driverPay ?? '🔒'}</td>
                      <td className="tnum" style={{ textAlign: 'right' }}>{t.helperPay ?? '🔒'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn ghost sm" onClick={() => removeTrip.mutate(t.id)} title={tr('removeTrip')}>✕</button>
                      </td>
                    </tr>
                  ))}
                  {detail.trips.length === 0 && (
                    <tr><td colSpan={9} className="helper" style={{ padding: 16 }}>{tr('noTripsYet')}</td></tr>
                  )}
                </tbody>
                <tfoot>
                  <AddTripRow
                    clients={clients.data ?? []}
                    drivers={driverOptions}
                    helpers={helperOptions}
                    onAdd={(b) => {
                      addTrip.mutate(b);
                      // A trip means the truck operated — classify the day so it
                      // counts toward the operating %.
                      if (detail.operStatus !== 'operating') setOper.mutate('operating');
                    }}
                    adding={addTrip.isPending}
                  />
                </tfoot>
              </table>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderTop: '1px solid var(--line)', background: '#FBFBFD', flexWrap: 'wrap' }}>
                <span className="helper">{tr('noCapNote')}</span>
                <div className="spacer" />
                {detail.totals && (
                  <span className="helper">{tr('dayTotal')} <b>{detail.totals.billAmount}</b> {tr('chargeWord')} · <b>{detail.totals.driverPay}</b> {tr('driverPayWord')}</span>
                )}
                <button className="btn" disabled={confirm.isPending || detail.status === 'confirmed'} onClick={() => confirm.mutate()}>
                  {detail.status === 'confirmed' ? `${tr('confirmed')} ✓` : confirm.isPending ? tr('confirming') : `${tr('confirm')} ✓`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FuelOdometer({
  detail,
  onSave,
  saving,
}: {
  detail: { fuelCost: string | null; odometerStart: number | null; odometerEnd: number | null };
  onSave: (b: { fuelCost?: number; odometerStart?: number; odometerEnd?: number }) => void;
  saving: boolean;
}) {
  const tr = useTranslations('tripEntry');
  const tc = useTranslations('common');
  const [fuel, setFuel] = useState(detail.fuelCost ?? '');
  const [odoStart, setOdoStart] = useState(detail.odometerStart?.toString() ?? '');
  const [odoEnd, setOdoEnd] = useState(detail.odometerEnd?.toString() ?? '');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <label className="helper" style={{ fontWeight: 700 }}>{tr('fuel')}</label>
      <input className="input" style={{ width: 80 }} value={fuel} onChange={(e) => setFuel(e.target.value)} />
      <label className="helper" style={{ fontWeight: 700 }}>{tr('odoStart')}</label>
      <input className="input" style={{ width: 90 }} value={odoStart} onChange={(e) => setOdoStart(e.target.value)} />
      <label className="helper" style={{ fontWeight: 700 }}>{tr('odoEnd')}</label>
      <input className="input" style={{ width: 90 }} value={odoEnd} onChange={(e) => setOdoEnd(e.target.value)} />
      <button
        className="btn ghost sm"
        disabled={saving}
        onClick={() => onSave({ fuelCost: num(fuel), odometerStart: num(odoStart), odometerEnd: num(odoEnd) })}
      >
        {saving ? tc('saving') : tc('save')}
      </button>
    </div>
  );
}

function AddTripRow({
  clients,
  drivers,
  helpers,
  onAdd,
  adding,
}: {
  clients: { id: string; name: string }[];
  drivers: { id: string; fullName: string }[];
  helpers: { id: string; fullName: string }[];
  onAdd: (b: CreateTripInput) => void;
  adding: boolean;
}) {
  const tr = useTranslations('tripEntry');
  const tc = useTranslations('common');
  const [clientId, setClientId] = useState('');
  const [routeLabel, setRouteLabel] = useState('');
  const [driverWorkerId, setDriverWorkerId] = useState('');
  const [helperWorkerId, setHelperWorkerId] = useState('');
  const [bill, setBill] = useState('');
  const [dPay, setDPay] = useState('');
  const [hPay, setHPay] = useState('');

  // Prepopulate pay from the client's rate (editable). The client charge is
  // always typed in manually: route prices move constantly, so a prefilled
  // figure would be misleading (Xavier, 15 Jun 2026).
  const onClient = async (id: string) => {
    setClientId(id);
    if (!id) return;
    try {
      const r = await lookupRate(id, routeLabel || undefined);
      if (r.found && r.rate) {
        if (r.rate.driverPay != null) setDPay(r.rate.driverPay);
        if (r.rate.helperPay != null) setHPay(r.rate.helperPay);
      }
    } catch {
      /* no rate — enter manually */
    }
  };

  const canAdd = clientId && driverWorkerId && !adding;
  const reset = () => { setClientId(''); setRouteLabel(''); setDriverWorkerId(''); setHelperWorkerId(''); setBill(''); setDPay(''); setHPay(''); };
  const submit = () => {
    onAdd({
      clientId,
      routeLabel: routeLabel || undefined,
      driverWorkerId,
      helperWorkerId: helperWorkerId || undefined,
      billAmount: num(bill),
      driverPay: num(dPay),
      helperPay: num(hPay),
    });
    reset();
  };

  return (
    <tr style={{ background: 'var(--peri)' }}>
      <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--blue)' }}>＋</td>
      <td>
        <select className="input" value={clientId} onChange={(e) => onClient(e.target.value)}>
          <option value="">{tr('clientPlaceholder')}</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </td>
      <td><input className="input" placeholder={tr('route')} value={routeLabel} onChange={(e) => setRouteLabel(e.target.value)} /></td>
      <td>
        <select className="input" value={driverWorkerId} onChange={(e) => setDriverWorkerId(e.target.value)}>
          <option value="">{tr('driverPlaceholder')}</option>
          {drivers.map((w) => <option key={w.id} value={w.id}>{w.fullName}</option>)}
        </select>
      </td>
      <td>
        <select className="input" value={helperWorkerId} onChange={(e) => setHelperWorkerId(e.target.value)}>
          <option value="">{tr('noHelper')}</option>
          {helpers.map((w) => <option key={w.id} value={w.id}>{w.fullName}</option>)}
        </select>
      </td>
      <td><input className="input pre" style={{ textAlign: 'right' }} placeholder="0.00" value={bill} onChange={(e) => setBill(e.target.value)} /></td>
      <td><input className="input pre" style={{ textAlign: 'right' }} placeholder="0.00" value={dPay} onChange={(e) => setDPay(e.target.value)} /></td>
      <td><input className="input pre" style={{ textAlign: 'right' }} placeholder="0.00" value={hPay} onChange={(e) => setHPay(e.target.value)} /></td>
      <td style={{ textAlign: 'center' }}><button className="btn sm" disabled={!canAdd} onClick={submit}>{tc('add')}</button></td>
    </tr>
  );
}
