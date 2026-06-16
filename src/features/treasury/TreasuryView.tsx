'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/Modal';
import { Pagination } from '@/components/Pagination';
import { usePaged } from '@/lib/usePaged';
import { useAuth } from '@/lib/auth/useAuth';
import { getTrucks } from '@/lib/api/masterdata';
import {
  listAccounts,
  createAccount,
  updateAccount,
  listTransactions,
  createTransaction,
  deleteTransaction,
  type AccountKind,
  type TxCategory,
  type TxDirection,
} from '@/lib/api/treasury';

const CATEGORIES: TxCategory[] = ['client_payment', 'investment', 'loan', 'fuel', 'salary', 'maintenance', 'toll', 'insurance', 'tax', 'general', 'transfer', 'other'];
const money = (s: string) => '$' + Number(s).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);

export function TreasuryView() {
  const t = useTranslations('treasury');
  const tc = useTranslations('common');
  const { canSeeMoney, isLoading: authLoading } = useAuth();
  const [account, setAccount] = useState('');
  const [addingTx, setAddingTx] = useState(false);
  const [addingAcct, setAddingAcct] = useState(false);

  const qc = useQueryClient();
  const accounts = useQuery({ queryKey: ['accounts'], queryFn: listAccounts, enabled: !authLoading && canSeeMoney });
  const total = accounts.data?.reduce((s, a) => s + Number(a.balance), 0) ?? 0;
  const setDefault = useMutation({
    mutationFn: (id: string) => updateAccount(id, { isDefault: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
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
    <div className="page" style={{ maxWidth: 1100 }}>
      {/* Cash position */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="hd">
          <h2>{t('cashPosition')}</h2>
          <span className="pill info" style={{ marginLeft: 8 }}>{money(String(total))}</span>
          <div className="spacer" />
          <button className="btn ghost sm" onClick={() => setAddingAcct(true)}>+ {t('newAccount')}</button>
        </div>
        <div className="bd" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {accounts.isLoading && <span className="helper">{tc('loading')}</span>}
          {accounts.data && accounts.data.length === 0 && <span className="helper">{t('noAccounts')}</span>}
          {accounts.data?.map((a) => (
            <div key={a.id} style={{ minWidth: 190, border: a.isDefault ? '1px solid var(--blue)' : '1px solid var(--line)', borderRadius: 'var(--rc)', padding: '12px 14px' }}>
              <div className="muted" style={{ fontSize: 12, fontWeight: 600 }}>{a.name} <span className="pill off" style={{ marginLeft: 4 }}>{t(`kind_${a.kind}`)}</span></div>
              <div style={{ font: '800 19px var(--font)', marginTop: 4, color: Number(a.balance) < 0 ? 'var(--bad)' : 'var(--ink)' }}>{money(a.balance)}</div>
              <div style={{ marginTop: 6 }}>
                {a.isDefault ? (
                  <span className="pill info" style={{ fontSize: 10 }}>★ {t('default')}</span>
                ) : (
                  <button className="linkbtn" style={{ fontSize: 11 }} disabled={setDefault.isPending} onClick={() => setDefault.mutate(a.id)}>{t('setDefault')}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ledger */}
      <div className="toolbar">
        <button className="btn" onClick={() => setAddingTx(true)} disabled={!accounts.data?.length}>+ {t('newTx')}</button>
        <select className="input" style={{ width: 200, marginLeft: 12 }} value={account} onChange={(e) => setAccount(e.target.value)}>
          <option value="">{t('allAccounts')}</option>
          {accounts.data?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
      <Ledger accountId={account} />

      {addingTx && <AddTxModal accounts={accounts.data ?? []} onClose={() => setAddingTx(false)} />}
      {addingAcct && <AddAccountModal onClose={() => setAddingAcct(false)} />}
    </div>
  );
}

function Ledger({ accountId }: { accountId: string }) {
  const t = useTranslations('treasury');
  const tc = useTranslations('common');
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['txns', accountId], queryFn: () => listTransactions(accountId ? { accountId } : undefined) });
  const pg = usePaged(q.data ?? [], 20);
  const del = useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['txns'] }); qc.invalidateQueries({ queryKey: ['accounts'] }); },
  });

  return (
    <div className="card">
      {q.isLoading && <div className="empty">{tc('loading')}</div>}
      {q.data && q.data.length === 0 && <div className="empty">{t('noTx')}</div>}
      {pg.total > 0 && (
        <>
          <table>
            <thead>
              <tr>
                <th>{t('date')}</th><th>{t('account')}</th><th>{t('description')}</th>
                <th>{t('category')}</th><th>{t('truck')}</th>
                <th style={{ textAlign: 'right' }}>{t('amount')}</th><th />
              </tr>
            </thead>
            <tbody>
              {pg.pageItems.map((x) => {
                const inflow = x.direction === 'inflow';
                return (
                  <tr key={x.id}>
                    <td className="muted">{x.date.slice(0, 10)}</td>
                    <td>{x.accountName}</td>
                    <td>{x.description}{x.sourceType !== 'manual' && <span className="pill off" style={{ marginLeft: 6, fontSize: 10 }}>{t('auto')}</span>}</td>
                    <td className="muted">{t(`cat_${x.category}`)}</td>
                    <td className="muted">{x.truckCode ?? '—'}</td>
                    <td className="tnum" style={{ textAlign: 'right', fontWeight: 700, color: inflow ? 'var(--ok)' : 'var(--bad)' }}>
                      {inflow ? '+' : '−'}{money(x.amount).slice(1)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn ghost sm" onClick={() => { if (window.confirm(t('confirmDelete'))) del.mutate(x.id); }}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination paged={pg} />
        </>
      )}
    </div>
  );
}

function AddTxModal({ accounts, onClose }: { accounts: { id: string; name: string }[]; onClose: () => void }) {
  const t = useTranslations('treasury');
  const tc = useTranslations('common');
  const qc = useQueryClient();
  const trucks = useQuery({ queryKey: ['trucks'], queryFn: getTrucks });
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [date, setDate] = useState(today());
  const [direction, setDirection] = useState<TxDirection>('outflow');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<TxCategory>('general');
  const [description, setDescription] = useState('');
  const [truckId, setTruckId] = useState('');

  const valid = accountId && date && amount.trim() !== '' && Number(amount) >= 0 && description.trim() !== '';
  const create = useMutation({
    mutationFn: () => createTransaction({ accountId, date, direction, amount: Number(amount), category, description: description.trim(), truckId: truckId || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['txns'] }); qc.invalidateQueries({ queryKey: ['accounts'] }); onClose(); },
  });

  return (
    <Modal
      title={t('newTx')}
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
          <label className="flabel">{t('account')}</label>
          <select className="input" value={accountId} onChange={(e) => setAccountId(e.target.value)} autoFocus>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="flabel">{t('direction')}</label>
          <select className="input" value={direction} onChange={(e) => setDirection(e.target.value as TxDirection)}>
            <option value="inflow">{t('inflow')}</option>
            <option value="outflow">{t('outflow')}</option>
          </select>
        </div>
        <div>
          <label className="flabel">{t('amount')}</label>
          <input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <label className="flabel">{t('date')}</label>
          <input className="input" type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="flabel">{t('category')}</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value as TxCategory)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{t(`cat_${c}`)}</option>)}
          </select>
        </div>
        <div className="full">
          <label className="flabel">{t('description')}</label>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="full">
          <label className="flabel">{t('truck')} <span className="fhint">· {tc('optional')}</span></label>
          <select className="input" value={truckId} onChange={(e) => setTruckId(e.target.value)}>
            <option value="">{t('noTruck')}</option>
            {trucks.data?.map((tr) => <option key={tr.id} value={tr.id}>{tr.code}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  );
}

function AddAccountModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('treasury');
  const tc = useTranslations('common');
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<AccountKind>('bank');
  const [openingBalance, setOpeningBalance] = useState('');

  const create = useMutation({
    mutationFn: () => createAccount({ name: name.trim(), kind, openingBalance: openingBalance.trim() ? Number(openingBalance) : undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); onClose(); },
  });

  return (
    <Modal
      title={t('newAccount')}
      onClose={onClose}
      footer={
        <>
          {create.isError && <span className="errbox" style={{ marginRight: 'auto' }}>{tc('errorGeneric')}</span>}
          <div className="spacer" />
          <button className="btn ghost" onClick={onClose}>{tc('cancel')}</button>
          <button className="btn" disabled={!name.trim() || create.isPending} onClick={() => create.mutate()}>{create.isPending ? tc('saving') : tc('save')}</button>
        </>
      }
    >
      <div className="formgrid">
        <div className="full">
          <label className="flabel">{t('accountName')}</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="St Georges Bank" autoFocus />
        </div>
        <div>
          <label className="flabel">{t('kind')}</label>
          <select className="input" value={kind} onChange={(e) => setKind(e.target.value as AccountKind)}>
            <option value="bank">{t('kind_bank')}</option>
            <option value="cash">{t('kind_cash')}</option>
          </select>
        </div>
        <div>
          <label className="flabel">{t('openingBalance')}</label>
          <input className="input" inputMode="decimal" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} placeholder="0.00" />
        </div>
      </div>
    </Modal>
  );
}
