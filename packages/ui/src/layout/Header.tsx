import { useState, type ReactNode } from 'react';
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
  /**
   * Optional override for the right-hand area (Sign in / Get started).
   * Apps that wire auth state pass an auth-aware controls component;
   * pass an empty fragment to hide the area entirely (e.g. on /signin).
   * Falls back to the default placeholder buttons when omitted, which
   * preserves behavior for any consumer that hasn't been updated.
   */
  rightSlot?: ReactNode;
}

export function Header({
  lang,
  setLang,
  mobile = false,
  transparent = false,
  active = '',
  rightSlot,
}: HeaderProps) {
  const { t } = useI18n(lang);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (mobile) {
    const menuLabel = t('header_menu');
    const fallback = (
      <>
        <button className="pl-btn pl-btn-quiet pl-btn-sm">{t('nav_signin')}</button>
        <button className="pl-btn pl-btn-primary pl-btn-sm">{t('nav_get_started')}</button>
      </>
    );
    return (
      <>
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
            <button
              type="button"
              className="pl-btn pl-btn-quiet"
              style={{ width: 36, padding: 0 }}
              aria-label={menuLabel}
              aria-expanded={mobileMenuOpen}
              aria-controls="lune-mobile-header-menu"
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              <Icon name={mobileMenuOpen ? 'close' : 'menu'} />
            </button>
          </div>
        </header>
        {mobileMenuOpen ? (
          <nav
            id="lune-mobile-header-menu"
            aria-label={menuLabel}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: '12px 16px',
              borderBottom: '1px solid var(--line)',
              background: 'var(--bg)',
            }}
          >
            {rightSlot ?? fallback}
          </nav>
        ) : null}
      </>
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
      {rightSlot ?? (
        <>
          <button className="pl-btn pl-btn-quiet pl-btn-sm">{t('nav_signin')}</button>
          <button className="pl-btn pl-btn-primary pl-btn-sm">{t('nav_get_started')}</button>
        </>
      )}
    </header>
  );
}
