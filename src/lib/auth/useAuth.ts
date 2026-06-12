'use client';

import { useQuery } from '@tanstack/react-query';
import { me, type AuthUser } from '@/lib/api/auth';

export type RoleKey =
  | 'admin'
  | 'finance'
  | 'ops_manager'
  | 'ops_staff'
  | 'driver'
  | 'investor';

// Roles allowed to see money. The backend already strips financial fields for ops
// roles; the frontend mirrors that so we never render an empty money column to them.
const MONEY_ROLES: RoleKey[] = ['admin', 'finance', 'investor'];

export interface Auth {
  user: AuthUser | undefined;
  roles: string[];
  isLoading: boolean;
  isError: boolean;
  has: (role: RoleKey) => boolean;
  isAdmin: boolean;
  canSeeMoney: boolean;
}

// Shared profile query (queryKey ['me']) — reused by AuthGate and every screen so the
// profile is fetched once and cached. retry:false keeps the redirect-on-unauth snappy.
export function useAuth(): Auth {
  const q = useQuery({
    queryKey: ['me'],
    queryFn: me,
    retry: false,
    staleTime: 5 * 60_000,
  });

  const roles = q.data?.roles ?? [];
  const has = (role: RoleKey) => roles.includes(role);

  return {
    user: q.data,
    roles,
    isLoading: q.isLoading,
    isError: q.isError,
    has,
    isAdmin: has('admin'),
    canSeeMoney: roles.some((r) => (MONEY_ROLES as string[]).includes(r)),
  };
}
