import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Header, type Lang } from '@lunedoc/ui';
import { useI18n } from '@lunedoc/i18n';
import { LunedocApiError } from '@lunedoc/api';
import { useAuth } from './AuthContext';

interface AuthVerifyPageProps {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

/**
 * Magic-link consumer at /auth/verify?email=…&token=…
 *
 * Email body printed by the dev ConsoleEmailSender includes both a code
 * and a link of this shape; clicking the link auto-verifies. The single
 * useEffect is guarded against StrictMode's double-invoke because the
 * link_token is one-shot.
 */
export function AuthVerifyPage({ lang, setLang }: AuthVerifyPageProps) {
  const { t } = useI18n(lang);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { signInVerify } = useAuth();
  const ranRef = useRef(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    const email = params.get('email');
    const token = params.get('token');
    if (!email || !token) {
      setErrorKey('auth_invalid_link');
      return;
    }
    signInVerify(email, { link_token: token })
      .then(() => navigate(lang === 'en' ? '/' : `/${lang}`, { replace: true }))
      .catch((err) => {
        if (err instanceof LunedocApiError && err.status === 400) {
          setErrorKey('auth_invalid_link');
        } else {
          setErrorKey('auth_network_error');
        }
      });
  }, [params, signInVerify, navigate, lang]);

  const signinHref = lang === 'en' ? '/signin' : `/${lang}/signin`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--fg)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <Header lang={lang} setLang={setLang} rightSlot={<></>} />
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '4rem 1.5rem',
        }}
      >
        <div className="pl-card" style={{ width: '100%', maxWidth: 420, padding: 32, textAlign: 'center' }}>
          {errorKey === null ? (
            <p style={{ color: 'var(--fg-muted)', fontSize: 14, margin: 0 }}>
              {t('auth_verifying')}
            </p>
          ) : (
            <>
              <p
                role="alert"
                style={{
                  fontSize: 14,
                  color: '#b91c1c',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  padding: '12px 16px',
                  margin: '0 0 16px',
                }}
              >
                {t(errorKey)}
              </p>
              <Link
                to={signinHref}
                className="pl-btn pl-btn-primary pl-btn-sm"
                style={{ textDecoration: 'none' }}
              >
                {t('auth_link_failed_cta')}
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
