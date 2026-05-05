import { useEffect, useMemo, useState } from 'react';
import {
  ALLOWED_CONVERT_PAIRS,
  BackendUnreachableError,
  JobFailedError,
  JobTimeoutError,
  LunedocApiError,
  NotFoundError,
  TooLargeError,
  UnsupportedMediaTypeError,
  ValidationError,
  forgetToken,
  getClient,
  rememberFile,
  saveToken,
  type ConvertFormat,
  type ResultFile,
  type UploadedFile,
} from '@lunedoc/api';
import { useI18n, type Lang } from '@lunedoc/i18n';
import { DropZone, Icon } from '@lunedoc/ui';

const MAX_BYTES = 50 * 1024 * 1024;

type Stage = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

interface ConvertToolPageProps {
  lang: Lang;
}

const ALL_FORMATS: readonly ConvertFormat[] = [
  'PDF',
  'JPG',
  'PNG',
  'DOCX',
  'XLSX',
  'PPTX',
];

// File extensions accepted by the server's MIME whitelist + DropZone.
const ACCEPT_TYPES =
  'application/pdf,image/png,image/jpeg,' +
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document,' +
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,' +
  'application/vnd.openxmlformats-officedocument.presentationml.presentation';

const MIME_TO_FORMAT: Record<string, ConvertFormat> = {
  'application/pdf': 'PDF',
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
};

function allowedTargets(from: ConvertFormat): ConvertFormat[] {
  return ALLOWED_CONVERT_PAIRS.filter((p) => p[0] === from).map((p) => p[1]);
}

export function ConvertToolPage({ lang }: ConvertToolPageProps) {
  const { t } = useI18n(lang);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [from, setFrom] = useState<ConvertFormat>('PDF');
  const [to, setTo] = useState<ConvertFormat>('JPG');
  const [imageDpi, setImageDpi] = useState<number>(150);
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<ResultFile[]>([]);

  // When the user uploads, auto-detect from_format from the MIME and
  // pick the first valid target as the default `to`.
  useEffect(() => {
    if (!file) return;
    const detected = MIME_TO_FORMAT[file.mime];
    if (!detected) return;
    setFrom(detected);
    const targets = allowedTargets(detected);
    if (targets.length > 0 && !targets.includes(to)) {
      setTo(targets[0]!);
    }
  }, [file]); // eslint-disable-line react-hooks/exhaustive-deps

  const validTargets = useMemo(() => allowedTargets(from), [from]);
  const pairValid = validTargets.includes(to);
  const showDpi = from === 'PDF' && (to === 'JPG' || to === 'PNG');

  async function handleFiles(picked: File[]) {
    const raw = picked[0];
    if (!raw) return;
    setError(null);
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

  async function runConvert() {
    if (!file || !pairValid) return;
    setError(null);
    setStage('processing');
    const client = getClient();
    const token = file.owner_token;
    try {
      const job = await client.createConvertJob(
        {
          file_id: file.file_id,
          from_format: from,
          to_format: to,
          image_dpi: showDpi ? imageDpi : undefined,
        },
        token,
      );
      const done = await client.pollJob(job.job_id, token);
      const result = await client.getJobResult(done.job_id, token);
      for (const out of result.outputs) saveToken(out.file_id, token);
      setOutputs(result.outputs);
      setStage('done');
    } catch (e) {
      setError(jobErrorKey(e));
      setStage('error');
    }
  }

  async function downloadOne(out: ResultFile) {
    if (!file) return;
    try {
      const blob = await getClient().downloadFile(out.file_id, file.owner_token);
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
    setError(null);
    setFrom('PDF');
    setTo('JPG');
    setImageDpi(150);
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
                background: 'oklch(0.96 0.04 220)',
                color: 'oklch(0.45 0.16 220)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="convert" size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                }}
              >
                {t('convert_title') || 'Convert PDF'}
              </h1>
              <p
                style={{
                  marginTop: 4,
                  fontSize: 15,
                  color: 'var(--fg-muted)',
                }}
              >
                {t('convert_sub') ||
                  'Convert between PDF and images / Office formats. Lossy where the source format demands it.'}
              </p>
            </div>
          </div>

          {/* Honesty notice. */}
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
            <strong>{t('convert_honesty_title') || 'Conversion fidelity'}</strong>:{' '}
            {t('convert_honesty_body') ||
              'image directions are lossless. PDF → DOCX/PPTX preserves text but layout often shifts. PDF → XLSX is not supported because spreadsheets cannot be reliably reconstructed from PDF.'}
          </div>

          {error && (
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
          )}

          {!file ? (
            <div className="pl-card" style={{ padding: 24 }}>
              <DropZone
                accept={ACCEPT_TYPES}
                maxBytes={MAX_BYTES}
                multiple={false}
                onFiles={handleFiles}
                onReject={handleReject}
                disabled={stage === 'uploading'}
                testId="convert-dropzone"
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
                style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}
              >
                {outputs.length} {t('convert_outputs') || 'output(s)'}
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {outputs.map((out) => (
                  <div
                    key={out.file_id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: 12,
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: 10,
                      background: 'var(--bg-elev)',
                      border: '1px solid var(--line)',
                    }}
                  >
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
                      onClick={() => downloadOne(out)}
                    >
                      <Icon name="download" size={14} />
                    </button>
                  </div>
                ))}
              </div>
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
                {file.name} · {(file.size / (1024 * 1024)).toFixed(1)} MB ·{' '}
                {from}
              </div>

              <div style={{ display: 'grid', gap: 18 }}>
                <div>
                  <label className="pl-label">{t('convert_to') || 'Convert to'}</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {ALL_FORMATS.map((fmt) => {
                      const enabled = validTargets.includes(fmt);
                      const active = enabled && to === fmt;
                      return (
                        <button
                          key={fmt}
                          onClick={() => enabled && setTo(fmt)}
                          disabled={!enabled}
                          title={
                            enabled
                              ? undefined
                              : (t('convert_pair_unsupported') ||
                                  'Not supported from {from}').replace(
                                  '{from}',
                                  from,
                                )
                          }
                          style={{
                            padding: '10px 14px',
                            borderRadius: 8,
                            border:
                              '1px solid ' +
                              (active ? 'var(--accent)' : 'var(--line)'),
                            background: active
                              ? 'var(--accent)'
                              : enabled
                                ? 'var(--bg-elev)'
                                : 'var(--bg-muted)',
                            color: active
                              ? 'var(--accent-fg)'
                              : enabled
                                ? 'var(--fg)'
                                : 'var(--fg-subtle)',
                            fontSize: 13,
                            fontWeight: 600,
                            fontFamily: 'var(--font-mono)',
                            cursor: enabled ? 'pointer' : 'not-allowed',
                            opacity: enabled ? 1 : 0.4,
                          }}
                        >
                          {fmt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {showDpi && (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        marginBottom: 8,
                      }}
                    >
                      <label className="pl-label" style={{ marginBottom: 0 }}>
                        {t('convert_image_dpi') || 'Image DPI'}
                      </label>
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--fg-muted)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {imageDpi} dpi
                      </span>
                    </div>
                    <input
                      type="range"
                      min={72}
                      max={600}
                      step={1}
                      value={imageDpi}
                      onChange={(e) =>
                        setImageDpi(parseInt(e.target.value, 10) || 150)
                      }
                      style={{ width: '100%', accentColor: 'var(--accent)' }}
                    />
                  </div>
                )}

                {/* OCR toggle — Phase 3 placeholder, disabled. */}
                <div>
                  <label
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'center',
                      fontSize: 13,
                      color: 'var(--fg-muted)',
                      cursor: 'not-allowed',
                      userSelect: 'none',
                    }}
                    title={
                      t('convert_ocr_phase3') ||
                      'OCR will land in Phase 3. Currently rejected by the API.'
                    }
                  >
                    <input type="checkbox" disabled />
                    {t('convert_opt_ocr')} —{' '}
                    <em>
                      {t('convert_ocr_phase3_short') || 'Phase 3'}
                    </em>
                  </label>
                </div>
              </div>
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
                onClick={runConvert}
                disabled={
                  !file ||
                  !pairValid ||
                  stage === 'uploading' ||
                  stage === 'processing'
                }
              >
                <Icon name="convert" size={16} /> {t('convert_cta') || 'Convert'}
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
