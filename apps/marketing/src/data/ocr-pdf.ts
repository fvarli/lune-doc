import type { Lang } from '@lunedoc/i18n';
import type { FaqItem, HowToStepInput } from '../seo/schema';

export interface ToolPageContent {
  // <title>
  seoTitle: string;
  // <meta name="description">
  metaDescription: string;
  // Hero
  eyebrow: string;
  h1: string;
  sub: string;
  // Trust strip — short bullet phrases shown above-the-fold
  trust: string[];
  // FAQ block — 6–8 entries per docs/seo-tool-page-template.md §8
  faq: FaqItem[];
  // HowTo block — 3 steps per §9
  howToTitle: string;
  howToSteps: HowToStepInput[];
  // Tool-page section labels (i18n-friendly text shown in the hero/footer)
  ctaPrimary: string;
  ctaSecondary: string;
  faqLabel: string;
  howToLabel: string;
  relatedLabel: string;
}

const en: ToolPageContent = {
  seoTitle: 'OCR PDF — Make Scans Searchable | Lunedoc',
  metaDescription:
    "Run OCR on a scanned PDF in your browser. Get a searchable PDF or plain-text output in seconds. Files deleted within an hour. Free up to 20 pages.",
  eyebrow: 'Tool · Edit family',
  h1: 'Make any scan searchable.',
  sub: "Pull text out of scanned PDFs and images, or rebuild the file as a searchable PDF — without leaving the browser.",
  trust: [
    'Files deleted within 1 hour',
    'TLS in transit · encrypted at rest',
    'No signup required',
    'Free up to 20 pages per file',
  ],
  faq: [
    {
      q: 'Is OCR PDF free?',
      a: 'Yes, up to 20 pages per file. Larger documents are available on Pro.',
    },
    {
      q: "Which languages do you recognize?",
      a: 'English, Turkish, and Spanish at launch. Auto-detect handles mixed Latin scripts.',
    },
    {
      q: "Are my files deleted after I'm done?",
      a: 'Yes. Every uploaded file and every result is automatically deleted within one hour.',
    },
    {
      q: 'Can OCR handle handwriting?',
      a: 'No. Tesseract is reliable on printed text, not cursive.',
    },
    {
      q: 'What file types can I upload?',
      a: 'PDF, JPG, PNG, and TIFF.',
    },
    {
      q: 'Does the searchable PDF look the same as the original?',
      a: 'Yes. We add an invisible text layer on top of the original page image, so the visible page is unchanged.',
    },
    {
      q: 'Will the extracted text keep its layout?',
      a: 'Plain-text output is unformatted by design. Use searchable PDF mode to keep the layout.',
    },
    {
      q: 'Does it work on my phone?',
      a: 'Yes, the entire flow works in mobile browsers.',
    },
  ],
  howToTitle: 'How to OCR a PDF online',
  howToSteps: [
    { name: 'Upload your scanned PDF', text: 'Drop it onto the page or click to browse.' },
    { name: 'Pick the document language', text: 'Choose Auto-detect, English, Turkish, or Spanish.' },
    { name: 'Run OCR and download', text: 'Choose searchable PDF or plain-text output and download.' },
  ],
  ctaPrimary: 'Drop a scanned PDF',
  ctaSecondary: 'Try a sample scan',
  faqLabel: 'Frequently asked',
  howToLabel: 'How it works',
  relatedLabel: 'Related tools',
};

const tr: ToolPageContent = {
  seoTitle: 'PDF OCR — Taramaları Aranabilir Yap | Lunedoc',
  metaDescription:
    "Taranan bir PDF'i tarayıcında OCR ile işle. Saniyeler içinde aranabilir PDF ya da düz metin al. Dosyalar bir saat içinde silinir. 20 sayfaya kadar ücretsiz.",
  eyebrow: 'Araç · Düzenleme',
  h1: 'Her taramayı aranabilir yap.',
  sub: "Taranan PDF ve görsellerden metni çıkar ya da dosyayı aranabilir bir PDF olarak yeniden oluştur — tarayıcıdan çıkmadan.",
  trust: [
    'Dosyalar 1 saat içinde silinir',
    'Aktarımda TLS · sunucuda şifrelenir',
    'Kayıt gerekmez',
    'Dosya başına 20 sayfaya kadar ücretsiz',
  ],
  faq: [
    {
      q: 'PDF OCR ücretsiz mi?',
      a: 'Evet, dosya başına 20 sayfaya kadar. Daha uzun dokümanlar Pro plana dahildir.',
    },
    {
      q: 'Hangi dilleri tanıyor?',
      a: 'Lansmanda İngilizce, Türkçe ve İspanyolca. Otomatik algılama Latin alfabelerinde çalışır.',
    },
    {
      q: 'Dosyalarım işlemden sonra siliniyor mu?',
      a: 'Evet. Yüklenen her dosya ve her çıktı bir saat içinde otomatik olarak silinir.',
    },
    {
      q: 'OCR el yazısını okuyabilir mi?',
      a: 'Hayır. Tesseract basılı metinde güvenilirdir, el yazısı için tasarlanmamıştır.',
    },
    {
      q: 'Hangi dosya türlerini yükleyebilirim?',
      a: 'PDF, JPG, PNG ve TIFF.',
    },
    {
      q: 'Aranabilir PDF orijinaliyle aynı mı görünüyor?',
      a: 'Evet. Orijinal sayfa görüntüsünün üzerine görünmez bir metin katmanı ekliyoruz; görünen sayfa değişmiyor.',
    },
    {
      q: 'Çıkarılan metin düzeni koruyor mu?',
      a: 'Düz metin çıktısı tasarım gereği biçimsizdir. Düzeni korumak için aranabilir PDF modunu kullan.',
    },
    {
      q: 'Telefonumda çalışıyor mu?',
      a: 'Evet, tüm akış mobil tarayıcılarda çalışır.',
    },
  ],
  howToTitle: "PDF'inizi nasıl OCR'larsınız",
  howToSteps: [
    { name: "Taranan PDF'inizi yükleyin", text: 'Sayfaya bırakın ya da göz atın.' },
    { name: 'Belge dilini seçin', text: 'Otomatik algıla, İngilizce, Türkçe veya İspanyolca seçin.' },
    { name: "OCR'ı çalıştırın ve indirin", text: 'Aranabilir PDF veya düz metin seçin ve indirin.' },
  ],
  ctaPrimary: 'Taranan bir PDF bırak',
  ctaSecondary: 'Örnek tarama dene',
  faqLabel: 'Sık sorulanlar',
  howToLabel: 'Nasıl çalışır',
  relatedLabel: 'İlgili araçlar',
};

const es: ToolPageContent = {
  seoTitle: 'OCR PDF — Convierte escaneos en buscables | Lunedoc',
  metaDescription:
    'Aplica OCR a un PDF escaneado en tu navegador. Obtén un PDF buscable o texto plano en segundos. Archivos eliminados en una hora. Gratis hasta 20 páginas.',
  eyebrow: 'Herramienta · Edición',
  h1: 'Convierte cualquier escaneo en buscable.',
  sub: 'Extrae texto de PDFs e imágenes escaneados o reconstrúyelos como un PDF buscable — sin salir del navegador.',
  trust: [
    'Archivos eliminados en 1 hora',
    'TLS en tránsito · cifrado en reposo',
    'Sin registro',
    'Gratis hasta 20 páginas por archivo',
  ],
  faq: [
    {
      q: '¿OCR PDF es gratis?',
      a: 'Sí, hasta 20 páginas por archivo. Documentos más grandes están disponibles en Pro.',
    },
    {
      q: '¿Qué idiomas reconocen?',
      a: 'Inglés, turco y español en el lanzamiento. La detección automática funciona con alfabetos latinos.',
    },
    {
      q: '¿Mis archivos se eliminan?',
      a: 'Sí. Cada archivo subido y cada resultado se elimina automáticamente en una hora.',
    },
    {
      q: '¿OCR maneja escritura a mano?',
      a: 'No. Tesseract es fiable con texto impreso, no con cursiva.',
    },
    {
      q: '¿Qué tipos de archivo puedo subir?',
      a: 'PDF, JPG, PNG y TIFF.',
    },
    {
      q: '¿El PDF buscable se ve igual que el original?',
      a: 'Sí. Añadimos una capa de texto invisible sobre la imagen original; la página visible no cambia.',
    },
    {
      q: '¿El texto extraído conserva el diseño?',
      a: 'La salida en texto plano es sin formato por diseño. Usa el modo PDF buscable para conservar el diseño.',
    },
    {
      q: '¿Funciona en mi teléfono?',
      a: 'Sí, todo el flujo funciona en navegadores móviles.',
    },
  ],
  howToTitle: 'Cómo aplicar OCR a un PDF en línea',
  howToSteps: [
    { name: 'Sube tu PDF escaneado', text: 'Arrástralo a la página o haz clic para examinar.' },
    { name: 'Elige el idioma del documento', text: 'Selecciona Detección automática, Inglés, Turco o Español.' },
    { name: 'Ejecuta OCR y descarga', text: 'Elige PDF buscable o texto plano y descarga.' },
  ],
  ctaPrimary: 'Suelta un PDF escaneado',
  ctaSecondary: 'Probar un escaneo de muestra',
  faqLabel: 'Preguntas frecuentes',
  howToLabel: 'Cómo funciona',
  relatedLabel: 'Herramientas relacionadas',
};

export const OCR_PAGE: Record<Lang, ToolPageContent> = { en, tr, es };
