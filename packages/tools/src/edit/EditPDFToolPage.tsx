import { useEffect, useState } from 'react';
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
  type EditOperation,
  type UploadedFile,
} from '@lunedoc/api';
import { useI18n, type Lang } from '@lunedoc/i18n';
import { DropZone, Icon } from '@lunedoc/ui';
import type { IconName } from '@lunedoc/ui';

const MAX_BYTES = 50 * 1024 * 1024;

type EditMode = 'text_overlay' | 'highlight' | 'redact' | 'shape_rect';
type Stage = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

interface EditTool {
  id: EditMode;
  label: string;
  icon: IconName;
}

interface EditedResult {
  file_id: string;
  name: string;
  size: number;
}

interface EditPDFToolPageProps {
  lang: Lang;
}

// Default placement when the user adds an operation. Coordinates are
// normalized 0–1 fractions of the target page. The mock UI didn't have
// real click-to-position; users adjust via the page input.
const DEFAULTS: Record<EditMode, { x: number; y: number; width: number; height: number }> = {
  text_overlay: { x: 0.1, y: 0.1, width: 0.5, height: 0.05 },
  highlight: { x: 0.1, y: 0.2, width: 0.5, height: 0.04 },
  redact: { x: 0.1, y: 0.3, width: 0.5, height: 0.05 },
  shape_rect: { x: 0.1, y: 0.4, width: 0.3, height: 0.1 },
};

export function EditPDFToolPage({ lang }: EditPDFToolPageProps) {
  const { t } = useI18n(lang);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [tool, setTool] = useState<EditMode>('text_overlay');
  const [text, setText] = useState<string>(t('edit_text_default'));
  const [color, setColor] = useState<string>('#ffe066');
  const [page, setPage] = useState<number>(1);
  const [operations, setOperations] = useState<EditOperation[]>([]);
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EditedResult | null>(null);

  useEffect(() => {
    setText(t('edit_text_default'));
  }, [lang, t]);

  const tools: EditTool[] = [
    { id: 'text_overlay', label: t('edit_tool_text'),      icon: 'edit' },
    { id: 'highlight',    label: t('edit_tool_highlight'), icon: 'watermark' },
    { id: 'redact',       label: t('edit_tool_redact'),    icon: 'trash' },
    { id: 'shape_rect',   label: t('edit_tool_shape'),     icon: 'grid' },
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

  function addOperation() {
    setError(null);
    const d = DEFAULTS[tool];
    if (tool === 'text_overlay') {
      const trimmed = text.trim();
      if (!trimmed) {
        setError('error_invalid_ranges');
        setStage('error');
        return;
      }
      setOperations((prev) => [
        ...prev,
        { type: 'text_overlay', page, x: d.x, y: d.y, width: d.width, text: trimmed },
      ]);
    } else if (tool === 'highlight') {
      setOperations((prev) => [
        ...prev,
        {
          type: 'highlight',
          page,
          x: d.x,
          y: d.y,
          width: d.width,
          height: d.height,
          color,
        },
      ]);
    } else if (tool === 'redact') {
      setOperations((prev) => [
        ...prev,
        { type: 'redact', page, x: d.x, y: d.y, width: d.width, height: d.height },
      ]);
    } else {
      setOperations((prev) => [
        ...prev,
        {
          type: 'shape_rect',
          page,
          x: d.x,
          y: d.y,
          width: d.width,
          height: d.height,
          color,
        },
      ]);
    }
  }

  function removeOperation(idx: number) {
    setOperations((prev) => prev.filter((_, i) => i !== idx));
  }

  async function runEdit() {
    if (!file || operations.length === 0) return;
    setError(null);
    setStage('processing');
    const client = getClient();
    const token = file.owner_token;
    try {
      const job = await client.createEditJob(
        { file_id: file.file_id, operations },
        token,
      );
      const done = await client.pollJob(job.job_id, token);
      const r = await client.getJobResult(done.job_id, token);
      const out = r.outputs[0];
      if (!out) throw new Error('edit produced no output');
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
    setOperations([]);
    setText(t('edit_text_default'));
    setTool('text_overlay');
    setColor('#ffe066');
    setPage(1);
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
                background: 'oklch(0.96 0.04 290)',
                color: 'oklch(0.45 0.18 290)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="edit" size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                }}
              >
                {t('edit_title')}
              </h1>
              <p
                style={{
                  marginTop: 4,
                  fontSize: 15,
                  color: 'var(--fg-muted)',
                }}
              >
                {t('edit_sub')}
              </p>
            </div>
          </div>

          {/* Honesty notice — overlay/redact editor, not full content reflow. */}
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
            <strong>{t('edit_honesty_title') || 'Overlay & redact editor'}</strong>:{' '}
            {t('edit_honesty_body') ||
              'this adds visible text, highlights, redactions, or shapes on top of pages. It does not reflow or rewrite the original text content. Redactions truly remove the underlying text from the file.'}
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
                testId="edit-dropzone"
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

              {/* Tool picker */}
              <div style={{ marginBottom: 18 }}>
                <label className="pl-label">{t('edit_tools')}</label>
                <div
                  role="radiogroup"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 8,
                  }}
                >
                  {tools.map((tl) => {
                    const active = tool === tl.id;
                    return (
                      <button
                        key={tl.id}
                        onClick={() => setTool(tl.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '10px 12px',
                          borderRadius: 10,
                          background: active ? 'var(--accent-soft)' : 'var(--bg-elev)',
                          border:
                            '1px solid ' +
                            (active
                              ? 'color-mix(in oklch, var(--accent) 35%, var(--line))'
                              : 'var(--line)'),
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontSize: 13,
                          fontWeight: 500,
                          color: active ? 'var(--accent)' : 'var(--fg)',
                          textAlign: 'left',
                        }}
                      >
                        <Icon name={tl.icon} size={14} />
                        {tl.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Per-tool inputs */}
              <div style={{ display: 'grid', gap: 12, marginBottom: 18 }}>
                {tool === 'text_overlay' && (
                  <div>
                    <label className="pl-label">{t('edit_text_label') || 'Text'}</label>
                    <input
                      className="pl-input"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={t('edit_text_default')}
                    />
                  </div>
                )}
                {(tool === 'highlight' || tool === 'shape_rect') && (
                  <div>
                    <label className="pl-label">{t('edit_color') || 'Color'}</label>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      style={{
                        width: 64,
                        height: 32,
                        border: '1px solid var(--line)',
                        borderRadius: 6,
                        background: 'transparent',
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                )}

                <div>
                  <label className="pl-label">{t('edit_page_label') || 'Page'}</label>
                  <input
                    className="pl-input"
                    type="number"
                    min={1}
                    value={page}
                    onChange={(e) => setPage(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    style={{ width: 80, fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>

              <button
                className="pl-btn pl-btn-ghost"
                onClick={addOperation}
                disabled={stage === 'uploading' || stage === 'processing'}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <Icon name="plus" size={14} />
                {t('edit_add_operation') || 'Add to operations'}
              </button>

              {/* Operations list */}
              {operations.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <label className="pl-label">
                    {t('edit_operations_label') || 'Operations'}{' '}
                    <span
                      style={{
                        color: 'var(--fg-subtle)',
                        fontFamily: 'var(--font-mono)',
                        marginLeft: 6,
                        fontWeight: 400,
                      }}
                    >
                      {operations.length}
                    </span>
                  </label>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {operations.map((op, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'auto 1fr auto',
                          gap: 10,
                          alignItems: 'center',
                          padding: '8px 12px',
                          borderRadius: 8,
                          background: 'var(--bg-muted)',
                          border: '1px solid var(--line)',
                          fontSize: 12,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        <span
                          style={{
                            color: 'var(--fg-subtle)',
                            fontWeight: 600,
                          }}
                        >
                          {i + 1}
                        </span>
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {op.type} · p{op.page}
                          {op.type === 'text_overlay' && ` · "${op.text}"`}
                          {(op.type === 'highlight' || op.type === 'shape_rect') &&
                            op.color &&
                            ` · ${op.color}`}
                        </span>
                        <button
                          onClick={() => removeOperation(i)}
                          style={{
                            width: 24,
                            height: 24,
                            border: 0,
                            background: 'transparent',
                            cursor: 'pointer',
                            color: 'var(--fg-muted)',
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          <Icon name="trash" size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
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
                onClick={runEdit}
                disabled={
                  !file ||
                  operations.length === 0 ||
                  stage === 'uploading' ||
                  stage === 'processing'
                }
              >
                <Icon name="edit" size={16} /> {t('edit_apply') || 'Apply edits'}
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
