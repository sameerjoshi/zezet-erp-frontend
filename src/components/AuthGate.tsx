'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { me } from '@/lib/api/auth';

// Guards the app area. On mount, loads the profile — the API client will silently
// refresh via the httpOnly cookie if the in-memory access token is gone (e.g. after
// a page reload). If that fails, the user isn't signed in → send them to /login.
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'ok'>('loading');

  useEffect(() => {
    let active = true;
    me()
      .then(() => active && setState('ok'))
      .catch(() => active && router.replace('/login'));
    return () => {
      active = false;
    };
  }, [router]);

  if (state !== 'ok') {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', color: 'var(--muted)' }}>
        Loading…
      </div>
    );
  }
  return <>{children}</>;
}
