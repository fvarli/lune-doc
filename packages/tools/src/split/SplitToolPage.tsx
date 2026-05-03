import { useState, type CSSProperties } from 'react';
import { useI18n, type Lang } from '@lunedoc/i18n';
import { Icon, PdfThumb } from '@lunedoc/ui';

type SplitMode = 'range' | 'pages';

interface SplitRange {
  from: number;
  to: number;
  name: string;
}

interface SplitToolPageProps {
  lang: Lang;
}

export function SplitToolPage({ lang }: SplitToolPageProps) {
  const { t } = useI18n(lang);
  const [mode, setMode] = useState<SplitMode>('range');
  const [selected, setSelected] = useState<Set<number>>(new Set([3, 4, 5, 6, 12]));
  const totalPages = 16;

  const togglePage = (n: number) => {
    const s = new Set(selected);
    if (s.has(n)) s.delete(n);
    else s.add(n);
    setSelected(s);
  };

  const ranges: SplitRange[] = [
    { from: 1, to: 4, name: 'summary.pdf' },
    { from: 5, to: 12, name: 'financials.pdf' },
    { from: 13, to: 16, name: 'appendix.pdf' },
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
                background: 'oklch(0.96 0.04 252)',
                color: 'oklch(0.45 0.16 252)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="split" size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em' }}>{t('split_title')}</h1>
              <p style={{ marginTop: 4, fontSize: 15, color: 'var(--fg-muted)' }}>{t('split_sub')}</p>
            </div>
          </div>

          {/* Mode toggle */}
          <div
            role="tablist"
            style={{
              display: 'inline-flex',
              padding: 4,
              gap: 4,
              background: 'var(--bg-elev)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              marginBottom: 18,
            }}
          >
            {([['range', t('split_mode_range')], ['pages', t('split_mode_pages')]] as const).map(([k, label]) => {
              const active = mode === k;
              return (
                <button
                  key={k}
                  onClick={() => setMode(k)}
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
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="pl-card" style={{ padding: 24 }}>
            {/* Document strip */}
            <div
              style={{
                display: 'flex',
                gap: 14,
                alignItems: 'center',
                marginBottom: 20,
                paddingBottom: 16,
                borderBottom: '1px solid var(--line)',
              }}
            >
              <PdfThumb w={36} h={48} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>quarterly-review-2026-Q1.pdf</div>
                <div style={{ fontSize: 11, color: 'var(--fg-subtle)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  3.2 MB · {totalPages} {t('pages_short')}
                </div>
              </div>
            </div>

            {mode === 'range' ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {ranges.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto auto 1fr auto',
                      gap: 12,
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: 10,
                      background: 'var(--bg-muted)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--fg-subtle)',
                        fontWeight: 600,
                      }}
                    >
                      {t('split_range')} {i + 1}
                    </span>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        className="pl-input"
                        defaultValue={r.from}
                        style={{ width: 56, height: 32, textAlign: 'center', fontFamily: 'var(--font-mono)' }}
                      />
                      <span style={{ color: 'var(--fg-subtle)' }}>→</span>
                      <input
                        className="pl-input"
                        defaultValue={r.to}
                        style={{ width: 56, height: 32, textAlign: 'center', fontFamily: 'var(--font-mono)' }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--fg-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.name}
                    </div>
                    <button style={btnGhost(false)}>
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                ))}
                <button
                  style={{
                    marginTop: 4,
                    padding: '10px',
                    borderRadius: 10,
                    background: 'transparent',
                    border: '1.5px dashed var(--line-strong)',
                    color: 'var(--fg-muted)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Icon name="plus" size={14} /> {t('add_range')}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8 }}>
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const n = i + 1;
                    const active = selected.has(n);
                    return (
                      <button
                        key={n}
                        onClick={() => togglePage(n)}
                        style={{
                          position: 'relative',
                          padding: 0,
                          border: 0,
                          background: 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <div
                          style={{
                            width: '100%',
                            aspectRatio: '3 / 4',
                            background: 'var(--bg-elev)',
                            border: '2px solid ' + (active ? 'var(--accent)' : 'var(--line)'),
                            borderRadius: 6,
                            boxShadow: active ? '0 0 0 4px var(--accent-ring)' : 'var(--shadow-sm)',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'all .15s ease',
                          }}
                        >
                          <div style={{ position: 'absolute', top: 4, left: 4, right: 4, height: 2, background: 'var(--bg-sunken)', borderRadius: 1 }} />
                          <div style={{ position: 'absolute', top: 9, left: 4, right: 8, height: 2, background: 'var(--bg-sunken)', borderRadius: 1 }} />
                          <div style={{ position: 'absolute', top: 14, left: 4, right: 6, height: 2, background: 'var(--bg-sunken)', borderRadius: 1 }} />
                          {active && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                width: 16,
                                height: 16,
                                borderRadius: 999,
                                background: 'var(--accent)',
                                color: 'var(--accent-fg)',
                                display: 'grid',
                                placeItems: 'center',
                              }}
                            >
                              <Icon name="check" size={10} />
                            </div>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: 'var(--font-mono)',
                            color: active ? 'var(--accent)' : 'var(--fg-subtle)',
                            fontWeight: 600,
                          }}
                        >
                          {n}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 14, fontSize: 12, color: 'var(--fg-subtle)', fontFamily: 'var(--font-mono)' }}>
                  {selected.size} {t('split_pages_selected')}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
            <button className="pl-btn pl-btn-ghost pl-btn-lg">{t('start_over')}</button>
            <button className="pl-btn pl-btn-primary pl-btn-lg">
              <Icon name="split" size={16} /> {t('split_extract_cta')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function btnGhost(disabled: boolean): CSSProperties {
  return {
    width: 28,
    height: 28,
    borderRadius: 8,
    border: '1px solid var(--line)',
    background: 'var(--bg-elev)',
    color: disabled ? 'var(--fg-subtle)' : 'var(--fg-muted)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'grid',
    placeItems: 'center',
    opacity: disabled ? 0.4 : 1,
  };
}
