'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/Modal';
import { useAuth, type RoleKey } from '@/lib/auth/useAuth';
import {
  getUsers,
  getRoles,
  createUser,
  setUserRoles,
  type UserRow,
  type Role,
  type CreateUserInput,
} from '@/lib/api/admin';
import { usePaged } from '@/lib/usePaged';
import { Pagination } from '@/components/Pagination';

export function UsersView() {
  const t = useTranslations('users');
  const tc = useTranslations('common');
  const ts = useTranslations('status');
  const qc = useQueryClient();
  const { isAdmin, isLoading: authLoading } = useAuth();

  const [creating, setCreating] = useState(false);
  const [editingRoles, setEditingRoles] = useState<UserRow | null>(null);
  const [createdUsername, setCreatedUsername] = useState<string | null>(null);

  const users = useQuery({ queryKey: ['users'], queryFn: getUsers, enabled: isAdmin });
  const roles = useQuery({ queryKey: ['roles'], queryFn: getRoles, enabled: isAdmin });

  const create = useMutation({
    mutationFn: (body: CreateUserInput) => createUser(body),
    onSuccess: (user) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setCreating(false);
      setCreatedUsername(user.username);
    },
  });
  const updateRoles = useMutation({
    mutationFn: (vars: { id: string; roles: RoleKey[] }) => setUserRoles(vars.id, vars.roles),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setEditingRoles(null);
    },
  });

  const roleName = (key: RoleKey) => roles.data?.find((r) => r.key === key)?.name ?? key;

  // Called before the early returns below to keep hook order stable.
  const pg = usePaged(users.data ?? [], 20);

  if (authLoading) return <div className="page"><div className="empty">{tc('loading')}</div></div>;
  if (!isAdmin) {
    return (
      <div className="page">
        <div className="card"><div className="empty">{t('adminOnly')}</div></div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="toolbar">
        <button className="btn" onClick={() => setCreating(true)}>+ {t('newUser')}</button>
      </div>

      {createdUsername && (
        <div className="card" style={{ marginBottom: 14, borderColor: 'var(--ok)' }}>
          <div className="bd" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="pill ok">{t('createdUser')}</span>
            <b>{t('usernameIs', { username: createdUsername })}</b>
            <button className="linkbtn" style={{ marginLeft: 'auto' }} onClick={() => setCreatedUsername(null)}>
              {tc('close')}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        {users.isLoading && <div className="empty">{tc('loading')}</div>}
        {users.isError && <div className="empty" style={{ color: 'var(--bad)' }}>{t('loadError')}</div>}
        {users.data && users.data.length === 0 && <div className="empty">{t('empty')}</div>}
        {users.data && users.data.length > 0 && (
          <>
          <table>
            <thead>
              <tr>
                <th>{t('username')}</th>
                <th>{t('roles')}</th>
                <th>{t('status')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pg.pageItems.map((u) => (
                <tr key={u.id}>
                  <td><b>{u.username}</b></td>
                  <td>
                    {u.roles.map((r) => (
                      <span key={r} className="pill info" style={{ marginRight: 6 }}>{roleName(r)}</span>
                    ))}
                  </td>
                  <td><span className={`pill ${u.status === 'active' ? 'ok' : 'off'}`}>{ts(u.status)}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn ghost sm" onClick={() => setEditingRoles(u)}>{t('editRoles')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination paged={pg} />
          </>
        )}
      </div>

      {creating && (
        <CreateUserForm
          roles={roles.data ?? []}
          saving={create.isPending}
          error={create.isError ? tc('errorGeneric') : null}
          onClose={() => setCreating(false)}
          onSave={(body) => create.mutate(body)}
        />
      )}

      {editingRoles && (
        <EditRolesForm
          user={editingRoles}
          roles={roles.data ?? []}
          saving={updateRoles.isPending}
          error={updateRoles.isError ? tc('errorGeneric') : null}
          onClose={() => setEditingRoles(null)}
          onSave={(next) => updateRoles.mutate({ id: editingRoles.id, roles: next })}
        />
      )}
    </div>
  );
}

function RolePicker({
  roles,
  selected,
  toggle,
}: {
  roles: Role[];
  selected: RoleKey[];
  toggle: (key: RoleKey) => void;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {roles.map((r) => (
        <label key={r.id} className="checkrow">
          <input type="checkbox" checked={selected.includes(r.key)} onChange={() => toggle(r.key)} />
          {r.name}
        </label>
      ))}
    </div>
  );
}

function CreateUserForm({
  roles,
  saving,
  error,
  onClose,
  onSave,
}: {
  roles: Role[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (body: CreateUserInput) => void;
}) {
  const t = useTranslations('users');
  const tc = useTranslations('common');

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [selected, setSelected] = useState<RoleKey[]>([]);

  const toggle = (key: RoleKey) =>
    setSelected((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));

  const valid = fullName.trim() !== '' && password.length > 0 && selected.length > 0;
  const submit = () => onSave({ fullName: fullName.trim(), password, roles: selected });

  return (
    <Modal
      title={t('newUser')}
      onClose={onClose}
      footer={
        <>
          {error && <span className="errbox" style={{ marginRight: 'auto' }}>{error}</span>}
          {!error && selected.length === 0 && <span className="fhint" style={{ marginRight: 'auto' }}>{t('atLeastOneRole')}</span>}
          <div className="spacer" />
          <button className="btn ghost" onClick={onClose}>{tc('cancel')}</button>
          <button className="btn" disabled={!valid || saving} onClick={submit}>
            {saving ? tc('saving') : tc('save')}
          </button>
        </>
      }
    >
      <div className="formgrid">
        <div className="full">
          <label className="flabel">{t('fullName')}</label>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
          <p className="fhint" style={{ marginTop: 6 }}>{t('generatedNote')}</p>
        </div>
        <div className="full">
          <label className="flabel">{t('password')}</label>
          <input className="input" type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="full">
          <label className="flabel">{t('roles')}</label>
          <RolePicker roles={roles} selected={selected} toggle={toggle} />
        </div>
      </div>
    </Modal>
  );
}

function EditRolesForm({
  user,
  roles,
  saving,
  error,
  onClose,
  onSave,
}: {
  user: UserRow;
  roles: Role[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (roles: RoleKey[]) => void;
}) {
  const t = useTranslations('users');
  const tc = useTranslations('common');

  const [selected, setSelected] = useState<RoleKey[]>(user.roles);
  const toggle = (key: RoleKey) =>
    setSelected((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));

  return (
    <Modal
      title={`${t('setRoles')} · ${user.username}`}
      onClose={onClose}
      footer={
        <>
          {error && <span className="errbox" style={{ marginRight: 'auto' }}>{error}</span>}
          {!error && selected.length === 0 && <span className="fhint" style={{ marginRight: 'auto' }}>{t('atLeastOneRole')}</span>}
          <div className="spacer" />
          <button className="btn ghost" onClick={onClose}>{tc('cancel')}</button>
          <button className="btn" disabled={selected.length === 0 || saving} onClick={() => onSave(selected)}>
            {saving ? tc('saving') : tc('save')}
          </button>
        </>
      }
    >
      <p className="helper" style={{ marginTop: 0 }}>{t('pickRoles')}</p>
      <RolePicker roles={roles} selected={selected} toggle={toggle} />
    </Modal>
  );
}
