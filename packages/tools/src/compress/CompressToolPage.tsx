import { useEffect, useRef, useState } from 'react';
import { useI18n, type Lang } from '@lunedoc/i18n';
import { Icon, PdfThumb } from '@lunedoc/ui';

type CompressState = 'empty' | 'uploading' | 'done';
type Phase = 'upload' | 'process';
type QualityId = 'low' | 'med' | 'high';

interface QualityOption {
  k: QualityId;
  label: string;
  hint: string;
}

interface CompressToolPageProps {
  lang: Lang;
}

export function CompressToolPage({ lang }: CompressToolPageProps) {
  const { t } = useI18n(lang);
  const [state, setState] = useState<CompressState>('empty');
  const [quality, setQuality] = useState<QualityId>('med');

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
              cursor: 'pointer',
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
                background: 'oklch(0.96 0.04 200)',
                color: 'oklch(0.45 0.16 200)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="compress" size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em' }}>{t('tool_compress_title')}</h1>
              <p style={{ marginTop: 4, fontSize: 15, color: 'var(--fg-muted)' }}>{t('tool_compress_sub')}</p>
            </div>
          </div>

          <div className="pl-card" style={{ padding: 28 }}>
            {state === 'empty' && <EmptyState lang={lang} onUpload={() => setState('uploading')} />}
            {state === 'uploading' && <UploadingState lang={lang} onDone={() => setState('done')} />}
            {state === 'done' && <DoneState lang={lang} onReset={() => setState('empty')} />}
          </div>

          {state === 'empty' && (
            <div style={{ marginTop: 20 }}>
              <QualityRow lang={lang} quality={quality} setQuality={setQuality} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Empty ───────────────────────────────────────────────────────

function EmptyState({ lang, onUpload }: { lang: Lang; onUpload: () => void }) {
  const { t } = useI18n(lang);
  const [hover, setHover] = useState<boolean>(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        onUpload();
      }}
      onClick={onUpload}
      style={{
        cursor: 'pointer',
        background: hover ? 'var(--accent-soft)' : 'var(--bg-muted)',
        border: `1.5px dashed ${hover ? 'var(--accent)' : 'var(--line-strong)'}`,
        borderRadius: 14,
        padding: '72px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        textAlign: 'center',
        transition: 'background .15s ease, border-color .15s ease',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: 'var(--bg-elev)',
          border: '1px solid var(--line)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--accent)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <Icon name="upload" size={22} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 600 }}>{t('upload_title')}</div>
        <div style={{ fontSize: 13.5, color: 'var(--fg-muted)', marginTop: 4 }}>{t('upload_subtitle')}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
        <button
          className="pl-btn pl-btn-primary"
          onClick={(e) => {
            e.stopPropagation();
            onUpload();
          }}
        >
          {t('upload_browse')}
        </button>
        <button className="pl-btn pl-btn-ghost" onClick={(e) => e.stopPropagation()}>
          <Icon name="drive" size={14} />
          {t('upload_from_drive')}
        </button>
        <button className="pl-btn pl-btn-ghost" onClick={(e) => e.stopPropagation()}>
          <Icon name="dropbox" size={14} />
          {t('upload_from_dropbox')}
        </button>
      </div>
    </div>
  );
}

// ── Uploading ───────────────────────────────────────────────────

function UploadingState({ lang, onDone }: { lang: Lang; onDone: () => void }) {
  const { t } = useI18n(lang);
  const [pct, setPct] = useState<number>(34);
  const [phase, setPhase] = useState<Phase>('upload');
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  // Tick progress only — never call other setters from inside setPct's updater.
  useEffect(() => {
    const id = setInterval(() => {
      setPct((p) => Math.min(100, p + (phase === 'upload' ? 6 : 4)));
    }, 220);
    return () => clearInterval(id);
  }, [phase]);

  // React to progress reaching 100 in a separate effect to avoid setState-in-render.
  useEffect(() => {
    if (pct < 100) return;
    if (phase === 'upload') {
      setPhase('process');
      setPct(8);
    } else if (phase === 'process') {
      onDoneRef.current?.();
    }
  }, [pct, phase]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <PdfThumb />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              annual-report-2025-final-v3.pdf
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-subtle)', fontFamily: 'var(--font-mono)' }}>{pct}%</div>
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 999,
              background: 'var(--bg-sunken)',
              overflow: 'hidden',
              border: '1px solid var(--line)',
            }}
          >
            <div
              style={{
                height: '100%',
                width: pct + '%',
                background: 'var(--accent)',
                borderRadius: 999,
                transition: 'width .2s ease',
              }}
            />
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--fg-muted)', display: 'flex', gap: 12 }}>
            <span>14.2 MB</span>
            <span>•</span>
            <span>42 {t('file_pages')}</span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span className="pl-pulse" style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--accent)' }} />
              {phase === 'upload' ? t('state_uploading') : t('state_processing')}…
            </span>
          </div>
        </div>
      </div>

      {/* Steps timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 6 }}>
        {[
          { key: 'upload',  label: t('state_uploading'),  done: phase === 'process', active: false },
          { key: 'process', label: t('state_processing'), done: false,               active: phase === 'process' },
          { key: 'ready',   label: t('state_done'),       done: false,               active: false },
        ].map((s, i) => (
          <div
            key={s.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 10,
              background: s.active ? 'var(--accent-soft)' : 'var(--bg-muted)',
              border: '1px solid ' + (s.active ? 'color-mix(in oklch, var(--accent) 30%, var(--line))' : 'var(--line)'),
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                display: 'grid',
                placeItems: 'center',
                background: s.done ? 'var(--accent)' : 'var(--bg-elev)',
                color: s.done ? 'var(--accent-fg)' : 'var(--fg-muted)',
                border: '1px solid ' + (s.done ? 'var(--accent)' : 'var(--line)'),
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {s.done ? <Icon name="check" size={12} /> : i + 1}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: s.active || s.done ? 'var(--fg)' : 'var(--fg-muted)',
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          fontSize: 12,
          color: 'var(--fg-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 4,
        }}
      >
        <Icon name="shield" size={12} /> {t('upload_secure')}
      </div>
    </div>
  );
}

// ── Done ────────────────────────────────────────────────────────

function DoneState({ lang, onReset }: { lang: Lang; onReset: () => void }) {
  const { t } = useI18n(lang);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            background: 'oklch(0.92 0.10 145)',
            color: 'oklch(0.40 0.18 145)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon name="check" size={20} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{t('state_done')}</div>
          <div style={{ fontSize: 13.5, color: 'var(--fg-muted)', marginTop: 2 }}>
            {t('state_done_sub')} <strong style={{ color: 'var(--fg)' }}>68%</strong>.
          </div>
        </div>
      </div>

      {/* Before / after */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: 14,
          alignItems: 'center',
          padding: 18,
          background: 'var(--bg-muted)',
          border: '1px solid var(--line)',
          borderRadius: 12,
        }}
      >
        <FileSummary thumbDim title="annual-report-2025-final-v3.pdf" size="14.2 MB" pages={42} pagesLabel={t('file_pages')} />
        <Icon name="arrow-right" size={16} stroke="var(--fg-subtle)" />
        <FileSummary title="annual-report-compressed.pdf" size="4.5 MB" pages={42} pagesLabel={t('file_pages')} highlight />
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="pl-btn pl-btn-primary pl-btn-lg">
          <Icon name="download" size={16} />
          {t('download')}
        </button>
        <button className="pl-btn pl-btn-ghost pl-btn-lg" onClick={onReset}>
          {t('start_over')}
        </button>
        <button className="pl-btn pl-btn-quiet pl-btn-lg">{t('share_link')}</button>
      </div>
    </div>
  );
}

// ── File summary chip ───────────────────────────────────────────

interface FileSummaryProps {
  title: string;
  size: string;
  pages: number;
  pagesLabel: string;
  highlight?: boolean;
  thumbDim?: boolean;
}

function FileSummary({ title, size, pages, pagesLabel, highlight = false, thumbDim = false }: FileSummaryProps) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0, opacity: thumbDim ? 0.7 : 1 }}>
      <PdfThumb />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: highlight ? 'var(--accent)' : 'var(--fg)',
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2, display: 'flex', gap: 8 }}>
          <span>{size}</span>
          <span>•</span>
          <span>
            {pages} {pagesLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Quality row ─────────────────────────────────────────────────

interface QualityRowProps {
  lang: Lang;
  quality: QualityId;
  setQuality: (q: QualityId) => void;
}

function QualityRow({ lang, quality, setQuality }: QualityRowProps) {
  const { t } = useI18n(lang);
  const opts: QualityOption[] = [
    { k: 'low',  label: t('quality_low'),  hint: '≈ 80%' },
    { k: 'med',  label: t('quality_med'),  hint: '≈ 50%' },
    { k: 'high', label: t('quality_high'), hint: '≈ 30%' },
  ];
  return (
    <div className="pl-card" style={{ padding: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{t('quality_label')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {opts.map((o) => {
          const active = quality === o.k;
          return (
            <button
              key={o.k}
              onClick={() => setQuality(o.k)}
              style={{
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                padding: '12px 14px',
                borderRadius: 10,
                background: active ? 'var(--accent-soft)' : 'var(--bg-elev)',
                border: '1px solid ' + (active ? 'color-mix(in oklch, var(--accent) 40%, var(--line))' : 'var(--line)'),
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: active ? 'var(--accent)' : 'var(--fg)' }}>
                  {o.label}
                </div>
                <div
                  style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}
                >
                  {o.hint}
                </div>
              </div>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 999,
                  border: '1.5px solid ' + (active ? 'var(--accent)' : 'var(--line-strong)'),
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {active && <div style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--accent)' }} />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
