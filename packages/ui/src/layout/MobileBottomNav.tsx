import { useI18n } from '@lunedoc/i18n';
import { Icon, type IconName } from '../icons/Icon';
import type { Lang } from '../types';

interface MobileBottomNavProps {
  active?: string;
  lang?: Lang;
}

interface NavItem {
  id: string;
  icon: IconName;
  labelKey: string;
}

export function MobileBottomNav({ active = 'home', lang = 'en' }: MobileBottomNavProps) {
  const { t } = useI18n(lang);
  const items: NavItem[] = [
    { id: 'home', icon: 'home', labelKey: 'nav_home' },
    { id: 'tools', icon: 'grid', labelKey: 'nav_tools' },
    { id: 'files', icon: 'folder', labelKey: 'nav_files' },
    { id: 'account', icon: 'user', labelKey: 'nav_account' },
  ];
  return (
    <nav
      style={{
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'color-mix(in oklch, var(--bg-elev) 92%, transparent)',
        borderTop: '1px solid var(--line)',
        padding: '8px 8px calc(env(safe-area-inset-bottom, 0px) + 10px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 4,
        backdropFilter: 'saturate(140%) blur(12px)',
        zIndex: 4,
      }}
    >
      {items.map((it) => {
        const isActive = it.id === active;
        return (
          <button
            key={it.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              height: 52,
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
              color: isActive ? 'var(--accent)' : 'var(--fg-subtle)',
              fontFamily: 'inherit',
              borderRadius: 10,
            }}
          >
            <div style={{ position: 'relative' }}>
              <Icon name={it.icon} size={20} />
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    inset: -6,
                    borderRadius: 10,
                    background: 'var(--accent-soft)',
                    zIndex: -1,
                  }}
                />
              )}
            </div>
            <div style={{ fontSize: 10.5, fontWeight: isActive ? 600 : 500, letterSpacing: '0.01em' }}>
              {t(it.labelKey)}
            </div>
          </button>
        );
      })}
    </nav>
  );
}
