import { useState } from 'react';
import {
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
  type OcrJobRequest,
  type OcrLang,
  type OcrMode,
  type UploadedFile,
} from '@lunedoc/api';
import { useI18n, type Lang } from '@lunedoc/i18n';
import { DropZone, Icon } from '@lunedoc/ui';

const MAX_BYTES = 50 * 1024 * 1024;

type UiLang = 'auto' | 'en' | 'tr' | 'es';
type Stage = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

interface OcrResultMeta {
  file_id: string;
  name: string;
  size: number;
  mime: string;
  preview?: string;
}

interface OCRToolPageProps {
  lang: Lang;
}

const UI_TO_TESSERACT: Record<Exclude<UiLang, 'auto'>, OcrLang> = {
  en: 'eng',
  tr: 'tur',
  es: 'spa',
};

function resolveLang(uiLang: UiLang, ambient: Lang): OcrLang {
  if (uiLang === 'auto') {
    return UI_TO_TESSERACT[ambient];
  }
  return UI_TO_TESSERACT[uiLang];
}

export function OCRToolPage({ lang }: OCRToolPageProps) {
  const { t } = useI18n(lang);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [uiLang, setUiLang] = useState<UiLang>('auto');
  const [mode, setMode] = useState<OcrMode>('extract');
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OcrResultMeta | null>(null);

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

  async function runOcr() {
    if (!file) return;
    setError(null);
    setStage('processing');
    const client = getClient();
    const token = file.owner_token;

    const body: OcrJobRequest = {
      file_id: file.file_id,
      mode,
      lang: resolveLang(uiLang, lang),
    };

    try {
      const job = await client.createOcrJob(body, token);
      const done = await client.pollJob(job.job_id, token);
      const r = await client.getJobResult(done.job_id, token);
      const out = r.outputs[0];
      if (!out) throw new Error('ocr produced no output');
      saveToken(out.file_id, token);

      let preview: string | undefined;
      if (mode === 'extract') {
        try {
          const blob = await client.downloadFile(out.file_id, token);
          const text = await blob.text();
          preview = text.slice(0, 1000);
        } catch {
          preview = undefined;
        }
      }

      setResult({
        file_id: out.file_id,
        name: out.name,
        size: out.size,
        mime: out.mime,
        preview,
      });
      setStage('done');
    } catch (e) {
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
    setUiLang('auto');
    setMode('extract');
    setStage('idle');
  }

  const langOptions: { id: UiLang; label: string }[] = [
    { id: 'auto', label: t('ocr_lang_auto') },
    { id: 'en', label: t('ocr_lang_en') },
    { id: 'tr', label: t('ocr_lang_tr') },
    { id: 'es', label: t('ocr_lang_es') },
  ];

  const modeOptions: { id: OcrMode; label: string; hint: string }[] = [
    {
      id: 'extract',
      label: t('ocr_mode_extract'),
      hint: t('ocr_mode_extract_hint'),
    },
    {
      id: 'searchable',
      label: t('ocr_mode_searchable'),
      hint: t('ocr_mode_searchable_hint'),
    },
  ];

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
                background: 'oklch(0.96 0.04 290)',
                color: 'oklch(0.45 0.18 290)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="ocr" size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                }}
              >
                {t('ocr_title')}
              </h1>
              <p style={{ marginTop: 4, fontSize: 15, color: 'var(--fg-muted)' }}>
                {t('ocr_sub')}
              </p>
            </div>
          </div>

          {/* Honesty notice — best-effort + page cap. */}
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
            <strong>{t('ocr_honesty_title') || 'OCR is best-effort'}</strong>:{' '}
            {t('ocr_honesty_body') ||
              'clean scans of typed body text work well. Tables, math, and handwriting are unreliable. Free tier is capped at 20 pages per file.'}
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
                accept="application/pdf"
                maxBytes={MAX_BYTES}
                multiple={false}
                onFiles={handleFiles}
                onReject={handleReject}
                disabled={stage === 'uploading'}
                testId="ocr-dropzone"
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
          ) : stage === 'done' && result ? (
            <div className="pl-card" style={{ padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                {result.name}{' '}
                <span
                  style={{
                    color: 'var(--fg-subtle)',
                    fontFamily: 'var(--font-mono)',
                    marginLeft: 6,
                    fontWeight: 400,
                  }}
                >
                  {(result.size / 1024).toFixed(0)} KB
                </span>
              </div>
              {result.preview !== undefined && (
                <pre
                  style={{
                    maxHeight: 240,
                    overflow: 'auto',
                    margin: 0,
                    padding: 12,
                    borderRadius: 8,
                    background: 'var(--bg-muted)',
                    border: '1px solid var(--line)',
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--fg-muted)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {result.preview ||
                    (t('ocr_no_text_recognized') || '(no text recognized)')}
                </pre>
              )}
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

              {/* Lang picker */}
              <div style={{ marginBottom: 18 }}>
                <label className="pl-label">{t('ocr_lang')}</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {langOptions.map((o) => {
                    const active = uiLang === o.id;
                    return (
                      <button
                        key={o.id}
                        onClick={() => setUiLang(o.id)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 8,
                          border:
                            '1px solid ' + (active ? 'var(--accent)' : 'var(--line)'),
                          background: active ? 'var(--accent)' : 'var(--bg-elev)',
                          color: active ? 'var(--accent-fg)' : 'var(--fg)',
                          fontSize: 13,
                          fontWeight: 600,
                          fontFamily: 'var(--font-mono)',
                          cursor: 'pointer',
                        }}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: 'var(--fg-muted)',
                  }}
                >
                  {t('ocr_lang_hint')}
                </div>
              </div>

              {/* Mode picker */}
              <div>
                <label className="pl-label">{t('ocr_mode')}</label>
                <div style={{ display: 'grid', gap: 8 }}>
                  {modeOptions.map((o) => {
                    const active = mode === o.id;
                    return (
                      <button
                        key={o.id}
                        onClick={() => setMode(o.id)}
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
            {stage === 'done' && result && (
              <button
                className="pl-btn pl-btn-primary pl-btn-lg"
                onClick={downloadResult}
              >
                <Icon name="download" size={16} />
                {t('state_done')} — {(result.size / 1024).toFixed(0)} KB
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
                onClick={runOcr}
                disabled={
                  !file || stage === 'uploading' || stage === 'processing'
                }
              >
                <Icon name="ocr" size={16} /> {t('ocr_cta')}
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
  if (e instanceof ValidationError) {
    if (e.detail && /capped at/i.test(e.detail)) return 'error_ocr_page_cap';
    return 'error_invalid_ranges';
  }
  if (e instanceof JobFailedError) return 'error_job_failed';
  if (e instanceof JobTimeoutError) return 'error_job_timeout';
  if (e instanceof BackendUnreachableError) return 'error_backend_unreachable';
  if (e instanceof NotFoundError) return 'error_file_expired';
  if (e instanceof LunedocApiError && e.status === 410) return 'error_result_expired';
  return 'error_job_failed';
}
