import { useState } from 'react';
import {
  BackendUnreachableError,
  JobFailedError,
  JobTimeoutError,
  LunedocApiError,
  NotFoundError,
  QuotaExceededError,
  TooLargeError,
  UnsupportedMediaTypeError,
  ValidationError,
  forgetToken,
  getClient,
  rememberFile,
  saveToken,
  type CompressLevel,
  type UploadedFile,
} from '@lunedoc/api';
import { useI18n, type Lang } from '@lunedoc/i18n';
import { DropZone, Icon } from '@lunedoc/ui';
import { QuotaBanner, isQuotaExceededError } from '../shared/quota';

const MAX_BYTES = 50 * 1024 * 1024;

type Stage = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

interface CompressedResult {
  file_id: string;
  name: string;
  size: number;
}

interface CompressToolPageProps {
  lang: Lang;
}

interface QualityOption {
  level: CompressLevel;
  label: string;
  hint: string;
}

export function CompressToolPage({ lang }: CompressToolPageProps) {
  const { t } = useI18n(lang);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [level, setLevel] = useState<CompressLevel>('medium');
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState<QuotaExceededError | null>(null);
  const [result, setResult] = useState<CompressedResult | null>(null);

  const options: QualityOption[] = [
    {
      level: 'low',
      label: t('compress_quality_low') || 'Smaller',
      hint:
        t('compress_quality_low_hint') ||
        'Smallest file. Suitable for screen viewing.',
    },
    {
      level: 'medium',
      label: t('compress_quality_med') || 'Balanced',
      hint:
        t('compress_quality_med_hint') ||
        'Good size–quality balance. Recommended for most uses.',
    },
    {
      level: 'high',
      label: t('compress_quality_high') || 'Print-quality',
      hint:
        t('compress_quality_high_hint') ||
        'Largest output, near original quality. Best for print.',
    },
  ];

  async function handleFiles(picked: File[]) {
    const raw = picked[0];
    if (!raw) return;
    setError(null);
    setQuotaError(null);
    setStage('uploading');
    try {
      const uploaded = await getClient().uploadFile(raw);
      saveToken(uploaded.file_id, uploaded.owner_token);
      rememberFile({
        file_id: uploaded.file_id,
        name: uploaded.name,
        mime: uploaded.mime,
        size: uploaded.size,
        expires_at: uploaded.expires_at,
      });
      setFile(uploaded);
      setStage('idle');
    } catch (e) {
      if (isQuotaExceededError(e)) {
        setQuotaError(e);
        setStage('error');
        return;
      }
      setError(uploadErrorKey(e));
      setStage('error');
    }
  }

  function handleReject(rejected: File[]) {
    if (rejected.length > 0) {
      setError('error_upload_too_large');
      setStage('error');
    }
  }

  async function runCompress() {
    if (!file) return;
    setError(null);
    setQuotaError(null);
    setStage('processing');
    const client = getClient();
    const token = file.owner_token;
    try {
      const job = await client.createCompressJob(
        { file_id: file.file_id, level },
        token,
      );
      const done = await client.pollJob(job.job_id, token);
      const r = await client.getJobResult(done.job_id, token);
      const out = r.outputs[0];
      if (!out) throw new Error('compress produced no output');
      saveToken(out.file_id, token);
      setResult({ file_id: out.file_id, name: out.name, size: out.size });
      setStage('done');
    } catch (e) {
      if (isQuotaExceededError(e)) {
        setQuotaError(e);
        setStage('error');
        return;
      }
      setError(jobErrorKey(e));
      setStage('error');
    }
  }

  async function downloadResult() {
    if (!result || !file) return;
    try {
      const blob = await getClient().downloadFile(result.file_id, file.owner_token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(jobErrorKey(e));
      setStage('error');
    }
  }

  function startOver() {
    if (file) forgetToken(file.file_id);
    if (result) forgetToken(result.file_id);
    setFile(null);
    setResult(null);
    setError(null);
    setQuotaError(null);
    setLevel('medium');
    setStage('idle');
  }

  // Savings panel inputs (only meaningful when result is present).
  const inputBytes = file?.size ?? 0;
  const outputBytes = result?.size ?? 0;
  const savedBytes = Math.max(0, inputBytes - outputBytes);
  const savedPercent =
    inputBytes > 0 ? Math.round((savedBytes / inputBytes) * 100) : 0;

  return (
    <div style={{ background: 'var(--bg-muted)', minHeight: '100%' }}>
      <div style={{ padding: '32px 28px 64px' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <a
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: 'var(--fg-muted)',
              textDecoration: 'none',
              marginBottom: 18,
            }}
          >
            <Icon name="arrow-left" size={14} />
            {t('tool_back')}
          </a>
          <div
            style={{
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'oklch(0.96 0.04 200)',
                color: 'oklch(0.45 0.16 200)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="compress" size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                }}
              >
                {t('tool_compress_title')}
              </h1>
              <p
                style={{
                  marginTop: 4,
                  fontSize: 15,
                  color: 'var(--fg-muted)',
                }}
              >
                {t('tool_compress_sub')}
              </p>
            </div>
          </div>

          {/* Honesty notice — size depends on original. */}
          <div
            style={{
              padding: '10px 14px',
              marginBottom: 18,
              borderRadius: 10,
              background: 'oklch(0.97 0.03 80)',
              color: 'oklch(0.40 0.10 80)',
              border: '1px solid oklch(0.88 0.07 80)',
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            <strong>{t('compress_honesty_title') || 'How small depends on the file'}</strong>:{' '}
            {t('compress_honesty_body') ||
              'image-heavy PDFs shrink dramatically; text-heavy ones marginally. If we cannot make it smaller, we keep the original.'}
          </div>

          {quotaError ? (
            <QuotaBanner error={quotaError} lang={lang} />
          ) : (
            error && (
              <div
                role="alert"
                style={{
                  marginBottom: 16,
                  padding: 12,
                  borderRadius: 10,
                  background: 'oklch(0.96 0.04 30)',
                  color: 'oklch(0.40 0.18 30)',
                  border: '1px solid oklch(0.85 0.1 30)',
                  fontSize: 13,
                }}
              >
                {t(error)}
              </div>
            )
          )}

          {!file ? (
            <div className="pl-card" style={{ padding: 24 }}>
              <DropZone
                accept="application/pdf"
                maxBytes={MAX_BYTES}
                multiple={false}
                onFiles={handleFiles}
                onReject={handleReject}
                disabled={stage === 'uploading'}
                testId="compress-dropzone"
              >
                <Icon name="upload" size={20} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {t('upload_title')}
                </div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                  {t('upload_subtitle')}
                </div>
              </DropZone>
            </div>
          ) : (
            <div className="pl-card" style={{ padding: 24 }}>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--fg-subtle)',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: 18,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {file.name} · {(file.size / (1024 * 1024)).toFixed(1)} MB
              </div>

              <label className="pl-label">
                {t('compress_quality_label') || 'Compression level'}
              </label>
              <div style={{ display: 'grid', gap: 8 }}>
                {options.map((o) => {
                  const active = level === o.level;
                  return (
                    <button
                      key={o.level}
                      onClick={() => setLevel(o.level)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr',
                        gap: 12,
                        alignItems: 'flex-start',
                        padding: 14,
                        borderRadius: 10,
                        background: active ? 'var(--accent-soft)' : 'var(--bg-elev)',
                        border:
                          '1px solid ' +
                          (active
                            ? 'color-mix(in oklch, var(--accent) 35%, var(--line))'
                            : 'var(--line)'),
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        textAlign: 'left',
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 999,
                          border:
                            '1.5px solid ' +
                            (active ? 'var(--accent)' : 'var(--line-strong)'),
                          background: 'var(--bg-elev)',
                          display: 'grid',
                          placeItems: 'center',
                          marginTop: 1,
                          flexShrink: 0,
                        }}
                      >
                        {active && (
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 999,
                              background: 'var(--accent)',
                            }}
                          />
                        )}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: active ? 'var(--accent)' : 'var(--fg)',
                            marginBottom: 2,
                          }}
                        >
                          {o.label}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                          {o.hint}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {stage === 'done' && result && (
                <div
                  style={{
                    marginTop: 18,
                    padding: 14,
                    borderRadius: 10,
                    background: 'oklch(0.96 0.05 145)',
                    border: '1px solid oklch(0.85 0.08 145)',
                    color: 'oklch(0.30 0.10 145)',
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  {savedBytes > 0 ? (
                    <>
                      {t('compress_saved') || 'Saved'}{' '}
                      <strong>{(savedBytes / (1024 * 1024)).toFixed(2)} MB</strong>{' '}
                      ({savedPercent}%) — {(inputBytes / (1024 * 1024)).toFixed(2)} MB →{' '}
                      {(outputBytes / (1024 * 1024)).toFixed(2)} MB
                    </>
                  ) : (
                    t('compress_no_savings') ||
                    'Could not make it smaller — keeping the original file.'
                  )}
                </div>
              )}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              gap: 10,
              marginTop: 18,
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
          >
            {stage === 'processing' && (
              <span
                style={{ fontSize: 13, color: 'var(--fg-muted)' }}
                aria-live="polite"
              >
                {t('state_processing')}
              </span>
            )}
            {stage === 'done' && result && (
              <button
                className="pl-btn pl-btn-primary pl-btn-lg"
                onClick={downloadResult}
              >
                <Icon name="download" size={16} />
                {t('state_done')} — {(result.size / (1024 * 1024)).toFixed(1)} MB
              </button>
            )}
            <button
              className="pl-btn pl-btn-ghost pl-btn-lg"
              onClick={startOver}
              disabled={stage === 'uploading' || stage === 'processing'}
            >
              {t('start_over')}
            </button>
            {stage !== 'done' && (
              <button
                className="pl-btn pl-btn-primary pl-btn-lg"
                onClick={runCompress}
                disabled={
                  !file || stage === 'uploading' || stage === 'processing'
                }
              >
                <Icon name="compress" size={16} />{' '}
                {t('compress_cta') || 'Compress'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function uploadErrorKey(e: unknown): string {
  if (e instanceof TooLargeError) return 'error_upload_too_large';
  if (e instanceof UnsupportedMediaTypeError) return 'error_upload_unsupported';
  if (e instanceof BackendUnreachableError) return 'error_backend_unreachable';
  return 'error_network';
}

function jobErrorKey(e: unknown): string {
  if (e instanceof ValidationError) return 'error_invalid_ranges';
  if (e instanceof JobFailedError) return 'error_job_failed';
  if (e instanceof JobTimeoutError) return 'error_job_timeout';
  if (e instanceof BackendUnreachableError) return 'error_backend_unreachable';
  if (e instanceof NotFoundError) return 'error_file_expired';
  if (e instanceof LunedocApiError && e.status === 410) return 'error_result_expired';
  return 'error_job_failed';
}
