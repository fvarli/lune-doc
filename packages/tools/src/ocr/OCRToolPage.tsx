import { useState } from 'react';
import { useI18n, type Lang } from '@lunedoc/i18n';
import { Icon, PdfThumb, type IconName } from '@lunedoc/ui';

type OcrLang = 'auto' | 'en' | 'tr' | 'es';
type SampleLang = 'en' | 'tr' | 'es';
type OcrMode = 'extract' | 'searchable';

interface OcrLangOption {
  id: OcrLang;
  label: string;
  code: string;
}

interface OcrModeOption {
  id: OcrMode;
  label: string;
  hint: string;
  icon: IconName;
}

interface SampleInvoice {
  title: string;
  meta: string;
  body: string[];
}

interface OCRToolPageProps {
  lang: Lang;
}

export function OCRToolPage({ lang }: OCRToolPageProps) {
  const { t } = useI18n(lang);
  const [ocrLang, setOcrLang] = useState<OcrLang>('auto');
  const [mode, setMode] = useState<OcrMode>('extract');

  const langs: OcrLangOption[] = [
    { id: 'auto', label: t('ocr_lang_auto'), code: 'AUTO' },
    { id: 'en',   label: t('ocr_lang_en'),   code: 'EN' },
    { id: 'tr',   label: t('ocr_lang_tr'),   code: 'TR' },
    { id: 'es',   label: t('ocr_lang_es'),   code: 'ES' },
  ];

  const modes: OcrModeOption[] = [
    { id: 'extract',    label: t('ocr_mode_extract'),    hint: t('ocr_mode_extract_hint'),    icon: 'doc' },
    { id: 'searchable', label: t('ocr_mode_searchable'), hint: t('ocr_mode_searchable_hint'), icon: 'search' },
  ];

  // Effective sample language: when auto, mirror the UI locale.
  const sampleLang: SampleLang =
    ocrLang === 'auto' ? (lang === 'tr' || lang === 'es' ? lang : 'en') : ocrLang;

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
              <Icon name="ocr" size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em' }}>{t('ocr_title')}</h1>
              <p style={{ marginTop: 4, fontSize: 15, color: 'var(--fg-muted)' }}>{t('ocr_sub')}</p>
            </div>
          </div>

          {/* Mock document strip */}
          <div className="pl-card" style={{ padding: '10px 14px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
            <PdfThumb w={32} h={42} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                scanned-invoice.pdf
              </div>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
                1.8 MB · 1 {t('file_pages')}
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
              gridTemplateColumns: 'minmax(0, 360px) minmax(0, 1fr)',
              gap: 18,
              alignItems: 'start',
            }}
          >
            {/* Controls */}
            <div className="pl-card" style={{ padding: 24, minWidth: 0 }}>
              {/* Language selector */}
              <div style={{ marginBottom: 20 }}>
                <label className="pl-label">{t('ocr_lang')}</label>
                <div role="radiogroup" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                  {langs.map((l) => {
                    const active = ocrLang === l.id;
                    return (
                      <button
                        key={l.id}
                        role="radio"
                        aria-checked={active}
                        onClick={() => setOcrLang(l.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          minWidth: 0,
                          padding: '10px 12px',
                          borderRadius: 10,
                          background: active ? 'var(--accent-soft)' : 'var(--bg-elev)',
                          border: '1px solid ' + (active ? 'color-mix(in oklch, var(--accent) 35%, var(--line))' : 'var(--line)'),
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
                            borderRadius: 7,
                            background: active ? 'var(--accent)' : 'var(--bg-muted)',
                            color: active ? 'var(--accent-fg)' : 'var(--fg-muted)',
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0,
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                          }}
                        >
                          {l.id === 'auto' ? <Icon name="globe" size={14} /> : l.code}
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
                          {l.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--fg-subtle)', fontFamily: 'var(--font-mono)' }}>
                  {t('ocr_lang_hint')}
                </div>
              </div>

              {/* Mode selector */}
              <div style={{ marginBottom: 20 }}>
                <label className="pl-label">{t('ocr_mode')}</label>
                <div style={{ display: 'grid', gap: 8 }}>
                  {modes.map((m) => {
                    const active = mode === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          minWidth: 0,
                          padding: '12px 14px',
                          borderRadius: 10,
                          background: active ? 'var(--accent-soft)' : 'var(--bg-elev)',
                          border: '1px solid ' + (active ? 'color-mix(in oklch, var(--accent) 35%, var(--line))' : 'var(--line)'),
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
                            marginTop: 1,
                          }}
                        >
                          <Icon name={m.icon} size={14} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--accent)' : 'var(--fg)' }}>
                            {m.label}
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2 }}>{m.hint}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status / confidence chips */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span
                  className="pl-chip"
                  style={{
                    background: 'color-mix(in oklch, var(--accent) 12%, var(--bg-muted))',
                    color: 'var(--accent)',
                    borderColor: 'color-mix(in oklch, var(--accent) 25%, var(--line))',
                  }}
                >
                  <Icon name="check" size={11} /> {t('ocr_status_ready')}
                </span>
                <span className="pl-chip" style={{ fontFamily: 'var(--font-mono)' }}>
                  {t('ocr_confidence')} · 94%
                </span>
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
                {t('ocr_preview')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 14, alignItems: 'stretch' }}>
                <OCRScannedPage label={t('ocr_scanned_label')} />
                <OCRExtractedBlock label={t('ocr_extracted_label')} mode={mode} sampleLang={sampleLang} />
              </div>
              <div
                style={{
                  marginTop: 12,
                  fontSize: 11,
                  color: 'var(--fg-subtle)',
                  fontFamily: 'var(--font-mono)',
                  textAlign: 'center',
                }}
              >
                {t('ocr_preview_caption')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button className="pl-btn pl-btn-ghost pl-btn-lg">{t('start_over')}</button>
            <button className="pl-btn pl-btn-primary pl-btn-lg">
              <Icon name="ocr" size={16} /> {t('ocr_cta')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Scanned-page mock ───────────────────────────────────────────

interface ScannedLine {
  w: string;
  h: number;
  mt: number;
  bold?: boolean;
  dim?: boolean;
}

function OCRScannedPage({ label }: { label: string }) {
  const lines: ScannedLine[] = [
    { w: '70%', h: 12, mt: 0,  bold: true },
    { w: '44%', h: 8,  mt: 12, dim: true },
    { w: '94%', h: 6,  mt: 22 },
    { w: '88%', h: 6,  mt: 8 },
    { w: '92%', h: 6,  mt: 8 },
    { w: '62%', h: 6,  mt: 8 },
    { w: '94%', h: 6,  mt: 16 },
    { w: '82%', h: 6,  mt: 8 },
    { w: '58%', h: 6,  mt: 8 },
    { w: '40%', h: 6,  mt: 18, dim: true },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <div
        style={{
          fontSize: 10,
          color: 'var(--fg-subtle)',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1.414',
          background: 'oklch(0.96 0.012 90)',
          borderRadius: 6,
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--line)',
          overflow: 'hidden',
          transform: 'rotate(-0.4deg)',
        }}
      >
        {/* Grain overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at 20% 30%, oklch(0.85 0.02 70 / 0.35) 0 1px, transparent 1px), radial-gradient(circle at 70% 60%, oklch(0.82 0.02 90 / 0.30) 0 1px, transparent 1px), radial-gradient(circle at 40% 80%, oklch(0.88 0.02 80 / 0.25) 0 1px, transparent 1px)',
            backgroundSize: '3px 3px, 5px 5px, 7px 7px',
            mixBlendMode: 'multiply',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'absolute', inset: '9% 9% 9% 9%' }}>
          {lines.map((l, i) => (
            <div
              key={i}
              style={{
                width: l.w,
                height: l.h,
                marginTop: l.mt,
                background: l.dim ? 'oklch(0.72 0.01 80)' : l.bold ? 'oklch(0.32 0.01 80)' : 'oklch(0.55 0.01 80)',
                borderRadius: 1,
                filter: 'blur(0.3px)',
                opacity: 0.85,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Recognized-text editor mock ─────────────────────────────────

interface OCRExtractedBlockProps {
  label: string;
  mode: OcrMode;
  sampleLang: SampleLang;
}

function OCRExtractedBlock({ label, mode, sampleLang }: OCRExtractedBlockProps) {
  const samples: Record<SampleLang, SampleInvoice> = {
    en: {
      title: 'INVOICE #2026-0184',
      meta: 'Issued · May 02, 2026',
      body: [
        'Bill to: Northwind Trading Co.',
        '440 Market Street, Suite 12',
        'Portland, OR 97204',
        '',
        'Description                Qty   Amount',
        'Annual support, tier B      1    $4,200.00',
        'Onboarding session          2      $480.00',
        '',
        'Subtotal                         $4,680.00',
        'Tax (8.5%)                         $397.80',
        'Total due                        $5,077.80',
      ],
    },
    tr: {
      title: 'FATURA #2026-0184',
      meta: 'Düzenleme · 02 Mayıs 2026',
      body: [
        'Alıcı: Kuzeyrüzgarı Ticaret A.Ş.',
        'Bağdat Caddesi 440, Daire 12',
        'Kadıköy, İstanbul 34710',
        '',
        'Açıklama                  Adet   Tutar',
        'Yıllık destek, B kademesi   1    ₺4.200,00',
        'Kurulum oturumu             2      ₺480,00',
        '',
        'Ara toplam                       ₺4.680,00',
        'KDV (%8,5)                         ₺397,80',
        'Toplam                           ₺5.077,80',
      ],
    },
    es: {
      title: 'FACTURA #2026-0184',
      meta: 'Emitida · 02 de mayo de 2026',
      body: [
        'Facturar a: Comercial Vientonorte S.L.',
        'Calle del Mercado 440, oficina 12',
        '28013 Madrid',
        '',
        'Descripción                Cant   Importe',
        'Soporte anual, nivel B       1    €4.200,00',
        'Sesión de incorporación      2      €480,00',
        '',
        'Subtotal                         €4.680,00',
        'IVA (8,5%)                         €397,80',
        'Total                            €5.077,80',
      ],
    },
  };
  const s = samples[sampleLang];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span
          style={{
            fontSize: 10,
            color: 'var(--fg-subtle)',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 10,
            color: 'var(--accent)',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {mode === 'extract' ? '.txt' : '.pdf'}
        </span>
      </div>
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1.414',
          background: 'var(--bg-elev)',
          borderRadius: 6,
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--line)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Faux editor header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 10px',
            borderBottom: '1px solid var(--line)',
            background: 'var(--bg-muted)',
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 999, background: 'oklch(0.72 0.16 25)' }} />
          <span style={{ width: 8, height: 8, borderRadius: 999, background: 'oklch(0.80 0.14 90)' }} />
          <span style={{ width: 8, height: 8, borderRadius: 999, background: 'oklch(0.74 0.14 150)' }} />
          <span
            style={{
              marginLeft: 6,
              fontSize: 10,
              color: 'var(--fg-subtle)',
              fontFamily: 'var(--font-mono)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            scanned-invoice{mode === 'extract' ? '.txt' : '.pdf'}
          </span>
        </div>
        {/* Text body */}
        <div
          style={{
            flex: 1,
            padding: '12px 14px',
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            lineHeight: 1.55,
            color: 'var(--fg)',
            overflow: 'hidden',
            minWidth: 0,
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--accent)', marginBottom: 2 }}>{s.title}</div>
          <div style={{ fontSize: 10, color: 'var(--fg-muted)', marginBottom: 10 }}>{s.meta}</div>
          {s.body.map((line, i) => {
            const isTotal = line.startsWith('Total') || line.startsWith('Toplam');
            return (
              <div
                key={i}
                style={{
                  whiteSpace: 'pre',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: isTotal ? 'var(--fg)' : 'var(--fg-muted)',
                  fontWeight: isTotal ? 700 : 400,
                  minHeight: line === '' ? 8 : 'auto',
                }}
              >
                {line || ' '}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
