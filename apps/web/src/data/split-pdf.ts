import type { Lang } from '@lunedoc/i18n';
import type { ToolPageContent } from './ocr-pdf';

const en: ToolPageContent = {
  seoTitle: 'Split PDF — Extract or Divide Pages | Lunedoc',
  metaDescription:
    'Pull selected pages out of a PDF, or split it into ranges. Free in your browser. Files deleted within an hour. Each output is a clean PDF.',
  eyebrow: 'Tool · Organize family',
  h1: 'Pull out the pages you need. Drop the rest.',
  sub: 'Split a PDF by page ranges or pick individual pages. Each output is a complete PDF — same fonts, same layout, just the pages you chose.',
  trust: [
    'Files deleted within 1 hour',
    'TLS in transit · encrypted at rest',
    'No signup required',
    'Full pages out — no partial text extraction',
  ],
  faq: [
    {
      q: 'How does Split work?',
      a: 'Two modes. **By range**: define one or more page ranges (e.g. 1-4, 5-12, 13-16) and get one PDF per range. **By single page**: tick the pages you want in a grid and get one PDF containing exactly those pages.',
    },
    {
      q: 'Can I extract just text or images instead?',
      a: 'No — Split is page-based. Each output preserves full pages, not partial content. To pull text out of pages, use OCR (for scans) or copy-paste from a real PDF reader. To pull images, use Convert PDF → JPG.',
    },
    {
      q: 'Will the split PDFs lose quality?',
      a: 'No. Splitting copies the original pages without re-rendering, so text, images, fonts, bookmarks, and embedded assets stay as they were.',
    },
    {
      q: 'How do I get a single output containing multiple ranges?',
      a: "Use the by-page mode and tick all the pages you want — they'll come out as one combined PDF. By-range mode produces one PDF per range; merge afterward if you need a single output.",
    },
    {
      q: 'Are page numbers based on what I see in my reader?',
      a: 'Yes. Page 1 is the first page of the PDF as you see it, regardless of any printed roman numerals or section restarts.',
    },
    {
      q: 'How big a PDF can I split?',
      a: '50 MB per upload on the free tier. The output total can exceed the input if you create many small range files (each adds a small file overhead).',
    },
    {
      q: 'Are my files deleted after?',
      a: 'Every uploaded file and every result is automatically deleted within one hour.',
    },
  ],
  howToTitle: 'How to split a PDF online',
  howToSteps: [
    { name: 'Upload your PDF', text: 'Drop it onto the page or click to browse.' },
    { name: 'Pick a mode', text: 'By-range gives one PDF per range you define; by-page gives one combined PDF of the pages you tick.' },
    { name: 'Extract and download', text: 'Click Extract. Download the resulting PDF (or ZIP, if multiple ranges).' },
  ],
  ctaPrimary: 'Drop a PDF',
  ctaSecondary: 'Try a sample split',
  faqLabel: 'Frequently asked',
  howToLabel: 'How it works',
  relatedLabel: 'Related tools',
};

const tr: ToolPageContent = {
  seoTitle: "PDF'i Böl — Sayfaları Ayır veya Çıkar | Lunedoc",
  metaDescription:
    "PDF'ten seçili sayfaları çıkar ya da aralıklara böl. Tarayıcında ücretsiz. Dosyalar bir saat içinde silinir. Her çıktı temiz bir PDF.",
  eyebrow: 'Araç · Düzenleme',
  h1: 'İhtiyacın olan sayfaları al, gerisini bırak.',
  sub: "PDF'i sayfa aralıklarına göre böl ya da tek tek sayfa seç. Her çıktı tam bir PDF — aynı yazı tipleri, aynı düzen, sadece seçtiğin sayfalar.",
  trust: [
    'Dosyalar 1 saat içinde silinir',
    'Aktarımda TLS · sunucuda şifrelenir',
    'Kayıt gerekmez',
    'Tam sayfalar — kısmi metin çıkarımı değil',
  ],
  faq: [
    {
      q: 'Bölme nasıl çalışır?',
      a: 'İki mod var. **Aralığa göre**: bir ya da daha fazla sayfa aralığı tanımla (örn. 1-4, 5-12, 13-16) ve her aralık için bir PDF al. **Tek sayfaya göre**: bir ızgarada istediğin sayfaları işaretle ve tam olarak o sayfaları içeren bir PDF al.',
    },
    {
      q: 'Sadece metni ya da görselleri çıkarabilir miyim?',
      a: "Hayır — Böl, sayfa bazlı. Her çıktı tam sayfayı korur, kısmi içeriği değil. Sayfalardan metin çıkarmak için OCR (taramalar için) ya da gerçek bir PDF okuyucudan kopyala-yapıştır kullan. Görselleri çıkarmak için PDF → JPG dönüştürme aracını kullan.",
    },
    {
      q: 'Bölünen PDF’ler kalite kaybeder mi?',
      a: 'Hayır. Bölme, sayfaları yeniden işlemeden kopyalar; metin, görseller, yazı tipleri, yer imleri ve gömülü varlıklar olduğu gibi kalır.',
    },
    {
      q: 'Birden fazla aralık içeren tek bir çıktı nasıl alabilirim?',
      a: 'Tek-sayfa modunu kullan ve istediğin tüm sayfaları işaretle — birleşik tek bir PDF olarak çıkar. Aralık modu her aralık için bir PDF üretir; tek dosya istiyorsan ardından birleştir.',
    },
    {
      q: 'Sayfa numaraları okuyucumda gördüklerime mi göre?',
      a: 'Evet. Sayfa 1, basılı romen rakamları ya da bölüm yeniden başlangıçları ne olursa olsun PDF’in gördüğün ilk sayfasıdır.',
    },
    {
      q: 'Ne kadar büyük bir PDF bölebilirim?',
      a: 'Ücretsiz katmanda yükleme başına 50 MB. Çok sayıda küçük aralık dosyası oluşturursan toplam çıktı girdiyi aşabilir (her dosya küçük bir ek yük getirir).',
    },
    {
      q: 'Dosyalarım sonradan siliniyor mu?',
      a: 'Yüklenen her dosya ve her çıktı bir saat içinde otomatik olarak silinir.',
    },
  ],
  howToTitle: "PDF'i online nasıl bölersiniz",
  howToSteps: [
    { name: "PDF'inizi yükleyin", text: 'Sayfaya bırakın ya da göz atın.' },
    { name: 'Bir mod seçin', text: 'Aralık modu tanımladığınız her aralık için bir PDF; tek-sayfa modu işaretlediğiniz sayfaların birleşik tek PDF’i.' },
    { name: 'Çıkarın ve indirin', text: 'Çıkar’a tıklayın. Sonuç PDF’i (birden fazla aralıkta ZIP) indirin.' },
  ],
  ctaPrimary: 'PDF bırak',
  ctaSecondary: 'Örnek bölme dene',
  faqLabel: 'Sık sorulanlar',
  howToLabel: 'Nasıl çalışır',
  relatedLabel: 'İlgili araçlar',
};

const es: ToolPageContent = {
  seoTitle: 'Dividir PDF — Extraer o separar páginas | Lunedoc',
  metaDescription:
    'Extrae páginas seleccionadas de un PDF o divídelo por rangos. Gratis en el navegador. Archivos eliminados en una hora. Cada salida es un PDF limpio.',
  eyebrow: 'Herramienta · Organización',
  h1: 'Saca las páginas que necesitas. Deja el resto.',
  sub: 'Divide un PDF por rangos de páginas o elige páginas individuales. Cada salida es un PDF completo — mismas fuentes, mismo diseño, solo las páginas que elegiste.',
  trust: [
    'Archivos eliminados en 1 hora',
    'TLS en tránsito · cifrado en reposo',
    'Sin registro',
    'Páginas completas — no extracción parcial de texto',
  ],
  faq: [
    {
      q: '¿Cómo funciona Dividir?',
      a: 'Dos modos. **Por rango**: define uno o más rangos de páginas (p. ej. 1-4, 5-12, 13-16) y obtén un PDF por rango. **Por página individual**: marca las páginas que quieres en una cuadrícula y obtén un PDF con exactamente esas páginas.',
    },
    {
      q: '¿Puedo extraer solo texto o imágenes?',
      a: 'No — Dividir es por páginas. Cada salida conserva páginas completas, no contenido parcial. Para extraer texto, usa OCR (escaneos) o copia y pega desde un lector de PDF real. Para imágenes, usa Convertir PDF → JPG.',
    },
    {
      q: '¿Los PDFs divididos pierden calidad?',
      a: 'No. Dividir copia las páginas originales sin volver a renderizar; texto, imágenes, fuentes, marcadores y recursos incrustados permanecen como estaban.',
    },
    {
      q: '¿Cómo obtengo una sola salida con varios rangos?',
      a: 'Usa el modo por-página y marca todas las páginas que quieras — saldrán como un único PDF combinado. El modo por-rango produce un PDF por rango; únelos después si necesitas una sola salida.',
    },
    {
      q: '¿Los números de página coinciden con los del lector?',
      a: 'Sí. La página 1 es la primera página del PDF tal y como la ves, sin importar números romanos impresos ni reinicios de sección.',
    },
    {
      q: '¿Qué tamaño de PDF puedo dividir?',
      a: '50 MB por subida en el plan gratuito. La salida total puede superar la entrada si creas muchos archivos pequeños (cada archivo añade un poco de overhead).',
    },
    {
      q: '¿Mis archivos se eliminan después?',
      a: 'Cada archivo subido y cada resultado se elimina automáticamente en una hora.',
    },
  ],
  howToTitle: 'Cómo dividir un PDF en línea',
  howToSteps: [
    { name: 'Sube tu PDF', text: 'Arrástralo a la página o haz clic para examinar.' },
    { name: 'Elige un modo', text: 'Por-rango da un PDF por cada rango que definas; por-página da un PDF combinado con las páginas que marques.' },
    { name: 'Extrae y descarga', text: 'Pulsa Extraer. Descarga el PDF resultante (o ZIP, si son varios rangos).' },
  ],
  ctaPrimary: 'Suelta un PDF',
  ctaSecondary: 'Probar una división de muestra',
  faqLabel: 'Preguntas frecuentes',
  howToLabel: 'Cómo funciona',
  relatedLabel: 'Herramientas relacionadas',
};

export const SPLIT_PAGE: Record<Lang, ToolPageContent> = { en, tr, es };
