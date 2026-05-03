import { useState } from 'react';
import { useI18n, type Lang } from '@lunedoc/i18n';
import { Icon } from '@lunedoc/ui';

type Format = 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'JPG' | 'PNG';
type OptionKey = 'ocr' | 'layout' | 'images';
type ConvertOpts = Record<OptionKey, boolean>;

interface ConvertToolPageProps {
  lang: Lang;
}

const FORMATS: readonly Format[] = ['PDF', 'DOCX', 'XLSX', 'PPTX', 'JPG', 'PNG'];

export function ConvertToolPage({ lang }: ConvertToolPageProps) {
  const { t } = useI18n(lang);
  const [from, setFrom] = useState<Format>('PDF');
  const [to, setTo] = useState<Format>('DOCX');
  const [opts, setOpts] = useState<ConvertOpts>({ ocr: true, layout: true, images: false });

  const optionList: { k: OptionKey; label: string }[] = [
    { k: 'ocr',     label: t('convert_opt_ocr') },
    { k: 'layout',  label: t('convert_opt_layout') },
    { k: 'images',  label: t('convert_opt_images') },
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
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 24 }}>
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
              <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em' }}>{t('convert_title')}</h1>
              <p style={{ marginTop: 4, fontSize: 15, color: 'var(--fg-muted)' }}>{t('convert_sub')}</p>
            </div>
          </div>

          <div className="pl-card" style={{ padding: 24 }}>
            {/* From / To */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                gap: 14,
                alignItems: 'end',
                marginBottom: 24,
              }}
            >
              <FormatPicker label={t('convert_from')} value={from} options={FORMATS} onChange={setFrom} />
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  background: 'var(--bg-elev)',
                  border: '1px solid var(--line)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--accent)',
                  margin: '0 0 4px 0',
                }}
              >
                <Icon name="arrow-right" size={16} />
              </div>
              <FormatPicker
                label={t('convert_to')}
                value={to}
                options={FORMATS.filter((f) => f !== from)}
                onChange={setTo}
              />
            </div>

            {/* Dropzone */}
            <div
              style={{
                padding: '48px 24px',
                borderRadius: 12,
                background: 'var(--bg-muted)',
                border: '1.5px dashed var(--line-strong)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'var(--bg-elev)',
                  border: '1px solid var(--line)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--accent)',
                }}
              >
                <Icon name="upload" size={20} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{t('convert_drop').replace('{from}', from)}</div>
                <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 4 }}>{t('convert_limit')}</div>
              </div>
              <button className="pl-btn pl-btn-primary">{t('upload_browse')}</button>
            </div>

            {/* Options */}
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{t('convert_options')}</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {optionList.map((o) => {
                  const checked = opts[o.k];
                  return (
                    <button
                      key={o.k}
                      onClick={() => setOpts({ ...opts, [o.k]: !checked })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        borderRadius: 10,
                        background: checked ? 'var(--accent-soft)' : 'var(--bg-elev)',
                        border:
                          '1px solid ' +
                          (checked ? 'color-mix(in oklch, var(--accent) 35%, var(--line))' : 'var(--line)'),
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        textAlign: 'left',
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 5,
                          background: checked ? 'var(--accent)' : 'var(--bg-elev)',
                          border: '1.5px solid ' + (checked ? 'var(--accent)' : 'var(--line-strong)'),
                          display: 'grid',
                          placeItems: 'center',
                          color: 'var(--accent-fg)',
                        }}
                      >
                        {checked && <Icon name="check" size={11} />}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: checked ? 'var(--accent)' : 'var(--fg)' }}>
                        {o.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
            <button className="pl-btn pl-btn-ghost pl-btn-lg">{t('start_over')}</button>
            <button className="pl-btn pl-btn-primary pl-btn-lg">
              <Icon name="convert" size={16} /> {t('convert_cta')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Format picker ───────────────────────────────────────────────

interface FormatPickerProps {
  label: string;
  value: Format;
  options: readonly Format[];
  onChange: (f: Format) => void;
}

function FormatPicker({ label, value, options, onChange }: FormatPickerProps) {
  return (
    <div style={{ minWidth: 0 }}>
      <label className="pl-label">{label}</label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {options.map((o) => {
          const active = o === value;
          return (
            <button
              key={o}
              onClick={() => onChange(o)}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid ' + (active ? 'var(--accent)' : 'var(--line)'),
                background: active ? 'var(--accent)' : 'var(--bg-elev)',
                color: active ? 'var(--accent-fg)' : 'var(--fg)',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                boxShadow: active ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
