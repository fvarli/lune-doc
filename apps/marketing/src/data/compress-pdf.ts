import type { Lang } from '@lunedoc/i18n';
import type { ToolPageContent } from './ocr-pdf';

const en: ToolPageContent = {
  seoTitle: 'Compress PDF Online — Free, No Signup | Lunedoc',
  metaDescription:
    "Shrink a PDF in your browser without losing readable quality. Pick low / medium / high compression. Files deleted within an hour.",
  eyebrow: 'Tool · Optimize',
  h1: 'Shrink your PDF without killing the quality.',
  sub: 'Compress a PDF down to a third of its size without making it look terrible. Three quality presets cover the common tradeoffs.',
  trust: [
    'Files deleted within 1 hour',
    'TLS in transit · encrypted at rest',
    'No signup required',
    'Three quality presets — low / medium / high',
  ],
  faq: [
    {
      q: 'How much smaller will my PDF get?',
      a: "It depends on the original. Image-heavy PDFs (scans, photos) can drop by 60–80%. Text-only PDFs are already small and may shrink only modestly. The result is unpredictable until we try.",
    },
    {
      q: 'Will compression hurt readability?',
      a: 'The medium preset (~ 50% size) is usually the sweet spot — text stays crisp, images soften slightly. Use high for archival, low for sharing on a chat that has size limits.',
    },
    {
      q: 'Can I compare before and after?',
      a: "Yes. The result screen shows old size, new size, and the percentage saved. Download or start over from there.",
    },
    {
      q: 'Does compression affect text searchability?',
      a: 'No. Text remains text. Embedded fonts and the document outline are preserved.',
    },
    {
      q: 'What does the "low / medium / high" preset actually do?',
      a: "Each preset tunes image downsampling and JPEG quality. Low keeps images near-original; medium drops them to ~ 150 dpi; high goes to ~ 96 dpi. Pick by use case, not by name.",
    },
    {
      q: 'Is it free?',
      a: 'Yes, for files up to 50 MB on the free tier.',
    },
    {
      q: 'Are my files deleted after?',
      a: 'Every uploaded file and every result is automatically deleted within one hour.',
    },
  ],
  howToTitle: 'How to compress a PDF online',
  howToSteps: [
    { name: 'Upload your PDF', text: 'Drop it onto the page or click to browse.' },
    { name: 'Wait for the size readout', text: 'Compression runs in two phases — upload, then process. Total time depends on file size.' },
    { name: 'Compare and download', text: 'Check the before/after sizes. Download the compressed PDF, or start over with a different preset.' },
  ],
  ctaPrimary: 'Drop a PDF',
  ctaSecondary: 'Try a sample compress',
  faqLabel: 'Frequently asked',
  howToLabel: 'How it works',
  relatedLabel: 'Related tools',
};

const tr: ToolPageContent = {
  seoTitle: "PDF'i Online Sıkıştır — Ücretsiz, Kayıtsız | Lunedoc",
  metaDescription:
    "Tarayıcında okunabilir kalite kaybı olmadan PDF'i küçült. Düşük / orta / yüksek seçeneği. Dosyalar bir saat içinde silinir.",
  eyebrow: 'Araç · Boyut',
  h1: "PDF'ini kaliteyi öldürmeden küçült.",
  sub: "PDF'ini kötü göstermeden üçte birine kadar sıkıştır. Üç kalite ön ayarı yaygın dengeleri kapsar.",
  trust: [
    'Dosyalar 1 saat içinde silinir',
    'Aktarımda TLS · sunucuda şifrelenir',
    'Kayıt gerekmez',
    'Üç kalite ön ayarı — düşük / orta / yüksek',
  ],
  faq: [
    {
      q: "PDF'im ne kadar küçülür?",
      a: 'Orijinale bağlı. Görsel ağırlıklı PDF’ler (taramalar, fotoğraflar) %60–80 küçülebilir. Sadece metin içeren PDF’ler zaten küçüktür ve az küçülür. Sonuç denemeden tahmin edilemez.',
    },
    {
      q: 'Sıkıştırma okunabilirliği etkiler mi?',
      a: 'Orta ön ayar (~ %50 boyut) genelde tatlı nokta — metin keskin kalır, görseller hafif yumuşar. Arşiv için yüksek; boyut sınırı olan sohbette paylaşmak için düşük.',
    },
    {
      q: 'Önce ve sonrayı karşılaştırabilir miyim?',
      a: 'Evet. Sonuç ekranı eski boyutu, yeni boyutu ve kaydedilen yüzdeyi gösterir. Oradan indirebilir ya da yeniden başlayabilirsin.',
    },
    {
      q: 'Sıkıştırma metin aramayı etkiler mi?',
      a: 'Hayır. Metin metin olarak kalır. Gömülü fontlar ve doküman taslağı korunur.',
    },
    {
      q: '"Düşük / orta / yüksek" ön ayarı ne yapar?',
      a: 'Her ön ayar görsel örnekleme ve JPEG kalitesini ayarlar. Düşük görselleri orijinaline yakın tutar; orta ~ 150 dpi’a düşürür; yüksek ~ 96 dpi’a iner. Kullanım amacına göre seç.',
    },
    {
      q: 'Ücretsiz mi?',
      a: 'Evet, ücretsiz katmanda 50 MB’a kadar dosyalar için.',
    },
    {
      q: 'Dosyalarım sonradan siliniyor mu?',
      a: 'Yüklenen her dosya ve her çıktı bir saat içinde otomatik olarak silinir.',
    },
  ],
  howToTitle: "PDF'i online nasıl sıkıştırırsınız",
  howToSteps: [
    { name: "PDF'inizi yükleyin", text: 'Sayfaya bırakın ya da göz atın.' },
    { name: 'Boyut göstergesini bekleyin', text: 'Sıkıştırma iki aşamada çalışır — yükleme, sonra işlem. Toplam süre dosya boyutuna bağlı.' },
    { name: 'Karşılaştırın ve indirin', text: 'Önceki/sonraki boyutu kontrol edin. Sıkıştırılmış PDF’i indirin ya da farklı ön ayarla yeniden başlayın.' },
  ],
  ctaPrimary: 'PDF bırak',
  ctaSecondary: 'Örnek sıkıştırma dene',
  faqLabel: 'Sık sorulanlar',
  howToLabel: 'Nasıl çalışır',
  relatedLabel: 'İlgili araçlar',
};

const es: ToolPageContent = {
  seoTitle: 'Comprimir PDF en línea — Gratis, sin registro | Lunedoc',
  metaDescription:
    'Reduce un PDF en tu navegador sin perder calidad legible. Elige compresión baja / media / alta. Archivos eliminados en una hora.',
  eyebrow: 'Herramienta · Tamaño',
  h1: 'Reduce tu PDF sin destrozar la calidad.',
  sub: 'Comprime un PDF hasta un tercio de su tamaño sin que se vea mal. Tres preajustes de calidad cubren los compromisos habituales.',
  trust: [
    'Archivos eliminados en 1 hora',
    'TLS en tránsito · cifrado en reposo',
    'Sin registro',
    'Tres preajustes de calidad — bajo / medio / alto',
  ],
  faq: [
    {
      q: '¿Cuánto se reducirá mi PDF?',
      a: 'Depende del original. Los PDFs con muchas imágenes (escaneos, fotos) pueden bajar 60–80%. Los PDFs solo de texto ya son pequeños y bajan poco. El resultado es impredecible hasta probar.',
    },
    {
      q: '¿La compresión afecta la legibilidad?',
      a: 'El preajuste medio (~ 50% del tamaño) suele ser el punto dulce — el texto queda nítido, las imágenes se suavizan ligeramente. Usa alto para archivar; bajo para compartir donde hay límites de tamaño.',
    },
    {
      q: '¿Puedo comparar antes y después?',
      a: 'Sí. La pantalla de resultado muestra el tamaño anterior, el nuevo y el porcentaje ahorrado. Descarga o vuelve a empezar desde ahí.',
    },
    {
      q: '¿La compresión afecta la búsqueda de texto?',
      a: 'No. El texto sigue siendo texto. Las fuentes incrustadas y el esquema del documento se conservan.',
    },
    {
      q: '¿Qué hace el preajuste "bajo / medio / alto"?',
      a: 'Cada preajuste ajusta el remuestreo de imágenes y la calidad JPEG. Bajo mantiene las imágenes casi como el original; medio las baja a ~ 150 dpi; alto a ~ 96 dpi. Elige por caso de uso, no por nombre.',
    },
    {
      q: '¿Es gratis?',
      a: 'Sí, para archivos de hasta 50 MB en el plan gratuito.',
    },
    {
      q: '¿Mis archivos se eliminan después?',
      a: 'Cada archivo subido y cada resultado se elimina automáticamente en una hora.',
    },
  ],
  howToTitle: 'Cómo comprimir un PDF en línea',
  howToSteps: [
    { name: 'Sube tu PDF', text: 'Arrástralo a la página o haz clic para examinar.' },
    { name: 'Espera la lectura de tamaño', text: 'La compresión corre en dos fases — subida y proceso. El tiempo total depende del tamaño.' },
    { name: 'Compara y descarga', text: 'Revisa los tamaños antes/después. Descarga el PDF comprimido o reinicia con otro preajuste.' },
  ],
  ctaPrimary: 'Suelta un PDF',
  ctaSecondary: 'Probar una compresión de muestra',
  faqLabel: 'Preguntas frecuentes',
  howToLabel: 'Cómo funciona',
  relatedLabel: 'Herramientas relacionadas',
};

export const COMPRESS_PAGE: Record<Lang, ToolPageContent> = { en, tr, es };
