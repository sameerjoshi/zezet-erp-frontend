'use client';

import { useEffect, useMemo, useState } from 'react';
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
} from '@/lib/api/operations';

const todayStr = () => new Date().toISOString().slice(0, 10);
const num = (s: string) => (s.trim() === '' ? undefined : Number(s));

export function TripEntryView() {
  const qc = useQueryClient();
  const [date, setDate] = useState(todayStr());
  const [truckId, setTruckId] = useState<string | null>(null);

  const summary = useQuery({ queryKey: ['ops-summary', date], queryFn: () => getSummary(date) });
  const clients = useQuery({ queryKey: ['clients'], queryFn: getClients });
  const workers = useQuery({ queryKey: ['workers'], queryFn: getWorkers });

  // auto-select first truck when the day loads
  useEffect(() => {
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
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().slice(0, 10));
    setTruckId(null);
  };

  const counts = summary.data?.counts;
  const detail = log.data;
  const driverOptions = workers.data?.filter((w) => w.canDrive) ?? [];
  const helperOptions = workers.data?.filter((w) => w.canHelp) ?? [];

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      {/* Day bar */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', flexWrap: 'wrap' }}>
          <button className="btn ghost sm" onClick={() => stepDate(-1)}>◀</button>
          <b style={{ fontSize: 15 }}>{new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</b>
          <button className="btn ghost sm" onClick={() => stepDate(1)}>▶</button>
          {counts && (
            <span className="pill info" style={{ marginLeft: 8 }}>
              {counts.confirmed + counts.draft} of {counts.trucks} trucks entered
            </span>
          )}
        </div>
      </div>

      {/* Truck chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {summary.data?.trucks.map((t) => {
          const sel = t.truckId === truckId;
          const dot = t.status === 'confirmed' ? 'var(--ok)' : t.status === 'draft' ? 'var(--warn)' : 'var(--line-2)';
          return (
            <button
              key={t.truckId}
              onClick={() => setTruckId(t.truckId)}
              className="card"
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer',
                border: sel ? '1px solid var(--blue)' : '1px solid var(--line)',
                background: sel ? 'var(--peri)' : 'var(--surface)', fontWeight: 700, fontSize: 13,
              }}
            >
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: dot }} />
              {t.truckCode}
              {t.tripCount > 0 && <span className="muted" style={{ fontWeight: 600 }}>· {t.tripCount}</span>}
            </button>
          );
        })}
      </div>

      {/* Selected truck panel */}
      {truckId && (
        <div className="card">
          {log.isLoading && <div className="bd helper">Loading…</div>}
          {detail && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: '1px solid var(--line)', flexWrap: 'wrap' }}>
                <b style={{ fontSize: 16 }}>{summary.data?.trucks.find((t) => t.truckId === truckId)?.truckCode}</b>
                <span className={`pill ${detail.status === 'confirmed' ? 'ok' : 'warn'}`}>{detail.status}</span>
                <div className="spacer" />
                <FuelOdometer detail={detail} onSave={(b) => saveLog.mutate(b)} saving={saveLog.isPending} />
              </div>

              {detail.warnings && detail.warnings.length > 0 && (
                <div style={{ padding: '10px 18px', background: 'var(--warn-bg)', color: 'var(--warn)', fontSize: 13, fontWeight: 600, borderBottom: '1px solid var(--line)' }}>
                  ⚠ {detail.warnings.join(' · ')}
                </div>
              )}

              <table>
                <thead>
                  <tr>
                    <th style={{ width: 34 }}>#</th><th>Client</th><th>Route</th><th>Driver</th><th>Helper</th>
                    <th style={{ width: 90 }}>Charge</th><th style={{ width: 90 }}>Driver $</th><th style={{ width: 90 }}>Helper $</th><th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {detail.trips.map((t) => (
                    <tr key={t.id}>
                      <td className="tnum">{t.seq}</td>
                      <td>{clientName(t.clientId)}</td>
                      <td className="muted">{t.routeLabel ?? '—'}</td>
                      <td>{workerName(t.driverWorkerId)}</td>
                      <td className="muted">{workerName(t.helperWorkerId)}</td>
                      <td className="tnum">{t.billAmount ?? '🔒'}</td>
                      <td className="tnum">{t.driverPay ?? '🔒'}</td>
                      <td className="tnum">{t.helperPay ?? '🔒'}</td>
                      <td>
                        <button className="btn ghost sm" onClick={() => removeTrip.mutate(t.id)} title="Remove trip">✕</button>
                      </td>
                    </tr>
                  ))}
                  {detail.trips.length === 0 && (
                    <tr><td colSpan={9} className="helper" style={{ padding: 16 }}>No trips yet — add the first one below.</td></tr>
                  )}
                </tbody>
              </table>

              <AddTripRow
                clients={clients.data ?? []}
                drivers={driverOptions}
                helpers={helperOptions}
                onAdd={(b) => addTrip.mutate(b)}
                adding={addTrip.isPending}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderTop: '1px solid var(--line)', background: '#FBFBFD', flexWrap: 'wrap' }}>
                <span className="helper">No cap on trips per day. Warnings never block saving.</span>
                <div className="spacer" />
                {detail.totals && (
                  <span className="helper">Day total: <b>{detail.totals.billAmount}</b> charge · <b>{detail.totals.driverPay}</b> driver pay</span>
                )}
                <button className="btn" disabled={confirm.isPending || detail.status === 'confirmed'} onClick={() => confirm.mutate()}>
                  {detail.status === 'confirmed' ? 'Confirmed ✓' : confirm.isPending ? 'Confirming…' : 'Confirm ✓'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
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
  const [fuel, setFuel] = useState(detail.fuelCost ?? '');
  const [odoStart, setOdoStart] = useState(detail.odometerStart?.toString() ?? '');
  const [odoEnd, setOdoEnd] = useState(detail.odometerEnd?.toString() ?? '');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <label className="helper" style={{ fontWeight: 700 }}>Fuel $</label>
      <input className="input" style={{ width: 80 }} value={fuel} onChange={(e) => setFuel(e.target.value)} />
      <label className="helper" style={{ fontWeight: 700 }}>Odo start</label>
      <input className="input" style={{ width: 90 }} value={odoStart} onChange={(e) => setOdoStart(e.target.value)} />
      <label className="helper" style={{ fontWeight: 700 }}>Odo end</label>
      <input className="input" style={{ width: 90 }} value={odoEnd} onChange={(e) => setOdoEnd(e.target.value)} />
      <button
        className="btn ghost sm"
        disabled={saving}
        onClick={() => onSave({ fuelCost: num(fuel), odometerStart: num(odoStart), odometerEnd: num(odoEnd) })}
      >
        {saving ? 'Saving…' : 'Save'}
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
  const [clientId, setClientId] = useState('');
  const [routeLabel, setRouteLabel] = useState('');
  const [driverWorkerId, setDriverWorkerId] = useState('');
  const [helperWorkerId, setHelperWorkerId] = useState('');
  const [bill, setBill] = useState('');
  const [dPay, setDPay] = useState('');
  const [hPay, setHPay] = useState('');

  // prepopulate amounts from the client's rate (editable)
  const onClient = async (id: string) => {
    setClientId(id);
    if (!id) return;
    try {
      const r = await lookupRate(id, routeLabel || undefined);
      if (r.found && r.rate) {
        if (r.rate.clientPrice != null) setBill(r.rate.clientPrice);
        if (r.rate.driverPay != null) setDPay(r.rate.driverPay);
        if (r.rate.helperPay != null) setHPay(r.rate.helperPay);
      }
    } catch {
      /* no rate — enter manually */
    }
  };

  const canAdd = clientId && driverWorkerId && !adding;
  const reset = () => { setClientId(''); setRouteLabel(''); setDriverWorkerId(''); setHelperWorkerId(''); setBill(''); setDPay(''); setHPay(''); };

  const cell = { padding: '8px 10px' } as const;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '34px 1fr 1fr 1fr 1fr 90px 90px 90px 60px', alignItems: 'center', borderTop: '1px solid var(--line)', background: 'var(--peri)' }}>
      <div style={{ ...cell, textAlign: 'center', fontWeight: 700, color: 'var(--blue)' }}>＋</div>
      <div style={cell}>
        <select className="input" value={clientId} onChange={(e) => onClient(e.target.value)}>
          <option value="">Client…</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div style={cell}><input className="input" placeholder="Route" value={routeLabel} onChange={(e) => setRouteLabel(e.target.value)} /></div>
      <div style={cell}>
        <select className="input" value={driverWorkerId} onChange={(e) => setDriverWorkerId(e.target.value)}>
          <option value="">Driver…</option>
          {drivers.map((w) => <option key={w.id} value={w.id}>{w.fullName}</option>)}
        </select>
      </div>
      <div style={cell}>
        <select className="input" value={helperWorkerId} onChange={(e) => setHelperWorkerId(e.target.value)}>
          <option value="">— no helper —</option>
          {helpers.map((w) => <option key={w.id} value={w.id}>{w.fullName}</option>)}
        </select>
      </div>
      <div style={cell}><input className="input pre" style={{ textAlign: 'right' }} placeholder="0.00" value={bill} onChange={(e) => setBill(e.target.value)} /></div>
      <div style={cell}><input className="input pre" style={{ textAlign: 'right' }} placeholder="0.00" value={dPay} onChange={(e) => setDPay(e.target.value)} /></div>
      <div style={cell}><input className="input pre" style={{ textAlign: 'right' }} placeholder="0.00" value={hPay} onChange={(e) => setHPay(e.target.value)} /></div>
      <div style={cell}>
        <button
          className="btn sm"
          disabled={!canAdd}
          onClick={() => {
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
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}
