'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/Modal';
import { Pagination } from '@/components/Pagination';
import { usePaged } from '@/lib/usePaged';
import { useAuth } from '@/lib/auth/useAuth';
import { getClients } from '@/lib/api/masterdata';
import {
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getBillable,
  getAging,
  type InvoiceStatus,
} from '@/lib/api/billing';

const money = (s: string) => '$' + Number(s).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);
const pillClass: Record<InvoiceStatus, string> = { draft: 'warn', sent: 'info', paid: 'ok', void: 'off' };

export function BillingView() {
  const t = useTranslations('billing');
  const { canSeeMoney, isLoading: authLoading } = useAuth();
  const [view, setView] = useState<'invoices' | 'aging'>('invoices');
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => setCreating(true)}>+ {t('newInvoice')}</button>
          <div className="spacer" />
          <span className="seg">
            <button className={view === 'invoices' ? 'on' : ''} onClick={() => setView('invoices')}>{t('invoices')}</button>
            <button className={view === 'aging' ? 'on' : ''} onClick={() => setView('aging')}>{t('aging')}</button>
          </span>
        </div>
      </div>

      {view === 'invoices' ? (
        <InvoicesTable onOpen={setOpenId} />
      ) : (
        <AgingTable />
      )}

      {creating && <CreateInvoiceModal onClose={() => setCreating(false)} onCreated={(id) => { setCreating(false); setOpenId(id); }} />}
      {openId && <InvoiceModal id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function InvoicesTable({ onOpen }: { onOpen: (id: string) => void }) {
  const t = useTranslations('billing');
  const ts = useTranslations('status');
  const tc = useTranslations('common');
  const [status, setStatus] = useState<InvoiceStatus | ''>('');
  const q = useQuery({ queryKey: ['invoices', status], queryFn: () => listInvoices(status ? { status } : undefined) });
  const pg = usePaged(q.data ?? [], 20);

  return (
    <div className="card">
      <div className="hd">
        <h2>{t('invoices')}</h2>
        <div className="spacer" />
        <select className="input" style={{ width: 150 }} value={status} onChange={(e) => { setStatus(e.target.value as InvoiceStatus | ''); pg.setPage(1); }}>
          <option value="">{tc('all')}</option>
          {(['draft', 'sent', 'paid', 'void'] as const).map((s) => <option key={s} value={s}>{ts(s)}</option>)}
        </select>
      </div>
      {q.isLoading && <div className="empty">{tc('loading')}</div>}
      {q.data && q.data.length === 0 && <div className="empty">{t('noInvoices')}</div>}
      {pg.total > 0 && (
        <>
          <table>
            <thead>
              <tr>
                <th>{t('number')}</th><th>{t('client')}</th><th>{t('period')}</th>
                <th style={{ textAlign: 'right' }}>{t('total')}</th>
                <th style={{ textAlign: 'right' }}>{t('paid')}</th>
                <th>{t('statusCol')}</th>
              </tr>
            </thead>
            <tbody>
              {pg.pageItems.map((inv) => (
                <tr key={inv.id} onClick={() => onOpen(inv.id)} style={{ cursor: 'pointer' }}>
                  <td><b>{inv.number}</b></td>
                  <td>{inv.clientName}</td>
                  <td className="muted">{inv.periodFrom.slice(0, 10)} → {inv.periodTo.slice(0, 10)}</td>
                  <td className="tnum" style={{ textAlign: 'right', fontWeight: 700 }}>{money(inv.total)}</td>
                  <td className="tnum" style={{ textAlign: 'right' }}>{Number(inv.amountPaid) > 0 ? money(inv.amountPaid) : '—'}</td>
                  <td><span className={`pill ${pillClass[inv.status]}`}>{ts(inv.status)}</span></td>
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

function AgingTable() {
  const t = useTranslations('billing');
  const tc = useTranslations('common');
  const q = useQuery({ queryKey: ['invoice-aging'], queryFn: getAging });
  return (
    <div className="card">
      <div className="hd"><h2>{t('aging')}</h2><div className="spacer" /><span className="helper">{q.data ? `${t('outstanding')}: ${money(q.data.grandTotal)}` : ''}</span></div>
      {q.isLoading && <div className="empty">{tc('loading')}</div>}
      {q.data && q.data.clients.length === 0 && <div className="empty">{t('noOutstanding')}</div>}
      {q.data && q.data.clients.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>{t('client')}</th>
              <th style={{ textAlign: 'right' }}>{t('current')}</th>
              <th style={{ textAlign: 'right' }}>1–30</th>
              <th style={{ textAlign: 'right' }}>31–60</th>
              <th style={{ textAlign: 'right' }}>60+</th>
              <th style={{ textAlign: 'right' }}>{t('total')}</th>
            </tr>
          </thead>
          <tbody>
            {q.data.clients.map((c) => (
              <tr key={c.clientId}>
                <td><b>{c.clientName}</b></td>
                <td className="tnum" style={{ textAlign: 'right' }}>{money(c.current)}</td>
                <td className="tnum" style={{ textAlign: 'right' }}>{money(c.d30)}</td>
                <td className="tnum" style={{ textAlign: 'right' }}>{money(c.d60)}</td>
                <td className="tnum" style={{ textAlign: 'right', color: Number(c.d90) > 0 ? 'var(--bad)' : undefined }}>{money(c.d90)}</td>
                <td className="tnum" style={{ textAlign: 'right', fontWeight: 700 }}>{money(c.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function CreateInvoiceModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const t = useTranslations('billing');
  const tc = useTranslations('common');
  const clients = useQuery({ queryKey: ['clients'], queryFn: getClients });
  const [clientId, setClientId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState(today());

  const ready = clientId && from && to;
  const preview = useQuery({
    queryKey: ['billable', clientId, from, to],
    queryFn: () => getBillable(clientId, from, to),
    enabled: !!ready,
  });

  const create = useMutation({
    mutationFn: () => createInvoice({ clientId, from, to }),
    onSuccess: (inv) => onCreated(inv.id),
  });

  const canCreate = ready && (preview.data?.tripCount ?? 0) > 0 && !create.isPending;

  return (
    <Modal
      title={t('newInvoice')}
      onClose={onClose}
      footer={
        <>
          {create.isError && <span className="errbox" style={{ marginRight: 'auto' }}>{tc('errorGeneric')}</span>}
          <div className="spacer" />
          <button className="btn ghost" onClick={onClose}>{tc('cancel')}</button>
          <button className="btn" disabled={!canCreate} onClick={() => create.mutate()}>
            {create.isPending ? tc('saving') : t('createInvoice')}
          </button>
        </>
      }
    >
      <div className="formgrid">
        <div className="full">
          <label className="flabel">{t('client')}</label>
          <select className="input" value={clientId} onChange={(e) => setClientId(e.target.value)} autoFocus>
            <option value="">{t('selectClient')}</option>
            {clients.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="flabel">{t('from')}</label>
          <input className="input" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
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
            ) : (preview.data?.tripCount ?? 0) === 0 ? (
              <span className="helper">{t('noBillable')}</span>
            ) : (
              <span style={{ fontWeight: 600 }}>
                {t('willBill', { count: preview.data!.tripCount })} · <b>{money(preview.data!.total)}</b>
              </span>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function InvoiceModal({ id, onClose }: { id: string; onClose: () => void }) {
  const t = useTranslations('billing');
  const ts = useTranslations('status');
  const tc = useTranslations('common');
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['invoice', id], queryFn: () => getInvoice(id) });
  const inv = q.data;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['invoice', id] });
    qc.invalidateQueries({ queryKey: ['invoices'] });
    qc.invalidateQueries({ queryKey: ['invoice-aging'] });
  };
  const setStatus = useMutation({ mutationFn: (status: InvoiceStatus) => updateInvoice(id, { status }), onSuccess: refresh });
  const del = useMutation({ mutationFn: () => deleteInvoice(id), onSuccess: () => { refresh(); onClose(); } });

  return (
    <Modal
      title={inv ? inv.number : t('invoice')}
      onClose={onClose}
      footer={
        <>
          {inv && inv.status === 'draft' && (
            <button className="btn ghost" style={{ marginRight: 'auto', color: 'var(--bad)' }} disabled={del.isPending} onClick={() => del.mutate()}>{tc('delete')}</button>
          )}
          <div className="spacer" />
          {inv && inv.status === 'draft' && <button className="btn ghost" disabled={setStatus.isPending} onClick={() => setStatus.mutate('sent')}>{t('markSent')}</button>}
          {inv && (inv.status === 'draft' || inv.status === 'sent') && <button className="btn ghost" disabled={setStatus.isPending} onClick={() => { if (window.confirm(t('confirmVoid'))) setStatus.mutate('void'); }}>{t('void')}</button>}
          {inv && inv.status !== 'paid' && inv.status !== 'void' && <button className="btn" disabled={setStatus.isPending} onClick={() => setStatus.mutate('paid')}>{t('markPaid')}</button>}
        </>
      }
    >
      {q.isLoading && <div className="helper">{tc('loading')}</div>}
      {inv && (
        <>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
            <Field label={t('client')} value={inv.clientName} />
            <Field label={t('period')} value={`${inv.periodFrom.slice(0, 10)} → ${inv.periodTo.slice(0, 10)}`} />
            <Field label={t('statusCol')} value={<span className={`pill ${pillClass[inv.status]}`}>{ts(inv.status)}</span>} />
            <Field label={t('total')} value={<b>{money(inv.total)}</b>} />
            {Number(inv.amountPaid) > 0 && <Field label={t('paid')} value={money(inv.amountPaid)} />}
          </div>
          <table>
            <thead>
              <tr><th>{t('date')}</th><th>{t('truck')}</th><th>{t('route')}</th><th style={{ textAlign: 'right' }}>{t('charge')}</th></tr>
            </thead>
            <tbody>
              {inv.lines.map((l) => (
                <tr key={l.id}>
                  <td className="muted">{l.date.slice(0, 10)}</td>
                  <td>{l.truckCode}</td>
                  <td className="muted">{l.routeLabel ?? '—'}</td>
                  <td className="tnum" style={{ textAlign: 'right' }}>{money(l.billAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
