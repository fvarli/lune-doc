import type { CSSProperties } from 'react';

export type IconName =
  | 'merge'
  | 'split'
  | 'compress'
  | 'convert'
  | 'doc'
  | 'calendar'
  | 'image'
  | 'rotate'
  | 'lock'
  | 'unlock'
  | 'sign'
  | 'edit'
  | 'watermark'
  | 'number'
  | 'ocr'
  | 'search'
  | 'upload'
  | 'download'
  | 'check'
  | 'arrow-right'
  | 'arrow-left'
  | 'chevron-down'
  | 'chevron-right'
  | 'globe'
  | 'shield'
  | 'sparkle'
  | 'menu'
  | 'close'
  | 'plus'
  | 'minus'
  | 'trash'
  | 'drag'
  | 'drive'
  | 'dropbox'
  | 'google'
  | 'apple'
  | 'home'
  | 'grid'
  | 'user'
  | 'star'
  | 'clock'
  | 'folder'
  | 'more'
  | 'list'
  | 'filter'
  | 'bell';

interface IconProps {
  name: IconName;
  size?: number;
  stroke?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = 18, stroke = 'currentColor', style }: IconProps) {
  const sw = 1.6;
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke,
    strokeWidth: sw,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    style,
  };
  switch (name) {
    case 'merge': return (<svg {...common}><path d="M5 4v5a3 3 0 0 0 3 3h4a3 3 0 0 1 3 3v1"/><path d="M3 4l2 -2 2 2"/><path d="M13 14l2 2 2 -2"/></svg>);
    case 'split': return (<svg {...common}><path d="M10 4v3"/><path d="M10 13v3"/><path d="M5 10h10"/><rect x="2" y="3" width="6" height="4" rx="1"/><rect x="12" y="3" width="6" height="4" rx="1"/><rect x="7" y="13" width="6" height="4" rx="1"/></svg>);
    case 'compress': return (<svg {...common}><path d="M3 8l3 -3M3 8l3 3M3 8h6"/><path d="M17 12l-3 -3M17 12l-3 3M17 12h-6"/></svg>);
    case 'convert': return (<svg {...common}><path d="M4 7h10l-2 -2"/><path d="M16 13H6l2 2"/></svg>);
    case 'doc': return (<svg {...common}><path d="M5 2h7l4 4v12a1 1 0 0 1 -1 1H5a1 1 0 0 1 -1 -1V3a1 1 0 0 1 1 -1z"/><path d="M12 2v5h4"/><path d="M7 11h6M7 14h4"/></svg>);
    case 'calendar': return (<svg {...common}><rect x="3" y="4" width="14" height="13" rx="2"/><path d="M3 8h14"/><path d="M7 2v4M13 2v4"/></svg>);
    case 'image': return (<svg {...common}><rect x="3" y="3" width="14" height="14" rx="2"/><circle cx="7.5" cy="7.5" r="1.2"/><path d="M3 14l4 -4 3 3 3 -3 4 4"/></svg>);
    case 'rotate': return (<svg {...common}><path d="M16 5v4h-4"/><path d="M16 9a6 6 0 1 0 -1.5 5"/></svg>);
    case 'lock': return (<svg {...common}><rect x="4" y="9" width="12" height="8" rx="2"/><path d="M7 9V6a3 3 0 0 1 6 0v3"/></svg>);
    case 'unlock': return (<svg {...common}><rect x="4" y="9" width="12" height="8" rx="2"/><path d="M7 9V6a3 3 0 0 1 6 0"/></svg>);
    case 'sign': return (<svg {...common}><path d="M3 16c2 0 3 -1 4 -3s2 -6 4 -6 1 4 3 4 2 -2 3 -2"/><path d="M2 18h16"/></svg>);
    case 'edit': return (<svg {...common}><path d="M3 17l3 -1 9 -9 -2 -2 -9 9 -1 3z"/><path d="M13 5l2 2"/></svg>);
    case 'watermark': return (<svg {...common}><rect x="3" y="3" width="14" height="14" rx="2"/><path d="M6 14l3 -4 3 3 2 -2"/><path d="M14 6l-1 2 2 1"/></svg>);
    case 'number': return (<svg {...common}><path d="M3 7h14M3 13h14"/><path d="M7 4l-1 12M13 4l-1 12"/></svg>);
    case 'ocr': return (<svg {...common}><path d="M3 6V4a1 1 0 0 1 1 -1h2"/><path d="M14 3h2a1 1 0 0 1 1 1v2"/><path d="M3 14v2a1 1 0 0 0 1 1h2"/><path d="M14 17h2a1 1 0 0 0 1 -1v-2"/><path d="M7 8l3 4 3 -4"/></svg>);
    case 'search': return (<svg {...common}><circle cx="9" cy="9" r="5"/><path d="M13 13l4 4"/></svg>);
    case 'upload': return (<svg {...common}><path d="M10 14V4"/><path d="M6 8l4 -4 4 4"/><path d="M3 14v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1 -1v-2"/></svg>);
    case 'download': return (<svg {...common}><path d="M10 4v10"/><path d="M6 10l4 4 4 -4"/><path d="M3 16v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1 -1v-1"/></svg>);
    case 'check': return (<svg {...common}><path d="M4 10l3 3 9 -9"/></svg>);
    case 'arrow-right': return (<svg {...common}><path d="M4 10h12"/><path d="M12 6l4 4 -4 4"/></svg>);
    case 'arrow-left': return (<svg {...common}><path d="M16 10H4"/><path d="M8 6l-4 4 4 4"/></svg>);
    case 'chevron-down': return (<svg {...common}><path d="M5 8l5 4 5 -4"/></svg>);
    case 'chevron-right': return (<svg {...common}><path d="M8 5l4 5 -4 5"/></svg>);
    case 'globe': return (<svg {...common}><circle cx="10" cy="10" r="7"/><path d="M3 10h14"/><path d="M10 3c2.5 2 2.5 12 0 14"/><path d="M10 3c-2.5 2 -2.5 12 0 14"/></svg>);
    case 'shield': return (<svg {...common}><path d="M10 3l6 2v4c0 4 -3 7 -6 8c-3 -1 -6 -4 -6 -8V5l6 -2z"/></svg>);
    case 'sparkle': return (<svg {...common}><path d="M10 3l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5z"/></svg>);
    case 'menu': return (<svg {...common}><path d="M3 5h14M3 10h14M3 15h14"/></svg>);
    case 'close': return (<svg {...common}><path d="M5 5l10 10M15 5l-10 10"/></svg>);
    case 'plus': return (<svg {...common}><path d="M10 4v12M4 10h12"/></svg>);
    case 'minus': return (<svg {...common}><path d="M4 10h12"/></svg>);
    case 'trash': return (<svg {...common}><path d="M4 6h12"/><path d="M8 6V4h4v2"/><path d="M5 6l1 11h8l1 -11"/></svg>);
    case 'drag': return (<svg {...common}><circle cx="7" cy="5" r="1"/><circle cx="13" cy="5" r="1"/><circle cx="7" cy="10" r="1"/><circle cx="13" cy="10" r="1"/><circle cx="7" cy="15" r="1"/><circle cx="13" cy="15" r="1"/></svg>);
    case 'drive': return (<svg {...common}><path d="M7 3l-4 8 3 5h8l3 -5 -4 -8z"/><path d="M3 11h14"/><path d="M11 3l3 8"/></svg>);
    case 'dropbox': return (<svg {...common}><path d="M5 4l5 3 -5 3 -3 -3z"/><path d="M15 4l-5 3 5 3 3 -3z"/><path d="M5 13l5 3 5 -3"/></svg>);
    case 'google': return (<svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" style={style}><path d="M19.6 10.23c0-.7-.06-1.36-.18-2H10v3.78h5.36a4.6 4.6 0 0 1-2 3.02v2.5h3.22c1.88-1.74 2.96-4.3 2.96-7.3z" fill="#4285F4"/><path d="M10 20c2.7 0 4.96-.9 6.62-2.43l-3.22-2.5c-.9.6-2.04.96-3.4.96-2.6 0-4.81-1.76-5.6-4.13H1.07v2.6A10 10 0 0 0 10 20z" fill="#34A853"/><path d="M4.4 11.9a6 6 0 0 1 0-3.81V5.49H1.07a10 10 0 0 0 0 9.02L4.4 11.9z" fill="#FBBC05"/><path d="M10 3.96c1.47 0 2.78.5 3.81 1.5l2.85-2.85C14.96 1.06 12.7 0 10 0A10 10 0 0 0 1.07 5.49l3.33 2.6C5.19 5.72 7.4 3.96 10 3.96z" fill="#EA4335"/></svg>);
    case 'apple': return (<svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" style={style}><path d="M14.94 10.6c-.02-2.1 1.72-3.1 1.8-3.16-1-1.44-2.5-1.64-3.04-1.66-1.3-.13-2.53.76-3.18.76-.66 0-1.68-.74-2.76-.72-1.42.02-2.74.83-3.46 2.1-1.48 2.56-.38 6.34 1.06 8.42.7 1.02 1.54 2.16 2.62 2.12 1.04-.04 1.44-.68 2.7-.68 1.26 0 1.62.68 2.72.66 1.12-.02 1.84-1.04 2.54-2.06.8-1.18 1.12-2.32 1.14-2.38-.02-.02-2.18-.84-2.2-3.36zM12.86 4.36c.56-.7.94-1.66.84-2.6-.8.04-1.78.54-2.36 1.22-.52.6-.98 1.58-.86 2.5.9.06 1.82-.46 2.38-1.12z"/></svg>);
    case 'home': return (<svg {...common}><path d="M3 9l7 -6 7 6"/><path d="M5 9v8a1 1 0 0 0 1 1h3v-5h2v5h3a1 1 0 0 0 1 -1V9"/></svg>);
    case 'grid': return (<svg {...common}><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="11" y="3" width="6" height="6" rx="1"/><rect x="3" y="11" width="6" height="6" rx="1"/><rect x="11" y="11" width="6" height="6" rx="1"/></svg>);
    case 'user': return (<svg {...common}><circle cx="10" cy="7" r="3"/><path d="M4 17a6 6 0 0 1 12 0"/></svg>);
    case 'star': return (<svg {...common}><path d="M10 3l2.4 4.9 5.4 0.8 -3.9 3.8 0.9 5.4 -4.8 -2.5 -4.8 2.5 0.9 -5.4 -3.9 -3.8 5.4 -0.8z"/></svg>);
    case 'clock': return (<svg {...common}><circle cx="10" cy="10" r="7"/><path d="M10 6v4l3 2"/></svg>);
    case 'folder': return (<svg {...common}><path d="M3 6a1 1 0 0 1 1 -1h4l2 2h7a1 1 0 0 1 1 1v8a1 1 0 0 1 -1 1H4a1 1 0 0 1 -1 -1z"/></svg>);
    case 'more': return (<svg {...common}><circle cx="5" cy="10" r="1"/><circle cx="10" cy="10" r="1"/><circle cx="15" cy="10" r="1"/></svg>);
    case 'list': return (<svg {...common}><path d="M3 5h14M3 10h14M3 15h14"/></svg>);
    case 'filter': return (<svg {...common}><path d="M3 5h14l-5 6v5l-4 -2v-3z"/></svg>);
    case 'bell': return (<svg {...common}><path d="M5 9a5 5 0 0 1 10 0v3l1 2H4l1 -2z"/><path d="M8 16a2 2 0 0 0 4 0"/></svg>);
  }
}
