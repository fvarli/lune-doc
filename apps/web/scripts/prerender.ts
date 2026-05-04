/**
 * Static-HTML prerender for SEO.
 *
 * After `vite build` finishes, this script walks the 25-route inventory
 * (1 home + 8 tools × 3 locales) and writes a per-route index.html into
 * dist/. Each generated file has the correct head metadata:
 *   - <title>, <meta name="description">
 *   - <link rel="canonical">, hreflang × 4
 *   - 4 JSON-LD blocks (SoftwareApplication, FAQPage, HowTo, BreadcrumbList)
 *   - <html lang="..."> matching the locale
 *
 * The body is the same SPA shell that Vite emitted in dist/index.html
 * (a single <div id="root"></div> + the JS bundle). React hydrates on
 * load, reads the URL, and renders the matching landing page + tool
 * widget. Modern crawlers that execute JS see the full content; non-JS
 * crawlers see the static head metadata.
 *
 * NOT a true SSG — for that we'd need vite-react-ssg or an SSR build.
 * This script is the cheapest correct alternative for SEO surface only.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SITE_ORIGIN,
  breadcrumbListSchema,
  faqPageSchema,
  howToSchema,
  softwareApplicationSchema,
} from '../src/seo/schema';
import type { ToolPageContent } from '../src/data/ocr-pdf';
import { LANGS, TOOL_CONFIGS } from '../src/landing/tool-config';
import type { ToolConfig } from '../src/landing/tool-config';
import type { Lang } from '@lunedoc/ui';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), '..');
const DIST = join(ROOT, 'dist');

const HOME_TITLES: Record<Lang, { title: string; description: string }> = {
  en: {
    title: 'Lunedoc — Every PDF tool you need, in one quiet place.',
    description:
      'Merge, compress, convert and sign documents in seconds. No installs. No clutter.',
  },
  tr: {
    title: 'Lunedoc — İhtiyacınız olan her PDF aracı, tek sakin yerde.',
    description:
      'Belgeleri saniyeler içinde birleştirin, sıkıştırın, dönüştürün ve imzalayın.',
  },
  es: {
    title:
      'Lunedoc — Toda herramienta PDF que necesitas, en un solo lugar tranquilo.',
    description:
      'Combina, comprime, convierte y firma documentos en segundos. Sin instalaciones. Sin ruido.',
  },
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function jsonLdScript(obj: unknown): string {
  // Inside a <script>, only </script> needs escaping.
  const json = JSON.stringify(obj).replace(/<\/script/gi, '<\\/script');
  return `    <script type="application/ld+json">${json}</script>`;
}

function buildToolHead(
  config: ToolConfig,
  lang: Lang,
  content: ToolPageContent,
): string {
  const url =
    lang === 'en'
      ? `${SITE_ORIGIN}/${config.slug}`
      : `${SITE_ORIGIN}/${lang}/${config.slug}`;
  const enUrl = `${SITE_ORIGIN}/${config.slug}`;
  const trUrl = `${SITE_ORIGIN}/tr/${config.slug}`;
  const esUrl = `${SITE_ORIGIN}/es/${config.slug}`;

  const softwareApp = softwareApplicationSchema({
    name: `Lunedoc ${config.displayName}`,
    url,
  });
  const faq = faqPageSchema(content.faq);
  const howTo = howToSchema({
    name: content.howToTitle,
    description: content.sub,
    totalTime: 'PT1M',
    steps: content.howToSteps,
  });
  const breadcrumbs = breadcrumbListSchema([
    {
      name: 'Home',
      url: lang === 'en' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}/${lang}/`,
    },
    {
      name: 'Tools',
      url:
        lang === 'en'
          ? `${SITE_ORIGIN}/tools`
          : `${SITE_ORIGIN}/${lang}/tools`,
    },
    { name: config.displayName, url },
  ]);

  return [
    `    <title>${escapeHtml(content.seoTitle)}</title>`,
    `    <meta name="description" content="${escapeHtml(content.metaDescription)}" />`,
    `    <link rel="canonical" href="${url}" />`,
    `    <link rel="alternate" hreflang="en" href="${enUrl}" />`,
    `    <link rel="alternate" hreflang="tr" href="${trUrl}" />`,
    `    <link rel="alternate" hreflang="es" href="${esUrl}" />`,
    `    <link rel="alternate" hreflang="x-default" href="${enUrl}" />`,
    jsonLdScript(softwareApp),
    jsonLdScript(faq),
    jsonLdScript(howTo),
    jsonLdScript(breadcrumbs),
  ].join('\n');
}

function buildHomeHead(lang: Lang): string {
  const { title, description } = HOME_TITLES[lang];
  const url = lang === 'en' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}/${lang}/`;
  const breadcrumbs = breadcrumbListSchema([
    { name: 'Tools', url },
  ]);

  return [
    `    <title>${escapeHtml(title)}</title>`,
    `    <meta name="description" content="${escapeHtml(description)}" />`,
    `    <link rel="canonical" href="${url}" />`,
    `    <link rel="alternate" hreflang="en" href="${SITE_ORIGIN}/" />`,
    `    <link rel="alternate" hreflang="tr" href="${SITE_ORIGIN}/tr/" />`,
    `    <link rel="alternate" hreflang="es" href="${SITE_ORIGIN}/es/" />`,
    `    <link rel="alternate" hreflang="x-default" href="${SITE_ORIGIN}/" />`,
    jsonLdScript(breadcrumbs),
  ].join('\n');
}

function injectIntoTemplate(template: string, lang: Lang, head: string): string {
  // Replace the <html lang="..."> attribute and inject our head section
  // just before </head>. Vite emits the placeholder <title>web</title>
  // in the template — strip it so we don't ship two titles.
  let out = template
    .replace(/<html lang="[^"]*">/i, `<html lang="${lang}">`)
    .replace(/<title>[^<]*<\/title>\s*/i, '');
  out = out.replace(/<\/head>/i, `${head}\n  </head>`);
  return out;
}

function writeRoute(distPath: string, html: string): void {
  const dir = dirname(distPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(distPath, html, 'utf8');
}

function main(): void {
  if (!existsSync(DIST)) {
    console.error(`prerender: ${DIST} does not exist — did vite build run?`);
    process.exit(1);
  }
  const templatePath = join(DIST, 'index.html');
  if (!existsSync(templatePath)) {
    console.error(`prerender: ${templatePath} does not exist`);
    process.exit(1);
  }
  const template = readFileSync(templatePath, 'utf8');

  let routesWritten = 0;

  // Home routes (1 EN at root, 2 localized).
  for (const lang of LANGS) {
    const head = buildHomeHead(lang);
    const html = injectIntoTemplate(template, lang, head);
    const out =
      lang === 'en' ? join(DIST, 'index.html') : join(DIST, lang, 'index.html');
    writeRoute(out, html);
    routesWritten++;
  }

  // Tool routes: 8 EN + 16 localized.
  for (const config of TOOL_CONFIGS) {
    for (const lang of LANGS) {
      const content = config.content[lang];
      const head = buildToolHead(config, lang, content);
      const html = injectIntoTemplate(template, lang, head);
      const out =
        lang === 'en'
          ? join(DIST, config.slug, 'index.html')
          : join(DIST, lang, config.slug, 'index.html');
      writeRoute(out, html);
      routesWritten++;
    }
  }

  console.log(`prerender: wrote ${routesWritten} routes under dist/`);
}

main();
