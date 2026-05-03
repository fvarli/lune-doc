import { Icon, type IconName } from '../icons/Icon';

interface ToolIconProps {
  name: IconName;
  tone?: number;
  size?: number;
}

// Soft tinted square with the icon — keeps grid quiet but adds rhythm.
export function ToolIcon({ name, tone = 252, size = 40 }: ToolIconProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        background: `oklch(0.96 0.04 ${tone})`,
        color: `oklch(0.45 0.16 ${tone})`,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        border: '1px solid color-mix(in oklch, var(--line) 80%, transparent)',
      }}
    >
      <Icon name={name} size={Math.round(size * 0.55)} />
    </div>
  );
}
