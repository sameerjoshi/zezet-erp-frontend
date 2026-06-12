'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth/useAuth';

// Guards the app area. The shared ['me'] query loads the profile — the API client will
// silently refresh via the httpOnly cookie if the in-memory access token is gone (e.g.
// after a page reload). If that fails, the user isn't signed in → send them to /login.
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const t = useTranslations('common');
  const { user, isError } = useAuth();

  useEffect(() => {
    if (isError) router.replace('/login');
  }, [isError, router]);

  if (!user) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', color: 'var(--muted)' }}>
        {t('loading')}
      </div>
    );
  }
  return <>{children}</>;
}
