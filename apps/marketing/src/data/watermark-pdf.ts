import type { Lang } from '@lunedoc/i18n';
import type { ToolPageContent } from './ocr-pdf';

const en: ToolPageContent = {
  seoTitle: 'Add Watermark to PDF — Free Online | Lunedoc',
  metaDescription:
    'Stamp every page of a PDF with a text watermark. Pick position, opacity, and rotation. Free in your browser. Files deleted within an hour.',
  eyebrow: 'Tool · Edit family',
  h1: 'Mark every page in seconds.',
  sub: "Add a text watermark to a PDF — DRAFT, CONFIDENTIAL, your name. Pick position, opacity, and rotation; preview before you apply.",
  trust: [
    'Files deleted within 1 hour',
    'TLS in transit · encrypted at rest',
    'No signup required',
    'Works on any modern browser',
  ],
  faq: [
    {
      q: 'Is Watermark PDF free?',
      a: "Yes, with no page cap on the free tier. Files up to 50 MB.",
    },
    {
      q: 'Can I watermark only some pages?',
      a: 'Yes. Apply to all pages, or list specific pages and ranges (e.g. 1, 3-5, 12).',
    },
    {
      q: 'Will the watermark be on top of the content?',
      a: "Yes. The watermark sits on a transparent layer above the page so the text stays legible underneath; opacity is adjustable.",
    },
    {
      q: 'Can I use an image watermark?',
      a: 'Not yet. Text watermarks are supported at launch; image watermarks land in a follow-up.',
    },
    {
      q: 'Will the watermark survive copy-paste of the text?',
      a: "Yes. The watermark is rendered as part of each page, so copying text from the PDF doesn't remove it.",
    },
    {
      q: 'Can I remove the watermark later?',
      a: "No, watermarking is destructive — keep your unmarked original safe before applying.",
    },
    {
      q: 'Are my files deleted after?',
      a: 'Every uploaded file and every result is automatically deleted within one hour.',
    },
  ],
  howToTitle: 'How to watermark a PDF online',
  howToSteps: [
    { name: 'Upload your PDF', text: 'Drop it onto the page or click to browse.' },
    { name: 'Type your watermark', text: 'Set the text, position, opacity, and rotation. The preview updates live.' },
    { name: 'Apply and download', text: 'Choose all pages or specific ranges, then download the watermarked PDF.' },
  ],
  ctaPrimary: 'Drop a PDF',
  ctaSecondary: 'Try a sample watermark',
  faqLabel: 'Frequently asked',
  howToLabel: 'How it works',
  relatedLabel: 'Related tools',
};

const tr: ToolPageContent = {
  seoTitle: "PDF'e Filigran Ekle — Ücretsiz Online | Lunedoc",
  metaDescription:
    "PDF'inin her sayfasına metin filigranı ekle. Konum, opaklık ve dönüşü seç. Tarayıcında ücretsiz. Dosyalar bir saat içinde silinir.",
  eyebrow: 'Araç · Düzenleme',
  h1: 'Her sayfayı saniyeler içinde işaretle.',
  sub: "PDF'e metin filigranı ekle — TASLAK, GİZLİ, adın. Konum, opaklık ve dönüşü seç; uygulamadan önce önizle.",
  trust: [
    'Dosyalar 1 saat içinde silinir',
    'Aktarımda TLS · sunucuda şifrelenir',
    'Kayıt gerekmez',
    'Modern tarayıcılarda çalışır',
  ],
  faq: [
    {
      q: 'Filigran aracı ücretsiz mi?',
      a: 'Evet, ücretsiz katmanda sayfa sınırı yok. Dosyalar 50 MB’a kadar.',
    },
    {
      q: 'Sadece bazı sayfalara filigran ekleyebilir miyim?',
      a: 'Evet. Tüm sayfalara uygulayabilir ya da belirli sayfaları/aralıkları listeleyebilirsin (örn. 1, 3-5, 12).',
    },
    {
      q: 'Filigran içeriğin üstünde mi olacak?',
      a: 'Evet. Filigran, sayfanın üzerine şeffaf bir katmanda durur; opaklığı ayarlanabilir, alttaki metin okunur kalır.',
    },
    {
      q: 'Görsel filigran kullanabilir miyim?',
      a: 'Henüz değil. Lansmanda metin filigranları destekleniyor; görsel filigran sonraki sürümde gelecek.',
    },
    {
      q: 'Filigran metin kopyalandığında kalıyor mu?',
      a: 'Evet. Filigran sayfanın bir parçası olarak işleniyor; metni kopyalamak filigranı silmez.',
    },
    {
      q: 'Filigranı sonradan kaldırabilir miyim?',
      a: 'Hayır, filigran ekleme geri alınamaz — uygulamadan önce orijinal dosyanı saklı tut.',
    },
    {
      q: 'Dosyalarım sonradan siliniyor mu?',
      a: 'Yüklenen her dosya ve her çıktı bir saat içinde otomatik olarak silinir.',
    },
  ],
  howToTitle: "PDF'e nasıl filigran eklenir",
  howToSteps: [
    { name: "PDF'inizi yükleyin", text: 'Sayfaya bırakın ya da göz atın.' },
    { name: 'Filigranınızı yazın', text: 'Metin, konum, opaklık ve dönüş ayarlarını seçin. Önizleme anında güncellenir.' },
    { name: 'Uygulayın ve indirin', text: 'Tüm sayfaları ya da belirli aralıkları seçin, sonra filigranlı PDF’i indirin.' },
  ],
  ctaPrimary: 'PDF bırak',
  ctaSecondary: 'Örnek filigran dene',
  faqLabel: 'Sık sorulanlar',
  howToLabel: 'Nasıl çalışır',
  relatedLabel: 'İlgili araçlar',
};

const es: ToolPageContent = {
  seoTitle: 'Marca de agua a PDF — Gratis en línea | Lunedoc',
  metaDescription:
    'Añade una marca de agua de texto a cada página de un PDF. Elige posición, opacidad y rotación. Gratis en el navegador. Archivos eliminados en una hora.',
  eyebrow: 'Herramienta · Edición',
  h1: 'Marca cada página en segundos.',
  sub: 'Añade una marca de agua de texto a un PDF — BORRADOR, CONFIDENCIAL, tu nombre. Elige posición, opacidad y rotación; previsualiza antes de aplicar.',
  trust: [
    'Archivos eliminados en 1 hora',
    'TLS en tránsito · cifrado en reposo',
    'Sin registro',
    'Funciona en cualquier navegador moderno',
  ],
  faq: [
    {
      q: '¿La marca de agua es gratis?',
      a: 'Sí, sin límite de páginas en el plan gratuito. Archivos de hasta 50 MB.',
    },
    {
      q: '¿Puedo marcar solo algunas páginas?',
      a: 'Sí. Aplica a todas las páginas o lista páginas/rangos específicos (p. ej. 1, 3-5, 12).',
    },
    {
      q: '¿La marca de agua queda sobre el contenido?',
      a: 'Sí. La marca de agua se sitúa en una capa transparente sobre la página; la opacidad es ajustable y el texto debajo permanece legible.',
    },
    {
      q: '¿Puedo usar una imagen como marca de agua?',
      a: 'Aún no. En el lanzamiento se admiten marcas de agua de texto; la marca de agua de imagen llegará en una actualización.',
    },
    {
      q: '¿La marca de agua sobrevive al copiar texto?',
      a: 'Sí. La marca de agua se renderiza como parte de cada página, así que copiar texto del PDF no la elimina.',
    },
    {
      q: '¿Puedo eliminar la marca de agua después?',
      a: 'No, la marca de agua es destructiva — guarda tu original sin marcar antes de aplicar.',
    },
    {
      q: '¿Mis archivos se eliminan?',
      a: 'Cada archivo subido y cada resultado se elimina automáticamente en una hora.',
    },
  ],
  howToTitle: 'Cómo añadir una marca de agua a un PDF en línea',
  howToSteps: [
    { name: 'Sube tu PDF', text: 'Arrástralo a la página o haz clic para examinar.' },
    { name: 'Escribe tu marca de agua', text: 'Elige texto, posición, opacidad y rotación. La vista previa se actualiza al instante.' },
    { name: 'Aplica y descarga', text: 'Elige todas las páginas o rangos específicos y descarga el PDF marcado.' },
  ],
  ctaPrimary: 'Suelta un PDF',
  ctaSecondary: 'Probar una marca de agua de muestra',
  faqLabel: 'Preguntas frecuentes',
  howToLabel: 'Cómo funciona',
  relatedLabel: 'Herramientas relacionadas',
};

export const WATERMARK_PAGE: Record<Lang, ToolPageContent> = { en, tr, es };
