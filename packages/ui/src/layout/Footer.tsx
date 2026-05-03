import { useI18n } from '@lunedoc/i18n';
import { Logo } from '../logo/Logo';
import { Icon } from '../icons/Icon';
import type { Lang } from '../types';

interface FooterProps {
  lang?: Lang;
  mobile?: boolean;
}

interface FooterColumn {
  title: string;
  items: string[];
}

export function Footer({ lang = 'en', mobile = false }: FooterProps) {
  const { t } = useI18n(lang);
  const cols: FooterColumn[] = [
    { title: 'foot_product', items: ['nav_tools', 'nav_pricing', 'foot_changelog', 'foot_status'] },
    { title: 'foot_company', items: ['foot_about', 'nav_blog', 'foot_careers', 'foot_contact'] },
    { title: 'foot_legal',   items: ['foot_privacy', 'foot_terms', 'foot_security'] },
  ];
  return (
    <footer
      style={{
        borderTop: '1px solid var(--line)',
        background: 'var(--bg-muted)',
        padding: mobile ? '32px 20px 20px' : '48px 28px 24px',
        display: 'grid',
        gridTemplateColumns: mobile ? '1fr' : '1.4fr repeat(3, 1fr)',
        gap: mobile ? 28 : 32,
      }}
    >
      <div>
        <Logo size={15} />
        <p style={{ marginTop: 12, fontSize: 13, color: 'var(--fg-muted)', maxWidth: 280 }}>{t('foot_tagline')}</p>
        <div style={{ marginTop: 14, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span className="pl-chip" style={{ fontSize: 11 }}>
            <Icon name="shield" size={11} /> SOC 2
          </span>
          <span className="pl-chip" style={{ fontSize: 11 }}>
            <Icon name="globe" size={11} /> GDPR
          </span>
        </div>
      </div>
      {cols.map((c) => (
        <div key={c.title}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--fg-subtle)',
              marginBottom: 12,
            }}
          >
            {t(c.title)}
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
            {c.items.map((k) => (
              <li key={k}>
                <a style={{ fontSize: 13, color: 'var(--fg-muted)' }}>{t(k)}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div
        style={{
          gridColumn: '1 / -1',
          borderTop: '1px solid var(--line)',
          paddingTop: 16,
          display: 'flex',
          flexDirection: mobile ? 'column' : 'row',
          gap: mobile ? 8 : 0,
          justifyContent: 'space-between',
          alignItems: mobile ? 'flex-start' : 'center',
          fontSize: 12,
          color: 'var(--fg-subtle)',
        }}
      >
        <span>{t('foot_copy')}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: 'oklch(0.7 0.14 145)' }} />
          {t('foot_status_ok')}
        </span>
      </div>
    </footer>
  );
}
