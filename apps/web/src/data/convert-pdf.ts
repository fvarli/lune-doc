import type { Lang } from '@lunedoc/i18n';
import type { ToolPageContent } from './ocr-pdf';

const en: ToolPageContent = {
  seoTitle: 'Convert PDF to Word, JPG, Excel & Back | Lunedoc',
  metaDescription:
    'Convert PDF to and from Word, Excel, PowerPoint, JPG, and PNG in your browser. Free, no signup. Files deleted within an hour.',
  eyebrow: 'Tool · Convert',
  h1: 'Convert your PDF into something editable.',
  sub: 'Pick a source format, pick a target, drop in a file. Word, Excel, PowerPoint, and image formats — both directions.',
  trust: [
    'Files deleted within 1 hour',
    'TLS in transit · encrypted at rest',
    'No signup required',
    'Six formats supported in both directions',
  ],
  faq: [
    {
      q: 'Will the layout survive PDF → Word conversion?',
      a: "Mostly, but PDF → Word is fundamentally lossy. Tables, columns, and unusual fonts often re-flow. Always proofread the result before sending. For native-feeling Word output, consider keeping the editable source and exporting to PDF only at the end.",
    },
    {
      q: 'Which formats can I convert between?',
      a: 'PDF, DOCX, XLSX, PPTX, JPG, and PNG — both directions. Specific pairs: PDF↔Word, PDF↔Excel, PDF↔PowerPoint, PDF↔JPG/PNG.',
    },
    {
      q: 'Does PDF → JPG split each page?',
      a: 'Yes. The output is one image per page, packaged in a ZIP for multi-page PDFs.',
    },
    {
      q: "Can I OCR a scanned PDF as I convert?",
      a: "There's a 'Run OCR on scans' option for PDF → text-bearing formats. For dedicated OCR with language picking and a searchable-PDF output, use the OCR tool.",
    },
    {
      q: 'Will tables and formulas survive PDF → Excel?',
      a: 'Detected tables become cells; cell formulas do not survive (the source PDF has no formula data). Expect to re-write any computed columns.',
    },
    {
      q: 'Are my files deleted after?',
      a: 'Every uploaded file and every result is automatically deleted within one hour.',
    },
    {
      q: 'Is there a file-size limit?',
      a: 'Yes — 50 MB per upload on the free tier. Larger files are available on Pro.',
    },
  ],
  howToTitle: 'How to convert a PDF online',
  howToSteps: [
    { name: 'Pick from / to formats', text: 'Choose your source format and what you want out. The drop label updates.' },
    { name: 'Upload the file', text: 'Drop it onto the page or click to browse.' },
    { name: 'Convert and download', text: 'Adjust options if needed (preserve layout, OCR scans, extract images), then download.' },
  ],
  ctaPrimary: 'Drop a file',
  ctaSecondary: 'Try a sample convert',
  faqLabel: 'Frequently asked',
  howToLabel: 'How it works',
  relatedLabel: 'Related tools',
};

const tr: ToolPageContent = {
  seoTitle: "PDF'i Word, JPG, Excel ve Geri — Dönüştür | Lunedoc",
  metaDescription:
    "PDF'i Word, Excel, PowerPoint, JPG ve PNG'ye veya geri dönüştür. Ücretsiz, kayıt yok. Dosyalar bir saat içinde silinir.",
  eyebrow: 'Araç · Dönüştürme',
  h1: "PDF'ini düzenlenebilir bir şeye dönüştür.",
  sub: 'Kaynak biçimi seç, hedef biçimi seç, dosyayı bırak. Word, Excel, PowerPoint ve görsel biçimler — iki yönde de.',
  trust: [
    'Dosyalar 1 saat içinde silinir',
    'Aktarımda TLS · sunucuda şifrelenir',
    'Kayıt gerekmez',
    'İki yönde altı biçim destekleniyor',
  ],
  faq: [
    {
      q: 'PDF → Word dönüşümünde düzen korunur mu?',
      a: "Çoğunlukla evet, ama PDF → Word doğası gereği kayıplı. Tablolar, sütunlar ve sıra dışı yazı tipleri sıkça yeniden akar. Sonucu göndermeden önce mutlaka kontrol et. Word'e yakın çıktı için düzenlenebilir kaynağı sakla ve PDF'e yalnızca sonda dönüştür.",
    },
    {
      q: 'Hangi biçimler arasında dönüşüm var?',
      a: 'PDF, DOCX, XLSX, PPTX, JPG ve PNG — iki yönde. Belirli çiftler: PDF↔Word, PDF↔Excel, PDF↔PowerPoint, PDF↔JPG/PNG.',
    },
    {
      q: 'PDF → JPG her sayfayı ayırıyor mu?',
      a: "Evet. Çıktı sayfa başına bir görseldir; çok sayfalı PDF'ler için ZIP olarak paketlenir.",
    },
    {
      q: 'Dönüştürürken taranan PDF için OCR çalıştırılabilir mi?',
      a: "PDF → metin barındıran biçimlerde 'Taramalarda OCR çalıştır' seçeneği var. Dil seçimi ve aranabilir PDF çıkışı için özel OCR aracını kullan.",
    },
    {
      q: 'PDF → Excel’de tablolar ve formüller korunur mu?',
      a: 'Algılanan tablolar hücreye dönüşür; hücre formülleri korunmaz (kaynak PDF’te formül verisi yoktur). Hesaplanmış sütunları yeniden yazmayı bekle.',
    },
    {
      q: 'Dosyalarım sonradan siliniyor mu?',
      a: 'Yüklenen her dosya ve her çıktı bir saat içinde otomatik olarak silinir.',
    },
    {
      q: 'Dosya boyutu sınırı var mı?',
      a: 'Evet — ücretsiz katmanda yükleme başına 50 MB. Daha büyük dosyalar Pro planda.',
    },
  ],
  howToTitle: "PDF'i online nasıl dönüştürürsünüz",
  howToSteps: [
    { name: 'Kaynak / hedef biçimleri seçin', text: 'Kaynak biçimi ve istediğiniz çıktıyı seçin. Bırakma etiketi güncellenir.' },
    { name: 'Dosyayı yükleyin', text: 'Sayfaya bırakın ya da göz atın.' },
    { name: 'Dönüştürün ve indirin', text: 'Gerekirse seçenekleri ayarlayın (düzeni koru, taramalarda OCR, görselleri çıkar) ve indirin.' },
  ],
  ctaPrimary: 'Dosya bırak',
  ctaSecondary: 'Örnek dönüşüm dene',
  faqLabel: 'Sık sorulanlar',
  howToLabel: 'Nasıl çalışır',
  relatedLabel: 'İlgili araçlar',
};

const es: ToolPageContent = {
  seoTitle: 'Convertir PDF a Word, JPG, Excel y vuelta | Lunedoc',
  metaDescription:
    'Convierte PDF a y desde Word, Excel, PowerPoint, JPG y PNG en tu navegador. Gratis, sin registro. Archivos eliminados en una hora.',
  eyebrow: 'Herramienta · Conversión',
  h1: 'Convierte tu PDF en algo editable.',
  sub: 'Elige el formato de origen, elige el destino, suelta el archivo. Word, Excel, PowerPoint y formatos de imagen — en ambas direcciones.',
  trust: [
    'Archivos eliminados en 1 hora',
    'TLS en tránsito · cifrado en reposo',
    'Sin registro',
    'Seis formatos en ambas direcciones',
  ],
  faq: [
    {
      q: '¿Se conserva el diseño en PDF → Word?',
      a: 'Mayormente sí, pero PDF → Word es fundamentalmente con pérdida. Tablas, columnas y fuentes inusuales suelen reflujar. Revisa siempre el resultado antes de enviarlo. Para una salida que se sienta nativa de Word, conserva la fuente editable y exporta a PDF solo al final.',
    },
    {
      q: '¿Entre qué formatos puedo convertir?',
      a: 'PDF, DOCX, XLSX, PPTX, JPG y PNG — en ambas direcciones. Pares específicos: PDF↔Word, PDF↔Excel, PDF↔PowerPoint, PDF↔JPG/PNG.',
    },
    {
      q: '¿PDF → JPG separa cada página?',
      a: 'Sí. La salida es una imagen por página, empaquetada en un ZIP para PDFs de varias páginas.',
    },
    {
      q: '¿Puedo aplicar OCR a un PDF escaneado al convertir?',
      a: "Hay una opción 'Aplicar OCR a escaneos' para PDF → formatos con texto. Para OCR dedicado con elección de idioma y salida en PDF buscable, usa la herramienta OCR.",
    },
    {
      q: '¿Se conservan tablas y fórmulas en PDF → Excel?',
      a: 'Las tablas detectadas pasan a celdas; las fórmulas de celda no sobreviven (el PDF de origen no tiene datos de fórmula). Espera reescribir cualquier columna calculada.',
    },
    {
      q: '¿Mis archivos se eliminan después?',
      a: 'Cada archivo subido y cada resultado se elimina automáticamente en una hora.',
    },
    {
      q: '¿Hay un límite de tamaño?',
      a: 'Sí — 50 MB por subida en el plan gratuito. Archivos más grandes disponibles en Pro.',
    },
  ],
  howToTitle: 'Cómo convertir un PDF en línea',
  howToSteps: [
    { name: 'Elige formatos origen / destino', text: 'Selecciona el formato de origen y lo que quieres como salida. La etiqueta se actualiza.' },
    { name: 'Sube el archivo', text: 'Arrástralo a la página o haz clic para examinar.' },
    { name: 'Convierte y descarga', text: 'Ajusta las opciones si hace falta (conservar diseño, OCR a escaneos, extraer imágenes) y descarga.' },
  ],
  ctaPrimary: 'Suelta un archivo',
  ctaSecondary: 'Probar una conversión de muestra',
  faqLabel: 'Preguntas frecuentes',
  howToLabel: 'Cómo funciona',
  relatedLabel: 'Herramientas relacionadas',
};

export const CONVERT_PAGE: Record<Lang, ToolPageContent> = { en, tr, es };
