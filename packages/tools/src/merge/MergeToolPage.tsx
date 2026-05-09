import { useRef, useState } from 'react';
import {
  BackendUnreachableError,
  JobFailedError,
  JobTimeoutError,
  LunedocApiError,
  NotFoundError,
  QuotaExceededError,
  TooLargeError,
  UnsupportedMediaTypeError,
  forgetToken,
  getClient,
  rememberFile,
  saveToken,
  type UploadedFile,
} from '@lunedoc/api';
import { useI18n, type Lang } from '@lunedoc/i18n';
import { DropZone, Icon, PdfThumb } from '@lunedoc/ui';
import { btnGhost } from '../_internal/btnGhost';
import { QuotaBanner, isQuotaExceededError } from '../shared/quota';

const MAX_BYTES = 50 * 1024 * 1024;

interface MergeToolPageProps {
  lang: Lang;
}

type Stage = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

interface MergedResult {
  file_id: string;
  name: string;
  size: number;
}

export function MergeToolPage({ lang }: MergeToolPageProps) {
  const { t } = useI18n(lang);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState<QuotaExceededError | null>(null);
  const [result, setResult] = useState<MergedResult | null>(null);
  const totalMB = files
    .reduce((s, f) => s + f.size / (1024 * 1024), 0)
    .toFixed(1);

  // Token used for the next upload + the merge job. Set on first upload,
  // reused for every subsequent upload (server validates X-Owner-Token
  // and reuses the same hash).
  const sharedTokenRef = useRef<string | null>(null);

  function move(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= files.length) return;
    const next = [...files];
    const a = next[idx];
    const b = next[j];
    if (!a || !b) return;
    next[idx] = b;
    next[j] = a;
    setFiles(next);
  }

  function remove(file_id: string) {
    forgetToken(file_id);
    setFiles((prev) => prev.filter((f) => f.file_id !== file_id));
  }

  async function handleFiles(picked: File[]) {
    setError(null);
    setQuotaError(null);
    setStage('uploading');
    const client = getClient();
    try {
      for (const raw of picked) {
        const opts = sharedTokenRef.current
          ? { extendToken: sharedTokenRef.current }
          : {};
        const uploaded = await client.uploadFile(raw, opts);
        sharedTokenRef.current = uploaded.owner_token;
        saveToken(uploaded.file_id, uploaded.owner_token);
        rememberFile({
          file_id: uploaded.file_id,
          name: uploaded.name,
          mime: uploaded.mime,
          size: uploaded.size,
          expires_at: uploaded.expires_at,
        });
        setFiles((prev) => [...prev, uploaded]);
      }
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

  async function runMerge() {
    if (files.length < 2 || !sharedTokenRef.current) return;
    setError(null);
    setQuotaError(null);
    setStage('processing');
    const client = getClient();
    const token = sharedTokenRef.current;
    try {
      const job = await client.createMergeJob(
        files.map((f) => f.file_id),
        token,
      );
      const done = await client.pollJob(job.job_id, token);
      const result = await client.getJobResult(done.job_id, token);
      const out = result.outputs[0];
      if (!out) throw new Error('merge produced no output');
      setResult({ file_id: out.file_id, name: out.name, size: out.size });
      saveToken(out.file_id, token);
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
    if (!result || !sharedTokenRef.current) return;
    try {
      const blob = await getClient().downloadFile(
        result.file_id,
        sharedTokenRef.current,
      );
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
    files.forEach((f) => forgetToken(f.file_id));
    if (result) forgetToken(result.file_id);
    setFiles([]);
    setResult(null);
    setError(null);
    setQuotaError(null);
    sharedTokenRef.current = null;
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
              <Icon name="merge" size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                }}
              >
                {t('merge_title')}
              </h1>
              <p
                style={{
                  marginTop: 4,
                  fontSize: 15,
                  color: 'var(--fg-muted)',
                }}
              >
                {t('merge_sub')}
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

          <div className="pl-card" style={{ padding: 24 }}>
            {files.length === 0 ? (
              <DropZone
                accept="application/pdf"
                maxBytes={MAX_BYTES}
                multiple
                onFiles={handleFiles}
                onReject={handleReject}
                disabled={stage === 'uploading' || stage === 'processing'}
                testId="merge-dropzone"
              >
                <Icon name="upload" size={20} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {t('upload_title')}
                </div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                  {t('upload_subtitle')}
                </div>
              </DropZone>
            ) : (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 14,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {t('merge_files')}{' '}
                    <span
                      style={{
                        color: 'var(--fg-subtle)',
                        fontFamily: 'var(--font-mono)',
                        marginLeft: 6,
                      }}
                    >
                      {files.length}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--fg-subtle)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {totalMB} MB {t('merge_total')}
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  {files.map((f, i) => (
                    <div
                      key={f.file_id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto auto 1fr auto auto',
                        gap: 12,
                        alignItems: 'center',
                        padding: 12,
                        borderRadius: 10,
                        background: 'var(--bg-elev)',
                        border: '1px solid var(--line)',
                      }}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 999,
                          background: 'var(--bg-muted)',
                          color: 'var(--fg-subtle)',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 11,
                          fontWeight: 600,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {i + 1}
                      </div>
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
                          {f.name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--fg-subtle)',
                            fontFamily: 'var(--font-mono)',
                            marginTop: 2,
                          }}
                        >
                          {(f.size / (1024 * 1024)).toFixed(1)} MB
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => move(i, -1)}
                          disabled={i === 0}
                          style={btnGhost(i === 0)}
                        >
                          <Icon
                            name="chevron-down"
                            size={12}
                            style={{ transform: 'rotate(180deg)' }}
                          />
                        </button>
                        <button
                          onClick={() => move(i, 1)}
                          disabled={i === files.length - 1}
                          style={btnGhost(i === files.length - 1)}
                        >
                          <Icon name="chevron-down" size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => remove(f.file_id)}
                        style={btnGhost(false)}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <DropZone
                  accept="application/pdf"
                  maxBytes={MAX_BYTES}
                  multiple
                  onFiles={handleFiles}
                  onReject={handleReject}
                  disabled={stage === 'uploading' || stage === 'processing'}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: 'var(--fg-muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Icon name="plus" size={14} /> {t('merge_add')}
                  </span>
                </DropZone>
              </>
            )}
          </div>

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
            {stage !== 'done' && (
              <>
                <button
                  className="pl-btn pl-btn-ghost pl-btn-lg"
                  onClick={startOver}
                  disabled={stage === 'uploading' || stage === 'processing'}
                >
                  {t('start_over')}
                </button>
                <button
                  className="pl-btn pl-btn-primary pl-btn-lg"
                  onClick={runMerge}
                  disabled={
                    files.length < 2 ||
                    stage === 'uploading' ||
                    stage === 'processing'
                  }
                >
                  <Icon name="merge" size={16} />
                  {t('merge_cta').replace('{n}', String(files.length))}
                </button>
              </>
            )}
            {stage === 'done' && (
              <button
                className="pl-btn pl-btn-ghost pl-btn-lg"
                onClick={startOver}
              >
                {t('start_over')}
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
  if (e instanceof NotFoundError) return 'error_session_expired';
  return 'error_network';
}

function jobErrorKey(e: unknown): string {
  if (e instanceof JobFailedError) return 'error_job_failed';
  if (e instanceof JobTimeoutError) return 'error_job_timeout';
  if (e instanceof BackendUnreachableError) return 'error_backend_unreachable';
  if (e instanceof NotFoundError) return 'error_file_expired';
  if (e instanceof LunedocApiError && e.status === 410)
    return 'error_result_expired';
  return 'error_job_failed';
}
