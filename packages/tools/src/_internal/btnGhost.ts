import type { CSSProperties } from 'react';

// Shared 28×28 ghost-button style used by tool widgets for inline row
// actions (move-up/down, trash, etc.). Internal to @lunedoc/tools — not
// re-exported from the package barrel.
export function btnGhost(disabled: boolean): CSSProperties {
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
