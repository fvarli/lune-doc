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
  type ResultFile,
  type UploadedFile,
} from '@lunedoc/api';
import { useI18n, type Lang } from '@lunedoc/i18n';
import { DropZone, Icon, PdfThumb } from '@lunedoc/ui';
import { btnGhost } from '../_internal/btnGhost';
import { QuotaBanner, isQuotaExceededError } from '../shared/quota';

const MAX_BYTES = 50 * 1024 * 1024;

type UiMode = 'range' | 'pages';
type Stage = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

interface SplitRange {
  from: number;
  to: number;
}

interface SplitToolPageProps {
  lang: Lang;
}

export function SplitToolPage({ lang }: SplitToolPageProps) {
  const { t } = useI18n(lang);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [mode, setMode] = useState<UiMode>('range');
  const [ranges, setRanges] = useState<SplitRange[]>([{ from: 1, to: 1 }]);
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState<QuotaExceededError | null>(null);
  const [outputs, setOutputs] = useState<ResultFile[]>([]);

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

  function updateRange(idx: number, patch: Partial<SplitRange>) {
    setRanges((prev) => {
      const next = [...prev];
      const cur = next[idx];
      if (!cur) return prev;
      next[idx] = { ...cur, ...patch };
      return next;
    });
  }

  function removeRange(idx: number) {
    setRanges((prev) => prev.filter((_, i) => i !== idx));
  }

  function addRange() {
    setRanges((prev) => {
      const last = prev[prev.length - 1];
      const start = last ? Math.max(last.to + 1, 1) : 1;
      return [...prev, { from: start, to: start }];
    });
  }

  async function runSplit() {
    if (!file) return;
    const token = getClientToken(file);
    if (!token) {
      setError('error_session_expired');
      setStage('error');
      return;
    }

    // Build the API request body and validate locally for fast feedback.
    let body;
    if (mode === 'range') {
      if (ranges.length === 0) {
        setError('error_invalid_ranges');
        setStage('error');
        return;
      }
      for (const r of ranges) {
        if (
          !Number.isInteger(r.from) ||
          !Number.isInteger(r.to) ||
          r.from < 1 ||
          r.to < 1 ||
          r.from > r.to
        ) {
          setError('error_invalid_ranges');
          setStage('error');
          return;
        }
      }
      body = {
        file_id: file.file_id,
        mode: 'ranges' as const,
        ranges: ranges.map((r) => [r.from, r.to]),
      };
    } else {
      body = { file_id: file.file_id, mode: 'per_page' as const };
    }

    setError(null);
    setQuotaError(null);
    setStage('processing');
    const client = getClient();
    try {
      const job = await client.createSplitJob(body, token);
      const done = await client.pollJob(job.job_id, token);
      const result = await client.getJobResult(done.job_id, token);
      // Persist tokens for each output so download works through the same client.
      for (const out of result.outputs) saveToken(out.file_id, token);
      setOutputs(result.outputs);
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

  async function downloadOutput(out: ResultFile) {
    if (!file) return;
    const token = getClientToken(file);
    if (!token) {
      setError('error_session_expired');
      setStage('error');
      return;
    }
    try {
      const blob = await getClient().downloadFile(out.file_id, token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = out.name;
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
    outputs.forEach((o) => forgetToken(o.file_id));
    setFile(null);
    setOutputs([]);
    setRanges([{ from: 1, to: 1 }]);
    setMode('range');
    setError(null);
    setQuotaError(null);
    setStage('idle');
  }

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
                background: 'oklch(0.96 0.04 252)',
                color: 'oklch(0.45 0.16 252)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="split" size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                }}
              >
                {t('split_title')}
              </h1>
              <p
                style={{
                  marginTop: 4,
                  fontSize: 15,
                  color: 'var(--fg-muted)',
                }}
              >
                {t('split_sub')}
              </p>
            </div>
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
                testId="split-dropzone"
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
          ) : stage === 'done' ? (
            <div className="pl-card" style={{ padding: 24 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 14,
                }}
              >
                {outputs.length} {t('split_outputs') || 'outputs'}
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {outputs.map((out) => (
                  <div
                    key={out.file_id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto',
                      gap: 12,
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: 10,
                      background: 'var(--bg-elev)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <PdfThumb w={32} h={42} />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {out.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--fg-subtle)',
                          fontFamily: 'var(--font-mono)',
                          marginTop: 2,
                        }}
                      >
                        {(out.size / 1024).toFixed(0)} KB
                      </div>
                    </div>
                    <button
                      className="pl-btn pl-btn-primary pl-btn-sm"
                      onClick={() => downloadOutput(out)}
                    >
                      <Icon name="download" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div
                role="tablist"
                style={{
                  display: 'inline-flex',
                  padding: 4,
                  gap: 4,
                  background: 'var(--bg-elev)',
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  marginBottom: 18,
                }}
              >
                {(
                  [
                    ['range', t('split_mode_range')],
                    ['pages', t('split_mode_pages')],
                  ] as const
                ).map(([k, label]) => {
                  const active = mode === k;
                  return (
                    <button
                      key={k}
                      onClick={() => setMode(k)}
                      style={{
                        border: 0,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        background: active ? 'var(--accent-soft)' : 'transparent',
                        color: active ? 'var(--accent)' : 'var(--fg-muted)',
                        fontSize: 13,
                        fontWeight: 600,
                        height: 32,
                        padding: '0 14px',
                        borderRadius: 8,
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="pl-card" style={{ padding: 24 }}>
                <div
                  style={{
                    display: 'flex',
                    gap: 14,
                    alignItems: 'center',
                    marginBottom: 20,
                    paddingBottom: 16,
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  <PdfThumb w={36} h={48} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {file.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--fg-subtle)',
                        fontFamily: 'var(--font-mono)',
                        marginTop: 2,
                      }}
                    >
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </div>
                  </div>
                </div>

                {mode === 'range' ? (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {ranges.map((r, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'auto auto 1fr auto',
                          gap: 12,
                          alignItems: 'center',
                          padding: 12,
                          borderRadius: 10,
                          background: 'var(--bg-muted)',
                          border: '1px solid var(--line)',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--fg-subtle)',
                            fontWeight: 600,
                          }}
                        >
                          {t('split_range')} {i + 1}
                        </span>
                        <div
                          style={{
                            display: 'flex',
                            gap: 6,
                            alignItems: 'center',
                          }}
                        >
                          <input
                            className="pl-input"
                            type="number"
                            min={1}
                            value={r.from}
                            onChange={(e) =>
                              updateRange(i, {
                                from: Number(e.target.value) || 1,
                              })
                            }
                            style={{
                              width: 56,
                              height: 32,
                              textAlign: 'center',
                              fontFamily: 'var(--font-mono)',
                            }}
                          />
                          <span style={{ color: 'var(--fg-subtle)' }}>→</span>
                          <input
                            className="pl-input"
                            type="number"
                            min={1}
                            value={r.to}
                            onChange={(e) =>
                              updateRange(i, {
                                to: Number(e.target.value) || 1,
                              })
                            }
                            style={{
                              width: 56,
                              height: 32,
                              textAlign: 'center',
                              fontFamily: 'var(--font-mono)',
                            }}
                          />
                        </div>
                        <div />
                        <button
                          onClick={() => removeRange(i)}
                          style={btnGhost(ranges.length === 1)}
                          disabled={ranges.length === 1}
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addRange}
                      style={{
                        marginTop: 4,
                        padding: '10px',
                        borderRadius: 10,
                        background: 'transparent',
                        border: '1.5px dashed var(--line-strong)',
                        color: 'var(--fg-muted)',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                    >
                      <Icon name="plus" size={14} /> {t('add_range')}
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: 20,
                      borderRadius: 10,
                      background: 'var(--bg-muted)',
                      border: '1px solid var(--line)',
                      fontSize: 13,
                      color: 'var(--fg-muted)',
                      lineHeight: 1.5,
                    }}
                  >
                    {t('split_mode_pages')} —{' '}
                    {t('split_per_page_hint') ||
                      'every page becomes its own PDF.'}
                  </div>
                )}
              </div>
            </>
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
                onClick={runSplit}
                disabled={
                  !file ||
                  stage === 'uploading' ||
                  stage === 'processing'
                }
              >
                <Icon name="split" size={16} /> {t('split_extract_cta')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getClientToken(f: UploadedFile): string | null {
  // The owner_token returned at upload is also persisted by saveToken;
  // for this widget the in-memory copy is authoritative and survives
  // until startOver().
  return f.owner_token;
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
  if (e instanceof LunedocApiError && e.status === 410)
    return 'error_result_expired';
  return 'error_job_failed';
}
