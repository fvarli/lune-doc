import { useState, type CSSProperties } from 'react';
import { useI18n, type Lang } from '@lunedoc/i18n';
import { Icon, PdfThumb } from '@lunedoc/ui';

interface MergeFile {
  id: number;
  name: string;
  size: string; // includes " MB" suffix; parseFloat() takes the leading number
  pages: number;
}

interface MergeToolPageProps {
  lang: Lang;
}

export function MergeToolPage({ lang }: MergeToolPageProps) {
  const { t } = useI18n(lang);
  const [files, setFiles] = useState<MergeFile[]>([
    { id: 1, name: '01-cover.pdf',              size: '0.4 MB', pages: 1 },
    { id: 2, name: '02-executive-summary.pdf',  size: '1.2 MB', pages: 4 },
    { id: 3, name: '03-financials.pdf',         size: '5.8 MB', pages: 18 },
    { id: 4, name: '04-appendix.pdf',           size: '2.1 MB', pages: 12 },
  ]);
  const totalMB = files.reduce((s, f) => s + parseFloat(f.size), 0).toFixed(1);

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= files.length) return;
    const next = [...files];
    const a = next[idx];
    const b = next[j];
    if (!a || !b) return;
    next[idx] = b;
    next[j] = a;
    setFiles(next);
  };
  const remove = (id: number) => setFiles(files.filter((f) => f.id !== id));

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
              <Icon name="merge" size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em' }}>{t('merge_title')}</h1>
              <p style={{ marginTop: 4, fontSize: 15, color: 'var(--fg-muted)' }}>{t('merge_sub')}</p>
            </div>
          </div>

          <div className="pl-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {t('merge_files')}{' '}
                <span style={{ color: 'var(--fg-subtle)', fontFamily: 'var(--font-mono)', marginLeft: 6 }}>
                  {files.length}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--fg-subtle)', fontFamily: 'var(--font-mono)' }}>
                {totalMB} MB {t('merge_total')}
              </div>
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              {files.map((f, i) => (
                <div
                  key={f.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto auto 1fr auto auto',
                    gap: 12,
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: 10,
                    background: 'var(--bg-elev)',
                    border: '1px solid var(--line)',
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 999,
                      background: 'var(--bg-muted)',
                      color: 'var(--fg-subtle)',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {i + 1}
                  </div>
                  <PdfThumb w={32} h={42} />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {f.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--fg-subtle)',
                        fontFamily: 'var(--font-mono)',
                        marginTop: 2,
                      }}
                    >
                      {f.size} · {f.pages} {t('pages_short')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => move(i, -1)} disabled={i === 0} style={btnGhost(i === 0)}>
                      <Icon name="chevron-down" size={12} style={{ transform: 'rotate(180deg)' }} />
                    </button>
                    <button onClick={() => move(i, 1)} disabled={i === files.length - 1} style={btnGhost(i === files.length - 1)}>
                      <Icon name="chevron-down" size={12} />
                    </button>
                  </div>
                  <button onClick={() => remove(f.id)} style={btnGhost(false)}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button
              style={{
                marginTop: 12,
                width: '100%',
                padding: '14px',
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
              <Icon name="plus" size={14} /> {t('merge_add')}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button className="pl-btn pl-btn-ghost pl-btn-lg">{t('start_over')}</button>
            <button className="pl-btn pl-btn-primary pl-btn-lg">
              <Icon name="merge" size={16} />
              {t('merge_cta').replace('{n}', String(files.length))}
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
