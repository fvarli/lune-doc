# Lunedoc — SEO Template for Tool Pages

**Status:** documentation only. No SEO pages implemented yet — current prototype renders all tools inside the design canvas. This document defines the template that each `/<tool>-pdf` page must follow once we ship the production marketing site.

**Scope:** every tool that gets its own dedicated landing URL:

```
/compress-pdf   /merge-pdf      /split-pdf      /convert-pdf
/watermark-pdf  /sign-pdf       /ocr-pdf        /edit-pdf
```

Each follows the same structural template with tool-specific copy. Consistency makes the template cheap to maintain and gives Google a clear pattern to crawl.

---

## 1. URL pattern

| Surface | Pattern | Example |
|---|---|---|
| Canonical EN | `https://lunedoc.app/<tool>-pdf` | `/ocr-pdf` |
| TR locale | `https://lunedoc.app/tr/<tool>-pdf` | `/tr/ocr-pdf` |
| ES locale | `https://lunedoc.app/es/<tool>-pdf` | `/es/ocr-pdf` |
| Trailing slash | **never** | always `/ocr-pdf`, never `/ocr-pdf/` |
| Casing | always lowercase | redirect uppercase to lowercase with 301 |

Rules:

- Path-based locale prefix beats subdomain-based for SEO simplicity. Reserve `app.lunedoc.app` for the authenticated app once we ship it.
- The slug **always ends in `-pdf`**. It's an explicit search-intent signal; users search "compress pdf" 100× more than "compress" alone.
- One canonical URL per tool per locale. `<link rel="canonical">` always points at the locale's own URL.
- `<link rel="alternate" hreflang="...">` connects the three locale variants. See §12.

---

## 2. SEO title formula

```
{Tool verb} PDF {modifier} — {brand promise} | Lunedoc
```

- **Tool verb:** the imperative the user typed into Google ("Compress", "Merge", "OCR").
- **Modifier:** optional differentiator that matches a real query refinement ("Online", "Free", "in your browser").
- **Brand promise:** one of {`Free`, `Private`, `No signup`, `In seconds`} — pick the one that the user-research suggests is the strongest objection-killer for this tool. Don't stack three.
- **Pipe + Lunedoc** at the end keeps brand presence without crowding the truncation point.

Hard limit: **60 characters** (Google truncates at ~580px). If the formula would exceed, drop the modifier first.

| Tool | Title |
|---|---|
| Compress | `Compress PDF Online — Free, No Signup \| Lunedoc` |
| Merge | `Merge PDF Files — Free in Your Browser \| Lunedoc` |
| Split | `Split PDF — Extract or Divide Pages \| Lunedoc` |
| Convert | `Convert PDF to Word, JPG, Excel & Back \| Lunedoc` |
| Watermark | `Add Watermark to PDF — Free Online \| Lunedoc` |
| Sign | `Sign PDF Online — Draw, Type, Upload \| Lunedoc` |
| OCR | `OCR PDF — Make Scans Searchable \| Lunedoc` |
| Edit | `Edit PDF Online — Text, Highlight, Redact \| Lunedoc` |

---

## 3. Meta description formula

```
{Tool verb} {object} {how}. {Privacy beat}. {CTA hint}.
```

- **Tool verb + object:** active voice ("Compress your PDF").
- **How:** one phrase about the experience ("in your browser", "in three clicks", "without losing quality").
- **Privacy beat:** "Files deleted within an hour." or equivalent — addresses the #1 objection for upload-based tools.
- **CTA hint:** "No signup required." or "Free for files up to 50 MB."

Hard limit: **155 characters**. Google may truncate, but the first 120 must stand alone.

Example:

> Compress your PDF in seconds — right in your browser, no signup. Files are deleted within an hour. Free for files up to 50 MB.

---

## 4. H1 formula

The H1 is **not** the title. It's the user-facing promise.

```
{Active verb} your PDF. {Promise}.
```

| Tool | H1 |
|---|---|
| Compress | `Shrink your PDF without killing the quality.` |
| Merge | `Combine PDFs in the order you actually want.` |
| Split | `Pull out the pages you need. Drop the rest.` |
| Convert | `Convert your PDF into something editable.` |
| Watermark | `Mark every page in seconds.` |
| Sign | `Sign your document right here.` |
| OCR | `Make any scan searchable.` |
| Edit | `Edit your PDF in place.` |

Rules:

- Verb-first. Use the *user's* verb, not the marketing department's.
- Period at the end. No trailing emoji, no exclamation.
- ≤ 8 words. If you need a second sentence, that's the subtitle (`<p>` under the H1), not part of the H1.
- Exactly **one** H1 per page. Section headers below are H2/H3.

---

## 5. Hero content structure

Above the fold, in this order:

```
┌───────────────────────────────────────────────────────────┐
│  Header (shared)                                          │
├───────────────────────────────────────────────────────────┤
│  [tool badge icon] [eyebrow: "Tool · {Category}"]         │
│  H1                                                       │
│  Sub (1 sentence)                                         │
│                                                           │
│  ┌─────────────────────────────────┐  ┌─────────────────┐ │
│  │ Drop zone / file picker         │  │ Trust strip     │ │
│  │  - Primary CTA                  │  │  ✓ Files deleted│ │
│  │  - Secondary upload from cloud  │  │    in 1 hour    │ │
│  │                                 │  │  ✓ No signup    │ │
│  │                                 │  │  ✓ TLS in transit│ │
│  └─────────────────────────────────┘  └─────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

- **Eyebrow:** kicker line above H1 — aids skim, also adds an internal link to the parent category page (`/tools#edit-family` etc.).
- **Drop zone:** clickable, drag-receptive, with a clear file-size limit ("Up to 50 MB") and supported types.
- **Trust strip:** see §7. Above the fold for upload-based tools; the privacy objection blocks conversion if buried.

---

## 6. Above-the-fold CTA structure

Two CTA tiers, never more.

| Tier | Visual | Copy | When |
|---|---|---|---|
| Primary | filled accent button | `Drop a PDF` (matches drop zone) or `Choose file` | always |
| Secondary | ghost button | `Try a sample {tool}` | always — lowers commitment, lets unconverted users see the result preview |

Below the fold, after the user has scrolled past the result preview, a third CTA may appear: `Create a free account` — but only if the value of the account (history, larger files) is genuinely earned by the section above.

Anti-patterns to avoid:

- "Sign up now" before the user has seen the tool work.
- Pricing plan grids in the hero. They belong on `/pricing`.
- Newsletter modal. Ever.

---

## 7. Trust / privacy strip

Three to four bullets. Each is a fact, not a feeling.

```
✓ Files deleted within 1 hour
✓ TLS in transit · stored encrypted at rest
✓ No signup required
✓ Works in your browser — nothing to install
```

Place above the fold for upload tools. Style: muted, monospace numerics for the "1 hour" so users know it's a real number, not marketing fluff.

If the tool has a hard size or page cap (notably OCR), state it here too: `✓ Free up to 20 pages per file`. Don't hide caps; users find out at upload time and bounce.

---

## 8. Tool-specific FAQ block

Every page ends with a FAQ section. Six to ten questions. Use **real user questions** mined from:

- Search Console (`Performance → Queries` filtered by tool URL).
- Reddit (`site:reddit.com "compress pdf"`).
- AlsoAsked / People-Also-Ask snippets.

Question template: phrase as a question the way a user would type it, including the slightly-wrong grammar they actually use.

| Universal questions (every tool gets these) |
|---|
| Is {Tool} PDF safe? |
| Are my files deleted after I'm done? |
| Do I need to sign up? |
| What's the maximum file size? |
| Does it work on my phone? |
| How is this different from Adobe Acrobat? |

| Tool-specific examples |
|---|
| Compress: "Will compressing my PDF make it look blurry?" |
| Merge: "Can I reorder pages before merging?" |
| Split: "Can I split a PDF every N pages automatically?" |
| Convert: "Will the formatting survive PDF→Word conversion?" |
| Watermark: "Can I add a watermark to only some pages?" |
| Sign: "Is the signature legally binding?" |
| OCR: "Which languages can you recognize?" / "Can OCR handle handwriting?" |
| Edit: "Can I actually edit the original text in the PDF?" |

The FAQ section is also the source of the `FAQPage` schema (§11).

---

## 9. How-to steps section

A short, screenshotted "How to {tool} a PDF" section near the bottom. 3–4 steps maximum.

```
H2: How to {tool} a PDF
  Step 1 — {Action}.   [thumbnail]
  Step 2 — {Action}.   [thumbnail]
  Step 3 — {Action}.   [thumbnail]
```

Rules:

- Each step is one sentence. No subordinate clauses.
- Each step has a small thumbnail of the actual UI at that point.
- Steps map 1:1 to a `HowToStep` schema entry (§11).
- Don't fake screenshots — they must be the live product. If the UI changes, the page must be updated.

---

## 10. Related tools internal linking block

Bottom of the page, before the footer. Six tiles (3×2 on desktop, 2×3 on mobile, single column under 480px).

Selection logic:

1. **Two from the same category** (e.g., for OCR which is in `edit`: Watermark, Edit).
2. **Two from a different category** that often appear in the user's flow (for OCR: Convert, Sign — common follow-up tools).
3. **Two cross-category evergreen** (Compress, Merge — always relevant).

Each tile: tool icon, tool name, one-line description, link. Mirrors the existing `ToolCard` component.

This block is the most important on-page SEO lever. Internal links pass crawl budget and topical authority. Without it, each tool page is an island.

---

## 11. Schema.org recommendations

All schema as JSON-LD inside `<script type="application/ld+json">` in `<head>` (or just before `</body>` — both are valid, head is preferred).

### 11.1 SoftwareApplication — every tool page

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Lunedoc OCR PDF",
  "url": "https://lunedoc.app/ocr-pdf",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "browserRequirements": "Requires JavaScript",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Lunedoc",
    "url": "https://lunedoc.app"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "1240"
  }
}
```

Notes:

- `applicationCategory: "BusinessApplication"` is the closest fit Schema.org offers; alternatives (`MultimediaApplication`) are less accurate.
- Only emit `aggregateRating` once you actually have ratings. Fabricating it is a manual-action risk.
- One `SoftwareApplication` per tool; don't try to declare a single object for the whole product.

### 11.2 FAQPage — only when an FAQ section is present (always for tool pages)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Are my files deleted after I'm done?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Every uploaded file and every result is automatically deleted within one hour of upload or one hour after the job finishes, whichever is later."
      }
    }
  ]
}
```

Rules:

- The schema must mirror the visible Q&A exactly. Hidden questions in schema = manual penalty risk.
- Plain-text answers in `text`. No HTML. Newlines as `\n`.

### 11.3 HowTo — only on pages with a real, screenshotted how-to section

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to OCR a PDF online",
  "description": "Make a scanned PDF searchable in three steps with Lunedoc.",
  "totalTime": "PT1M",
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Upload your scanned PDF",
      "text": "Drop your scanned PDF onto the page or click to browse.",
      "image": "https://lunedoc.app/img/ocr/step-1.png"
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "Pick the document language",
      "text": "Choose Auto-detect, English, Turkish, or Spanish.",
      "image": "https://lunedoc.app/img/ocr/step-2.png"
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "Run OCR and download",
      "text": "Click Run OCR. Download the searchable PDF or extracted text.",
      "image": "https://lunedoc.app/img/ocr/step-3.png"
    }
  ]
}
```

Notes:

- Don't apply HowTo to tools where the steps are trivial ("upload, click compress, download"). Google has been deprecating low-value HowTo rich results; reserve it for tools where the user genuinely chooses something between upload and download (OCR, Convert, Watermark, Sign, Edit).
- `totalTime` is ISO-8601 duration (`PT1M` = one minute).

### 11.4 BreadcrumbList — every tool page

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home",  "item": "https://lunedoc.app/" },
    { "@type": "ListItem", "position": 2, "name": "Tools", "item": "https://lunedoc.app/tools" },
    { "@type": "ListItem", "position": 3, "name": "OCR PDF", "item": "https://lunedoc.app/ocr-pdf" }
  ]
}
```

### 11.5 What NOT to add

- `Product` schema (this is software, not a sold object).
- `Review` schema with self-authored reviews.
- `Article` schema on a tool landing page (use it on `/blog/...` only).

---

## 12. EN / TR / ES localization considerations

### 12.1 hreflang

In each tool page's `<head>`:

```html
<link rel="canonical"   href="https://lunedoc.app/ocr-pdf" />
<link rel="alternate" hreflang="en"      href="https://lunedoc.app/ocr-pdf" />
<link rel="alternate" hreflang="tr"      href="https://lunedoc.app/tr/ocr-pdf" />
<link rel="alternate" hreflang="es"      href="https://lunedoc.app/es/ocr-pdf" />
<link rel="alternate" hreflang="x-default" href="https://lunedoc.app/ocr-pdf" />
```

`x-default` points to EN as the fallback for unrecognized locales.

### 12.2 Translate copy, not slugs (for now)

- Slug stays English (`/tr/ocr-pdf`, not `/tr/pdf-tarama`).
  - Pro: simpler routing, single source of truth, English query terms still rank for EN-typing users in TR/ES.
  - Con: lower local-search match.
  - Revisit once we have analytics from the TR/ES sites — if local-language slugs would lift CTR meaningfully, switch with 301s.

### 12.3 Keyword research per locale

Don't translate the EN keyword and call it done. For each tool, run separate keyword research for TR and ES:

- TR users often search verb-first ("PDF birleştir", not "birleştir PDF") — affects H1 phrasing.
- ES has Spain vs. LatAm vocabulary splits. Pick the larger market or build separate `/es-mx/...` later.
- Brand verb + tool ("OCR" stays "OCR" in TR/ES; "merge" becomes "birleştir"/"unir") — preserve OCR in title, translate everything else.

### 12.4 Translated copy lives in i18n

The current prototype already keeps tool copy in `i18n.jsx` (EN/TR/ES). When we build production tool pages:

- Hero/H1/sub/FAQ/HowTo copy → all from the same i18n source.
- The page template (HTML structure) is one file; locale data is the only thing that changes per URL.
- Add new keys per tool: `seo_title`, `seo_description`, `seo_h1`, `seo_sub`, `faq_q1`..`faq_q10`, `faq_a1`..`faq_a10`, `howto_step_1`..`howto_step_3`. Don't compose titles from sub-strings — translation order varies.

### 12.5 RTL readiness

Not needed for EN/TR/ES (all LTR). But: don't bake `flex-direction: row` or `padding-left` into shared components if a future Arabic locale is plausible. The current `tokens.css` and `pl-` classes already use logical properties where possible.

---

## 13. Filled example — OCR PDF page

### Title
`OCR PDF — Make Scans Searchable | Lunedoc`

### Meta description
`Run OCR on a scanned PDF in your browser. Get a searchable PDF or plain-text output in seconds. Files deleted within an hour. Free up to 20 pages.`

### H1
`Make any scan searchable.`

### Sub
`Pull text out of scanned PDFs and images, or rebuild the file as a searchable PDF — without leaving the browser.`

### Hero CTA
- Primary: `Drop a scanned PDF` (drop zone)
- Secondary: `Try a sample scan`

### Trust strip
- Files deleted within 1 hour
- TLS in transit · encrypted at rest
- No signup required
- Free up to 20 pages per file

### How-to steps

1. **Upload your scanned PDF.** Drop it or click to browse.
2. **Pick the document language.** Auto-detect, English, Turkish, or Spanish.
3. **Run OCR and download.** Choose searchable PDF or plain-text output.

### FAQ
1. **Is OCR PDF free?** — Yes, up to 20 pages per file. Larger documents are available on Pro.
2. **Which languages do you recognize?** — English, Turkish, and Spanish at launch. Auto-detect handles mixed Latin scripts.
3. **Are my files deleted?** — Every upload and every result is deleted within an hour.
4. **Can OCR handle handwriting?** — No. Tesseract is reliable on printed text, not cursive.
5. **What file types can I upload?** — PDF, JPG, PNG, and TIFF.
6. **Does the searchable PDF look the same as the original?** — Yes. We add an invisible text layer on top of the original page image.
7. **Will the extracted text keep its layout?** — Plain-text output is unformatted by design. Use searchable PDF mode to keep the layout.
8. **Does it work on my phone?** — Yes, the entire flow works in mobile browsers.

### Related tools (internal links)
Same category: Watermark · Edit ·
Common follow-up: Convert · Sign ·
Cross-category evergreen: Compress · Merge

### JSON-LD blocks emitted
- `SoftwareApplication`
- `FAQPage` (8 entries)
- `HowTo` (3 steps)
- `BreadcrumbList` (Home → Tools → OCR PDF)

---

## 14. Notes for future React / Vite migration

When the prototype graduates to Vite + React, the SEO template implementation matters more than the markup:

### 14.1 Pre-rendering, not client-side

A Vite SPA with `react-router-dom` will render an empty `<div id="root">` on initial response — Googlebot does crawl JS, but it's slower, less reliable, and wastes crawl budget. For tool landing pages we need HTML in the response.

Options, ranked:

1. **Vite SSG** (`vite-plugin-ssg` or build-time pre-render): each tool URL produces a static HTML file at build time. Best fit for our case — tool pages don't need SSR per request, they're effectively static + a JS island for the tool itself.
2. **Migrate marketing pages to Next.js / Astro**, keep the in-app workflow as a Vite SPA at `app.lunedoc.app`. Two stacks but each is right for its job.
3. **Vite SPA with a pre-render fallback** in the edge worker (Cloudflare HTMLRewriter): viable but more moving parts.

Recommendation: **Astro for the marketing site** (every tool page = a `.astro` file with islands of React for the actual tool widget), **Vite + React for the app** (`app.lunedoc.app`). Astro emits the SEO HTML for free; islands hydrate only the tool component.

### 14.2 i18n routing

In Astro: `src/pages/[lang]/ocr-pdf.astro` with `lang` ∈ `{en, tr, es}` (and `en` mounted at root via a redirect or duplicate file). Hreflang is auto-emitted by `astro-i18n` or hand-written into the page layout.

In Vite + React Router: `<Route path="/:lang?/ocr-pdf">` with a guard that defaults `lang` to `en`. Pre-render emits all three.

### 14.3 JSON-LD generation

Don't hand-write JSON-LD on each page. Centralize:

```ts
// src/seo/schema.ts
export function softwareApplicationSchema(tool: Tool, lang: Lang) { … }
export function faqPageSchema(faqs: FAQ[]) { … }
export function howToSchema(steps: HowToStep[], lang: Lang) { … }
```

Each tool page composes the three (or four with breadcrumbs) and emits them in `<script type="application/ld+json">` blocks. Validate output in CI with `schema-dts` types or a JSON-Schema validator pointed at https://validator.schema.org/ via `playwright` smoke test.

### 14.4 The current prototype is the design source

The Lunedoc design canvas (this prototype) **is** the design spec for the production tool pages. When we build the SEO pages we copy the layouts from the artboards, not redesign them. Specifically:

- Header / footer / trust strip → already in `primitives.jsx`.
- Tool widget (the actual upload + controls + preview) → already in `tool-variants.jsx`.
- Tile grid for related tools → already in `tools-index-page.jsx` (`ToolCard`).

In Astro the production page is roughly:

```astro
---
import ToolHeroLayout from '../layouts/ToolHeroLayout.astro';
import OCRTool from '../components/OCRTool.tsx';   // ported from tool-variants.jsx
import faqs from '../data/ocr-faqs.ts';
---
<ToolHeroLayout title="..." description="..." h1="..." faqs={faqs} ...>
  <OCRTool client:load />
</ToolHeroLayout>
```

`ToolHeroLayout` emits the H1, sub, trust strip, FAQ, HowTo, related-tools block, and all JSON-LD. The tool itself is one React island.

### 14.5 What does NOT belong in the SEO template

- The design canvas itself (it's a working tool, not a marketing surface).
- The Tweaks panel.
- The system-inventory page (it's an internal reference).
- The dashboard (gated; goes on `app.lunedoc.app`).

---

*When implementing: each tool page is a single `.astro` file (or single-file React component if we go SPA) that fills in this template's variables. Resist deviation — consistency across all eight tools is the SEO multiplier.*
