'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/Modal';
import { Pagination } from '@/components/Pagination';
import { usePaged } from '@/lib/usePaged';
import { useAuth } from '@/lib/auth/useAuth';
import { getTrucks } from '@/lib/api/masterdata';
import { listCosts, createCost, deleteCost, type CostCategory } from '@/lib/api/costs';

const CATEGORIES: CostCategory[] = ['maintenance', 'toll', 'insurance', 'tax', 'repair', 'other'];
const money = (s: string) => '$' + Number(s).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);

export function CostsView() {
  const t = useTranslations('costs');
  const tc = useTranslations('common');
  const { canSeeMoney, isLoading: authLoading } = useAuth();
  const qc = useQueryClient();
  const [truckId, setTruckId] = useState('');
  const [adding, setAdding] = useState(false);

  const trucks = useQuery({ queryKey: ['trucks'], queryFn: getTrucks, enabled: !authLoading && canSeeMoney });
  const costs = useQuery({
    queryKey: ['costs', truckId],
    queryFn: () => listCosts(truckId ? { truckId } : undefined),
    enabled: !authLoading && canSeeMoney,
  });
  const pg = usePaged(costs.data ?? [], 20);
  const del = useMutation({
    mutationFn: (id: string) => deleteCost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['costs'] }),
  });

  if (authLoading) return <div className="page helper">…</div>;
  if (!canSeeMoney) {
    return (
      <div className="page">
        <div className="card"><div className="bd helper">{t('financeOnly')}</div></div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 1000 }}>
      <div className="toolbar">
        <button className="btn" onClick={() => setAdding(true)}>+ {t('newCost')}</button>
        <select className="input" style={{ width: 200, marginLeft: 12 }} value={truckId} onChange={(e) => { setTruckId(e.target.value); pg.setPage(1); }}>
          <option value="">{t('allTrucks')}</option>
          {trucks.data?.map((tr) => <option key={tr.id} value={tr.id}>{tr.code}</option>)}
        </select>
      </div>

      <div className="card">
        {costs.isLoading && <div className="empty">{tc('loading')}</div>}
        {costs.data && costs.data.length === 0 && <div className="empty">{t('noCosts')}</div>}
        {pg.total > 0 && (
          <>
            <table>
              <thead>
                <tr>
                  <th>{t('date')}</th><th>{t('truck')}</th><th>{t('category')}</th>
                  <th>{t('note')}</th>
                  <th style={{ textAlign: 'right' }}>{t('amount')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pg.pageItems.map((c) => (
                  <tr key={c.id}>
                    <td className="muted">{c.date.slice(0, 10)}</td>
                    <td><b>{c.truckCode}</b></td>
                    <td>{t(`cat_${c.category}`)}</td>
                    <td className="muted">{c.note ?? '—'}</td>
                    <td className="tnum" style={{ textAlign: 'right', fontWeight: 700 }}>{money(c.amount)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn ghost sm" onClick={() => { if (window.confirm(t('confirmDelete'))) del.mutate(c.id); }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination paged={pg} />
          </>
        )}
      </div>

      {adding && <AddCostModal trucks={trucks.data ?? []} onClose={() => setAdding(false)} />}
    </div>
  );
}

function AddCostModal({ trucks, onClose }: { trucks: { id: string; code: string }[]; onClose: () => void }) {
  const t = useTranslations('costs');
  const tc = useTranslations('common');
  const qc = useQueryClient();
  const [truckId, setTruckId] = useState('');
  const [date, setDate] = useState(today());
  const [category, setCategory] = useState<CostCategory>('maintenance');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const valid = useMemo(() => truckId && date && amount.trim() !== '' && Number(amount) >= 0, [truckId, date, amount]);
  const create = useMutation({
    mutationFn: () => createCost({ truckId, date, category, amount: Number(amount), note: note.trim() || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['costs'] }); onClose(); },
  });

  return (
    <Modal
      title={t('newCost')}
      onClose={onClose}
      footer={
        <>
          {create.isError && <span className="errbox" style={{ marginRight: 'auto' }}>{tc('errorGeneric')}</span>}
          <div className="spacer" />
          <button className="btn ghost" onClick={onClose}>{tc('cancel')}</button>
          <button className="btn" disabled={!valid || create.isPending} onClick={() => create.mutate()}>{create.isPending ? tc('saving') : tc('save')}</button>
        </>
      }
    >
      <div className="formgrid">
        <div className="full">
          <label className="flabel">{t('truck')}</label>
          <select className="input" value={truckId} onChange={(e) => setTruckId(e.target.value)} autoFocus>
            <option value="">{t('selectTruck')}</option>
            {trucks.map((tr) => <option key={tr.id} value={tr.id}>{tr.code}</option>)}
          </select>
        </div>
        <div>
          <label className="flabel">{t('date')}</label>
          <input className="input" type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="flabel">{t('category')}</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value as CostCategory)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{t(`cat_${c}`)}</option>)}
          </select>
        </div>
        <div>
          <label className="flabel">{t('amount')}</label>
          <input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <div className="full">
          <label className="flabel">{t('note')} <span className="fhint">· {tc('optional')}</span></label>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
