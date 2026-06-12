'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/Modal';
import { useAuth } from '@/lib/auth/useAuth';
import {
  listClients,
  createClient,
  updateClient,
  deactivateClient,
  type Client,
  type ClientInput,
} from '@/lib/api/masterdata';
import {
  getRateCards,
  createRateCard,
  getRates,
  createRate,
  closeRate,
  type RateInput,
} from '@/lib/api/pricing';

export function ClientsView() {
  const t = useTranslations('clients');
  const tc = useTranslations('common');
  const ts = useTranslations('status');
  const qc = useQueryClient();
  const { canSeeMoney } = useAuth();

  const [showDisabled, setShowDisabled] = useState(false);
  const [editing, setEditing] = useState<Client | 'new' | null>(null);
  const [selected, setSelected] = useState<Client | null>(null);

  const clients = useQuery({
    queryKey: ['clients-admin', showDisabled],
    queryFn: () => listClients(showDisabled ? undefined : 'active'),
  });

  const save = useMutation({
    mutationFn: (vars: { id?: string; body: ClientInput }) =>
      vars.id ? updateClient(vars.id, vars.body) : createClient(vars.body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients-admin'] });
      setEditing(null);
    },
  });
  const deactivate = useMutation({
    mutationFn: (id: string) => deactivateClient(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients-admin'] }),
  });

  const onDeactivate = (c: Client) => {
    if (window.confirm(t('confirmDeactivate', { name: c.name }))) deactivate.mutate(c.id);
  };

  return (
    <div className="page">
      <div className="toolbar">
        <button className="btn" onClick={() => setEditing('new')}>
          + {t('newClient')}
        </button>
        <label className="checkrow" style={{ marginLeft: 'auto' }}>
          <input type="checkbox" checked={showDisabled} onChange={(e) => setShowDisabled(e.target.checked)} />
          {t('showDisabled')}
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 1.4fr', gap: 14, alignItems: 'start' }}>
        <div className="card">
          {clients.isLoading && <div className="empty">{tc('loading')}</div>}
          {clients.isError && <div className="empty" style={{ color: 'var(--bad)' }}>{t('loadError')}</div>}
          {clients.data && clients.data.length === 0 && <div className="empty">{t('empty')}</div>}
          {clients.data && clients.data.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>{t('name')}</th>
                  <th>{t('code')}</th>
                  <th>{tc('actions')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {clients.data.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    style={{ cursor: 'pointer', background: selected?.id === c.id ? 'var(--peri)' : undefined }}
                  >
                    <td><b>{c.name}</b></td>
                    <td className="muted">{c.code ?? '—'}</td>
                    <td>
                      <span className={`pill ${c.status === 'active' ? 'ok' : 'off'}`}>{ts(c.status)}</span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                      <button className="btn ghost sm" onClick={() => setEditing(c)}>{tc('edit')}</button>
                      {c.status === 'active' && (
                        <button className="btn ghost sm" style={{ marginLeft: 6 }} onClick={() => onDeactivate(c)}>
                          {tc('deactivate')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selected ? (
          <RatePanel key={selected.id} client={selected} canSeeMoney={canSeeMoney} />
        ) : (
          <div className="card">
            <div className="empty">{t('selectHint')}</div>
          </div>
        )}
      </div>

      {editing && (
        <ClientForm
          client={editing === 'new' ? null : editing}
          saving={save.isPending}
          error={save.isError ? tc('errorGeneric') : null}
          onClose={() => setEditing(null)}
          onSave={(body) => save.mutate({ id: editing === 'new' ? undefined : editing.id, body })}
        />
      )}
    </div>
  );
}

function RatePanel({ client, canSeeMoney }: { client: Client; canSeeMoney: boolean }) {
  const t = useTranslations('clients');
  const tc = useTranslations('common');
  const qc = useQueryClient();

  const [cardId, setCardId] = useState<string | null>(null);
  const [addingRate, setAddingRate] = useState(false);
  const [newCardName, setNewCardName] = useState('');

  const cards = useQuery({
    queryKey: ['rate-cards', client.id],
    queryFn: () => getRateCards(client.id),
  });

  // Auto-select the first card. Adjusting state during render (guarded so it runs once)
  // is the React-recommended alternative to a setState-in-effect for derived selection.
  const cardList = cards.data ?? [];
  if (cardList.length > 0 && (cardId === null || !cardList.some((c) => c.id === cardId))) {
    setCardId(cardList[0].id);
  }

  const rates = useQuery({
    queryKey: ['rates', cardId],
    queryFn: () => getRates(cardId!),
    enabled: !!cardId,
  });

  const addCard = useMutation({
    mutationFn: (name: string) => createRateCard(client.id, { name }),
    onSuccess: (card) => {
      qc.invalidateQueries({ queryKey: ['rate-cards', client.id] });
      setCardId(card.id);
      setNewCardName('');
    },
  });
  const addRate = useMutation({
    mutationFn: (body: RateInput) => createRate(cardId!, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rates', cardId] });
      setAddingRate(false);
    },
  });
  const close = useMutation({
    mutationFn: (rateId: string) => closeRate(rateId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rates', cardId] }),
  });

  return (
    <div className="card">
      <div className="hd">
        <h2>{t('ratesFor', { name: client.name })}</h2>
      </div>
      <div className="bd">
        {/* rate cards row */}
        <div className="toolbar">
          {cards.isLoading && <span className="helper">{tc('loading')}</span>}
          {cards.isError && <span className="helper" style={{ color: 'var(--bad)' }}>{t('loadCardsError')}</span>}
          {cards.data?.map((card) => (
            <button
              key={card.id}
              className="btn ghost sm"
              onClick={() => setCardId(card.id)}
              style={cardId === card.id ? { borderColor: 'var(--blue)', background: 'var(--peri)', color: 'var(--blue)' } : undefined}
            >
              {card.name}
            </button>
          ))}
          {cards.data && cards.data.length === 0 && <span className="helper">{t('noCards')}</span>}
        </div>

        {/* add a rate card */}
        <div className="toolbar">
          <input
            className="input"
            style={{ maxWidth: 220 }}
            placeholder={t('cardName')}
            value={newCardName}
            onChange={(e) => setNewCardName(e.target.value)}
          />
          <button className="btn ghost sm" disabled={!newCardName.trim() || addCard.isPending} onClick={() => addCard.mutate(newCardName.trim())}>
            + {t('newRateCard')}
          </button>
        </div>

        {!canSeeMoney && <p className="helper" style={{ margin: '8px 0' }}>{t('financeOnlyNote')}</p>}

        {/* rates table */}
        {cardId && (
          <>
            <table style={{ marginTop: 8 }}>
              <thead>
                <tr>
                  <th>{t('label')}</th>
                  {canSeeMoney && <th>{t('clientPrice')}</th>}
                  {canSeeMoney && <th>{t('driverPay')}</th>}
                  {canSeeMoney && <th>{t('helperPay')}</th>}
                  <th>{t('effectiveFrom')}</th>
                  <th>{t('effectiveTo')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rates.data?.map((r) => (
                  <tr key={r.id}>
                    <td><b>{r.label ?? '—'}</b></td>
                    {canSeeMoney && <td className="tnum">{r.clientPrice ?? '—'}</td>}
                    {canSeeMoney && <td className="tnum">{r.driverPay ?? '—'}</td>}
                    {canSeeMoney && <td className="tnum">{r.helperPay ?? '—'}</td>}
                    <td className="muted">{r.effectiveFrom.slice(0, 10)}</td>
                    <td className="muted">{r.effectiveTo ? r.effectiveTo.slice(0, 10) : <span className="pill off">{t('openEnded')}</span>}</td>
                    <td style={{ textAlign: 'right' }}>
                      {!r.effectiveTo && (
                        <button
                          className="btn ghost sm"
                          onClick={() => window.confirm(t('confirmCloseRate')) && close.mutate(r.id)}
                        >
                          {t('closeRate')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {rates.data && rates.data.length === 0 && (
                  <tr><td colSpan={7} className="empty">{t('noRates')}</td></tr>
                )}
              </tbody>
            </table>

            {canSeeMoney && (
              <div className="toolbar" style={{ marginTop: 12 }}>
                <button className="btn sm" onClick={() => setAddingRate(true)}>+ {t('newRate')}</button>
              </div>
            )}
          </>
        )}
      </div>

      {addingRate && (
        <RateForm
          saving={addRate.isPending}
          error={addRate.isError ? tc('errorGeneric') : null}
          onClose={() => setAddingRate(false)}
          onSave={(body) => addRate.mutate(body)}
        />
      )}
    </div>
  );
}

function RateForm({
  saving,
  error,
  onClose,
  onSave,
}: {
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (body: RateInput) => void;
}) {
  const t = useTranslations('clients');
  const tc = useTranslations('common');

  const [label, setLabel] = useState('');
  const [clientPrice, setClientPrice] = useState('');
  const [driverPay, setDriverPay] = useState('');
  const [helperPay, setHelperPay] = useState('');

  const valid = clientPrice.trim() !== '' && driverPay.trim() !== '' && helperPay.trim() !== '';
  const submit = () =>
    onSave({
      label: label.trim() || undefined,
      clientPrice: Number(clientPrice),
      driverPay: Number(driverPay),
      helperPay: Number(helperPay),
    });

  return (
    <Modal
      title={t('newRate')}
      onClose={onClose}
      footer={
        <>
          {error && <span className="errbox" style={{ marginRight: 'auto' }}>{error}</span>}
          <div className="spacer" />
          <button className="btn ghost" onClick={onClose}>{tc('cancel')}</button>
          <button className="btn" disabled={!valid || saving} onClick={submit}>
            {saving ? tc('saving') : tc('add')}
          </button>
        </>
      }
    >
      <div className="formgrid">
        <div className="full">
          <label className="flabel">{t('label')} <span className="fhint">· {tc('optional')}</span></label>
          <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ciudad → Colón" autoFocus />
        </div>
        <div>
          <label className="flabel">{t('clientPrice')}</label>
          <input className="input" inputMode="decimal" value={clientPrice} onChange={(e) => setClientPrice(e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <label className="flabel">{t('driverPay')}</label>
          <input className="input" inputMode="decimal" value={driverPay} onChange={(e) => setDriverPay(e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <label className="flabel">{t('helperPay')}</label>
          <input className="input" inputMode="decimal" value={helperPay} onChange={(e) => setHelperPay(e.target.value)} placeholder="0.00" />
        </div>
      </div>
    </Modal>
  );
}

function ClientForm({
  client,
  saving,
  error,
  onClose,
  onSave,
}: {
  client: Client | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (body: ClientInput) => void;
}) {
  const t = useTranslations('clients');
  const tc = useTranslations('common');

  const [name, setName] = useState(client?.name ?? '');
  const [code, setCode] = useState(client?.code ?? '');
  const [billingFrequency, setBillingFrequency] = useState(client?.billingFrequency ?? '');

  const submit = () =>
    onSave({
      name: name.trim(),
      code: code.trim() || undefined,
      billingFrequency: billingFrequency.trim() || undefined,
    });

  return (
    <Modal
      title={client ? t('editClient') : t('newClient')}
      onClose={onClose}
      footer={
        <>
          {error && <span className="errbox" style={{ marginRight: 'auto' }}>{error}</span>}
          <div className="spacer" />
          <button className="btn ghost" onClick={onClose}>{tc('cancel')}</button>
          <button className="btn" disabled={!name.trim() || saving} onClick={submit}>
            {saving ? tc('saving') : tc('save')}
          </button>
        </>
      }
    >
      <div className="formgrid">
        <div className="full">
          <label className="flabel">{t('name')}</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="flabel">{t('code')} <span className="fhint">· {tc('optional')}</span></label>
          <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="SELVA" />
        </div>
        <div>
          <label className="flabel">{t('billing')} <span className="fhint">· {tc('optional')}</span></label>
          <input className="input" value={billingFrequency} onChange={(e) => setBillingFrequency(e.target.value)} placeholder="monthly" />
        </div>
      </div>
    </Modal>
  );
}
