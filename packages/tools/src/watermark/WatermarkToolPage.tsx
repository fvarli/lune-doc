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
  type UploadedFile,
  type WatermarkPosition,
} from '@lunedoc/api';
import { useI18n, type Lang } from '@lunedoc/i18n';
import { DropZone, Icon } from '@lunedoc/ui';

const MAX_BYTES = 50 * 1024 * 1024;

type PositionId = 'tl' | 'tr' | 'center' | 'bl' | 'br';

interface Position {
  id: PositionId;
  label: string;
  x: string;
  y: string;
}

type Stage = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

interface WatermarkResult {
  file_id: string;
  name: string;
  size: number;
}

interface WatermarkToolPageProps {
  lang: Lang;
}

const POSITION_TO_API: Record<PositionId, WatermarkPosition> = {
  tl: 'top-left',
  tr: 'top-right',
  center: 'center',
  bl: 'bottom-left',
  br: 'bottom-right',
};

export function WatermarkToolPage({ lang }: WatermarkToolPageProps) {
  const { t } = useI18n(lang);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [text, setText] = useState<string>(t('watermark_text_default'));
  const [position, setPosition] = useState<PositionId>('center');
  const [opacity, setOpacity] = useState<number>(30); // percent
  const [rotation, setRotation] = useState<number>(45); // UI degrees (clockwise)
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WatermarkResult | null>(null);

  // Re-seed default text if locale changes mid-session.
  useEffect(() => {
    setText(t('watermark_text_default'));
  }, [lang, t]);

  const positions: Position[] = [
    { id: 'tl',     label: t('watermark_pos_tl'),     x: '12%', y: '12%' },
    { id: 'tr',     label: t('watermark_pos_tr'),     x: '88%', y: '12%' },
    { id: 'center', label: t('watermark_pos_center'), x: '50%', y: '50%' },
    { id: 'bl',     label: t('watermark_pos_bl'),     x: '12%', y: '88%' },
    { id: 'br',     label: t('watermark_pos_br'),     x: '88%', y: '88%' },
  ];
  const pos = positions.find((p) => p.id === position) ?? positions[2]!;
  const rotations = [0, 30, 45];

  const cells: { id: PositionId | null; row: number; col: number }[] = [
    { id: 'tl', row: 1, col: 1 },
    { id: null, row: 1, col: 2 },
    { id: 'tr', row: 1, col: 3 },
    { id: null, row: 2, col: 1 },
    { id: 'center', row: 2, col: 2 },
    { id: null, row: 2, col: 3 },
    { id: 'bl', row: 3, col: 1 },
    { id: null, row: 3, col: 2 },
    { id: 'br', row: 3, col: 3 },
  ];

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

  async function runWatermark() {
    if (!file) return;
    setError(null);
    setStage('processing');
    const client = getClient();
    const token = file.owner_token;
    try {
      const job = await client.createWatermarkJob(
        {
          file_id: file.file_id,
          text,
          position: POSITION_TO_API[position],
          opacity: opacity / 100,
          // Preview uses CSS `rotate(-Xdeg)` for positive UI values;
          // mirror that on the server by sending the negative.
          rotation: -rotation,
        },
        token,
      );
      const done = await client.pollJob(job.job_id, token);
      const r = await client.getJobResult(done.job_id, token);
      const out = r.outputs[0];
      if (!out) throw new Error('watermark produced no output');
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
    setText(t('watermark_text_default'));
    setPosition('center');
    setOpacity(30);
    setRotation(45);
    setStage('idle');
  }

  return (
    <div style={{ background: 'var(--bg-muted)', minHeight: '100%' }}>
      <div style={{ padding: '32px 28px 64px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
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
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 24 }}>
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
              <Icon name="watermark" size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em' }}>
                {t('watermark_title')}
              </h1>
              <p style={{ marginTop: 4, fontSize: 15, color: 'var(--fg-muted)' }}>
                {t('watermark_sub')}
              </p>
            </div>
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
                testId="watermark-dropzone"
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
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 420px)',
                gap: 18,
                alignItems: 'start',
              }}
            >
              {/* Controls */}
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

                {/* Text */}
                <div style={{ marginBottom: 20 }}>
                  <label className="pl-label">{t('watermark_text_label')}</label>
                  <input
                    className="pl-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t('watermark_text_placeholder')}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  />
                </div>

                {/* Position grid */}
                <div style={{ marginBottom: 20 }}>
                  <label className="pl-label">{t('watermark_position')}</label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gridTemplateRows: 'repeat(3, 56px)',
                      gap: 6,
                      background: 'var(--bg-muted)',
                      border: '1px solid var(--line)',
                      borderRadius: 10,
                      padding: 6,
                    }}
                  >
                    {cells.map((cell, i) => {
                      if (!cell.id) {
                        return (
                          <div key={i} style={{ gridRow: cell.row, gridColumn: cell.col }} />
                        );
                      }
                      const active = position === cell.id;
                      const p = positions.find((x) => x.id === cell.id);
                      return (
                        <button
                          key={cell.id}
                          onClick={() => setPosition(cell.id as PositionId)}
                          title={p?.label}
                          style={{
                            gridRow: cell.row,
                            gridColumn: cell.col,
                            border:
                              '1px solid ' + (active ? 'var(--accent)' : 'var(--line)'),
                            background: active ? 'var(--accent-soft)' : 'var(--bg-elev)',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            display: 'grid',
                            placeItems: 'center',
                            boxShadow: active ? '0 0 0 3px var(--accent-ring)' : 'none',
                            transition: 'all .15s ease',
                          }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 999,
                              background: active ? 'var(--accent)' : 'var(--fg-subtle)',
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      color: 'var(--fg-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {pos.label}
                  </div>
                </div>

                {/* Opacity slider */}
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: 8,
                    }}
                  >
                    <label className="pl-label" style={{ marginBottom: 0 }}>
                      {t('watermark_opacity')}
                    </label>
                    <span
                      style={{
                        fontSize: 12,
                        color: 'var(--fg-muted)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {opacity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={opacity}
                    onChange={(e) => setOpacity(parseInt(e.target.value, 10))}
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
                  />
                </div>

                {/* Rotation segmented */}
                <div style={{ marginBottom: 4 }}>
                  <label className="pl-label">{t('watermark_rotation')}</label>
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
                    {rotations.map((deg) => {
                      const active = rotation === deg;
                      return (
                        <button
                          key={deg}
                          onClick={() => setRotation(deg)}
                          style={{
                            border: 0,
                            cursor: 'pointer',
                            fontFamily: 'var(--font-mono)',
                            background: active ? 'var(--accent-soft)' : 'transparent',
                            color: active ? 'var(--accent)' : 'var(--fg-muted)',
                            fontSize: 13,
                            fontWeight: 600,
                            height: 32,
                            padding: '0 14px',
                            borderRadius: 8,
                          }}
                        >
                          {deg}°
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="pl-card" style={{ padding: 20, position: 'sticky', top: 24 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--fg-subtle)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontFamily: 'var(--font-mono)',
                    marginBottom: 12,
                  }}
                >
                  {t('watermark_preview')}
                </div>
                <WatermarkPreviewPage
                  text={text}
                  opacity={opacity}
                  rotation={rotation}
                  pos={pos}
                />
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 11,
                    color: 'var(--fg-subtle)',
                    fontFamily: 'var(--font-mono)',
                    textAlign: 'center',
                  }}
                >
                  {t('watermark_preview_caption')}
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              gap: 10,
              marginTop: 18,
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
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
                onClick={runWatermark}
                disabled={
                  !file ||
                  !text.trim() ||
                  stage === 'uploading' ||
                  stage === 'processing'
                }
              >
                <Icon name="watermark" size={16} /> {t('watermark_cta')}
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

// ── Preview ─────────────────────────────────────────────────────
// Co-located with WatermarkToolPage — only used by it.

interface PreviewLine {
  w: string;
  h: number;
  mt: number;
  bold?: boolean;
  dim?: boolean;
}

interface WatermarkPreviewPageProps {
  text: string;
  opacity: number;
  rotation: number;
  pos: { x: string; y: string };
}

function WatermarkPreviewPage({ text, opacity, rotation, pos }: WatermarkPreviewPageProps) {
  const lines: PreviewLine[] = [
    { w: '62%', h: 14, mt: 0,  bold: true },
    { w: '38%', h: 8,  mt: 14, dim: true },
    { w: '94%', h: 6,  mt: 22 },
    { w: '88%', h: 6,  mt: 8 },
    { w: '92%', h: 6,  mt: 8 },
    { w: '70%', h: 6,  mt: 8 },
    { w: '94%', h: 6,  mt: 16 },
    { w: '86%', h: 6,  mt: 8 },
    { w: '90%', h: 6,  mt: 8 },
    { w: '44%', h: 6,  mt: 8 },
  ];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 1.414',
        background: 'white',
        borderRadius: 6,
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--line)',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', inset: '10% 8% 10% 8%' }}>
        {lines.map((l, i) => (
          <div
            key={i}
            style={{
              width: l.w,
              height: l.h,
              marginTop: l.mt,
              background: l.dim
                ? 'oklch(0.85 0 0)'
                : l.bold
                  ? 'oklch(0.25 0 0)'
                  : 'oklch(0.78 0 0)',
              borderRadius: 2,
            }}
          />
        ))}
        <div
          style={{
            marginTop: 18,
            width: '100%',
            aspectRatio: '16 / 9',
            background:
              'repeating-linear-gradient(45deg, oklch(0.92 0 0) 0 6px, oklch(0.96 0 0) 6px 12px)',
            border: '1px solid oklch(0.85 0 0)',
            borderRadius: 3,
          }}
        />
        <div
          style={{
            width: '78%',
            height: 6,
            marginTop: 14,
            background: 'oklch(0.78 0 0)',
            borderRadius: 2,
          }}
        />
        <div
          style={{
            width: '60%',
            height: 6,
            marginTop: 8,
            background: 'oklch(0.78 0 0)',
            borderRadius: 2,
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          left: pos.x,
          top: pos.y,
          transform: `translate(-50%, -50%) rotate(-${rotation}deg)`,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <div
          style={{
            fontSize: 'min(13cqw, 64px)',
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: 'oklch(0.35 0.02 280)',
            opacity: opacity / 100,
            textTransform: 'uppercase',
            fontFamily: 'var(--font-mono)',
            textShadow: '0 1px 0 rgba(255,255,255,0.4)',
          }}
        >
          {text || ' '}
        </div>
      </div>
    </div>
  );
}
