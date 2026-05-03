import type { Lang } from '@lunedoc/i18n';
import type { ToolPageContent } from './ocr-pdf';

const en: ToolPageContent = {
  seoTitle: 'Edit PDF Online — Text, Highlight, Redact | Lunedoc',
  metaDescription:
    'Add text, highlights, redactions, and shapes to a PDF in your browser. Free, no signup. Files deleted within an hour.',
  eyebrow: 'Tool · Edit family',
  h1: 'Edit your PDF in place.',
  sub: 'Add text, highlight passages, redact secrets, or drop in a shape — all in one quiet workspace.',
  trust: [
    'Files deleted within 1 hour',
    'TLS in transit · encrypted at rest',
    'No signup required',
    'Overlay editor — not full text reflow',
  ],
  faq: [
    {
      q: 'Can I edit the original PDF text?',
      a: "Not directly. Lunedoc Edit is an overlay editor: you add text, highlights, redactions, and shapes on top of the page. To re-flow the original text the way Acrobat Pro does, you need a full content editor — that's a different product.",
    },
    {
      q: 'How does redaction work?',
      a: "Selecting Redact draws a black bar over the area, then permanently removes the underlying text from the file when you apply. The deleted content can't be recovered from the output PDF.",
    },
    {
      q: 'What can I add to a page?',
      a: 'Custom text, color highlights over existing text, redaction blocks, and outlined or filled shape rectangles. Choose color and stroke style for each.',
    },
    {
      q: 'Can I edit multiple pages?',
      a: 'Yes — use the page stepper to move through the document. Each page tracks its own overlay elements.',
    },
    {
      q: 'Will my edits survive copy-paste?',
      a: 'Added text and shapes are part of the rendered page, so they appear in print and any reader. Highlights are drawn on top; the underlying text is unchanged.',
    },
    {
      q: 'Does it work on my phone?',
      a: 'Yes, the entire flow works in mobile browsers — though precision is easier on a larger screen for redactions.',
    },
    {
      q: 'Are my files deleted after?',
      a: 'Every uploaded file and every result is automatically deleted within one hour.',
    },
  ],
  howToTitle: 'How to edit a PDF online',
  howToSteps: [
    { name: 'Upload your PDF', text: 'Drop it onto the page or click to browse.' },
    { name: 'Pick a tool and place it', text: 'Choose Add text, Highlight, Redact, or Shape; click on the page to position.' },
    { name: 'Apply and download', text: 'Step through pages, add what you need, then download the edited PDF.' },
  ],
  ctaPrimary: 'Drop a PDF',
  ctaSecondary: 'Try a sample edit',
  faqLabel: 'Frequently asked',
  howToLabel: 'How it works',
  relatedLabel: 'Related tools',
};

const tr: ToolPageContent = {
  seoTitle: "PDF'i Online Düzenle — Metin, Vurgu, Sansür | Lunedoc",
  metaDescription:
    "PDF'e tarayıcında metin, vurgu, sansür ve şekil ekle. Ücretsiz, kayıt yok. Dosyalar bir saat içinde silinir.",
  eyebrow: 'Araç · Düzenleme',
  h1: "PDF'ini doğrudan düzenle.",
  sub: 'Metin ekle, satırları vurgula, gizli bilgileri sansürle ya da bir şekil yerleştir — hepsi tek bir sade çalışma alanında.',
  trust: [
    'Dosyalar 1 saat içinde silinir',
    'Aktarımda TLS · sunucuda şifrelenir',
    'Kayıt gerekmez',
    'Üst-katman düzenleyici — tam metin akışı değil',
  ],
  faq: [
    {
      q: "Orijinal PDF metnini düzenleyebilir miyim?",
      a: "Doğrudan değil. Lunedoc Edit bir üst-katman düzenleyicidir: sayfanın üzerine metin, vurgu, sansür ve şekiller eklersin. Acrobat Pro gibi orijinal metni yeniden akışa sokmak için tam içerik düzenleyici gerekir — o farklı bir ürün.",
    },
    {
      q: 'Sansürleme nasıl çalışır?',
      a: 'Sansür aracını seçtiğinde alanın üzerine siyah bir bant çizilir; uygulandığında alttaki metin dosyadan kalıcı olarak silinir. Çıktı PDF’ten silinen içerik geri getirilemez.',
    },
    {
      q: 'Sayfaya neler ekleyebilirim?',
      a: 'Özel metin, mevcut metin üzerine renkli vurgu, sansür blokları ve dolu ya da çerçeveli şekil dikdörtgenleri. Her biri için renk ve çizgi stili seçebilirsin.',
    },
    {
      q: 'Birden fazla sayfayı düzenleyebilir miyim?',
      a: 'Evet — sayfa adımlayıcıyla belge boyunca ilerle. Her sayfa kendi katman öğelerini takip eder.',
    },
    {
      q: 'Düzenlemelerim kopyala-yapıştır sonrası kalır mı?',
      a: 'Eklenen metin ve şekiller işlenmiş sayfanın parçası olur; baskıda ve her okuyucuda görünür. Vurgular üstte çizilir; alttaki metin değişmez.',
    },
    {
      q: 'Telefonumda çalışıyor mu?',
      a: 'Evet, tüm akış mobil tarayıcılarda çalışır — ama sansür gibi hassas işler için büyük ekranda daha kolay.',
    },
    {
      q: 'Dosyalarım sonradan siliniyor mu?',
      a: 'Yüklenen her dosya ve her çıktı bir saat içinde otomatik olarak silinir.',
    },
  ],
  howToTitle: "PDF'i online nasıl düzenlersiniz",
  howToSteps: [
    { name: "PDF'inizi yükleyin", text: 'Sayfaya bırakın ya da göz atın.' },
    { name: 'Bir araç seçin ve yerleştirin', text: 'Metin ekle, Vurgula, Sansürle ya da Şekil seçin; sayfada konumlandırmak için tıklayın.' },
    { name: 'Uygulayın ve indirin', text: "Sayfalar arasında dolaşın, gerekenleri ekleyin, sonra düzenlenmiş PDF'i indirin." },
  ],
  ctaPrimary: 'PDF bırak',
  ctaSecondary: 'Örnek düzenleme dene',
  faqLabel: 'Sık sorulanlar',
  howToLabel: 'Nasıl çalışır',
  relatedLabel: 'İlgili araçlar',
};

const es: ToolPageContent = {
  seoTitle: 'Editar PDF en línea — Texto, resaltado, censura | Lunedoc',
  metaDescription:
    'Añade texto, resaltados, censuras y formas a un PDF en tu navegador. Gratis, sin registro. Archivos eliminados en una hora.',
  eyebrow: 'Herramienta · Edición',
  h1: 'Edita tu PDF directamente.',
  sub: 'Añade texto, resalta pasajes, censura datos sensibles o coloca una forma — todo en un único espacio de trabajo tranquilo.',
  trust: [
    'Archivos eliminados en 1 hora',
    'TLS en tránsito · cifrado en reposo',
    'Sin registro',
    'Editor de capa — no reflujo completo de texto',
  ],
  faq: [
    {
      q: '¿Puedo editar el texto original del PDF?',
      a: 'No directamente. Lunedoc Edit es un editor de capa: añades texto, resaltados, censuras y formas sobre la página. Para reflujar el texto original como hace Acrobat Pro necesitas un editor de contenido completo — eso es un producto distinto.',
    },
    {
      q: '¿Cómo funciona la censura?',
      a: 'Seleccionar Censurar dibuja una barra negra sobre el área y, al aplicar, elimina permanentemente el texto subyacente del archivo. El contenido eliminado no se puede recuperar del PDF resultante.',
    },
    {
      q: '¿Qué puedo añadir a una página?',
      a: 'Texto personalizado, resaltados de color sobre texto existente, bloques de censura y rectángulos de forma con contorno o relleno. Elige color y trazo para cada uno.',
    },
    {
      q: '¿Puedo editar varias páginas?',
      a: 'Sí — usa el paso de páginas para recorrer el documento. Cada página guarda sus propios elementos de capa.',
    },
    {
      q: '¿Mis ediciones sobreviven al copiar y pegar?',
      a: 'El texto y las formas añadidas son parte de la página renderizada, así que aparecen en impresión y en cualquier lector. Los resaltados se dibujan encima; el texto subyacente no cambia.',
    },
    {
      q: '¿Funciona en mi teléfono?',
      a: 'Sí, todo el flujo funciona en navegadores móviles — aunque la precisión es más fácil en una pantalla grande para censuras.',
    },
    {
      q: '¿Mis archivos se eliminan después?',
      a: 'Cada archivo subido y cada resultado se elimina automáticamente en una hora.',
    },
  ],
  howToTitle: 'Cómo editar un PDF en línea',
  howToSteps: [
    { name: 'Sube tu PDF', text: 'Arrástralo a la página o haz clic para examinar.' },
    { name: 'Elige una herramienta y colócala', text: 'Selecciona Añadir texto, Resaltar, Censurar o Forma; haz clic en la página para posicionar.' },
    { name: 'Aplica y descarga', text: 'Recorre las páginas, añade lo necesario y descarga el PDF editado.' },
  ],
  ctaPrimary: 'Suelta un PDF',
  ctaSecondary: 'Probar una edición de muestra',
  faqLabel: 'Preguntas frecuentes',
  howToLabel: 'Cómo funciona',
  relatedLabel: 'Herramientas relacionadas',
};

export const EDIT_PAGE: Record<Lang, ToolPageContent> = { en, tr, es };
