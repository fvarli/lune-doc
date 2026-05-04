import type { ReactNode } from 'react';
import { Footer, Header, Icon, ToolCard, type IconName, type Lang, type ToolKey } from '@lunedoc/ui';
import {
  SITE_ORIGIN,
  breadcrumbListSchema,
  faqPageSchema,
  howToSchema,
  softwareApplicationSchema,
} from '../seo/schema';
import type { ToolPageContent } from '../data/ocr-pdf';

interface ToolLandingPageProps {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Canonical EN path (e.g. "/merge-pdf"). TR/ES variants prepend "/{lang}". */
  canonicalPath: string;
  toolDisplayName: string;
  toolIconName: IconName;
  toolBadgeTone: number;
  content: ToolPageContent;
  relatedToolKeys: ToolKey[];
  /** The tool widget — already locale-aware. */
  children: ReactNode;
}

/**
 * Re-implementation of apps/marketing's ToolLandingLayout.astro, in React.
 * Renders SEO metadata via React 19's metadata hoisting (rendered inline by
 * react-dom but moved to <head> by the browser on hydration).
 *
 * For real static-HTML SEO, see scripts/prerender.ts — that script writes
 * the same head tags directly into per-route index.html files at build time.
 */
export function ToolLandingPage({
  lang,
  setLang,
  canonicalPath,
  toolDisplayName,
  toolIconName,
  toolBadgeTone,
  content,
  relatedToolKeys,
  children,
}: ToolLandingPageProps) {
  const url =
    lang === 'en' ? `${SITE_ORIGIN}${canonicalPath}` : `${SITE_ORIGIN}/${lang}${canonicalPath}`;
  const enUrl = `${SITE_ORIGIN}${canonicalPath}`;
  const trUrl = `${SITE_ORIGIN}/tr${canonicalPath}`;
  const esUrl = `${SITE_ORIGIN}/es${canonicalPath}`;

  const softwareApp = softwareApplicationSchema({
    name: `Lunedoc ${toolDisplayName}`,
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
    { name: 'Home', url: lang === 'en' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}/${lang}/` },
    { name: 'Tools', url: lang === 'en' ? `${SITE_ORIGIN}/tools` : `${SITE_ORIGIN}/${lang}/tools` },
    { name: toolDisplayName, url },
  ]);

  return (
    <>
      {/* React 19 hoists these to <head> on hydration. The prerender step
          also injects them statically so crawlers without JS see them. */}
      <title>{content.seoTitle}</title>
      <meta name="description" content={content.metaDescription} />
      <link rel="canonical" href={url} />
      <link rel="alternate" hrefLang="en" href={enUrl} />
      <link rel="alternate" hrefLang="tr" href={trUrl} />
      <link rel="alternate" hrefLang="es" href={esUrl} />
      <link rel="alternate" hrefLang="x-default" href={enUrl} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          background: 'var(--bg)',
          color: 'var(--fg)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <Header lang={lang} setLang={setLang} />

        <main style={{ flex: 1 }}>
          {/* Hero */}
          <section style={{ padding: '4rem 1.5rem 2rem', maxWidth: 920, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 24 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `oklch(0.96 0.04 ${toolBadgeTone})`,
                  color: `oklch(0.45 0.18 ${toolBadgeTone})`,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon name={toolIconName} size={22} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--fg-subtle)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontFamily: 'var(--font-mono)',
                    marginBottom: 6,
                  }}
                >
                  {content.eyebrow}
                </div>
                <h1
                  style={{
                    fontSize: 40,
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    margin: 0,
                  }}
                >
                  {content.h1}
                </h1>
                <p
                  style={{
                    marginTop: 8,
                    fontSize: 17,
                    color: 'var(--fg-muted)',
                    lineHeight: 1.5,
                    maxWidth: 640,
                  }}
                >
                  {content.sub}
                </p>
              </div>
            </div>

            {/* Trust strip */}
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: '24px 0 0',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 16,
                fontSize: 13,
                color: 'var(--fg-muted)',
              }}
            >
              {content.trust.map((item, i) => (
                <li
                  key={i}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Icon name="check" size={14} stroke="oklch(0.55 0.16 145)" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Tool widget slot */}
          <section style={{ padding: '0 0 32px' }}>{children}</section>

          {/* How-to */}
          <section style={{ padding: '48px 1.5rem', maxWidth: 920, margin: '0 auto' }}>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                margin: '0 0 20px',
              }}
            >
              {content.howToLabel}
            </h2>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
              {content.howToSteps.map((s, i) => (
                <li
                  key={i}
                  className="pl-card"
                  style={{
                    padding: '16px 18px',
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      background: 'var(--accent-soft)',
                      color: 'var(--accent)',
                      display: 'grid',
                      placeItems: 'center',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{s.name}</div>
                    <div
                      style={{ fontSize: 14, color: 'var(--fg-muted)', lineHeight: 1.5 }}
                    >
                      {s.text}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* FAQ */}
          <section style={{ padding: '32px 1.5rem 48px', maxWidth: 920, margin: '0 auto' }}>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                margin: '0 0 20px',
              }}
            >
              {content.faqLabel}
            </h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {content.faq.map((f, i) => (
                <details key={i} className="pl-card" style={{ padding: '14px 18px' }}>
                  <summary
                    style={{
                      cursor: 'pointer',
                      fontSize: 15,
                      fontWeight: 600,
                      listStyle: 'none',
                    }}
                  >
                    {f.q}
                  </summary>
                  <p
                    style={{
                      margin: '10px 0 0',
                      fontSize: 14,
                      color: 'var(--fg-muted)',
                      lineHeight: 1.6,
                    }}
                  >
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* Related tools */}
          <section style={{ padding: '32px 1.5rem 64px', maxWidth: 920, margin: '0 auto' }}>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                margin: '0 0 20px',
              }}
            >
              {content.relatedLabel}
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
              }}
            >
              {relatedToolKeys.map((key) => (
                <ToolCard key={key} toolKey={key} lang={lang} />
              ))}
            </div>
          </section>
        </main>

        <Footer lang={lang} />
      </div>
    </>
  );
}
