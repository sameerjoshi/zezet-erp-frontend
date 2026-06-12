import { tokenStore } from './tokens';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function request(path: string, init: RequestInit, withAuth: boolean): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = tokenStore.get();
  if (withAuth && token) headers.set('Authorization', `Bearer ${token}`);
  // credentials: 'include' so the httpOnly refresh cookie is sent (ADR 0001).
  return fetch(`${BASE}${path}`, { ...init, headers, credentials: 'include' });
}

// Single in-flight refresh shared by concurrent 401s.
let refreshing: Promise<boolean> | null = null;
function tryRefresh(): Promise<boolean> {
  refreshing ??= request('/auth/refresh', { method: 'POST' }, false)
    .then(async (r) => {
      if (!r.ok) return false;
      const data = (await r.json()) as { accessToken: string };
      tokenStore.set(data.accessToken);
      return true;
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  opts: { auth?: boolean; retry?: boolean } = {},
): Promise<T> {
  const { auth = true, retry = true } = opts;
  let res = await request(path, init, auth);

  if (res.status === 401 && auth && retry) {
    const ok = await tryRefresh();
    if (ok) res = await request(path, init, auth);
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (body.message) {
        message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
      }
    } catch {
      // non-JSON error body — keep statusText
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
