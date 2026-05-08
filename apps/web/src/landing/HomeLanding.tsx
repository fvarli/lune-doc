import { Link } from 'react-router-dom';
import {
  Footer,
  Header,
  Icon,
  ToolCard,
  type Lang,
  type ToolKey,
} from '@lunedoc/ui';
import { SITE_ORIGIN, breadcrumbListSchema } from '../seo/schema';
import { AuthHeaderControls } from '../auth/AuthHeaderControls';

interface HomeLandingProps {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

/** The 8 MVP tools that have routes today. Order matches the home grid. */
const ACTIVE_TOOL_KEYS: ToolKey[] = [
  'merge',
  'split',
  'compress',
  'watermark',
  'sign',
  'edit',
  'ocr',
  // Convert is a category in TOOLS; the route is /convert-pdf.
  // Map it to the 'pdf_to_word' card here (closest single key).
  'pdf_to_word',
];

const TOOL_PATH: Partial<Record<ToolKey, string>> = {
  merge: '/merge-pdf',
  split: '/split-pdf',
  compress: '/compress-pdf',
  watermark: '/watermark-pdf',
  sign: '/sign-pdf',
  edit: '/edit-pdf',
  ocr: '/ocr-pdf',
  pdf_to_word: '/convert-pdf',
};

const HOME_COPY: Record<
  Lang,
  {
    title: string;
    description: string;
    eyebrow: string;
    h1: string;
    sub: string;
    toolsLabel: string;
    openMerge: string;
    openSplit: string;
  }
> = {
  en: {
    title: 'Lunedoc — Every PDF tool you need, in one quiet place.',
    description:
      'Merge, compress, convert and sign documents in seconds. No installs. No clutter.',
    eyebrow: 'PDF tools, simplified',
    h1: 'Every PDF tool you need, in one quiet place.',
    sub: 'Merge, compress, convert and sign documents in seconds. No installs. No clutter.',
    toolsLabel: 'Tools',
    openMerge: 'Open Merge PDF',
    openSplit: 'Open Split PDF',
  },
  tr: {
    title: 'Lunedoc — İhtiyacınız olan her PDF aracı, tek sakin yerde.',
    description:
      'Belgeleri saniyeler içinde birleştirin, sıkıştırın, dönüştürün ve imzalayın.',
    eyebrow: 'PDF araçları, sadeleştirildi',
    h1: 'İhtiyacınız olan her PDF aracı, tek sakin yerde.',
    sub: 'Belgeleri saniyeler içinde birleştirin, sıkıştırın, dönüştürün ve imzalayın. Kurulum yok. Karmaşa yok.',
    toolsLabel: 'Araçlar',
    openMerge: 'PDF Birleştir',
    openSplit: 'PDF Böl',
  },
  es: {
    title:
      'Lunedoc — Toda herramienta PDF que necesitas, en un solo lugar tranquilo.',
    description:
      'Combina, comprime, convierte y firma documentos en segundos. Sin instalaciones. Sin ruido.',
    eyebrow: 'Herramientas PDF, simplificadas',
    h1: 'Toda herramienta PDF que necesitas, en un solo lugar tranquilo.',
    sub: 'Combina, comprime, convierte y firma documentos en segundos. Sin instalaciones. Sin ruido.',
    toolsLabel: 'Herramientas',
    openMerge: 'Abrir Combinar PDF',
    openSplit: 'Abrir Dividir PDF',
  },
};

export function HomeLanding({ lang, setLang }: HomeLandingProps) {
  const copy = HOME_COPY[lang];
  const url = lang === 'en' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}/${lang}/`;
  const breadcrumbs = breadcrumbListSchema([
    { name: copy.toolsLabel, url },
  ]);

  const localizedPath = (path: string): string =>
    lang === 'en' ? path : `/${lang}${path}`;

  return (
    <>
      <title>{copy.title}</title>
      <meta name="description" content={copy.description} />
      <link rel="canonical" href={url} />
      <link rel="alternate" hrefLang="en" href={`${SITE_ORIGIN}/`} />
      <link rel="alternate" hrefLang="tr" href={`${SITE_ORIGIN}/tr/`} />
      <link rel="alternate" hrefLang="es" href={`${SITE_ORIGIN}/es/`} />
      <link rel="alternate" hrefLang="x-default" href={`${SITE_ORIGIN}/`} />
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
        <Header lang={lang} setLang={setLang} rightSlot={<AuthHeaderControls lang={lang} />} />

        <main style={{ flex: 1 }}>
          <section
            style={{
              padding: '5rem 1.5rem 3rem',
              maxWidth: 920,
              margin: '0 auto',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--fg-subtle)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontFamily: 'var(--font-mono)',
                marginBottom: 12,
              }}
            >
              {copy.eyebrow}
            </div>
            <h1
              style={{
                fontSize: 44,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              {copy.h1}
            </h1>
            <p
              style={{
                marginTop: 16,
                fontSize: 18,
                color: 'var(--fg-muted)',
                lineHeight: 1.55,
                maxWidth: 640,
              }}
            >
              {copy.sub}
            </p>
          </section>

          <section
            style={{ padding: '0 1.5rem 4rem', maxWidth: 1080, margin: '0 auto' }}
          >
            <h2
              style={{
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                margin: '0 0 20px',
              }}
            >
              {copy.toolsLabel}
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 12,
              }}
            >
              {ACTIVE_TOOL_KEYS.map((key) => {
                const path = TOOL_PATH[key];
                if (!path) return null;
                return (
                  <Link
                    key={key}
                    to={localizedPath(path)}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <ToolCard toolKey={key} lang={lang} />
                  </Link>
                );
              })}
            </div>

            <div
              style={{
                marginTop: 32,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                alignItems: 'center',
              }}
            >
              <Link
                to={localizedPath('/merge-pdf')}
                className="pl-btn pl-btn-primary pl-btn-lg"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  textDecoration: 'none',
                }}
              >
                <Icon name="merge" size={16} stroke="var(--accent-fg)" />
                {copy.openMerge}
              </Link>
              <Link
                to={localizedPath('/split-pdf')}
                className="pl-btn pl-btn-ghost pl-btn-lg"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  textDecoration: 'none',
                }}
              >
                <Icon name="split" size={16} />
                {copy.openSplit}
              </Link>
            </div>
          </section>
        </main>

        <Footer lang={lang} />
      </div>
    </>
  );
}
