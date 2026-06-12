'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { login } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

export function LoginForm() {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const setLocale = (next: 'en' | 'es') => {
    if (next !== locale) router.replace(pathname, { locale: next });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(username.trim(), password);
      router.replace('/dashboard');
    } catch (err) {
      const badCreds = err instanceof ApiError && err.status === 401;
      setError(
        badCreds
          ? locale === 'es'
            ? 'Usuario o contraseña incorrectos.'
            : 'Wrong username or password.'
          : locale === 'es'
            ? 'No se pudo iniciar sesión. Inténtalo de nuevo.'
            : 'Could not sign in. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <section className="show">
        <div className="lw">
          <span className="z">Z</span> zezet
        </div>
        <div>
          <h2>{t('tagline')}</h2>
          <p>Trips, drivers, fuel and billing for the whole fleet — simple enough to use every night.</p>
          <div className="mini">
            <div className="r"><span style={{ opacity: 0.85 }}>Trucks out today</span><b>28 / 38</b></div>
            <div className="r"><span style={{ opacity: 0.85 }}>Trips logged</span><b>31</b></div>
            <div className="r"><span style={{ opacity: 0.85 }}>Fleet in use</span><b>81%</b></div>
          </div>
        </div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>zezet.net · Panamá</div>
      </section>

      <section className="formside">
        <form className="box" onSubmit={onSubmit}>
          <h3>{t('signIn')}</h3>
          <p className="muted" style={{ margin: '0 0 12px' }}>
            {locale === 'es'
              ? 'Inicia sesión con el usuario que te dieron.'
              : 'Sign in with the username your admin gave you.'}
          </p>

          <div className="field">
            <label>
              {t('username')} <span className="es">· {locale === 'es' ? 'Usuario' : 'Usuario'}</span>
            </label>
            <input
              className="input"
              placeholder="m.gomez"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="field">
            <label>{t('password')}</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div
              role="alert"
              style={{
                background: 'var(--bad-bg)',
                color: 'var(--bad)',
                border: '1px solid #f6c7ce',
                borderRadius: 5,
                padding: '9px 12px',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              {error}
            </div>
          )}

          <button
            className="btn"
            type="submit"
            disabled={busy}
            style={{ width: '100%', justifyContent: 'center', padding: 12, opacity: busy ? 0.7 : 1 }}
          >
            {busy ? (locale === 'es' ? 'Entrando…' : 'Signing in…') : t('signIn')}
          </button>

          <div className="note" style={{ marginTop: 18 }}>
            <span>ℹ️</span>
            <span>
              {locale === 'es'
                ? 'No necesitas correo — la cuenta usa un usuario. Correo y teléfono son opcionales.'
                : 'No email needed — accounts use a simple username. Email & phone are optional.'}
            </span>
          </div>

          <div style={{ textAlign: 'center', marginTop: 18 }}>
            <span className="lang">
              <button type="button" className={locale === 'en' ? 'on' : ''} onClick={() => setLocale('en')}>
                English
              </button>
              <button type="button" className={locale === 'es' ? 'on' : ''} onClick={() => setLocale('es')}>
                Español
              </button>
            </span>
          </div>
        </form>
      </section>
    </div>
  );
}
