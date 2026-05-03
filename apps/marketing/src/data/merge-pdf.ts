import type { Lang } from '@lunedoc/i18n';
import type { ToolPageContent } from './ocr-pdf';

const en: ToolPageContent = {
  seoTitle: 'Merge PDF Files — Free in Your Browser | Lunedoc',
  metaDescription:
    'Combine PDF files in any order, in your browser. Drag to rearrange, drop to merge. Free, no signup. Files deleted within an hour.',
  eyebrow: 'Tool · Organize family',
  h1: 'Combine PDFs in the order you actually want.',
  sub: 'Add files, drag them into the right order, click merge. The output is a single PDF — same pages, same fidelity, in the order you set.',
  trust: [
    'Files deleted within 1 hour',
    'TLS in transit · encrypted at rest',
    'No signup required',
    'No page count limit on free tier',
  ],
  faq: [
    {
      q: 'Is Merge PDF free?',
      a: "Yes, with no page cap on the free tier. Files up to 50 MB each.",
    },
    {
      q: 'How many PDFs can I merge at once?',
      a: 'Up to 20 files in one batch. The total payload should stay under 200 MB.',
    },
    {
      q: 'Can I rearrange the order before merging?',
      a: 'Yes. Each file shows up as a row; use the up/down arrows to reorder, or drag with your pointer.',
    },
    {
      q: 'Will the merged PDF lose quality?',
      a: 'No. Merging concatenates pages without re-rendering, so text, images, fonts, and bookmarks stay as they were.',
    },
    {
      q: 'Can I include only some pages from each file?',
      a: 'Not in Merge. For partial-page selections, run Split first, then merge the resulting PDFs.',
    },
    {
      q: 'What happens to bookmarks and metadata?',
      a: "Bookmarks from each input are kept and grouped under that file's name in the output. Metadata defaults to the first file's; rename if you need.",
    },
    {
      q: 'Are my files deleted after?',
      a: 'Every uploaded file and every result is automatically deleted within one hour.',
    },
  ],
  howToTitle: 'How to merge PDFs online',
  howToSteps: [
    { name: 'Add your PDFs', text: 'Drop them onto the page or click to browse — multi-file at once is fine.' },
    { name: 'Reorder if needed', text: 'Use the up/down arrows on each row to set the order. Remove any row you do not need.' },
    { name: 'Merge and download', text: 'Click Merge. Download the combined PDF.' },
  ],
  ctaPrimary: 'Drop PDFs to merge',
  ctaSecondary: 'Try a sample merge',
  faqLabel: 'Frequently asked',
  howToLabel: 'How it works',
  relatedLabel: 'Related tools',
};

const tr: ToolPageContent = {
  seoTitle: "PDF'leri Birleştir — Tarayıcında Ücretsiz | Lunedoc",
  metaDescription:
    "PDF dosyalarını istediğin sırayla, tarayıcında birleştir. Sürükleyerek sırala, tıklayarak birleştir. Ücretsiz, kayıt yok. Dosyalar bir saat içinde silinir.",
  eyebrow: 'Araç · Düzenleme',
  h1: 'PDF’leri istediğin sırayla birleştir.',
  sub: 'Dosyaları ekle, doğru sıraya sürükle, birleştir. Çıktı tek bir PDF — aynı sayfalar, aynı kalite, senin belirlediğin sırada.',
  trust: [
    'Dosyalar 1 saat içinde silinir',
    'Aktarımda TLS · sunucuda şifrelenir',
    'Kayıt gerekmez',
    'Ücretsiz katmanda sayfa sınırı yok',
  ],
  faq: [
    {
      q: 'Birleştirme ücretsiz mi?',
      a: 'Evet, ücretsiz katmanda sayfa sınırı yok. Her dosya 50 MB’a kadar olabilir.',
    },
    {
      q: 'Tek seferde kaç PDF birleştirebilirim?',
      a: "Bir grupta 20 dosyaya kadar. Toplam yük 200 MB'ın altında kalmalı.",
    },
    {
      q: 'Birleştirmeden önce sıralayabilir miyim?',
      a: 'Evet. Her dosya bir satır olarak görünür; yukarı/aşağı oklarıyla ya da fareyle sürükleyerek sıralayabilirsin.',
    },
    {
      q: 'Birleştirilen PDF kalite kaybeder mi?',
      a: 'Hayır. Birleştirme, sayfaları yeniden işlemeden bir araya getirir; metin, görsel, yazı tipi ve yer imleri olduğu gibi kalır.',
    },
    {
      q: 'Her dosyadan sadece bazı sayfaları alabilir miyim?',
      a: "Birleştirme'de değil. Kısmi sayfa seçimi için önce Böl aracını kullan, sonra çıkan PDF'leri birleştir.",
    },
    {
      q: 'Yer imleri ve meta veriler ne olur?',
      a: "Her girdi dosyasının yer imleri korunur ve o dosyanın adı altında gruplanır. Meta veriler varsayılan olarak ilk dosyanınkine ayarlanır; gerekirse yeniden adlandır.",
    },
    {
      q: 'Dosyalarım sonradan siliniyor mu?',
      a: 'Yüklenen her dosya ve her çıktı bir saat içinde otomatik olarak silinir.',
    },
  ],
  howToTitle: "PDF'leri online nasıl birleştirirsiniz",
  howToSteps: [
    { name: "PDF'lerinizi ekleyin", text: 'Sayfaya bırakın ya da göz atın — çoklu dosya seçimi olur.' },
    { name: 'Gerekirse sıralayın', text: 'Her satırdaki yukarı/aşağı oklarıyla sırayı belirleyin. İstemediğiniz satırı kaldırın.' },
    { name: 'Birleştirin ve indirin', text: 'Birleştir’e tıklayın. Birleştirilmiş PDF’i indirin.' },
  ],
  ctaPrimary: "Birleştirilecek PDF'leri bırak",
  ctaSecondary: 'Örnek birleştirme dene',
  faqLabel: 'Sık sorulanlar',
  howToLabel: 'Nasıl çalışır',
  relatedLabel: 'İlgili araçlar',
};

const es: ToolPageContent = {
  seoTitle: 'Unir PDFs — Gratis en tu navegador | Lunedoc',
  metaDescription:
    'Combina archivos PDF en cualquier orden, en tu navegador. Arrastra para reordenar, suelta para unir. Gratis, sin registro. Archivos eliminados en una hora.',
  eyebrow: 'Herramienta · Organización',
  h1: 'Combina PDFs en el orden que quieres.',
  sub: 'Añade archivos, arrástralos al orden correcto, pulsa unir. La salida es un único PDF — mismas páginas, misma fidelidad, en el orden que indicas.',
  trust: [
    'Archivos eliminados en 1 hora',
    'TLS en tránsito · cifrado en reposo',
    'Sin registro',
    'Sin límite de páginas en el plan gratuito',
  ],
  faq: [
    {
      q: '¿Unir PDFs es gratis?',
      a: 'Sí, sin límite de páginas en el plan gratuito. Cada archivo hasta 50 MB.',
    },
    {
      q: '¿Cuántos PDFs puedo unir a la vez?',
      a: 'Hasta 20 archivos por lote. La carga total debe quedar bajo 200 MB.',
    },
    {
      q: '¿Puedo reordenar antes de unir?',
      a: 'Sí. Cada archivo aparece como una fila; usa las flechas arriba/abajo o arrástralo con el puntero.',
    },
    {
      q: '¿El PDF unido pierde calidad?',
      a: 'No. La unión concatena páginas sin volver a renderizar, así que texto, imágenes, tipografías y marcadores quedan como estaban.',
    },
    {
      q: '¿Puedo incluir solo algunas páginas de cada archivo?',
      a: 'En Unir no. Para selecciones parciales, ejecuta Dividir primero y luego une los PDFs resultantes.',
    },
    {
      q: '¿Qué pasa con marcadores y metadatos?',
      a: 'Los marcadores de cada entrada se mantienen y se agrupan bajo el nombre de ese archivo en la salida. Los metadatos por defecto son los del primer archivo; renómbralo si lo necesitas.',
    },
    {
      q: '¿Mis archivos se eliminan después?',
      a: 'Cada archivo subido y cada resultado se elimina automáticamente en una hora.',
    },
  ],
  howToTitle: 'Cómo unir PDFs en línea',
  howToSteps: [
    { name: 'Añade tus PDFs', text: 'Arrástralos a la página o haz clic para examinar — selección múltiple incluida.' },
    { name: 'Reordena si hace falta', text: 'Usa las flechas arriba/abajo de cada fila para fijar el orden. Quita las filas que no quieras.' },
    { name: 'Une y descarga', text: 'Pulsa Unir. Descarga el PDF combinado.' },
  ],
  ctaPrimary: 'Suelta los PDFs a unir',
  ctaSecondary: 'Probar una unión de muestra',
  faqLabel: 'Preguntas frecuentes',
  howToLabel: 'Cómo funciona',
  relatedLabel: 'Herramientas relacionadas',
};

export const MERGE_PAGE: Record<Lang, ToolPageContent> = { en, tr, es };
