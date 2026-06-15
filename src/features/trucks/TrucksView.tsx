'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/Modal';
import { useAuth } from '@/lib/auth/useAuth';
import {
  listTrucks,
  createTruck,
  updateTruck,
  deactivateTruck,
  type Truck,
  type TruckInput,
} from '@/lib/api/masterdata';
import { usePaged } from '@/lib/usePaged';
import { Pagination } from '@/components/Pagination';

const num = (s: string) => (s.trim() === '' ? undefined : Number(s));

export function TrucksView() {
  const t = useTranslations('trucks');
  const tc = useTranslations('common');
  const ts = useTranslations('status');
  const qc = useQueryClient();
  const { canSeeMoney } = useAuth();

  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState<Truck | 'new' | null>(null);

  const trucks = useQuery({
    queryKey: ['trucks-admin', showInactive],
    queryFn: () => listTrucks(showInactive ? undefined : 'active'),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['trucks-admin'] });

  const save = useMutation({
    mutationFn: (vars: { id?: string; body: TruckInput }) =>
      vars.id ? updateTruck(vars.id, vars.body) : createTruck(vars.body),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });
  const deactivate = useMutation({
    mutationFn: (id: string) => deactivateTruck(id),
    onSuccess: invalidate,
  });

  const onDeactivate = (truck: Truck) => {
    if (window.confirm(t('confirmDeactivate', { code: truck.code }))) deactivate.mutate(truck.id);
  };

  const pg = usePaged(trucks.data ?? [], 20);

  return (
    <div className="page">
      <div className="toolbar">
        <button className="btn" onClick={() => setEditing('new')}>
          + {t('newTruck')}
        </button>
        <label className="checkrow" style={{ marginLeft: 'auto' }}>
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => {
              setShowInactive(e.target.checked);
              pg.setPage(1);
            }}
          />
          {t('showInactive')}
        </label>
      </div>

      <div className="card">
        {trucks.isLoading && <div className="empty">{tc('loading')}</div>}
        {trucks.isError && <div className="empty" style={{ color: 'var(--bad)' }}>{t('loadError')}</div>}
        {trucks.data && trucks.data.length === 0 && <div className="empty">{t('empty')}</div>}
        {trucks.data && trucks.data.length > 0 && (
          <>
          <table>
            <thead>
              <tr>
                <th>{t('code')}</th>
                <th>{t('plate')}</th>
                <th>{t('year')}</th>
                <th>{t('size')}</th>
                {canSeeMoney && <th>{t('purchasePrice')}</th>}
                <th>{tc('actions')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pg.pageItems.map((truck) => (
                <tr key={truck.id}>
                  <td><b>{truck.code}</b></td>
                  <td className="muted">{truck.plate ?? '—'}</td>
                  <td className="tnum">{truck.year ?? '—'}</td>
                  <td className="tnum">{truck.sizeFt ? `${truck.sizeFt}'` : '—'}</td>
                  {canSeeMoney && <td className="tnum">{truck.purchasePrice ?? '—'}</td>}
                  <td>
                    <span className={`pill ${truck.status === 'active' ? 'ok' : 'off'}`}>
                      {ts(truck.status)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn ghost sm" onClick={() => setEditing(truck)}>{tc('edit')}</button>
                    {truck.status === 'active' && (
                      <button
                        className="btn ghost sm"
                        style={{ marginLeft: 6 }}
                        onClick={() => onDeactivate(truck)}
                      >
                        {tc('deactivate')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination paged={pg} />
          </>
        )}
      </div>

      {editing && (
        <TruckForm
          truck={editing === 'new' ? null : editing}
          canSeeMoney={canSeeMoney}
          saving={save.isPending}
          error={save.isError ? tc('errorGeneric') : null}
          onClose={() => setEditing(null)}
          onSave={(body) => save.mutate({ id: editing === 'new' ? undefined : editing.id, body })}
        />
      )}
    </div>
  );
}

function TruckForm({
  truck,
  canSeeMoney,
  saving,
  error,
  onClose,
  onSave,
}: {
  truck: Truck | null;
  canSeeMoney: boolean;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (body: TruckInput) => void;
}) {
  const t = useTranslations('trucks');
  const tc = useTranslations('common');

  const [code, setCode] = useState(truck?.code ?? '');
  const [plate, setPlate] = useState(truck?.plate ?? '');
  const [year, setYear] = useState(truck?.year?.toString() ?? '');
  const [sizeFt, setSizeFt] = useState(truck?.sizeFt?.toString() ?? '');
  const [purchaseDate, setPurchaseDate] = useState(truck?.purchaseDate?.slice(0, 10) ?? '');
  const [inServiceDate, setInServiceDate] = useState(truck?.inServiceDate?.slice(0, 10) ?? '');
  const [purchasePrice, setPurchasePrice] = useState(truck?.purchasePrice ?? '');
  const [odometerStart, setOdometerStart] = useState(truck?.odometerStart?.toString() ?? '');

  const submit = () => {
    const body: TruckInput = {
      code: code.trim(),
      plate: plate.trim() || undefined,
      year: num(year),
      sizeFt: num(sizeFt),
      purchaseDate: purchaseDate || undefined,
      inServiceDate: inServiceDate || undefined,
      odometerStart: num(odometerStart),
    };
    if (canSeeMoney) body.purchasePrice = num(purchasePrice);
    onSave(body);
  };

  return (
    <Modal
      title={truck ? t('editTruck') : t('newTruck')}
      onClose={onClose}
      footer={
        <>
          {error && <span className="errbox" style={{ marginRight: 'auto' }}>{error}</span>}
          <div className="spacer" />
          <button className="btn ghost" onClick={onClose}>{tc('cancel')}</button>
          <button className="btn" disabled={!code.trim() || saving} onClick={submit}>
            {saving ? tc('saving') : tc('save')}
          </button>
        </>
      }
    >
      <div className="formgrid">
        <div className="full">
          <label className="flabel">{t('code')}</label>
          <input className="input" value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="flabel">{t('plate')}</label>
          <input className="input" value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="PA-1234" />
        </div>
        <div>
          <label className="flabel">{t('year')}</label>
          <input className="input" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
        <div>
          <label className="flabel">{t('size')}</label>
          <input className="input" inputMode="numeric" value={sizeFt} onChange={(e) => setSizeFt(e.target.value)} />
        </div>
        <div>
          <label className="flabel">{t('odometer')}</label>
          <input className="input" inputMode="numeric" value={odometerStart} onChange={(e) => setOdometerStart(e.target.value)} />
        </div>
        <div>
          <label className="flabel">{t('purchaseDate')}</label>
          <input className="input" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
        </div>
        <div>
          <label className="flabel">{t('inServiceDate')}</label>
          <input className="input" type="date" value={inServiceDate} onChange={(e) => setInServiceDate(e.target.value)} />
        </div>
        {canSeeMoney && (
          <div>
            <label className="flabel">{t('purchasePrice')}</label>
            <input className="input" inputMode="decimal" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="0.00" />
          </div>
        )}
      </div>
    </Modal>
  );
}
