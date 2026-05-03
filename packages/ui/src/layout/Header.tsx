import { useI18n } from '@lunedoc/i18n';
import { Logo } from '../logo/Logo';
import { Icon } from '../icons/Icon';
import { LangSwitch } from './LangSwitch';
import type { Lang } from '../types';

interface HeaderProps {
  lang: Lang;
  setLang: (lang: Lang) => void;
  mobile?: boolean;
  transparent?: boolean;
  active?: string;
}

export function Header({ lang, setLang, mobile = false, transparent = false, active = '' }: HeaderProps) {
  const { t } = useI18n(lang);

  if (mobile) {
    return (
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--bg)',
          position: 'sticky',
          top: 0,
          zIndex: 5,
        }}
      >
        <Logo size={15} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LangSwitch lang={lang} setLang={setLang} compact />
          <button className="pl-btn pl-btn-quiet" style={{ width: 36, padding: 0 }} aria-label="Menu">
            <Icon name="menu" />
          </button>
        </div>
      </header>
    );
  }

  const items = [
    ['nav_tools', 'tools'],
    ['nav_pricing', 'pricing'],
    ['nav_blog', 'blog'],
    ['nav_docs', 'docs'],
  ] as const;

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        padding: '14px 28px',
        borderBottom: '1px solid var(--line)',
        background: transparent ? 'transparent' : 'var(--bg)',
        position: 'sticky',
        top: 0,
        zIndex: 5,
        backdropFilter: 'saturate(140%) blur(8px)',
      }}
    >
      <Logo size={16} />
      <nav style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 12 }}>
        {items.map(([k, id]) => {
          const isActive = active === id;
          return (
            <a
              key={k}
              href="#"
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                color: isActive ? 'var(--fg)' : 'var(--fg-muted)',
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                background: isActive ? 'var(--bg-muted)' : 'transparent',
              }}
            >
              {t(k)}
            </a>
          );
        })}
      </nav>
      <div style={{ flex: 1 }} />
      <LangSwitch lang={lang} setLang={setLang} />
      <button className="pl-btn pl-btn-quiet pl-btn-sm">{t('nav_signin')}</button>
      <button className="pl-btn pl-btn-primary pl-btn-sm">{t('nav_get_started')}</button>
    </header>
  );
}
