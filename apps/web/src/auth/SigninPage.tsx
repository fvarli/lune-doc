import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, type Lang } from '@lunedoc/ui';
import { useI18n } from '@lunedoc/i18n';
import { LunedocApiError } from '@lunedoc/api';
import { useAuth } from './AuthContext';

interface SigninPageProps {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

type Stage =
  | { kind: 'email' }
  | { kind: 'verify'; email: string };

export function SigninPage({ lang, setLang }: SigninPageProps) {
  const { t } = useI18n(lang);
  const navigate = useNavigate();
  const { signInStart, signInVerify } = useAuth();

  const [stage, setStage] = useState<Stage>({ kind: 'email' });
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [resentToast, setResentToast] = useState(false);

  async function handleStart(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setErrorKey(null);
    setSubmitting(true);
    try {
      await signInStart(email.trim());
      setStage({ kind: 'verify', email: email.trim() });
      setCode('');
    } catch {
      setErrorKey('auth_network_error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (stage.kind !== 'verify' || code.length !== 6) return;
    setErrorKey(null);
    setSubmitting(true);
    try {
      await signInVerify(stage.email, { code });
      navigate(lang === 'en' ? '/' : `/${lang}`, { replace: true });
    } catch (err) {
      if (err instanceof LunedocApiError && err.status === 400) {
        setErrorKey('auth_invalid_code');
      } else {
        setErrorKey('auth_network_error');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (stage.kind !== 'verify') return;
    setErrorKey(null);
    setResentToast(false);
    try {
      await signInStart(stage.email);
      setResentToast(true);
      window.setTimeout(() => setResentToast(false), 4000);
    } catch {
      setErrorKey('auth_network_error');
    }
  }

  function handleUseDifferentEmail() {
    setStage({ kind: 'email' });
    setCode('');
    setErrorKey(null);
    setResentToast(false);
  }

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
        <div className="pl-card" style={{ width: '100%', maxWidth: 420, padding: 32 }}>
          {stage.kind === 'email' ? (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 8px', letterSpacing: '-0.01em' }}>
                {t('auth_signin_title')}
              </h1>
              <p style={{ color: 'var(--fg-muted)', fontSize: 14, margin: '0 0 24px' }}>
                {t('auth_signin_sub')}
              </p>
              <form onSubmit={handleStart}>
                <label className="pl-label" htmlFor="signin-email">{t('auth_email')}</label>
                <input
                  id="signin-email"
                  className="pl-input"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ marginBottom: 16 }}
                />
                <button
                  type="submit"
                  className="pl-btn pl-btn-primary pl-btn-lg"
                  disabled={submitting || !email.trim()}
                  style={{ width: '100%' }}
                >
                  {t('auth_continue')}
                </button>
              </form>
              {import.meta.env.DEV && (
                <p
                  style={{
                    marginTop: 16,
                    fontSize: 12,
                    color: 'var(--fg-subtle)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {t('auth_dev_email_hint')}
                </p>
              )}
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 8px', letterSpacing: '-0.01em' }}>
                {t('auth_signin_title')}
              </h1>
              <p style={{ color: 'var(--fg-muted)', fontSize: 14, margin: '0 0 24px' }}>
                {t('auth_verify_sub_prefix')}{' '}
                <strong style={{ color: 'var(--fg)' }}>{stage.email}</strong>
              </p>
              <form onSubmit={handleVerify}>
                <label className="pl-label" htmlFor="signin-code">{t('auth_code')}</label>
                <input
                  id="signin-code"
                  className="pl-input"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  style={{
                    marginBottom: 16,
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.3em',
                    textAlign: 'center',
                    fontSize: 18,
                  }}
                />
                <button
                  type="submit"
                  className="pl-btn pl-btn-primary pl-btn-lg"
                  disabled={submitting || code.length !== 6}
                  style={{ width: '100%' }}
                >
                  {t('auth_verify')}
                </button>
              </form>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 13 }}>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={submitting}
                  className="pl-btn pl-btn-quiet pl-btn-sm"
                  style={{ padding: '6px 8px' }}
                >
                  {t('auth_resend_code')}
                </button>
                <button
                  type="button"
                  onClick={handleUseDifferentEmail}
                  disabled={submitting}
                  className="pl-btn pl-btn-quiet pl-btn-sm"
                  style={{ padding: '6px 8px' }}
                >
                  {t('auth_use_different_email')}
                </button>
              </div>
              {resentToast && (
                <p style={{ marginTop: 12, fontSize: 13, color: 'var(--fg-muted)' }}>
                  {t('auth_resent')}
                </p>
              )}
              {import.meta.env.DEV && (
                <p
                  style={{
                    marginTop: 16,
                    fontSize: 12,
                    color: 'var(--fg-subtle)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {t('auth_dev_email_hint')}
                </p>
              )}
            </>
          )}
          {errorKey && (
            <p
              role="alert"
              style={{
                marginTop: 16,
                fontSize: 13,
                color: '#b91c1c',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 8,
                padding: '8px 12px',
              }}
            >
              {t(errorKey)}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
