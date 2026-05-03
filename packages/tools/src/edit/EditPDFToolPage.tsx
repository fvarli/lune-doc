import { useEffect, useState, type ReactNode } from 'react';
import { useI18n, type Lang } from '@lunedoc/i18n';
import { Icon, PdfThumb } from '@lunedoc/ui';

type EditMode = 'text' | 'highlight' | 'redact' | 'shape';
type StrokeStyle = 'outline' | 'solid';
type ColorId = 'yellow' | 'pink' | 'cyan' | 'green' | 'black';

interface EditColor {
  id: ColorId;
  swatch: string;
  ink: string;
}

interface EditTool {
  id: EditMode;
  label: string;
  glyph: ReactNode;
}

interface EditPDFToolPageProps {
  lang: Lang;
}

export function EditPDFToolPage({ lang }: EditPDFToolPageProps) {
  const { t } = useI18n(lang);
  const [tool, setTool] = useState<EditMode>('text');
  const [text, setText] = useState<string>(t('edit_text_default'));
  const [color, setColor] = useState<ColorId>('yellow');
  const [strokeStyle, setStrokeStyle] = useState<StrokeStyle>('outline');
  const [page, setPage] = useState<number>(3);
  const totalPages = 7;

  useEffect(() => {
    setText(t('edit_text_default'));
  }, [lang, t]);

  const colors: EditColor[] = [
    { id: 'yellow', swatch: 'oklch(0.92 0.16 95)',  ink: 'oklch(0.30 0.10 95)' },
    { id: 'pink',   swatch: 'oklch(0.85 0.14 350)', ink: 'oklch(0.40 0.16 350)' },
    { id: 'cyan',   swatch: 'oklch(0.86 0.10 220)', ink: 'oklch(0.40 0.14 220)' },
    { id: 'green',  swatch: 'oklch(0.86 0.14 150)', ink: 'oklch(0.36 0.14 150)' },
    { id: 'black',  swatch: 'oklch(0.20 0 0)',      ink: 'oklch(0.20 0 0)' },
  ];
  // Index 0 ('yellow') is structurally guaranteed by the literal above.
  const activeColor = colors.find((c) => c.id === color) ?? colors[0]!;

  const tools: EditTool[] = [
    { id: 'text',      label: t('edit_tool_text'),      glyph: <EditGlyphText /> },
    { id: 'highlight', label: t('edit_tool_highlight'), glyph: <EditGlyphHighlight /> },
    { id: 'redact',    label: t('edit_tool_redact'),    glyph: <EditGlyphRedact /> },
    { id: 'shape',     label: t('edit_tool_shape'),     glyph: <EditGlyphShape /> },
  ];

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
              <Icon name="edit" size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em' }}>{t('edit_title')}</h1>
              <p style={{ marginTop: 4, fontSize: 15, color: 'var(--fg-muted)' }}>{t('edit_sub')}</p>
            </div>
          </div>

          {/* Mock document strip */}
          <div className="pl-card" style={{ padding: '10px 14px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
            <PdfThumb w={32} h={42} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                annual-report.pdf
              </div>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
                2.4 MB · {totalPages} {t('file_pages')}
              </div>
            </div>
            <button
              style={{
                background: 'transparent',
                border: '1px solid var(--line)',
                color: 'var(--fg-muted)',
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Icon name="trash" size={12} />
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 380px) minmax(0, 1fr)',
              gap: 18,
              alignItems: 'start',
            }}
          >
            {/* Controls */}
            <div className="pl-card" style={{ padding: 24, minWidth: 0 }}>
              {/* Tool mode grid */}
              <div style={{ marginBottom: 20 }}>
                <label className="pl-label">{t('edit_tools')}</label>
                <div role="radiogroup" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                  {tools.map((tl) => {
                    const active = tool === tl.id;
                    return (
                      <button
                        key={tl.id}
                        role="radio"
                        aria-checked={active}
                        onClick={() => setTool(tl.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          minWidth: 0,
                          padding: '12px 12px',
                          borderRadius: 10,
                          background: active ? 'var(--accent-soft)' : 'var(--bg-elev)',
                          border: '1px solid ' + (active ? 'color-mix(in oklch, var(--accent) 35%, var(--line))' : 'var(--line)'),
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          textAlign: 'left',
                          boxShadow: active ? '0 0 0 3px var(--accent-ring)' : 'none',
                          transition: 'all .15s ease',
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: active ? 'var(--bg-elev)' : 'var(--bg-muted)',
                            border: '1px solid ' + (active ? 'color-mix(in oklch, var(--accent) 25%, var(--line))' : 'var(--line)'),
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {tl.glyph}
                        </div>
                        <span
                          style={{
                            fontSize: 12.5,
                            fontWeight: 500,
                            color: active ? 'var(--accent)' : 'var(--fg)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {tl.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Text input — only when text tool active */}
              {tool === 'text' && (
                <div style={{ marginBottom: 20 }}>
                  <label className="pl-label">{t('edit_text_label')}</label>
                  <input
                    className="pl-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t('edit_text_placeholder')}
                  />
                </div>
              )}

              {/* Color swatches */}
              <div style={{ marginBottom: 20 }}>
                <label className="pl-label">{t('edit_color')}</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {colors.map((c) => {
                    const active = color === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setColor(c.id)}
                        title={c.id}
                        aria-label={c.id}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 999,
                          background: c.swatch,
                          border:
                            '1px solid ' +
                            (c.id === 'black' ? 'transparent' : 'color-mix(in oklch, ' + c.swatch + ' 70%, black 12%)'),
                          boxShadow: active ? '0 0 0 3px var(--accent-ring), 0 0 0 1.5px var(--accent)' : 'none',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        {active && <Icon name="check" size={14} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stroke style */}
              <div style={{ marginBottom: 20 }}>
                <label className="pl-label">{t('edit_style')}</label>
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
                  {([
                    { id: 'outline', label: t('edit_style_outline') },
                    { id: 'solid',   label: t('edit_style_solid') },
                  ] as const).map((o) => {
                    const active = strokeStyle === o.id;
                    return (
                      <button
                        key={o.id}
                        onClick={() => setStrokeStyle(o.id)}
                        style={{
                          border: 0,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          background: active ? 'var(--accent-soft)' : 'transparent',
                          color: active ? 'var(--accent)' : 'var(--fg-muted)',
                          fontSize: 12.5,
                          fontWeight: 600,
                          height: 32,
                          padding: '0 14px',
                          borderRadius: 8,
                        }}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Page stepper */}
              <div>
                <label className="pl-label">{t('edit_page')}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: 'var(--bg-elev)',
                      border: '1px solid var(--line)',
                      color: page <= 1 ? 'var(--fg-subtle)' : 'var(--fg)',
                      cursor: page <= 1 ? 'not-allowed' : 'pointer',
                      display: 'grid',
                      placeItems: 'center',
                      padding: 0,
                    }}
                  >
                    <Icon name="arrow-left" size={14} />
                  </button>
                  <div
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--fg)',
                    }}
                  >
                    {page} / {totalPages}
                  </div>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: 'var(--bg-elev)',
                      border: '1px solid var(--line)',
                      color: page >= totalPages ? 'var(--fg-subtle)' : 'var(--fg)',
                      cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                      display: 'grid',
                      placeItems: 'center',
                      padding: 0,
                    }}
                  >
                    <Icon name="arrow-right" size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="pl-card" style={{ padding: 20, position: 'sticky', top: 24, minWidth: 0 }}>
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
                {t('edit_preview')}
              </div>
              <EditPDFPreviewPage
                tool={tool}
                text={text}
                color={activeColor}
                strokeStyle={strokeStyle}
                redactLabel={t('edit_redact_label')}
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
                {t('edit_preview_caption')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button className="pl-btn pl-btn-ghost pl-btn-lg">{t('start_over')}</button>
            <button className="pl-btn pl-btn-primary pl-btn-lg">
              <Icon name="edit" size={16} /> {t('edit_cta')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Per-mode tool-button glyphs ─────────────────────────────────

function EditGlyphText() {
  return (
    <span
      style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 14,
        color: 'var(--fg)',
        letterSpacing: '-0.02em',
      }}
    >
      T
    </span>
  );
}
function EditGlyphHighlight() {
  return <span style={{ display: 'inline-block', width: 16, height: 6, background: 'oklch(0.92 0.16 95)', borderRadius: 1 }} />;
}
function EditGlyphRedact() {
  return <span style={{ display: 'inline-block', width: 16, height: 8, background: 'oklch(0.20 0 0)', borderRadius: 1 }} />;
}
function EditGlyphShape() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 14,
        height: 10,
        border: '1.5px solid var(--fg)',
        borderRadius: 2,
        background: 'transparent',
      }}
    />
  );
}

// ── Preview ─────────────────────────────────────────────────────

interface PreviewLine {
  w: string;
  h: number;
  mt: number;
  bold?: boolean;
  dim?: boolean;
}

interface EditPDFPreviewPageProps {
  tool: EditMode;
  text: string;
  color: EditColor;
  strokeStyle: StrokeStyle;
  redactLabel: string;
}

function EditPDFPreviewPage({ tool, text, color, strokeStyle, redactLabel }: EditPDFPreviewPageProps) {
  const lines: PreviewLine[] = [
    { w: '58%', h: 14, mt: 0,  bold: true },
    { w: '34%', h: 8,  mt: 14, dim: true },
    { w: '94%', h: 6,  mt: 22 },
    { w: '88%', h: 6,  mt: 8 },
    { w: '92%', h: 6,  mt: 8 },
    { w: '70%', h: 6,  mt: 8 },
    { w: '94%', h: 6,  mt: 16 },
    { w: '86%', h: 6,  mt: 8 },
    { w: '90%', h: 6,  mt: 8 },
    { w: '44%', h: 6,  mt: 8 },
  ];

  const selectedRing = '0 0 0 2px white, 0 0 0 4px var(--accent)';

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
      {/* Body */}
      <div style={{ position: 'absolute', inset: '9% 9% 9% 9%' }}>
        {lines.map((l, i) => (
          <div
            key={i}
            style={{
              width: l.w,
              height: l.h,
              marginTop: l.mt,
              background: l.dim ? 'oklch(0.85 0 0)' : l.bold ? 'oklch(0.25 0 0)' : 'oklch(0.78 0 0)',
              borderRadius: 2,
            }}
          />
        ))}
      </div>

      {/* 1) Highlight overlay */}
      <div
        style={{
          position: 'absolute',
          left: '9%',
          top: '32%',
          width: '78%',
          height: '2.4%',
          background: tool === 'highlight' ? color.swatch : 'oklch(0.92 0.16 95)',
          opacity: 0.55,
          borderRadius: 2,
          boxShadow: tool === 'highlight' ? selectedRing : 'none',
          pointerEvents: 'none',
        }}
      />

      {/* 2) Redaction block */}
      <div
        style={{
          position: 'absolute',
          left: '32%',
          top: '44%',
          width: '36%',
          height: '3.2%',
          background: 'oklch(0.10 0 0)',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: tool === 'redact' ? selectedRing : 'none',
        }}
      >
        <span
          style={{
            color: 'white',
            fontFamily: 'var(--font-mono)',
            fontSize: 'min(2.2cqw, 9px)',
            fontWeight: 700,
            letterSpacing: '0.16em',
          }}
        >
          {redactLabel}
        </span>
      </div>

      {/* 3) Text box overlay */}
      <div
        style={{
          position: 'absolute',
          right: '9%',
          top: '11%',
          maxWidth: '44%',
          padding: '4px 8px',
          background: 'white',
          border:
            '1.5px ' +
            (strokeStyle === 'outline' ? 'dashed ' : 'solid ') +
            (tool === 'text' ? 'var(--accent)' : color.ink),
          borderRadius: 4,
          boxShadow: tool === 'text' ? '0 0 0 3px var(--accent-ring)' : 'var(--shadow-sm)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'min(2.6cqw, 11px)',
            fontWeight: 600,
            color: tool === 'text' ? color.ink : 'oklch(0.30 0.04 290)',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'block',
          }}
        >
          {text || ' '}
        </span>
      </div>

      {/* 4) Shape rectangle */}
      <div
        style={{
          position: 'absolute',
          left: '12%',
          bottom: '10%',
          width: '42%',
          height: '12%',
          background: strokeStyle === 'solid' ? color.swatch : 'transparent',
          opacity: strokeStyle === 'solid' ? 0.3 : 1,
          border: '2px solid ' + color.ink,
          borderRadius: 4,
          boxShadow: tool === 'shape' ? selectedRing : 'none',
        }}
      />

      {/* Drag handles for the selected element */}
      <PreviewSelectionHandles tool={tool} />
    </div>
  );
}

// ── Selection handles ───────────────────────────────────────────

interface BoxRect {
  left?: string;
  top?: string;
  bottom?: string;
  width: string;
  height: string;
}

interface DragCorner {
  id: 'tl' | 'tr' | 'bl' | 'br';
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

function PreviewSelectionHandles({ tool }: { tool: EditMode }) {
  const boxes: Record<EditMode, BoxRect> = {
    text:      { left: '47%',  top: '11%',    width: '44%',  height: '8%' },
    highlight: { left: '9%',   top: '32%',    width: '78%',  height: '2.4%' },
    redact:    { left: '32%',  top: '44%',    width: '36%',  height: '3.2%' },
    shape:     { left: '12%',  bottom: '10%', width: '42%',  height: '12%' },
  };
  const b = boxes[tool];
  const corners: DragCorner[] = [
    { id: 'tl', top: -4, left: -4 },
    { id: 'tr', top: -4, right: -4 },
    { id: 'bl', bottom: -4, left: -4 },
    { id: 'br', bottom: -4, right: -4 },
  ];
  return (
    <div style={{ position: 'absolute', ...b, pointerEvents: 'none' }}>
      {corners.map((c) => (
        <span
          key={c.id}
          style={{
            position: 'absolute',
            width: 7,
            height: 7,
            borderRadius: 999,
            background: 'var(--accent)',
            boxShadow: '0 0 0 1.5px white',
            top: c.top,
            bottom: c.bottom,
            left: c.left,
            right: c.right,
          }}
        />
      ))}
    </div>
  );
}
