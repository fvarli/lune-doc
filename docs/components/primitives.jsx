// primitives.jsx — Logo, Icons, Header, Footer, LangSwitch, ToolIcon

const { useI18n } = window;
const BRAND_NAME = "Lunedoc";

// ── Wordmark logo ─────────────────────────────────────────────────
function Logo({ size = 18, name = BRAND_NAME }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: size, letterSpacing: "-0.025em", color: "var(--fg)" }}>
      <LogoMark size={Math.round(size * 1.35)} />
      <span>{name}</span>
    </div>
  );
}

// Distinctive mark: a folded-corner page rendered as two interlocking
// trapezoids — the negative space forms a "P". Geometric, ownable, scales
// to a 16px favicon without losing identity.
function LogoMark({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <defs>
        <linearGradient id="pl-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="color-mix(in oklch, var(--accent), black 18%)" />
        </linearGradient>
      </defs>
      {/* Outer rounded square in accent */}
      <rect x="2" y="2" width="24" height="24" rx="7" fill="url(#pl-g)" />
      {/* Folded corner — top right cut */}
      <path d="M19 2 L26 9 L19 9 Z" fill="color-mix(in oklch, var(--accent), white 24%)" />
      {/* Inner glyph: stacked pages forming a 'P'-like notch in negative space */}
      <path d="M9 8 H17 a3 3 0 0 1 3 3 v2 a3 3 0 0 1 -3 3 H12 v4 H9 Z M12 11 V13 H16 a0.5 0.5 0 0 0 0 -2 Z" fill="white" />
    </svg>
  );
}

// ── Icon set (stroke, 1.6, 20×20 grid) ────────────────────────────
const Icon = ({ name, size = 18, stroke = "currentColor", style }) => {
  const sw = 1.6;
  const common = { width: size, height: size, viewBox: "0 0 20 20", fill: "none", stroke, strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round", style };
  switch (name) {
    case "merge": return (<svg {...common}><path d="M5 4v5a3 3 0 0 0 3 3h4a3 3 0 0 1 3 3v1"/><path d="M3 4l2 -2 2 2"/><path d="M13 14l2 2 2 -2"/></svg>);
    case "split": return (<svg {...common}><path d="M10 4v3"/><path d="M10 13v3"/><path d="M5 10h10"/><rect x="2" y="3" width="6" height="4" rx="1"/><rect x="12" y="3" width="6" height="4" rx="1"/><rect x="7" y="13" width="6" height="4" rx="1"/></svg>);
    case "compress": return (<svg {...common}><path d="M3 8l3 -3M3 8l3 3M3 8h6"/><path d="M17 12l-3 -3M17 12l-3 3M17 12h-6"/></svg>);
    case "convert": return (<svg {...common}><path d="M4 7h10l-2 -2"/><path d="M16 13H6l2 2"/></svg>);
    case "doc": return (<svg {...common}><path d="M5 2h7l4 4v12a1 1 0 0 1 -1 1H5a1 1 0 0 1 -1 -1V3a1 1 0 0 1 1 -1z"/><path d="M12 2v5h4"/><path d="M7 11h6M7 14h4"/></svg>);
    case "calendar": return (<svg {...common}><rect x="3" y="4" width="14" height="13" rx="2"/><path d="M3 8h14"/><path d="M7 2v4M13 2v4"/></svg>);
    case "image": return (<svg {...common}><rect x="3" y="3" width="14" height="14" rx="2"/><circle cx="7.5" cy="7.5" r="1.2"/><path d="M3 14l4 -4 3 3 3 -3 4 4"/></svg>);
    case "rotate": return (<svg {...common}><path d="M16 5v4h-4"/><path d="M16 9a6 6 0 1 0 -1.5 5"/></svg>);
    case "lock": return (<svg {...common}><rect x="4" y="9" width="12" height="8" rx="2"/><path d="M7 9V6a3 3 0 0 1 6 0v3"/></svg>);
    case "unlock": return (<svg {...common}><rect x="4" y="9" width="12" height="8" rx="2"/><path d="M7 9V6a3 3 0 0 1 6 0"/></svg>);
    case "sign": return (<svg {...common}><path d="M3 16c2 0 3 -1 4 -3s2 -6 4 -6 1 4 3 4 2 -2 3 -2"/><path d="M2 18h16"/></svg>);
    case "edit": return (<svg {...common}><path d="M3 17l3 -1 9 -9 -2 -2 -9 9 -1 3z"/><path d="M13 5l2 2"/></svg>);
    case "watermark": return (<svg {...common}><rect x="3" y="3" width="14" height="14" rx="2"/><path d="M6 14l3 -4 3 3 2 -2"/><path d="M14 6l-1 2 2 1"/></svg>);
    case "number": return (<svg {...common}><path d="M3 7h14M3 13h14"/><path d="M7 4l-1 12M13 4l-1 12"/></svg>);
    case "ocr": return (<svg {...common}><path d="M3 6V4a1 1 0 0 1 1 -1h2"/><path d="M14 3h2a1 1 0 0 1 1 1v2"/><path d="M3 14v2a1 1 0 0 0 1 1h2"/><path d="M14 17h2a1 1 0 0 0 1 -1v-2"/><path d="M7 8l3 4 3 -4"/></svg>);
    case "search": return (<svg {...common}><circle cx="9" cy="9" r="5"/><path d="M13 13l4 4"/></svg>);
    case "upload": return (<svg {...common}><path d="M10 14V4"/><path d="M6 8l4 -4 4 4"/><path d="M3 14v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1 -1v-2"/></svg>);
    case "download": return (<svg {...common}><path d="M10 4v10"/><path d="M6 10l4 4 4 -4"/><path d="M3 16v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1 -1v-1"/></svg>);
    case "check": return (<svg {...common}><path d="M4 10l3 3 9 -9"/></svg>);
    case "arrow-right": return (<svg {...common}><path d="M4 10h12"/><path d="M12 6l4 4 -4 4"/></svg>);
    case "arrow-left": return (<svg {...common}><path d="M16 10H4"/><path d="M8 6l-4 4 4 4"/></svg>);
    case "chevron-down": return (<svg {...common}><path d="M5 8l5 4 5 -4"/></svg>);
    case "chevron-right": return (<svg {...common}><path d="M8 5l4 5 -4 5"/></svg>);
    case "globe": return (<svg {...common}><circle cx="10" cy="10" r="7"/><path d="M3 10h14"/><path d="M10 3c2.5 2 2.5 12 0 14"/><path d="M10 3c-2.5 2 -2.5 12 0 14"/></svg>);
    case "shield": return (<svg {...common}><path d="M10 3l6 2v4c0 4 -3 7 -6 8c-3 -1 -6 -4 -6 -8V5l6 -2z"/></svg>);
    case "sparkle": return (<svg {...common}><path d="M10 3l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5z"/></svg>);
    case "menu": return (<svg {...common}><path d="M3 5h14M3 10h14M3 15h14"/></svg>);
    case "close": return (<svg {...common}><path d="M5 5l10 10M15 5l-10 10"/></svg>);
    case "plus": return (<svg {...common}><path d="M10 4v12M4 10h12"/></svg>);
    case "minus": return (<svg {...common}><path d="M4 10h12"/></svg>);
    case "trash": return (<svg {...common}><path d="M4 6h12"/><path d="M8 6V4h4v2"/><path d="M5 6l1 11h8l1 -11"/></svg>);
    case "drag": return (<svg {...common}><circle cx="7" cy="5" r="1"/><circle cx="13" cy="5" r="1"/><circle cx="7" cy="10" r="1"/><circle cx="13" cy="10" r="1"/><circle cx="7" cy="15" r="1"/><circle cx="13" cy="15" r="1"/></svg>);
    case "drive": return (<svg {...common}><path d="M7 3l-4 8 3 5h8l3 -5 -4 -8z"/><path d="M3 11h14"/><path d="M11 3l3 8"/></svg>);
    case "dropbox": return (<svg {...common}><path d="M5 4l5 3 -5 3 -3 -3z"/><path d="M15 4l-5 3 5 3 3 -3z"/><path d="M5 13l5 3 5 -3"/></svg>);
    case "google": return (<svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true"><path d="M19.6 10.23c0-.7-.06-1.36-.18-2H10v3.78h5.36a4.6 4.6 0 0 1-2 3.02v2.5h3.22c1.88-1.74 2.96-4.3 2.96-7.3z" fill="#4285F4"/><path d="M10 20c2.7 0 4.96-.9 6.62-2.43l-3.22-2.5c-.9.6-2.04.96-3.4.96-2.6 0-4.81-1.76-5.6-4.13H1.07v2.6A10 10 0 0 0 10 20z" fill="#34A853"/><path d="M4.4 11.9a6 6 0 0 1 0-3.81V5.49H1.07a10 10 0 0 0 0 9.02L4.4 11.9z" fill="#FBBC05"/><path d="M10 3.96c1.47 0 2.78.5 3.81 1.5l2.85-2.85C14.96 1.06 12.7 0 10 0A10 10 0 0 0 1.07 5.49l3.33 2.6C5.19 5.72 7.4 3.96 10 3.96z" fill="#EA4335"/></svg>);
    case "apple": return (<svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M14.94 10.6c-.02-2.1 1.72-3.1 1.8-3.16-1-1.44-2.5-1.64-3.04-1.66-1.3-.13-2.53.76-3.18.76-.66 0-1.68-.74-2.76-.72-1.42.02-2.74.83-3.46 2.1-1.48 2.56-.38 6.34 1.06 8.42.7 1.02 1.54 2.16 2.62 2.12 1.04-.04 1.44-.68 2.7-.68 1.26 0 1.62.68 2.72.66 1.12-.02 1.84-1.04 2.54-2.06.8-1.18 1.12-2.32 1.14-2.38-.02-.02-2.18-.84-2.2-3.36zM12.86 4.36c.56-.7.94-1.66.84-2.6-.8.04-1.78.54-2.36 1.22-.52.6-.98 1.58-.86 2.5.9.06 1.82-.46 2.38-1.12z"/></svg>);
    case "home": return (<svg {...common}><path d="M3 9l7 -6 7 6"/><path d="M5 9v8a1 1 0 0 0 1 1h3v-5h2v5h3a1 1 0 0 0 1 -1V9"/></svg>);
    case "grid": return (<svg {...common}><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="11" y="3" width="6" height="6" rx="1"/><rect x="3" y="11" width="6" height="6" rx="1"/><rect x="11" y="11" width="6" height="6" rx="1"/></svg>);
    case "user": return (<svg {...common}><circle cx="10" cy="7" r="3"/><path d="M4 17a6 6 0 0 1 12 0"/></svg>);
    case "star": return (<svg {...common}><path d="M10 3l2.4 4.9 5.4 0.8 -3.9 3.8 0.9 5.4 -4.8 -2.5 -4.8 2.5 0.9 -5.4 -3.9 -3.8 5.4 -0.8z"/></svg>);
    case "clock": return (<svg {...common}><circle cx="10" cy="10" r="7"/><path d="M10 6v4l3 2"/></svg>);
    case "folder": return (<svg {...common}><path d="M3 6a1 1 0 0 1 1 -1h4l2 2h7a1 1 0 0 1 1 1v8a1 1 0 0 1 -1 1H4a1 1 0 0 1 -1 -1z"/></svg>);
    case "more": return (<svg {...common}><circle cx="5" cy="10" r="1"/><circle cx="10" cy="10" r="1"/><circle cx="15" cy="10" r="1"/></svg>);
    case "list": return (<svg {...common}><path d="M3 5h14M3 10h14M3 15h14"/></svg>);
    case "filter": return (<svg {...common}><path d="M3 5h14l-5 6v5l-4 -2v-3z"/></svg>);
    case "bell": return (<svg {...common}><path d="M5 9a5 5 0 0 1 10 0v3l1 2H4l1 -2z"/><path d="M8 16a2 2 0 0 0 4 0"/></svg>);
    default: return null;
  }
};

// ── Language switcher (segmented) ─────────────────────────────────
function LangSwitch({ lang, setLang, compact = false }) {
  const langs = ["en", "tr", "es"];
  return (
    <div role="tablist" aria-label="Language" style={{
      display: "inline-flex", alignItems: "center",
      background: "var(--bg-muted)", border: "1px solid var(--line)",
      borderRadius: 999, padding: 3, gap: 2,
    }}>
      {langs.map((code) => {
        const active = lang === code;
        return (
          <button key={code} role="tab" aria-selected={active} onClick={() => setLang(code)} style={{
            border: 0, background: active ? "var(--bg-elev)" : "transparent",
            color: active ? "var(--fg)" : "var(--fg-muted)",
            fontWeight: active ? 600 : 500,
            fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase",
            height: compact ? 22 : 26, padding: compact ? "0 8px" : "0 10px",
            borderRadius: 999, cursor: "pointer",
            boxShadow: active ? "var(--shadow-sm)" : "none",
            transition: "background .15s ease, color .15s ease",
          }}>
            {code}
          </button>
        );
      })}
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────
function Header({ lang, setLang, mobile = false, transparent = false, active = "" }) {
  const { t } = useI18n(lang);
  if (mobile) {
    return (
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px",
        borderBottom: "1px solid var(--line)",
        background: "var(--bg)",
        position: "sticky", top: 0, zIndex: 5,
      }}>
        <Logo size={15} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LangSwitch lang={lang} setLang={setLang} compact />
          <button className="pl-btn pl-btn-quiet" style={{ width: 36, padding: 0 }} aria-label="Menu">
            <Icon name="menu" />
          </button>
        </div>
      </header>
    );
  }
  const items = [["nav_tools","tools"],["nav_pricing","pricing"],["nav_blog","blog"],["nav_docs","docs"]];
  return (
    <header style={{
      display: "flex", alignItems: "center", gap: 24,
      padding: "14px 28px",
      borderBottom: "1px solid var(--line)",
      background: transparent ? "transparent" : "var(--bg)",
      position: "sticky", top: 0, zIndex: 5,
      backdropFilter: "saturate(140%) blur(8px)",
    }}>
      <Logo size={16} />
      <nav style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: 12 }}>
        {items.map(([k, id]) => {
          const isActive = active === id;
          return (
            <a key={k} href="#" style={{
              padding: "8px 12px", borderRadius: 8,
              color: isActive ? "var(--fg)" : "var(--fg-muted)",
              fontSize: 14, fontWeight: isActive ? 600 : 500,
              background: isActive ? "var(--bg-muted)" : "transparent",
            }}>{t(k)}</a>
          );
        })}
      </nav>
      <div style={{ flex: 1 }} />
      <LangSwitch lang={lang} setLang={setLang} />
      <button className="pl-btn pl-btn-quiet pl-btn-sm">{t("nav_signin")}</button>
      <button className="pl-btn pl-btn-primary pl-btn-sm">{t("nav_get_started")}</button>
    </header>
  );
}

// ── Mobile bottom navigation (Flutter-ready) ─────────────────────
function MobileBottomNav({ active = "home", lang }) {
  const { t } = useI18n(lang);
  const items = [
    { id: "home",      icon: "home",     label: t("nav_home") },
    { id: "tools",     icon: "grid",     label: t("nav_tools") },
    { id: "files",     icon: "folder",   label: t("nav_files") },
    { id: "account",   icon: "user",     label: t("nav_account") },
  ];
  return (
    <nav style={{
      position: "sticky", bottom: 0, left: 0, right: 0,
      background: "color-mix(in oklch, var(--bg-elev) 92%, transparent)",
      borderTop: "1px solid var(--line)",
      padding: "8px 8px calc(env(safe-area-inset-bottom, 0px) + 10px)",
      display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4,
      backdropFilter: "saturate(140%) blur(12px)",
      zIndex: 4,
    }}>
      {items.map((it) => {
        const isActive = it.id === active;
        return (
          <button key={it.id} style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 3, height: 52,
            border: 0, background: "transparent", cursor: "pointer",
            color: isActive ? "var(--accent)" : "var(--fg-subtle)",
            fontFamily: "inherit",
            borderRadius: 10,
          }}>
            <div style={{ position: "relative" }}>
              <Icon name={it.icon} size={20} />
              {isActive && <div style={{ position: "absolute", inset: -6, borderRadius: 10, background: "var(--accent-soft)", zIndex: -1 }} />}
            </div>
            <div style={{ fontSize: 10.5, fontWeight: isActive ? 600 : 500, letterSpacing: "0.01em" }}>{it.label}</div>
          </button>
        );
      })}
    </nav>
  );
}

// ── Footer ────────────────────────────────────────────────────────
function Footer({ lang, mobile = false }) {
  const { t } = useI18n(lang);
  const cols = [
    { title: "foot_product",   items: ["nav_tools", "nav_pricing", "foot_changelog", "foot_status"] },
    { title: "foot_company",   items: ["foot_about", "nav_blog", "foot_careers", "foot_contact"] },
    { title: "foot_legal",     items: ["foot_privacy", "foot_terms", "foot_security"] },
  ];
  return (
    <footer style={{
      borderTop: "1px solid var(--line)",
      background: "var(--bg-muted)",
      padding: mobile ? "32px 20px 20px" : "48px 28px 24px",
      display: "grid",
      gridTemplateColumns: mobile ? "1fr" : "1.4fr repeat(3, 1fr)",
      gap: mobile ? 28 : 32,
    }}>
      <div>
        <Logo size={15} />
        <p style={{ marginTop: 12, fontSize: 13, color: "var(--fg-muted)", maxWidth: 280 }}>
          {t("foot_tagline")}
        </p>
        <div style={{ marginTop: 14, display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span className="pl-chip" style={{ fontSize: 11 }}><Icon name="shield" size={11}/> SOC 2</span>
          <span className="pl-chip" style={{ fontSize: 11 }}><Icon name="globe" size={11}/> GDPR</span>
        </div>
      </div>
      {cols.map((c) => (
        <div key={c.title}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-subtle)", marginBottom: 12 }}>{t(c.title)}</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
            {c.items.map((k) => (
              <li key={k}><a style={{ fontSize: 13, color: "var(--fg-muted)" }}>{t(k)}</a></li>
            ))}
          </ul>
        </div>
      ))}
      <div style={{
        gridColumn: "1 / -1",
        borderTop: "1px solid var(--line)",
        paddingTop: 16,
        display: "flex",
        flexDirection: mobile ? "column" : "row",
        gap: mobile ? 8 : 0,
        justifyContent: "space-between",
        alignItems: mobile ? "flex-start" : "center",
        fontSize: 12,
        color: "var(--fg-subtle)",
      }}>
        <span>{t("foot_copy")}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "oklch(0.7 0.14 145)" }} />
          {t("foot_status_ok")}
        </span>
      </div>
    </footer>
  );
}

// ── Tool definitions ─────────────────────────────────────────────
// Categories: organize, convert, compress (optimize), edit, security
const TOOLS = [
  { key: "merge",       icon: "merge",    cat: "organize", tone: 252 },
  { key: "split",       icon: "split",    cat: "organize", tone: 252 },
  { key: "rotate",      icon: "rotate",   cat: "organize", tone: 252 },
  { key: "compress",    icon: "compress", cat: "compress", tone: 200 },
  { key: "pdf_to_word", icon: "doc",      cat: "convert",  tone: 220 },
  { key: "pdf_to_jpg",  icon: "image",    cat: "convert",  tone: 220 },
  { key: "pdf_to_excel",icon: "doc",      cat: "convert",  tone: 220 },
  { key: "pdf_to_ppt",  icon: "doc",      cat: "convert",  tone: 220 },
  { key: "word_to_pdf", icon: "doc",      cat: "convert",  tone: 220 },
  { key: "jpg_to_pdf",  icon: "image",    cat: "convert",  tone: 220 },
  { key: "edit",        icon: "edit",     cat: "edit",     tone: 290 },
  { key: "watermark",   icon: "watermark",cat: "edit",     tone: 290 },
  { key: "page_numbers",icon: "number",   cat: "edit",     tone: 290 },
  { key: "ocr",         icon: "ocr",      cat: "edit",     tone: 290 },
  { key: "sign",        icon: "sign",     cat: "security", tone: 30 },
  { key: "protect",     icon: "lock",     cat: "security", tone: 30 },
  { key: "unlock",      icon: "unlock",   cat: "security", tone: 30 },
  { key: "redact",      icon: "shield",   cat: "security", tone: 30 },
];

function ToolIcon({ name, tone = 252, size = 40 }) {
  // Soft tinted square with the icon — keeps grid quiet but adds rhythm
  return (
    <div style={{
      width: size, height: size, borderRadius: 10,
      background: `oklch(0.96 0.04 ${tone})`,
      color: `oklch(0.45 0.16 ${tone})`,
      display: "grid", placeItems: "center",
      flexShrink: 0,
      border: "1px solid color-mix(in oklch, var(--line) 80%, transparent)",
    }}>
      <Icon name={name} size={Math.round(size * 0.55)} />
    </div>
  );
}

function ToolCard({ toolKey, lang, onClick, featured }) {
  const { t } = useI18n(lang);
  const tool = TOOLS.find(x => x.key === toolKey);
  if (!tool) return null;
  return (
    <button onClick={onClick} className="pl-card" style={{
      textAlign: "left",
      padding: "var(--tool-card-pad)",
      cursor: "pointer",
      display: "flex", flexDirection: "column", gap: "var(--tool-card-gap)",
      transition: "border-color .15s ease, transform .15s ease, box-shadow .15s ease",
      border: featured ? "1px solid color-mix(in oklch, var(--accent) 35%, var(--line))" : "1px solid var(--line)",
      background: "var(--bg-elev)",
      width: "100%",
    }}
      onMouseOver={(e)=>{ e.currentTarget.style.borderColor = "var(--line-strong)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseOut={(e)=>{ e.currentTarget.style.borderColor = featured ? "color-mix(in oklch, var(--accent) 35%, var(--line))" : "var(--line)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <ToolIcon name={tool.icon} tone={tool.tone} size={40} />
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--fg)", textWrap: "balance" }}>{t("t_" + tool.key)}</div>
        <div style={{ fontSize: 12.5, color: "var(--fg-muted)", lineHeight: 1.45, textWrap: "pretty" }}>{t("t_" + tool.key + "_d")}</div>
      </div>
    </button>
  );
}

// ── File-card placeholder (shows a "PDF page" thumbnail) ─────────
function PdfThumb({ w = 56, h = 72, page = null }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 6,
      background: "var(--bg-elev)",
      border: "1px solid var(--line)",
      boxShadow: "var(--shadow-sm)",
      position: "relative", overflow: "hidden", flexShrink: 0,
    }}>
      <div style={{ position: "absolute", top: 8, left: 8, right: 8, height: 4, borderRadius: 2, background: "var(--bg-sunken)" }} />
      <div style={{ position: "absolute", top: 18, left: 8, right: 18, height: 3, borderRadius: 2, background: "var(--bg-sunken)" }} />
      <div style={{ position: "absolute", top: 26, left: 8, right: 12, height: 3, borderRadius: 2, background: "var(--bg-sunken)" }} />
      <div style={{ position: "absolute", top: 34, left: 8, right: 22, height: 3, borderRadius: 2, background: "var(--bg-sunken)" }} />
      {page != null
        ? <div style={{ position: "absolute", bottom: 4, right: 4, fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--fg-subtle)", background: "var(--bg-muted)", padding: "1px 5px", borderRadius: 3, border: "1px solid var(--line)" }}>{page}</div>
        : <div style={{ position: "absolute", bottom: 6, right: 6, fontSize: 8, fontFamily: "var(--font-mono)", color: "var(--fg-subtle)", background: "var(--bg-muted)", padding: "1px 4px", borderRadius: 3, border: "1px solid var(--line)" }}>PDF</div>
      }
    </div>
  );
}

Object.assign(window, { BRAND_NAME, Logo, LogoMark, Icon, LangSwitch, Header, Footer, MobileBottomNav, TOOLS, ToolIcon, ToolCard, PdfThumb });
