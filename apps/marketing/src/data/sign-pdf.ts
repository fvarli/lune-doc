import type { Lang } from '@lunedoc/i18n';
import type { ToolPageContent } from './ocr-pdf';

const en: ToolPageContent = {
  seoTitle: 'Sign PDF Online — Draw, Type, Upload | Lunedoc',
  metaDescription:
    'Add a visible signature to a PDF in your browser. Draw it, type it, or upload an image. Free, no signup. Files deleted within an hour.',
  eyebrow: 'Tool · Security family',
  h1: 'Sign your document right here.',
  sub: 'Draw, type, or upload a signature. Drop it on any page, then download. No signup, no installs.',
  trust: [
    'Files deleted within 1 hour',
    'TLS in transit · encrypted at rest',
    'No signup required',
    'Visible signature, not a cryptographic e-signature',
  ],
  faq: [
    {
      q: 'Is the signature legally binding?',
      a: 'It is a visible electronic signature, suitable for everyday agreements where a recognizable mark on the page is what matters. For binding e-signatures under eIDAS or ESIGN, use a certified provider — we do not issue cryptographic signatures yet.',
    },
    {
      q: 'How can I sign — draw, type, or upload?',
      a: 'All three. Draw with your mouse or touch, type your name in a chosen style, or upload a PNG of your existing signature.',
    },
    {
      q: 'Can I add a date or initials too?',
      a: 'Yes. Switch the field type to Initials, Date, or free Text and place it where you like.',
    },
    {
      q: 'Will the signature be visible if someone prints the PDF?',
      a: "Yes. The signature is rendered into the page, so it shows up in print and in any reader.",
    },
    {
      q: 'Can I sign multiple pages at once?',
      a: 'Yes. Apply to the current page only, or stamp the signature across every page.',
    },
    {
      q: 'Can the recipient verify who signed?',
      a: "Not cryptographically — that requires PKI. The visible signature shows a name and timestamp; you'll want a certified e-signature service for higher trust.",
    },
    {
      q: 'Are my files deleted after?',
      a: 'Every uploaded file and every result is automatically deleted within one hour.',
    },
  ],
  howToTitle: 'How to sign a PDF online',
  howToSteps: [
    { name: 'Upload your PDF', text: 'Drop it onto the page or click to browse.' },
    { name: 'Pick how to sign', text: 'Draw, type, or upload your signature. Choose a style and field type.' },
    { name: 'Place and download', text: 'Drag the signature onto the page, then download the signed PDF.' },
  ],
  ctaPrimary: 'Drop a PDF to sign',
  ctaSecondary: 'Try a sample signature',
  faqLabel: 'Frequently asked',
  howToLabel: 'How it works',
  relatedLabel: 'Related tools',
};

const tr: ToolPageContent = {
  seoTitle: "PDF'i Online İmzala — Çiz, Yaz, Yükle | Lunedoc",
  metaDescription:
    "PDF'e görünür imza ekle. Çiz, adını yaz ya da görselini yükle. Tarayıcında ücretsiz, kayıt yok. Dosyalar bir saat içinde silinir.",
  eyebrow: 'Araç · Güvenlik',
  h1: 'Belgeyi tam burada imzala.',
  sub: 'İmzanı çiz, yaz ya da yükle. İstediğin sayfaya yerleştir, sonra indir. Kayıt ya da kurulum yok.',
  trust: [
    'Dosyalar 1 saat içinde silinir',
    'Aktarımda TLS · sunucuda şifrelenir',
    'Kayıt gerekmez',
    'Görünür imza, kriptografik e-imza değil',
  ],
  faq: [
    {
      q: 'İmza yasal olarak bağlayıcı mı?',
      a: "Bu görünür bir elektronik imzadır; sayfada tanınabilir bir iz bırakmanın yeterli olduğu günlük anlaşmalar için uygundur. eIDAS veya ESIGN kapsamında bağlayıcı e-imza için sertifikalı bir sağlayıcı kullan — kriptografik imza henüz vermiyoruz.",
    },
    {
      q: 'Nasıl imzalayabilirim — çiz, yaz, yükle?',
      a: 'Üçü de var. Fare ya da dokunma ile çizebilir, adını seçtiğin stilde yazabilir ya da var olan imzanın PNG’sini yükleyebilirsin.',
    },
    {
      q: 'Tarih ya da baş harfler de ekleyebilir miyim?',
      a: 'Evet. Alan tipini Baş harfler, Tarih ya da serbest Metin yap; istediğin yere yerleştir.',
    },
    {
      q: "PDF'i biri yazdırırsa imza görünür mü?",
      a: 'Evet. İmza sayfanın bir parçası olarak işleniyor; baskıda ve her okuyucuda görünür.',
    },
    {
      q: 'Birden fazla sayfayı tek seferde imzalayabilir miyim?',
      a: 'Evet. Sadece bu sayfaya uygula ya da imzayı tüm sayfalara bas.',
    },
    {
      q: 'Alıcı imzalayanı doğrulayabilir mi?',
      a: 'Kriptografik olarak hayır — bu PKI gerektirir. Görünür imza ad ve zaman damgası gösterir; daha yüksek güven için sertifikalı bir e-imza servisine ihtiyacın olur.',
    },
    {
      q: 'Dosyalarım sonradan siliniyor mu?',
      a: 'Yüklenen her dosya ve her çıktı bir saat içinde otomatik olarak silinir.',
    },
  ],
  howToTitle: "PDF'i nasıl imzalarsınız",
  howToSteps: [
    { name: "PDF'inizi yükleyin", text: 'Sayfaya bırakın ya da göz atın.' },
    { name: 'İmza yöntemini seçin', text: 'İmzayı çizin, yazın ya da yükleyin. Bir stil ve alan tipi seçin.' },
    { name: 'Yerleştirin ve indirin', text: 'İmzayı sayfaya sürükleyin, sonra imzalı PDF’i indirin.' },
  ],
  ctaPrimary: 'İmzalanacak PDF bırak',
  ctaSecondary: 'Örnek imza dene',
  faqLabel: 'Sık sorulanlar',
  howToLabel: 'Nasıl çalışır',
  relatedLabel: 'İlgili araçlar',
};

const es: ToolPageContent = {
  seoTitle: 'Firmar PDF en línea — Dibuja, escribe, sube | Lunedoc',
  metaDescription:
    'Añade una firma visible a un PDF en tu navegador. Dibújala, escríbela o sube una imagen. Gratis, sin registro. Archivos eliminados en una hora.',
  eyebrow: 'Herramienta · Seguridad',
  h1: 'Firma tu documento aquí mismo.',
  sub: 'Dibuja, escribe o sube tu firma. Colócala en cualquier página y descarga. Sin registro, sin instalaciones.',
  trust: [
    'Archivos eliminados en 1 hora',
    'TLS en tránsito · cifrado en reposo',
    'Sin registro',
    'Firma visible, no es una e-firma criptográfica',
  ],
  faq: [
    {
      q: '¿La firma es legalmente vinculante?',
      a: 'Es una firma electrónica visible, adecuada para acuerdos cotidianos en los que basta con una marca reconocible en la página. Para firmas vinculantes bajo eIDAS o ESIGN, usa un proveedor certificado — todavía no emitimos firmas criptográficas.',
    },
    {
      q: '¿Cómo puedo firmar — dibujar, escribir, subir?',
      a: 'Las tres. Dibuja con el ratón o el dedo, escribe tu nombre en un estilo, o sube un PNG de tu firma existente.',
    },
    {
      q: '¿Puedo añadir también fecha o iniciales?',
      a: 'Sí. Cambia el tipo de campo a Iniciales, Fecha o Texto libre y colócalo donde quieras.',
    },
    {
      q: '¿Se ve la firma si alguien imprime el PDF?',
      a: 'Sí. La firma se renderiza dentro de la página, así que aparece en impresión y en cualquier lector.',
    },
    {
      q: '¿Puedo firmar varias páginas a la vez?',
      a: 'Sí. Aplica solo a la página actual o estampa la firma en todas las páginas.',
    },
    {
      q: '¿El destinatario puede verificar quién firmó?',
      a: 'Criptográficamente no — eso requiere PKI. La firma visible muestra un nombre y una marca de tiempo; para mayor confianza necesitas un servicio de e-firma certificado.',
    },
    {
      q: '¿Mis archivos se eliminan después?',
      a: 'Cada archivo subido y cada resultado se elimina automáticamente en una hora.',
    },
  ],
  howToTitle: 'Cómo firmar un PDF en línea',
  howToSteps: [
    { name: 'Sube tu PDF', text: 'Arrástralo a la página o haz clic para examinar.' },
    { name: 'Elige cómo firmar', text: 'Dibuja, escribe o sube tu firma. Elige un estilo y un tipo de campo.' },
    { name: 'Coloca y descarga', text: 'Arrastra la firma sobre la página y descarga el PDF firmado.' },
  ],
  ctaPrimary: 'Suelta un PDF para firmar',
  ctaSecondary: 'Probar una firma de muestra',
  faqLabel: 'Preguntas frecuentes',
  howToLabel: 'Cómo funciona',
  relatedLabel: 'Herramientas relacionadas',
};

export const SIGN_PAGE: Record<Lang, ToolPageContent> = { en, tr, es };
