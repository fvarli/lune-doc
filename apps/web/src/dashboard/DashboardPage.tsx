import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer, Header, type Lang } from '@lunedoc/ui';
import { useI18n } from '@lunedoc/i18n';
import {
  getClient,
  type MeFileItem,
  type MeFilesResponse,
  type MeJobItem,
  type MeJobsResponse,
  type MeUsageResponse,
} from '@lunedoc/api';
import { useAuth } from '../auth/AuthContext';
import { AuthHeaderControls } from '../auth/AuthHeaderControls';

interface DashboardPageProps {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

function localized(path: string, lang: Lang): string {
  return lang === 'en' ? path : `/${lang}${path}`;
}

type Translator = (key: string) => string;

const PAGE_LIMIT = 20;

const SECTION_TITLE: CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  letterSpacing: '-0.01em',
  margin: '0 0 12px',
};

const STAT_LABEL: CSSProperties = {
  fontSize: 12,
  color: 'var(--fg-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  margin: 0,
};

const STAT_VALUE: CSSProperties = {
  fontSize: 28,
  fontWeight: 600,
  margin: '4px 0 0',
  color: 'var(--fg)',
};

export function DashboardPage({ lang, setLang }: DashboardPageProps) {
  const { t } = useI18n(lang);
  const { isAuthenticated, isLoading: authLoading, user, withAccessToken } =
    useAuth();
  const navigate = useNavigate();

  // Auth gate: bounce to localized /signin once boot finishes.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(localized('/signin', lang), { replace: true });
    }
  }, [authLoading, isAuthenticated, lang, navigate]);

  const [usage, setUsage] = useState<MeUsageResponse | null>(null);
  const [jobs, setJobs] = useState<MeJobsResponse | null>(null);
  const [files, setFiles] = useState<MeFilesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    setErrored(false);
    void withAccessToken(async (token) => {
      const client = getClient();
      const [u, j, f] = await Promise.all([
        client.getMeUsage(token),
        client.getMeJobs(token, { limit: PAGE_LIMIT, offset: 0 }),
        client.getMeFiles(token, { limit: PAGE_LIMIT, offset: 0 }),
      ]);
      if (cancelled) return;
      setUsage(u);
      setJobs(j);
      setFiles(f);
    })
      .catch(() => {
        if (!cancelled) setErrored(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, withAccessToken, reloadTick]);

  if (authLoading) {
    return (
      <Shell lang={lang} setLang={setLang}>
        <p style={{ color: 'var(--fg-muted)' }}>{t('dashboard_loading')}</p>
      </Shell>
    );
  }
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Shell lang={lang} setLang={setLang}>
      <header style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            margin: '0 0 8px',
          }}
        >
          {t('dashboard_title')}
        </h1>
        <p style={{ color: 'var(--fg-muted)', margin: 0 }}>
          {t('dashboard_subtitle')}
          {user?.email ? ` · ${user.email}` : ''}
        </p>
      </header>

      {errored && (
        <div
          role="alert"
          className="pl-card"
          style={{
            padding: 16,
            marginBottom: 24,
            borderColor: '#fecaca',
            background: '#fef2f2',
            color: '#b91c1c',
          }}
        >
          <p style={{ margin: '0 0 12px', fontSize: 14 }}>
            {t('dashboard_error')}
          </p>
          <button
            type="button"
            className="pl-btn pl-btn-quiet pl-btn-sm"
            onClick={() => setReloadTick((n) => n + 1)}
          >
            {t('dashboard_retry')}
          </button>
        </div>
      )}

      <section style={{ marginBottom: 40 }}>
        <h2 style={SECTION_TITLE}>{t('dashboard_usage')}</h2>
        {loading && !usage ? (
          <p style={{ color: 'var(--fg-muted)' }}>{t('dashboard_loading')}</p>
        ) : usage ? (
          <UsageSummary usage={usage} t={t} />
        ) : null}
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={SECTION_TITLE}>{t('dashboard_recent_jobs')}</h2>
        {loading && !jobs ? (
          <p style={{ color: 'var(--fg-muted)' }}>{t('dashboard_loading')}</p>
        ) : jobs && jobs.items.length > 0 ? (
          <JobsList items={jobs.items} t={t} lang={lang} />
        ) : jobs ? (
          <EmptyCard text={t('dashboard_no_jobs')} />
        ) : null}
      </section>

      <section style={{ marginBottom: 64 }}>
        <h2 style={SECTION_TITLE}>{t('dashboard_recent_files')}</h2>
        {loading && !files ? (
          <p style={{ color: 'var(--fg-muted)' }}>{t('dashboard_loading')}</p>
        ) : files && files.items.length > 0 ? (
          <FilesList items={files.items} t={t} lang={lang} />
        ) : files ? (
          <EmptyCard text={t('dashboard_no_files')} />
        ) : null}
      </section>
    </Shell>
  );
}

function Shell({
  lang,
  setLang,
  children,
}: {
  lang: Lang;
  setLang: (lang: Lang) => void;
  children: ReactNode;
}) {
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
      <Header
        lang={lang}
        setLang={setLang}
        rightSlot={<AuthHeaderControls lang={lang} />}
      />
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 1080,
          margin: '0 auto',
          padding: '3rem 1.5rem',
        }}
      >
        {children}
      </main>
      <Footer lang={lang} />
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div
      className="pl-card"
      style={{
        padding: 24,
        textAlign: 'center',
        color: 'var(--fg-muted)',
        fontSize: 14,
      }}
    >
      {text}
    </div>
  );
}

function UsageSummary({
  usage,
  t,
}: {
  usage: MeUsageResponse;
  t: Translator;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12,
      }}
    >
      <Stat label={t('dashboard_tier')} value={usage.tier} />
      <Stat
        label={t('dashboard_total_files')}
        value={String(usage.total_files)}
      />
      <Stat
        label={t('dashboard_total_jobs')}
        value={String(usage.total_jobs)}
      />
      <Stat
        label={t('dashboard_ocr_pages_today')}
        value={String(usage.ocr_pages_used_today)}
      />
      <ChipGroup
        label={t('dashboard_jobs_by_status')}
        counts={usage.jobs_by_status}
      />
      <ChipGroup
        label={t('dashboard_jobs_by_tool')}
        counts={usage.jobs_by_tool}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="pl-card" style={{ padding: 16 }}>
      <p style={STAT_LABEL}>{label}</p>
      <p style={STAT_VALUE}>{value}</p>
    </div>
  );
}

function ChipGroup({
  label,
  counts,
}: {
  label: string;
  counts: Record<string, number>;
}) {
  const entries = Object.entries(counts);
  return (
    <div className="pl-card" style={{ padding: 16 }}>
      <p style={STAT_LABEL}>{label}</p>
      {entries.length === 0 ? (
        <p style={{ ...STAT_VALUE, fontSize: 16, color: 'var(--fg-muted)' }}>
          —
        </p>
      ) : (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginTop: 8,
          }}
        >
          {entries.map(([key, count]) => (
            <span
              key={key}
              style={{
                fontSize: 12,
                padding: '4px 8px',
                borderRadius: 999,
                background: 'var(--accent-bg, rgba(170,59,255,0.1))',
                color: 'var(--fg)',
                border: '1px solid var(--border, rgba(0,0,0,0.08))',
                whiteSpace: 'nowrap',
              }}
            >
              {key} · {count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function JobsList({
  items,
  t,
  lang,
}: {
  items: MeJobItem[];
  t: Translator;
  lang: Lang;
}) {
  return (
    <ul
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {items.map((job) => (
        <li key={job.job_id} className="pl-card" style={{ padding: 16 }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              alignItems: 'baseline',
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {t('dashboard_tool')}: {job.tool}
            </span>
            <StatusBadge status={job.status} />
            <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
              {t('dashboard_created')}:{' '}
              <DateText iso={job.created_at} lang={lang} />
            </span>
            <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
              {t('dashboard_updated')}:{' '}
              <DateText iso={job.updated_at} lang={lang} />
            </span>
          </div>
          {job.error && (
            <p
              role="alert"
              style={{
                margin: '8px 0 0',
                fontSize: 13,
                color: '#b91c1c',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 6,
                padding: '6px 10px',
              }}
            >
              {job.error}
            </p>
          )}
          {job.result_meta && (
            <details style={{ marginTop: 8 }}>
              <summary
                style={{
                  fontSize: 12,
                  color: 'var(--fg-muted)',
                  cursor: 'pointer',
                }}
              >
                {t('dashboard_result_meta')}
              </summary>
              <pre
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  background: 'var(--code-bg, rgba(0,0,0,0.04))',
                  padding: 10,
                  borderRadius: 6,
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {JSON.stringify(job.result_meta, null, 2)}
              </pre>
            </details>
          )}
        </li>
      ))}
    </ul>
  );
}

function StatusBadge({ status }: { status: MeJobItem['status'] }) {
  const palette: Record<MeJobItem['status'], { bg: string; fg: string }> = {
    queued: { bg: 'rgba(100, 116, 139, 0.12)', fg: '#475569' },
    running: { bg: 'rgba(59, 130, 246, 0.14)', fg: '#1d4ed8' },
    done: { bg: 'rgba(34, 197, 94, 0.14)', fg: '#15803d' },
    failed: { bg: 'rgba(239, 68, 68, 0.14)', fg: '#b91c1c' },
  };
  const c = palette[status];
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: '2px 8px',
        borderRadius: 999,
        background: c.bg,
        color: c.fg,
      }}
    >
      {status}
    </span>
  );
}

function FilesList({
  items,
  t,
  lang,
}: {
  items: MeFileItem[];
  t: Translator;
  lang: Lang;
}) {
  return (
    <ul
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {items.map((file) => (
        <li key={file.file_id} className="pl-card" style={{ padding: 16 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 6,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={file.name}
          >
            {file.name}
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              fontSize: 12,
              color: 'var(--fg-muted)',
            }}
          >
            <span>
              {t('dashboard_file_type')}: {file.mime}
            </span>
            <span>
              {t('dashboard_file_size')}: {formatSize(file.size)}
            </span>
            <span>
              {t('dashboard_created')}:{' '}
              <DateText iso={file.created_at} lang={lang} />
            </span>
            <span>
              {t('dashboard_expires')}:{' '}
              <DateText iso={file.expires_at} lang={lang} />
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function DateText({ iso, lang }: { iso: string; lang: Lang }) {
  const locale = lang === 'tr' ? 'tr-TR' : lang === 'es' ? 'es-ES' : 'en-US';
  let formatted = iso;
  try {
    formatted = new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    // Falls back to the raw ISO string if Date / Intl rejects the input.
  }
  return <>{formatted}</>;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
