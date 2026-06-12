import { apiFetch } from './client';
import type { RoleKey } from '@/lib/auth/useAuth';

// Admin-only: user accounts and the role catalogue.

export interface UserRow {
  id: string;
  username: string; // generated from fullName (firstInitial + lastName)
  email: string | null;
  phone: string | null;
  locale: string;
  status: 'active' | 'disabled';
  roles: RoleKey[];
  createdAt: string;
}
export interface Role {
  id: string;
  key: RoleKey;
  name: string;
}
export interface CreateUserInput {
  fullName: string;
  password: string;
  roles: RoleKey[];
  email?: string;
  phone?: string;
  locale?: 'en' | 'es';
}

export const getUsers = () => apiFetch<UserRow[]>('/users');
export const createUser = (body: CreateUserInput) =>
  apiFetch<UserRow>('/users', { method: 'POST', body: JSON.stringify(body) });
export const setUserRoles = (id: string, roles: RoleKey[]) =>
  apiFetch<UserRow>(`/users/${id}/roles`, { method: 'PATCH', body: JSON.stringify({ roles }) });

export const getRoles = () => apiFetch<Role[]>('/roles');
