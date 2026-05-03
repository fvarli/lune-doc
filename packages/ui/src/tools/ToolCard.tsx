import { useI18n } from '@lunedoc/i18n';
import { ToolIcon } from './ToolIcon';
import { TOOLS, type ToolKey } from './tools';
import type { Lang } from '../types';

interface ToolCardProps {
  toolKey: ToolKey;
  lang?: Lang;
  onClick?: () => void;
  featured?: boolean;
}

export function ToolCard({ toolKey, lang = 'en', onClick, featured }: ToolCardProps) {
  const { t } = useI18n(lang);
  const tool = TOOLS.find((x) => x.key === toolKey);
  if (!tool) return null;
  return (
    <button
      onClick={onClick}
      className="pl-card"
      style={{
        textAlign: 'left',
        padding: 'var(--tool-card-pad)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--tool-card-gap)',
        transition: 'border-color .15s ease, transform .15s ease, box-shadow .15s ease',
        border: featured
          ? '1px solid color-mix(in oklch, var(--accent) 35%, var(--line))'
          : '1px solid var(--line)',
        background: 'var(--bg-elev)',
        width: '100%',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = 'var(--line-strong)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = featured
          ? 'color-mix(in oklch, var(--accent) 35%, var(--line))'
          : 'var(--line)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <ToolIcon name={tool.icon} tone={tool.tone} size={40} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--fg)', textWrap: 'balance' }}>
          {t('t_' + tool.key)}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.45, textWrap: 'pretty' }}>
          {t('t_' + tool.key + '_d')}
        </div>
      </div>
    </button>
  );
}
