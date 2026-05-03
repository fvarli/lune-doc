export const BRAND_NAME = 'Lunedoc';

interface LogoMarkProps {
  size?: number;
}

// Distinctive mark: a folded-corner page in accent gradient, with a clean
// geometric "L" (vertical stem + foot) in white. Scales cleanly to a 16px
// favicon without losing identity.
export function LogoMark({ size = 24 }: LogoMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <defs>
        <linearGradient id="pl-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="color-mix(in oklch, var(--accent), black 18%)" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="24" height="24" rx="7" fill="url(#pl-g)" />
      <path d="M19 2 L26 9 L19 9 Z" fill="color-mix(in oklch, var(--accent), white 24%)" />
      <path d="M8 7 H12 V17 H20 V21 H8 Z" fill="white" />
    </svg>
  );
}

interface LogoProps {
  size?: number;
  name?: string;
}

export function Logo({ size = 18, name = BRAND_NAME }: LogoProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: size,
        letterSpacing: '-0.025em',
        color: 'var(--fg)',
      }}
    >
      <LogoMark size={Math.round(size * 1.35)} />
      <span>{name}</span>
    </div>
  );
}
