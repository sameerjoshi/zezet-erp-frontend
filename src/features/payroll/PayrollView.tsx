'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/Modal';
import { Pagination } from '@/components/Pagination';
import { usePaged } from '@/lib/usePaged';
import { useAuth } from '@/lib/auth/useAuth';
import {
  listRuns,
  getRun,
  createRun,
  updateRun,
  deleteRun,
  getPayrollPreview,
  type PayrollStatus,
} from '@/lib/api/payroll';

const money = (s: string) => '$' + Number(s).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);
const pillClass: Record<PayrollStatus, string> = { draft: 'warn', approved: 'info', paid: 'ok', void: 'off' };

export function PayrollView() {
  const t = useTranslations('payroll');
  const { canSeeMoney, isLoading: authLoading } = useAuth();
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  if (authLoading) return <div className="page helper">…</div>;
  if (!canSeeMoney) {
    return (
      <div className="page">
        <div className="card"><div className="bd helper">{t('financeOnly')}</div></div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
          <button className="btn" onClick={() => setCreating(true)}>+ {t('newRun')}</button>
          <div className="spacer" />
          <span className="helper">{t('subtitle')}</span>
        </div>
      </div>

      <RunsTable onOpen={setOpenId} />

      {creating && <CreateRunModal onClose={() => setCreating(false)} onCreated={(id) => { setCreating(false); setOpenId(id); }} />}
      {openId && <RunModal id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function RunsTable({ onOpen }: { onOpen: (id: string) => void }) {
  const t = useTranslations('payroll');
  const ts = useTranslations('status');
  const tc = useTranslations('common');
  const [status, setStatus] = useState<PayrollStatus | ''>('');
  const q = useQuery({ queryKey: ['runs', status], queryFn: () => listRuns(status || undefined) });
  const pg = usePaged(q.data ?? [], 20);

  return (
    <div className="card">
      <div className="hd">
        <h2>{t('runs')}</h2>
        <div className="spacer" />
        <select className="input" style={{ width: 150 }} value={status} onChange={(e) => { setStatus(e.target.value as PayrollStatus | ''); pg.setPage(1); }}>
          <option value="">{tc('all')}</option>
          {(['draft', 'approved', 'paid', 'void'] as const).map((s) => <option key={s} value={s}>{ts(s)}</option>)}
        </select>
      </div>
      {q.isLoading && <div className="empty">{tc('loading')}</div>}
      {q.data && q.data.length === 0 && <div className="empty">{t('noRuns')}</div>}
      {pg.total > 0 && (
        <>
          <table>
            <thead>
              <tr>
                <th>{t('number')}</th><th>{t('period')}</th>
                <th style={{ textAlign: 'right' }}>{t('workers')}</th>
                <th style={{ textAlign: 'right' }}>{t('total')}</th>
                <th>{t('statusCol')}</th>
              </tr>
            </thead>
            <tbody>
              {pg.pageItems.map((r) => (
                <tr key={r.id} onClick={() => onOpen(r.id)} style={{ cursor: 'pointer' }}>
                  <td><b>{r.number}</b></td>
                  <td className="muted">{r.periodFrom.slice(0, 10)} → {r.periodTo.slice(0, 10)}</td>
                  <td className="tnum" style={{ textAlign: 'right' }}>{r.workerCount}</td>
                  <td className="tnum" style={{ textAlign: 'right', fontWeight: 700 }}>{money(r.total)}</td>
                  <td><span className={`pill ${pillClass[r.status]}`}>{ts(r.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination paged={pg} />
        </>
      )}
    </div>
  );
}

function CreateRunModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const t = useTranslations('payroll');
  const tc = useTranslations('common');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState(today());

  const ready = !!from && !!to;
  const preview = useQuery({
    queryKey: ['pay-preview', from, to],
    queryFn: () => getPayrollPreview(from, to),
    enabled: ready,
  });
  const create = useMutation({ mutationFn: () => createRun({ from, to }), onSuccess: (r) => onCreated(r.id) });
  const canCreate = ready && (preview.data?.workerCount ?? 0) > 0 && !create.isPending;

  return (
    <Modal
      title={t('newRun')}
      onClose={onClose}
      footer={
        <>
          {create.isError && <span className="errbox" style={{ marginRight: 'auto' }}>{tc('errorGeneric')}</span>}
          <div className="spacer" />
          <button className="btn ghost" onClick={onClose}>{tc('cancel')}</button>
          <button className="btn" disabled={!canCreate} onClick={() => create.mutate()}>{create.isPending ? tc('saving') : t('createRun')}</button>
        </>
      }
    >
      <div className="formgrid">
        <div>
          <label className="flabel">{t('from')}</label>
          <input className="input" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="flabel">{t('to')}</label>
          <input className="input" type="date" value={to} max={today()} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      {ready && (
        <div className="card" style={{ marginTop: 14, background: 'var(--soft)' }}>
          <div className="bd">
            {preview.isLoading ? (
              <span className="helper">{tc('loading')}</span>
            ) : (preview.data?.workerCount ?? 0) === 0 ? (
              <span className="helper">{t('noPayable')}</span>
            ) : (
              <span style={{ fontWeight: 600 }}>{t('willPay', { count: preview.data!.workerCount })} · <b>{money(preview.data!.total)}</b></span>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function RunModal({ id, onClose }: { id: string; onClose: () => void }) {
  const t = useTranslations('payroll');
  const ts = useTranslations('status');
  const tc = useTranslations('common');
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['run', id], queryFn: () => getRun(id) });
  const run = q.data;
  const wpg = usePaged(run?.workers ?? [], 15);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['run', id] });
    qc.invalidateQueries({ queryKey: ['runs'] });
  };
  const setStatus = useMutation({ mutationFn: (status: PayrollStatus) => updateRun(id, { status }), onSuccess: refresh });
  const del = useMutation({ mutationFn: () => deleteRun(id), onSuccess: () => { refresh(); onClose(); } });

  return (
    <Modal
      title={run ? run.number : t('run')}
      onClose={onClose}
      footer={
        <>
          {run && run.status === 'draft' && (
            <button className="btn ghost" style={{ marginRight: 'auto', color: 'var(--bad)' }} disabled={del.isPending} onClick={() => del.mutate()}>{tc('delete')}</button>
          )}
          <div className="spacer" />
          {run && run.status === 'draft' && <button className="btn ghost" disabled={setStatus.isPending} onClick={() => setStatus.mutate('approved')}>{t('approve')}</button>}
          {run && (run.status === 'draft' || run.status === 'approved') && <button className="btn ghost" disabled={setStatus.isPending} onClick={() => { if (window.confirm(t('confirmVoid'))) setStatus.mutate('void'); }}>{t('void')}</button>}
          {run && run.status !== 'paid' && run.status !== 'void' && <button className="btn" disabled={setStatus.isPending} onClick={() => setStatus.mutate('paid')}>{t('markPaid')}</button>}
        </>
      }
    >
      {q.isLoading && <div className="helper">{tc('loading')}</div>}
      {run && (
        <>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
            <Field label={t('period')} value={`${run.periodFrom.slice(0, 10)} → ${run.periodTo.slice(0, 10)}`} />
            <Field label={t('statusCol')} value={<span className={`pill ${pillClass[run.status]}`}>{ts(run.status)}</span>} />
            <Field label={t('workers')} value={run.workerCount} />
            <Field label={t('total')} value={<b>{money(run.total)}</b>} />
          </div>
          <table>
            <thead>
              <tr>
                <th>{t('worker')}</th>
                <th style={{ textAlign: 'right' }}>{t('driverPay')}</th>
                <th style={{ textAlign: 'right' }}>{t('helperPay')}</th>
                <th style={{ textAlign: 'right' }}>{t('trips')}</th>
                <th style={{ textAlign: 'right' }}>{t('total')}</th>
              </tr>
            </thead>
            <tbody>
              {wpg.pageItems.map((w) => (
                <tr key={w.workerId}>
                  <td><b>{w.workerName}</b></td>
                  <td className="tnum" style={{ textAlign: 'right' }}>{money(w.driverPay)}</td>
                  <td className="tnum" style={{ textAlign: 'right' }}>{money(w.helperPay)}</td>
                  <td className="tnum" style={{ textAlign: 'right' }}>{w.tripCount}</td>
                  <td className="tnum" style={{ textAlign: 'right', fontWeight: 700 }}>{money(w.totalPay)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination paged={wpg} />
        </>
      )}
    </Modal>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="flabel" style={{ marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14 }}>{value}</div>
    </div>
  );
}
