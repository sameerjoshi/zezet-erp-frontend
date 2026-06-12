'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/Modal';
import {
  listWorkers,
  createWorker,
  updateWorker,
  deactivateWorker,
  type Worker,
  type WorkerInput,
} from '@/lib/api/masterdata';

export function PeopleView() {
  const t = useTranslations('people');
  const tc = useTranslations('common');
  const ts = useTranslations('status');
  const qc = useQueryClient();

  const [showDisabled, setShowDisabled] = useState(false);
  const [editing, setEditing] = useState<Worker | 'new' | null>(null);

  const workers = useQuery({
    queryKey: ['workers-admin', showDisabled],
    queryFn: () => listWorkers(showDisabled ? undefined : 'active'),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['workers-admin'] });

  const save = useMutation({
    mutationFn: (vars: { id?: string; body: WorkerInput }) =>
      vars.id ? updateWorker(vars.id, vars.body) : createWorker(vars.body),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });
  const deactivate = useMutation({
    mutationFn: (id: string) => deactivateWorker(id),
    onSuccess: invalidate,
  });

  const onDeactivate = (w: Worker) => {
    if (window.confirm(t('confirmDeactivate', { name: w.fullName }))) deactivate.mutate(w.id);
  };

  return (
    <div className="page">
      <div className="toolbar">
        <button className="btn" onClick={() => setEditing('new')}>
          + {t('newWorker')}
        </button>
        <label className="checkrow" style={{ marginLeft: 'auto' }}>
          <input type="checkbox" checked={showDisabled} onChange={(e) => setShowDisabled(e.target.checked)} />
          {t('showDisabled')}
        </label>
      </div>

      <div className="card">
        {workers.isLoading && <div className="empty">{tc('loading')}</div>}
        {workers.isError && <div className="empty" style={{ color: 'var(--bad)' }}>{t('loadError')}</div>}
        {workers.data && workers.data.length === 0 && <div className="empty">{t('empty')}</div>}
        {workers.data && workers.data.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>{t('name')}</th>
                <th>{t('type')}</th>
                <th>{t('abilities')}</th>
                <th>{tc('actions')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {workers.data.map((w) => (
                <tr key={w.id}>
                  <td><b>{w.fullName}</b></td>
                  <td className="muted">{t(w.type)}</td>
                  <td>
                    {w.canDrive && <span className="pill info" style={{ marginRight: 6 }}>{t('canDrive')}</span>}
                    {w.canHelp && <span className="pill off">{t('canHelp')}</span>}
                  </td>
                  <td>
                    <span className={`pill ${w.status === 'active' ? 'ok' : 'off'}`}>{ts(w.status)}</span>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn ghost sm" onClick={() => setEditing(w)}>{tc('edit')}</button>
                    {w.status === 'active' && (
                      <button className="btn ghost sm" style={{ marginLeft: 6 }} onClick={() => onDeactivate(w)}>
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

      {editing && (
        <WorkerForm
          worker={editing === 'new' ? null : editing}
          saving={save.isPending}
          error={save.isError ? tc('errorGeneric') : null}
          onClose={() => setEditing(null)}
          onSave={(body) => save.mutate({ id: editing === 'new' ? undefined : editing.id, body })}
        />
      )}
    </div>
  );
}

function WorkerForm({
  worker,
  saving,
  error,
  onClose,
  onSave,
}: {
  worker: Worker | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (body: WorkerInput) => void;
}) {
  const t = useTranslations('people');
  const tc = useTranslations('common');

  const [fullName, setFullName] = useState(worker?.fullName ?? '');
  const [type, setType] = useState<'employee' | 'contractor'>(worker?.type ?? 'contractor');
  const [canDrive, setCanDrive] = useState(worker?.canDrive ?? true);
  const [canHelp, setCanHelp] = useState(worker?.canHelp ?? true);

  const submit = () => onSave({ fullName: fullName.trim(), type, canDrive, canHelp });

  return (
    <Modal
      title={worker ? t('editWorker') : t('newWorker')}
      onClose={onClose}
      footer={
        <>
          {error && <span className="errbox" style={{ marginRight: 'auto' }}>{error}</span>}
          <div className="spacer" />
          <button className="btn ghost" onClick={onClose}>{tc('cancel')}</button>
          <button className="btn" disabled={!fullName.trim() || saving} onClick={submit}>
            {saving ? tc('saving') : tc('save')}
          </button>
        </>
      }
    >
      <div className="formgrid">
        <div className="full">
          <label className="flabel">{t('name')}</label>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
        </div>
        <div className="full">
          <label className="flabel">{t('type')}</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as 'employee' | 'contractor')}>
            <option value="employee">{t('employee')}</option>
            <option value="contractor">{t('contractor')}</option>
          </select>
        </div>
        <div className="full">
          <label className="flabel">{t('abilities')}</label>
          <label className="checkrow" style={{ marginBottom: 8 }}>
            <input type="checkbox" checked={canDrive} onChange={(e) => setCanDrive(e.target.checked)} />
            {t('canDrive')}
          </label>
          <label className="checkrow">
            <input type="checkbox" checked={canHelp} onChange={(e) => setCanHelp(e.target.checked)} />
            {t('canHelp')}
          </label>
        </div>
      </div>
    </Modal>
  );
}
