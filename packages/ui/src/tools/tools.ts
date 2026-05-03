import type { IconName } from '../icons/Icon';

export type ToolCategory = 'organize' | 'compress' | 'convert' | 'edit' | 'security';

// Source of truth for the 18 MVP tools. `as const satisfies` validates each
// entry against the schema (icon must be IconName, cat must be ToolCategory)
// while preserving literal types so ToolKey can be derived below.
export const TOOLS = [
  { key: 'merge',        icon: 'merge',     cat: 'organize', tone: 252 },
  { key: 'split',        icon: 'split',     cat: 'organize', tone: 252 },
  { key: 'rotate',       icon: 'rotate',    cat: 'organize', tone: 252 },
  { key: 'compress',     icon: 'compress',  cat: 'compress', tone: 200 },
  { key: 'pdf_to_word',  icon: 'doc',       cat: 'convert',  tone: 220 },
  { key: 'pdf_to_jpg',   icon: 'image',     cat: 'convert',  tone: 220 },
  { key: 'pdf_to_excel', icon: 'doc',       cat: 'convert',  tone: 220 },
  { key: 'pdf_to_ppt',   icon: 'doc',       cat: 'convert',  tone: 220 },
  { key: 'word_to_pdf',  icon: 'doc',       cat: 'convert',  tone: 220 },
  { key: 'jpg_to_pdf',   icon: 'image',     cat: 'convert',  tone: 220 },
  { key: 'edit',         icon: 'edit',      cat: 'edit',     tone: 290 },
  { key: 'watermark',    icon: 'watermark', cat: 'edit',     tone: 290 },
  { key: 'page_numbers', icon: 'number',    cat: 'edit',     tone: 290 },
  { key: 'ocr',          icon: 'ocr',       cat: 'edit',     tone: 290 },
  { key: 'sign',         icon: 'sign',      cat: 'security', tone: 30 },
  { key: 'protect',      icon: 'lock',      cat: 'security', tone: 30 },
  { key: 'unlock',       icon: 'unlock',    cat: 'security', tone: 30 },
  { key: 'redact',       icon: 'shield',    cat: 'security', tone: 30 },
] as const satisfies readonly {
  readonly key: string;
  readonly icon: IconName;
  readonly cat: ToolCategory;
  readonly tone: number;
}[];

export type ToolKey = (typeof TOOLS)[number]['key'];

export interface Tool {
  key: ToolKey;
  icon: IconName;
  cat: ToolCategory;
  tone: number;
}
