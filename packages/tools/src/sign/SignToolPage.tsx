import { useEffect, useRef, useState, type ChangeEvent } from 'react';
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
  type SignJobRequest,
  type UploadedFile,
} from '@lunedoc/api';
import { useI18n, type Lang } from '@lunedoc/i18n';
import { DropZone, Icon, type IconName } from '@lunedoc/ui';

const MAX_BYTES = 50 * 1024 * 1024;
const MAX_SIGNATURE_IMAGE_BYTES = 1_500_000; // 1.5 MB raw → ~2 MB base64

type Method = 'type' | 'draw' | 'upload';
type Stage = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

interface MethodTab {
  id: Method;
  label: string;
  icon: IconName;
}

interface SignedResult {
  file_id: string;
  name: string;
  size: number;
}

interface SignToolPageProps {
  lang: Lang;
}

// Default placement for the visible signature: roughly bottom-left of
// page 1, 30% of page width. Matches the prototype mock's overlay
// position (left: 8%, top: 62%, width ~30%).
const DEFAULT_PAGE = 1;
const DEFAULT_X = 0.08;
const DEFAULT_Y = 0.62;
const DEFAULT_WIDTH = 0.3;

export function SignToolPage({ lang }: SignToolPageProps) {
  const { t } = useI18n(lang);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [method, setMethod] = useState<Method>('type');
  const [name, setName] = useState<string>(t('sign_typed_default'));
  const [signatureImageData, setSignatureImageData] = useState<string | null>(null);
  const [signatureImageName, setSignatureImageName] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SignedResult | null>(null);

  const sigImageInputRef = useRef<HTMLInputElement>(null);

  // Re-seed default name if locale changes mid-session.
  useEffect(() => {
    setName(t('sign_typed_default'));
  }, [lang, t]);

  const methodTabs: MethodTab[] = [
    { id: 'type', label: t('sign_method_type'), icon: 'sign' },
    { id: 'draw', label: t('sign_method_draw'), icon: 'edit' },
    { id: 'upload', label: t('sign_method_upload'), icon: 'upload' },
  ];

  async function handlePdfFiles(picked: File[]) {
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

  function handlePdfReject(rejected: File[]) {
    if (rejected.length > 0) {
      setError('error_upload_too_large');
      setStage('error');
    }
  }

  function handleSignatureImagePick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\/(?:png|jpeg|jpg)$/i.test(f.type)) {
      setError('error_upload_unsupported');
      setStage('error');
      return;
    }
    if (f.size > MAX_SIGNATURE_IMAGE_BYTES) {
      setError('error_upload_too_large');
      setStage('error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r !== 'string') return;
      setSignatureImageData(r);
      setSignatureImageName(f.name);
      setError(null);
      setStage('idle');
    };
    reader.readAsDataURL(f);
  }

  async function runSign() {
    if (!file) return;
    setError(null);
    setStage('processing');
    const client = getClient();
    const token = file.owner_token;

    let body: SignJobRequest;
    if (method === 'type') {
      const trimmed = name.trim();
      if (!trimmed) {
        setError('error_invalid_ranges');
        setStage('error');
        return;
      }
      body = {
        file_id: file.file_id,
        mode: 'text',
        page: DEFAULT_PAGE,
        x: DEFAULT_X,
        y: DEFAULT_Y,
        width: DEFAULT_WIDTH,
        text: trimmed,
      };
    } else if (method === 'upload') {
      if (!signatureImageData) {
        setError('error_invalid_ranges');
        setStage('error');
        return;
      }
      body = {
        file_id: file.file_id,
        mode: 'image',
        page: DEFAULT_PAGE,
        x: DEFAULT_X,
        y: DEFAULT_Y,
        width: DEFAULT_WIDTH,
        image_data: signatureImageData,
      };
    } else {
      // Draw mode is currently a Phase 2 placeholder.
      setError('error_invalid_ranges');
      setStage('error');
      return;
    }

    try {
      const job = await client.createSignJob(body, token);
      const done = await client.pollJob(job.job_id, token);
      const r = await client.getJobResult(done.job_id, token);
      const out = r.outputs[0];
      if (!out) throw new Error('sign produced no output');
      saveToken(out.file_id, token);
      setResult({ file_id: out.file_id, name: out.name, size: out.size });
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
    setName(t('sign_typed_default'));
    setMethod('type');
    setSignatureImageData(null);
    setSignatureImageName(null);
    setStage('idle');
  }

  const cantSubmit =
    !file ||
    stage === 'uploading' ||
    stage === 'processing' ||
    method === 'draw' ||
    (method === 'type' && !name.trim()) ||
    (method === 'upload' && !signatureImageData);

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
                background: 'oklch(0.96 0.04 30)',
                color: 'oklch(0.45 0.16 30)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="sign" size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                }}
              >
                {t('sign_title')}
              </h1>
              <p
                style={{
                  marginTop: 4,
                  fontSize: 15,
                  color: 'var(--fg-muted)',
                }}
              >
                {t('sign_sub')}
              </p>
            </div>
          </div>

          {/* Honesty notice — visible signature, NOT cryptographic. */}
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
            <strong>{t('sign_honesty_title') || 'Visible signature'}</strong>:{' '}
            {t('sign_honesty_body') ||
              'this stamps a visible signature on the page. It is not a cryptographic e-signature and has no inherent legal binding. For binding e-signatures, use a certified provider.'}
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
                onFiles={handlePdfFiles}
                onReject={handlePdfReject}
                disabled={stage === 'uploading'}
                testId="sign-dropzone"
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

              {/* Method tabs */}
              <div style={{ marginBottom: 18 }}>
                <div
                  role="tablist"
                  style={{
                    display: 'inline-flex',
                    padding: 4,
                    gap: 4,
                    background: 'var(--bg-elev)',
                    border: '1px solid var(--line)',
                    borderRadius: 10,
                  }}
                >
                  {methodTabs.map((m) => {
                    const active = method === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setMethod(m.id)}
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
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Icon name={m.icon} size={13} />
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Method-specific input */}
              {method === 'type' && (
                <div>
                  <label className="pl-label">{t('sign_typed_label')}</label>
                  <input
                    className="pl-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('sign_typed_placeholder')}
                  />
                  <div
                    style={{
                      marginTop: 16,
                      padding: 24,
                      borderRadius: 10,
                      background: 'var(--bg-muted)',
                      border: '1px solid var(--line)',
                      textAlign: 'center',
                      fontSize: 32,
                      fontWeight: 600,
                      fontStyle: 'italic',
                      color: 'oklch(0.30 0.06 250)',
                    }}
                  >
                    {name || '—'}
                  </div>
                </div>
              )}

              {method === 'draw' && (
                <div
                  style={{
                    padding: 24,
                    borderRadius: 10,
                    background: 'var(--bg-muted)',
                    border: '1px dashed var(--line)',
                    fontSize: 13,
                    color: 'var(--fg-muted)',
                    lineHeight: 1.5,
                  }}
                >
                  {t('sign_draw_hint')} —{' '}
                  <em>
                    {t('sign_draw_phase2_note') ||
                      'drawing is coming next. For now, switch to Type or Upload.'}
                  </em>
                </div>
              )}

              {method === 'upload' && (
                <div>
                  <label className="pl-label">{t('sign_upload_hint')}</label>
                  <button
                    onClick={() => sigImageInputRef.current?.click()}
                    className="pl-btn pl-btn-ghost"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Icon name="upload" size={14} />
                    {t('sign_upload_browse')}
                  </button>
                  <input
                    ref={sigImageInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleSignatureImagePick}
                    style={{ display: 'none' }}
                  />
                  {signatureImageData && signatureImageName && (
                    <div
                      style={{
                        marginTop: 14,
                        padding: 14,
                        borderRadius: 10,
                        background: 'var(--bg-muted)',
                        border: '1px solid var(--line)',
                        display: 'flex',
                        gap: 12,
                        alignItems: 'center',
                      }}
                    >
                      <img
                        src={signatureImageData}
                        alt={signatureImageName}
                        style={{
                          maxWidth: 120,
                          maxHeight: 60,
                          objectFit: 'contain',
                          background: 'white',
                          padding: 4,
                          borderRadius: 4,
                          border: '1px solid var(--line)',
                        }}
                      />
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--fg-muted)',
                          fontFamily: 'var(--font-mono)',
                          flex: 1,
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {signatureImageName}
                      </div>
                    </div>
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
                onClick={runSign}
                disabled={cantSubmit}
              >
                <Icon name="sign" size={16} /> {t('sign_cta')}
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
