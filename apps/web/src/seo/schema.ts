// Typed JSON-LD helpers for SEO tool landing pages.
// Each function returns a plain object; callers stringify it inside a
// <script type="application/ld+json"> block.
//
// Spec source: docs/seo-tool-page-template.md §11.

export const SITE_ORIGIN = 'https://lunedoc.app';
// Placeholder domain — see project-status.md Q1. Single source of truth so a
// future domain change is one edit.

export interface FaqItem {
  q: string;
  a: string;
}

export interface HowToStepInput {
  name: string;
  text: string;
  image?: string;
}

interface Offer {
  '@type': 'Offer';
  price: string;
  priceCurrency: string;
}

interface OrganizationRef {
  '@type': 'Organization';
  name: string;
  url: string;
}

interface QuestionEntity {
  '@type': 'Question';
  name: string;
  acceptedAnswer: {
    '@type': 'Answer';
    text: string;
  };
}

interface HowToStepEntity {
  '@type': 'HowToStep';
  position: number;
  name: string;
  text: string;
  image?: string;
}

interface BreadcrumbItemEntity {
  '@type': 'ListItem';
  position: number;
  name: string;
  item: string;
}

export interface SoftwareApplicationSchema {
  '@context': 'https://schema.org';
  '@type': 'SoftwareApplication';
  name: string;
  url: string;
  applicationCategory: 'BusinessApplication';
  operatingSystem: 'Web';
  browserRequirements: 'Requires JavaScript';
  offers: Offer;
  publisher: OrganizationRef;
}

export function softwareApplicationSchema(args: { name: string; url: string }): SoftwareApplicationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: args.name,
    url: args.url,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Lunedoc',
      url: SITE_ORIGIN,
    },
  };
}

export interface FaqPageSchema {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: QuestionEntity[];
}

export function faqPageSchema(faqs: FaqItem[]): FaqPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };
}

export interface HowToSchema {
  '@context': 'https://schema.org';
  '@type': 'HowTo';
  name: string;
  description: string;
  totalTime: string;
  step: HowToStepEntity[];
}

export function howToSchema(args: { name: string; description: string; totalTime: string; steps: HowToStepInput[] }): HowToSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: args.name,
    description: args.description,
    totalTime: args.totalTime,
    step: args.steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
      ...(s.image ? { image: s.image } : {}),
    })),
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface BreadcrumbListSchema {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: BreadcrumbItemEntity[];
}

export function breadcrumbListSchema(crumbs: BreadcrumbItem[]): BreadcrumbListSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}
