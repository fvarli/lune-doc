import type { JSX } from 'react';
import { QuotaExceededError, type QuotaName } from '@lunedoc/api';
import { createTranslator, type Lang } from '@lunedoc/i18n';

const QUOTA_KEY: Record<QuotaName, string> = {
  ocr_pages_daily: 'quota_ocr_pages_daily',
  jobs_per_hour: 'quota_jobs_per_hour',
  concurrent_jobs: 'quota_concurrent_jobs',
};

const LOCALE_BY_LANG: Record<Lang, string> = {
  en: 'en-US',
  tr: 'tr-TR',
  es: 'es-ES',
};

export function isQuotaExceededError(e: unknown): e is QuotaExceededError {
  return e instanceof QuotaExceededError;
}

export function quotaMessage(
  error: QuotaExceededError,
  t: (key: string) => string,
): string {
  const base = t(QUOTA_KEY[error.quota] ?? 'quota_generic');
  if (error.quota === 'ocr_pages_daily' || error.quota === 'concurrent_jobs') {
    return `${base} (${error.used}/${error.limit})`;
  }
  return base;
}

function formatResetAt(iso: string, lang: Lang): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    return new Intl.DateTimeFormat(LOCALE_BY_LANG[lang], {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
    }).format(d);
  } catch {
    return null;
  }
}

interface QuotaBannerProps {
  error: QuotaExceededError;
  lang: Lang;
}

export function QuotaBanner({ error, lang }: QuotaBannerProps): JSX.Element {
  const t = createTranslator(lang);
  const reset = formatResetAt(error.resetAt, lang);
  return (
    <div
      role="alert"
      style={{
        marginBottom: 16,
        padding: '14px 16px',
        borderRadius: 10,
        background: 'oklch(0.96 0.04 30)',
        color: 'oklch(0.40 0.18 30)',
        border: '1px solid oklch(0.85 0.1 30)',
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{t('quota_title')}</div>
      <div>{quotaMessage(error, t)}</div>
      {reset && (
        <div style={{ marginTop: 4, fontSize: 12, opacity: 0.85 }}>
          {t('quota_resets_at')} {reset}
        </div>
      )}
      <div
        style={{
          marginTop: 10,
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          disabled
          aria-describedby="quota-upgrade-hint"
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid oklch(0.75 0.1 30)',
            background: 'transparent',
            color: 'oklch(0.40 0.18 30)',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'not-allowed',
            opacity: 0.7,
          }}
        >
          {t('quota_upgrade_cta')}
        </button>
        <span
          id="quota-upgrade-hint"
          style={{ fontSize: 12, opacity: 0.75 }}
        >
          {t('quota_upgrade_soon')}
        </span>
      </div>
    </div>
  );
}
