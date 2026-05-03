import { useEffect, useState, type ReactNode } from 'react';
import { useI18n, type Lang } from '@lunedoc/i18n';
import { Icon, PdfThumb, type IconName } from '@lunedoc/ui';

type Method = 'draw' | 'type' | 'upload';
type StyleId = 'signature' | 'classic' | 'modern';
type FieldType = 'signature' | 'initials' | 'date' | 'text';
type ApplyMode = 'current' | 'all';

interface SignStyle {
  id: StyleId;
  label: string;
  font: string;
  weight: number;
  slant: number;
  size: number;
}

interface SignField {
  id: FieldType;
  label: string;
  icon: IconName;
}

interface MethodTab {
  id: Method;
  label: string;
  icon: IconName;
}

interface ApplyOption {
  id: ApplyMode;
  label: string;
}

interface SignToolPageProps {
  lang: Lang;
}

export function SignToolPage({ lang }: SignToolPageProps) {
  const { t } = useI18n(lang);
  const [method, setMethod] = useState<Method>('type');
  const [name, setName] = useState<string>(t('sign_typed_default'));
  const [styleId, setStyleId] = useState<StyleId>('signature');
  const [field, setField] = useState<FieldType>('signature');
  const [apply, setApply] = useState<ApplyMode>('current');

  // Re-seed default name if locale changes mid-session.
  useEffect(() => {
    setName(t('sign_typed_default'));
  }, [lang, t]);

  const today = 'May 02, 2026';
  // String.charAt(0) returns '' for out-of-bounds rather than undefined, so
  // strict noUncheckedIndexedAccess stays happy without explicit guards.
  const initials =
    (name || '')
      .split(/\s+/)
      .filter(Boolean)
      .map((s) => s.charAt(0))
      .slice(0, 3)
      .join('')
      .toUpperCase() || 'MH';

  const styles: SignStyle[] = [
    { id: 'signature', label: t('sign_style_signature'), font: '"Caveat", "Brush Script MT", cursive',                weight: 600, slant: -2, size: 1.0 },
    { id: 'classic',   label: t('sign_style_classic'),   font: '"Cormorant Garamond", "Times New Roman", serif',      weight: 600, slant: -8, size: 1.0 },
    { id: 'modern',    label: t('sign_style_modern'),    font: 'var(--font-mono)',                                    weight: 600, slant: 0,  size: 0.78 },
  ];
  // Index 0 is structurally guaranteed by the literal above.
  const style = styles.find((s) => s.id === styleId) ?? styles[0]!;

  const fields: SignField[] = [
    { id: 'signature', label: t('sign_field_signature'), icon: 'sign' },
    { id: 'initials',  label: t('sign_field_initials'),  icon: 'edit' },
    { id: 'date',      label: t('sign_field_date'),      icon: 'calendar' },
    { id: 'text',      label: t('sign_field_text'),      icon: 'doc' },
  ];

  const methodTabs: MethodTab[] = [
    { id: 'draw',   label: t('sign_method_draw'),   icon: 'edit' },
    { id: 'type',   label: t('sign_method_type'),   icon: 'sign' },
    { id: 'upload', label: t('sign_method_upload'), icon: 'upload' },
  ];

  const applyOptions: ApplyOption[] = [
    { id: 'current', label: t('sign_apply_current') },
    { id: 'all',     label: t('sign_apply_all') },
  ];

  const renderFieldContent = (): ReactNode => {
    if (field === 'signature') {
      return (
        <span
          style={{
            fontFamily: style.font,
            fontWeight: style.weight,
            fontStyle: style.slant ? 'italic' : 'normal',
            transform: `skewX(${style.slant}deg)`,
            fontSize: `calc(28px * ${style.size})`,
            color: 'oklch(0.30 0.06 250)',
            letterSpacing: style.id === 'modern' ? '0.06em' : 'normal',
            textTransform: style.id === 'modern' ? 'uppercase' : 'none',
            whiteSpace: 'nowrap',
            display: 'inline-block',
          }}
        >
          {name || '—'}
        </span>
      );
    }
    if (field === 'initials') {
      return (
        <span
          style={{
            fontFamily: style.font,
            fontWeight: 700,
            fontStyle: style.slant ? 'italic' : 'normal',
            transform: `skewX(${style.slant}deg)`,
            fontSize: 32,
            color: 'oklch(0.30 0.06 250)',
            letterSpacing: '0.04em',
            display: 'inline-block',
          }}
        >
          {initials}
        </span>
      );
    }
    if (field === 'date') {
      return (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500, color: 'oklch(0.30 0.06 250)' }}>
          {today}
        </span>
      );
    }
    return (
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'oklch(0.45 0.06 250)', fontStyle: 'italic' }}>
        {t('sign_field_text')}
      </span>
    );
  };

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
              <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em' }}>{t('sign_title')}</h1>
              <p style={{ marginTop: 4, fontSize: 15, color: 'var(--fg-muted)' }}>{t('sign_sub')}</p>
            </div>
          </div>

          {/* Mock document strip */}
          <div
            className="pl-card"
            style={{ padding: '10px 14px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}
          >
            <PdfThumb w={32} h={42} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                contract-2026-q2.pdf
              </div>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
                1.2 MB · 7 {t('file_pages')}
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
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 460px)',
              gap: 18,
              alignItems: 'start',
            }}
          >
            {/* Controls */}
            <div className="pl-card" style={{ padding: 24 }}>
              {/* Method tabs */}
              <div style={{ marginBottom: 20 }}>
                <label className="pl-label">{t('sign_method')}</label>
                <div
                  role="tablist"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 4,
                    padding: 4,
                    background: 'var(--bg-muted)',
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
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          border: 0,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          background: active ? 'var(--bg-elev)' : 'transparent',
                          color: active ? 'var(--fg)' : 'var(--fg-muted)',
                          fontSize: 12.5,
                          fontWeight: 600,
                          height: 34,
                          padding: '0 10px',
                          borderRadius: 8,
                          boxShadow: active ? 'var(--shadow-sm)' : 'none',
                        }}
                      >
                        <Icon name={m.icon} size={13} /> {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Method body */}
              {method === 'type' && (
                <div style={{ marginBottom: 20 }}>
                  <label className="pl-label">{t('sign_typed_label')}</label>
                  <input
                    className="pl-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('sign_typed_placeholder')}
                  />
                  <label className="pl-label" style={{ marginTop: 16 }}>
                    {t('sign_style')}
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {styles.map((s) => {
                      const active = styleId === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setStyleId(s.id)}
                          style={{
                            padding: '16px 12px',
                            borderRadius: 10,
                            background: active ? 'var(--accent-soft)' : 'var(--bg-elev)',
                            border:
                              '1px solid ' +
                              (active ? 'color-mix(in oklch, var(--accent) 35%, var(--line))' : 'var(--line)'),
                            boxShadow: active ? '0 0 0 3px var(--accent-ring)' : 'none',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            textAlign: 'center',
                            transition: 'all .15s ease',
                            minHeight: 78,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: s.font,
                              fontWeight: s.weight,
                              fontStyle: s.slant ? 'italic' : 'normal',
                              transform: `skewX(${s.slant}deg)`,
                              fontSize: `calc(22px * ${s.size})`,
                              color: 'oklch(0.30 0.06 250)',
                              letterSpacing: s.id === 'modern' ? '0.06em' : 'normal',
                              textTransform: s.id === 'modern' ? 'uppercase' : 'none',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '100%',
                              display: 'inline-block',
                            }}
                          >
                            {name || '—'}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              color: 'var(--fg-subtle)',
                              fontFamily: 'var(--font-mono)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                            }}
                          >
                            {s.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {method === 'draw' && (
                <div style={{ marginBottom: 20 }}>
                  <label className="pl-label">{t('sign_method_draw')}</label>
                  <div
                    style={{
                      height: 140,
                      borderRadius: 10,
                      background: 'var(--bg-elev)',
                      border: '1.5px dashed var(--line-strong)',
                      position: 'relative',
                      display: 'grid',
                      placeItems: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Mock drawn signature path */}
                    <svg viewBox="0 0 320 100" style={{ width: '70%', height: 'auto' }} aria-hidden="true">
                      <path
                        d="M 10 70 Q 30 10, 60 50 T 110 60 Q 140 30, 170 60 T 230 50 Q 260 70, 290 35 L 305 60"
                        stroke="oklch(0.30 0.06 250)"
                        strokeWidth="2.4"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 6,
                        left: 0,
                        right: 0,
                        textAlign: 'center',
                        fontSize: 10,
                        color: 'var(--fg-subtle)',
                        fontFamily: 'var(--font-mono)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {t('sign_draw_hint')}
                    </div>
                    <button
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'var(--bg-elev)',
                        border: '1px solid var(--line)',
                        color: 'var(--fg-muted)',
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {t('sign_draw_clear')}
                    </button>
                  </div>
                </div>
              )}

              {method === 'upload' && (
                <div style={{ marginBottom: 20 }}>
                  <label className="pl-label">{t('sign_method_upload')}</label>
                  <div
                    style={{
                      padding: '22px 16px',
                      borderRadius: 10,
                      background: 'var(--bg-elev)',
                      border: '1.5px dashed var(--line-strong)',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'var(--bg-muted)',
                        color: 'var(--accent)',
                        display: 'grid',
                        placeItems: 'center',
                        margin: '0 auto 10px',
                      }}
                    >
                      <Icon name="upload" size={18} />
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginBottom: 10 }}>{t('sign_upload_hint')}</div>
                    <button className="pl-btn pl-btn-ghost" style={{ fontSize: 12 }}>
                      {t('sign_upload_browse')}
                    </button>
                  </div>
                </div>
              )}

              {/* Fields panel */}
              <div style={{ marginBottom: 20 }}>
                <label className="pl-label">{t('sign_fields')}</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {fields.map((f) => {
                    const active = field === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setField(f.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '12px 14px',
                          borderRadius: 10,
                          background: active ? 'var(--accent-soft)' : 'var(--bg-elev)',
                          border:
                            '1px solid ' +
                            (active ? 'color-mix(in oklch, var(--accent) 35%, var(--line))' : 'var(--line)'),
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          textAlign: 'left',
                          transition: 'all .15s ease',
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: active ? 'var(--accent)' : 'var(--bg-muted)',
                            color: active ? 'var(--accent-fg)' : 'var(--fg-muted)',
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Icon name={f.icon} size={14} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: active ? 'var(--accent)' : 'var(--fg)' }}>
                          {f.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--fg-subtle)', fontFamily: 'var(--font-mono)' }}>
                  {t('sign_fields_hint')}
                </div>
              </div>

              {/* Apply to */}
              <div>
                <label className="pl-label">{t('sign_apply')}</label>
                <div style={{ display: 'grid', gap: 8 }}>
                  {applyOptions.map((o) => {
                    const active = apply === o.id;
                    return (
                      <button
                        key={o.id}
                        onClick={() => setApply(o.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '12px 14px',
                          borderRadius: 10,
                          background: active ? 'var(--accent-soft)' : 'var(--bg-elev)',
                          border:
                            '1px solid ' +
                            (active ? 'color-mix(in oklch, var(--accent) 35%, var(--line))' : 'var(--line)'),
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
                            border: '1.5px solid ' + (active ? 'var(--accent)' : 'var(--line-strong)'),
                            background: 'var(--bg-elev)',
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {active && (
                            <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--accent)' }} />
                          )}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: active ? 'var(--accent)' : 'var(--fg)' }}>
                          {o.label}
                        </div>
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
                {t('sign_preview')}
              </div>
              <SignPreviewPage fieldType={field} renderContent={renderFieldContent} />
              <div
                style={{
                  marginTop: 12,
                  fontSize: 11,
                  color: 'var(--fg-subtle)',
                  fontFamily: 'var(--font-mono)',
                  textAlign: 'center',
                }}
              >
                {t('sign_preview_caption')}
              </div>
            </div>
          </div>

          <div
            style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end', flexWrap: 'wrap' }}
          >
            <button className="pl-btn pl-btn-ghost pl-btn-lg">{t('start_over')}</button>
            <button className="pl-btn pl-btn-primary pl-btn-lg">
              <Icon name="sign" size={16} /> {t('sign_cta')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Preview ─────────────────────────────────────────────────────
// Co-located with SignToolPage — only used by it. If a second tool ever
// needs the same A4 mock contract page, lift to packages/tools/src/_internal/.

interface PreviewLine {
  w: string;
  h: number;
  mt: number;
  bold?: boolean;
  dim?: boolean;
}

interface BoxSize {
  w: string;
  h: string;
}

interface DragCorner {
  id: 'tl' | 'tr' | 'bl' | 'br';
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

interface SignPreviewPageProps {
  fieldType: FieldType;
  renderContent: () => ReactNode;
}

function SignPreviewPage({ fieldType, renderContent }: SignPreviewPageProps) {
  const lines: PreviewLine[] = [
    { w: '52%', h: 14, mt: 0,  bold: true },
    { w: '32%', h: 8,  mt: 14, dim: true },
    { w: '94%', h: 6,  mt: 22 },
    { w: '88%', h: 6,  mt: 8 },
    { w: '92%', h: 6,  mt: 8 },
    { w: '70%', h: 6,  mt: 8 },
    { w: '94%', h: 6,  mt: 16 },
    { w: '86%', h: 6,  mt: 8 },
    { w: '60%', h: 6,  mt: 8 },
  ];

  const boxSizes: Record<FieldType, BoxSize> = {
    signature: { w: '44%', h: '9%' },
    initials:  { w: '18%', h: '9%' },
    date:      { w: '26%', h: '7%' },
    text:      { w: '32%', h: '7%' },
  };
  const boxSize = boxSizes[fieldType];

  const corners: DragCorner[] = [
    { id: 'tl', top: -3, left: -3 },
    { id: 'tr', top: -3, right: -3 },
    { id: 'bl', bottom: -3, left: -3 },
    { id: 'br', bottom: -3, right: -3 },
  ];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 1.414', // A4
        background: 'white',
        borderRadius: 6,
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--line)',
        overflow: 'hidden',
      }}
    >
      {/* Mock page body */}
      <div style={{ position: 'absolute', inset: '8% 8% 8% 8%' }}>
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
        {/* Signature line label near the bottom */}
        <div
          style={{
            marginTop: 28,
            fontSize: 9,
            color: 'oklch(0.45 0 0)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-mono)',
          }}
        >
          Signed by
        </div>
        <div style={{ marginTop: 6, width: '44%', height: 1, background: 'oklch(0.55 0 0)' }} />
      </div>

      {/* Draggable-looking signature field overlay */}
      <div
        style={{
          position: 'absolute',
          left: '8%',
          top: '62%',
          width: boxSize.w,
          height: boxSize.h,
          minHeight: 36,
          border: '1.5px dashed oklch(0.55 0.18 30)',
          background: 'oklch(0.97 0.04 30 / 0.6)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
          transition: 'all .15s ease',
        }}
      >
        {renderContent()}
        {/* Drag handle dots — corners */}
        {corners.map((c) => (
          <span
            key={c.id}
            style={{
              position: 'absolute',
              width: 6,
              height: 6,
              borderRadius: 999,
              background: 'oklch(0.55 0.18 30)',
              top: c.top,
              bottom: c.bottom,
              left: c.left,
              right: c.right,
              boxShadow: '0 0 0 2px white',
            }}
          />
        ))}
      </div>
    </div>
  );
}
