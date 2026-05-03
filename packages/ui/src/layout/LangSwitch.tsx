import type { Lang } from '../types';

interface LangSwitchProps {
  lang: Lang;
  setLang: (lang: Lang) => void;
  compact?: boolean;
}

export function LangSwitch({ lang, setLang, compact = false }: LangSwitchProps) {
  const langs: Lang[] = ['en', 'tr', 'es'];
  return (
    <div
      role="tablist"
      aria-label="Language"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'var(--bg-muted)',
        border: '1px solid var(--line)',
        borderRadius: 999,
        padding: 3,
        gap: 2,
      }}
    >
      {langs.map((code) => {
        const active = lang === code;
        return (
          <button
            key={code}
            role="tab"
            aria-selected={active}
            onClick={() => setLang(code)}
            style={{
              border: 0,
              background: active ? 'var(--bg-elev)' : 'transparent',
              color: active ? 'var(--fg)' : 'var(--fg-muted)',
              fontWeight: active ? 600 : 500,
              fontSize: 12,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              height: compact ? 22 : 26,
              padding: compact ? '0 8px' : '0 10px',
              borderRadius: 999,
              cursor: 'pointer',
              boxShadow: active ? 'var(--shadow-sm)' : 'none',
              transition: 'background .15s ease, color .15s ease',
            }}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
