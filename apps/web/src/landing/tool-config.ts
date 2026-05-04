/**
 * Single source of truth for the 8 tool landing pages.
 *
 * Both the React Router config (App.tsx) AND the prerender script
 * (scripts/prerender.ts) read this. The route slug, display name,
 * icon tone, and related-tools list all live here.
 */
import type { IconName, ToolKey } from '@lunedoc/ui';
import type { ToolPageContent } from '../data/ocr-pdf';
import { COMPRESS_PAGE } from '../data/compress-pdf';
import { CONVERT_PAGE } from '../data/convert-pdf';
import { EDIT_PAGE } from '../data/edit-pdf';
import { MERGE_PAGE } from '../data/merge-pdf';
import { OCR_PAGE } from '../data/ocr-pdf';
import { SIGN_PAGE } from '../data/sign-pdf';
import { SPLIT_PAGE } from '../data/split-pdf';
import { WATERMARK_PAGE } from '../data/watermark-pdf';
import type { Lang } from '@lunedoc/ui';

export interface ToolConfig {
  /** URL path component, e.g. "merge-pdf". The route is "/<slug>" or "/<lang>/<slug>". */
  slug: string;
  /** Pretty name in breadcrumbs + JSON-LD ("Merge PDF"). */
  displayName: string;
  /** Icon for the hero badge. */
  iconName: IconName;
  /** OKLCH hue used by the badge background and text. */
  badgeTone: number;
  /** 4 related-tool tile keys for the bottom of the page. */
  relatedToolKeys: ToolKey[];
  /** Per-locale content (title, h1, FAQ, HowTo, etc.). */
  content: Record<Lang, ToolPageContent>;
}

export const TOOL_CONFIGS: ToolConfig[] = [
  {
    slug: 'merge-pdf',
    displayName: 'Merge PDF',
    iconName: 'merge',
    badgeTone: 252,
    relatedToolKeys: ['split', 'compress', 'edit', 'watermark'],
    content: MERGE_PAGE,
  },
  {
    slug: 'split-pdf',
    displayName: 'Split PDF',
    iconName: 'split',
    badgeTone: 252,
    relatedToolKeys: ['merge', 'compress', 'edit', 'watermark'],
    content: SPLIT_PAGE,
  },
  {
    slug: 'compress-pdf',
    displayName: 'Compress PDF',
    iconName: 'compress',
    badgeTone: 200,
    relatedToolKeys: ['pdf_to_word', 'merge', 'split', 'edit'],
    content: COMPRESS_PAGE,
  },
  {
    slug: 'convert-pdf',
    displayName: 'Convert PDF',
    iconName: 'convert',
    badgeTone: 220,
    relatedToolKeys: ['ocr', 'compress', 'edit', 'merge'],
    content: CONVERT_PAGE,
  },
  {
    slug: 'watermark-pdf',
    displayName: 'Watermark PDF',
    iconName: 'watermark',
    badgeTone: 290,
    relatedToolKeys: ['edit', 'sign', 'compress', 'merge'],
    content: WATERMARK_PAGE,
  },
  {
    slug: 'sign-pdf',
    displayName: 'Sign PDF',
    iconName: 'sign',
    badgeTone: 30,
    relatedToolKeys: ['edit', 'watermark', 'compress', 'merge'],
    content: SIGN_PAGE,
  },
  {
    slug: 'ocr-pdf',
    displayName: 'OCR PDF',
    iconName: 'ocr',
    badgeTone: 290,
    relatedToolKeys: ['watermark', 'edit', 'sign', 'compress'],
    content: OCR_PAGE,
  },
  {
    slug: 'edit-pdf',
    displayName: 'Edit PDF',
    iconName: 'edit',
    badgeTone: 290,
    relatedToolKeys: ['watermark', 'sign', 'compress', 'merge'],
    content: EDIT_PAGE,
  },
];

/** Locales we generate static landing pages for. EN is at the root path. */
export const LANGS: Lang[] = ['en', 'tr', 'es'];
