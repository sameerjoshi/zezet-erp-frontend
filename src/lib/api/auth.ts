import { apiFetch } from './client';
import { tokenStore } from './tokens';

export interface AuthUser {
  id: string;
  username: string;
  locale: string;
  roles: string[];
}

interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

// POST /auth/login → sets the httpOnly refresh cookie + returns the access token.
// We keep the access token in memory and immediately load the profile.
export async function login(username: string, password: string): Promise<AuthUser> {
  const res = await apiFetch<LoginResponse>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ username, password }) },
    { auth: false },
  );
  tokenStore.set(res.accessToken);
  return me();
}

export function me(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me', { method: 'GET' });
}

export async function logout(): Promise<void> {
  try {
    await apiFetch<void>('/auth/logout', { method: 'POST' });
  } finally {
    tokenStore.clear();
  }
}
