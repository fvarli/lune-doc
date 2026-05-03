// app.jsx — composes pages in a design canvas, with tweaks panel & shared lang state

const {
  DesignCanvas, DCSection, DCArtboard,
  TweaksPanel, useTweaks, TweakSection, TweakRadio, TweakSelect, TweakToggle,
  IOSDevice, IOSStatusBar, ChromeWindow,
  HomeContent, ToolPage, AuthPage, BlogPage,
  MergeToolPage, SplitToolPage, ConvertToolPage, WatermarkToolPage, SignToolPage, OCRToolPage, EditPDFToolPage,
  ToolsIndexPage, PricingPage, DashboardPage, ArticlePage, SystemInventoryPage,
  LangSwitch,
} = window;

// ── Accent presets ────────────────────────────────────────────────
const ACCENTS = {
  indigo:  { h: 252, c: 0.18, l: 0.55, label: "Indigo" },
  blue:    { h: 235, c: 0.17, l: 0.55, label: "Blue" },
  emerald: { h: 165, c: 0.15, l: 0.50, label: "Emerald" },
  graphite:{ h: 260, c: 0.02, l: 0.20, label: "Graphite" },
  amber:   { h: 60,  c: 0.16, l: 0.60, label: "Amber" },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "accent": "indigo",
  "density": "default",
  "heroVariant": "split",
  "lang": "en"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const lang = tweaks.lang;
  const setLang = (v) => setTweak("lang", v);

  // Apply accent + theme + density to :root
  React.useEffect(() => {
    const a = ACCENTS[tweaks.accent] || ACCENTS.indigo;
    const r = document.documentElement;
    r.style.setProperty("--accent-h", a.h);
    r.style.setProperty("--accent-c", a.c);
    r.style.setProperty("--accent-l", a.l);
    r.setAttribute("data-theme", tweaks.theme);
    r.setAttribute("data-density", tweaks.density);
  }, [tweaks.accent, tweaks.theme, tweaks.density]);

  // Common artboard inner-frame: a styled scroll-clipped container
  const Frame = ({ children, height = 900, mobile = false, isAuth = false }) => (
    <div className="pl-root pl-art" style={{
      width: "100%", height,
      overflow: "hidden",
      borderRadius: 0,
      background: "var(--bg)",
    }}>
      <div style={{ width: "100%", height: "100%", overflow: "auto" }}>
        {children}
      </div>
    </div>
  );

  // Desktop frame inside ChromeWindow
  const Desktop = ({ children, url = "lunedoc.app", w = 1280, h = 820 }) => (
    <ChromeWindow tabs={[{ title: "Lunedoc" }]} activeIndex={0} url={url} width={w} height={h}>
      <div className="pl-root" style={{ width: "100%", height: "100%", overflow: "auto", background: "var(--bg)" }}>
        {children}
      </div>
    </ChromeWindow>
  );

  // iPhone frame
  const Phone = ({ children, label = "" }) => (
    <IOSDevice width={390} height={844} dark={tweaks.theme === "dark"}>
      <IOSStatusBar dark={tweaks.theme === "dark"} time="9:41" />
      <div className="pl-root" style={{ width: "100%", height: "calc(100% - 47px)", overflow: "auto", background: "var(--bg)" }}>
        {children}
      </div>
    </IOSDevice>
  );

  return (
    <React.Fragment>
      <DesignCanvas storageKey="paperline-canvas-v1" background="oklch(0.97 0.005 250)">
        {/* HOMEPAGE */}
        <DCSection id="home" title="01 — Homepage" subtitle="Hero, tools, why · desktop + mobile">
          <DCArtboard id="home-desktop" label="Homepage · Desktop" width={1280} height={820}>
            <Desktop w={1280} h={820}>
              <HomeContent lang={lang} heroVariant={tweaks.heroVariant} />
            </Desktop>
          </DCArtboard>
          <DCArtboard id="home-mobile" label="Homepage · Mobile" width={390} height={844}>
            <Phone>
              <HomeContent lang={lang} mobile heroVariant={tweaks.heroVariant} />
            </Phone>
          </DCArtboard>
        </DCSection>

        {/* TOOL PAGE — three states */}
        <DCSection id="tool" title="02 — Tool page" subtitle="Compress PDF · empty / uploading / result · all states are toggleable in-page">
          <DCArtboard id="tool-empty" label="Tool · Empty" width={1080} height={820}>
            <Desktop w={1080} h={820} url="lunedoc.app/compress-pdf">
              <ToolPage lang={lang} state="empty" />
            </Desktop>
          </DCArtboard>
          <DCArtboard id="tool-uploading" label="Tool · Uploading" width={1080} height={820}>
            <Desktop w={1080} h={820} url="lunedoc.app/compress-pdf">
              <ToolPage lang={lang} state="uploading" />
            </Desktop>
          </DCArtboard>
          <DCArtboard id="tool-done" label="Tool · Result" width={1080} height={820}>
            <Desktop w={1080} h={820} url="lunedoc.app/compress-pdf">
              <ToolPage lang={lang} state="done" />
            </Desktop>
          </DCArtboard>
          <DCArtboard id="tool-mobile" label="Tool · Mobile" width={390} height={844}>
            <Phone>
              <ToolPage lang={lang} state="empty" mobile />
            </Phone>
          </DCArtboard>
        </DCSection>

        {/* TOOL VARIANTS */}
        <DCSection id="tool-variants" title="03 — Tool variants" subtitle="The same shell, four different problems · Merge, Split, Convert, Watermark">
          <DCArtboard id="tool-merge" label="Merge PDF" width={1080} height={820}>
            <Desktop w={1080} h={820} url="lunedoc.app/merge-pdf">
              <MergeToolPage lang={lang} setLang={setLang} />
            </Desktop>
          </DCArtboard>
          <DCArtboard id="tool-split" label="Split PDF" width={1080} height={900}>
            <Desktop w={1080} h={900} url="lunedoc.app/split-pdf">
              <SplitToolPage lang={lang} setLang={setLang} />
            </Desktop>
          </DCArtboard>
          <DCArtboard id="tool-convert" label="Convert PDF" width={1080} height={900}>
            <Desktop w={1080} h={900} url="lunedoc.app/convert-pdf">
              <ConvertToolPage lang={lang} setLang={setLang} />
            </Desktop>
          </DCArtboard>
          <DCArtboard id="tool-watermark" label="Watermark PDF" width={1080} height={1000}>
            <Desktop w={1080} h={1000} url="lunedoc.app/watermark-pdf">
              <WatermarkToolPage lang={lang} setLang={setLang} />
            </Desktop>
          </DCArtboard>
          <DCArtboard id="tool-watermark-mobile" label="Watermark PDF · Mobile" width={390} height={844}>
            <Phone>
              <WatermarkToolPage lang={lang} setLang={setLang} mobile />
            </Phone>
          </DCArtboard>
          <DCArtboard id="tool-sign" label="Sign PDF" width={1080} height={1000}>
            <Desktop w={1080} h={1000} url="lunedoc.app/sign-pdf">
              <SignToolPage lang={lang} setLang={setLang} />
            </Desktop>
          </DCArtboard>
          <DCArtboard id="tool-sign-mobile" label="Sign PDF · Mobile" width={390} height={844}>
            <Phone>
              <SignToolPage lang={lang} setLang={setLang} mobile />
            </Phone>
          </DCArtboard>
          <DCArtboard id="tool-ocr" label="OCR PDF" width={1080} height={1000}>
            <Desktop w={1080} h={1000} url="lunedoc.app/ocr-pdf">
              <OCRToolPage lang={lang} setLang={setLang} />
            </Desktop>
          </DCArtboard>
          <DCArtboard id="tool-ocr-mobile" label="OCR PDF · Mobile" width={390} height={844}>
            <Phone>
              <OCRToolPage lang={lang} setLang={setLang} mobile />
            </Phone>
          </DCArtboard>
          <DCArtboard id="tool-edit" label="Edit PDF" width={1080} height={1000}>
            <Desktop w={1080} h={1000} url="lunedoc.app/edit-pdf">
              <EditPDFToolPage lang={lang} setLang={setLang} />
            </Desktop>
          </DCArtboard>
          <DCArtboard id="tool-edit-mobile" label="Edit PDF · Mobile" width={390} height={844}>
            <Phone>
              <EditPDFToolPage lang={lang} setLang={setLang} mobile />
            </Phone>
          </DCArtboard>
        </DCSection>

        {/* TOOLS INDEX */}
        <DCSection id="tools-index" title="04 — Tools index" subtitle="Searchable, filterable library page · all 18 tools + FAQ">
          <DCArtboard id="tools-desktop" label="Tools · Desktop" width={1280} height={1100}>
            <Desktop w={1280} h={1100} url="lunedoc.app/tools">
              <ToolsIndexPage lang={lang} setLang={setLang} />
            </Desktop>
          </DCArtboard>
          <DCArtboard id="tools-mobile" label="Tools · Mobile" width={390} height={844}>
            <Phone>
              <ToolsIndexPage lang={lang} setLang={setLang} mobile />
            </Phone>
          </DCArtboard>
        </DCSection>

        {/* PRICING */}
        <DCSection id="pricing" title="05 — Pricing" subtitle="Free / Pro / Business · monthly + yearly toggle">
          <DCArtboard id="pricing-desktop" label="Pricing · Desktop" width={1280} height={1000}>
            <Desktop w={1280} h={1000} url="lunedoc.app/pricing">
              <PricingPage lang={lang} setLang={setLang} />
            </Desktop>
          </DCArtboard>
          <DCArtboard id="pricing-mobile" label="Pricing · Mobile" width={390} height={844}>
            <Phone>
              <PricingPage lang={lang} setLang={setLang} mobile />
            </Phone>
          </DCArtboard>
        </DCSection>

        {/* AUTH */}
        <DCSection id="auth" title="06 — Sign in / Register" subtitle="Split layout with editorial quote">
          <DCArtboard id="auth-signin" label="Sign in" width={1280} height={820}>
            <Desktop w={1280} h={820} url="lunedoc.app/signin">
              <AuthPage lang={lang} setLang={setLang} mode="signin" />
            </Desktop>
          </DCArtboard>
          <DCArtboard id="auth-register" label="Register" width={1280} height={820}>
            <Desktop w={1280} h={820} url="lunedoc.app/register">
              <AuthPage lang={lang} setLang={setLang} mode="register" />
            </Desktop>
          </DCArtboard>
          <DCArtboard id="auth-mobile" label="Sign in · Mobile" width={390} height={844}>
            <Phone>
              <AuthPage lang={lang} setLang={setLang} mode="signin" mobile />
            </Phone>
          </DCArtboard>
        </DCSection>

        {/* DASHBOARD */}
        <DCSection id="dashboard" title="07 — Dashboard" subtitle="Logged-in workspace · empty + populated · desktop + mobile">
          <DCArtboard id="dash-desktop" label="Dashboard · Desktop" width={1280} height={900}>
            <Desktop w={1280} h={900} url="lunedoc.app/app">
              <DashboardPage lang={lang} setLang={setLang} />
            </Desktop>
          </DCArtboard>
          <DCArtboard id="dash-empty" label="Dashboard · Empty" width={1280} height={900}>
            <Desktop w={1280} h={900} url="lunedoc.app/app">
              <DashboardPage lang={lang} setLang={setLang} empty />
            </Desktop>
          </DCArtboard>
          <DCArtboard id="dash-mobile" label="Dashboard · Mobile" width={390} height={844}>
            <Phone>
              <DashboardPage lang={lang} setLang={setLang} mobile />
            </Phone>
          </DCArtboard>
        </DCSection>

        {/* BLOG */}
        <DCSection id="blog" title="08 — Blog" subtitle="Magazine grid + article detail with TOC and related tools">
          <DCArtboard id="blog-desktop" label="Blog index · Desktop" width={1280} height={1100}>
            <Desktop w={1280} h={1100} url="lunedoc.app/blog">
              <BlogPage lang={lang} />
            </Desktop>
          </DCArtboard>
          <DCArtboard id="blog-mobile" label="Blog index · Mobile" width={390} height={844}>
            <Phone>
              <BlogPage lang={lang} mobile />
            </Phone>
          </DCArtboard>
          <DCArtboard id="article-desktop" label="Article · Desktop" width={1280} height={1400}>
            <Desktop w={1280} h={1400} url="lunedoc.app/blog/why-your-pdf">
              <ArticlePage lang={lang} setLang={setLang} />
            </Desktop>
          </DCArtboard>
          <DCArtboard id="article-mobile" label="Article · Mobile" width={390} height={844}>
            <Phone>
              <ArticlePage lang={lang} setLang={setLang} mobile />
            </Phone>
          </DCArtboard>
        </DCSection>

        {/* SYSTEM */}
        <DCSection id="system" title="09 — Design system" subtitle="Tokens, primitives, components used across every page">
          <DCArtboard id="system-inventory" label="The system, one page" width={1280} height={1500}>
            <Desktop w={1280} h={1500} url="lunedoc.app/system">
              <SystemInventoryPage lang={lang} setLang={setLang} />
            </Desktop>
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      {/* Persistent language switcher overlay (always available, always at bottom-left) */}
      <div style={{
        position: "fixed", bottom: 16, left: 16, zIndex: 50,
        background: "var(--bg-elev, #fff)",
        border: "1px solid var(--line, #e5e7eb)",
        borderRadius: 999, padding: 6,
        boxShadow: "0 6px 16px -6px rgba(15,15,20,.18)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: 11, color: "#777", paddingLeft: 8, fontFamily: "Inter, sans-serif" }}>Language</span>
        <LangSwitch lang={lang} setLang={setLang} compact />
      </div>

      <TweaksPanel title="Tweaks" defaultOpen={false}>
        <TweakSection title="Theme">
          <TweakRadio label="Mode" value={tweaks.theme} onChange={(v) => setTweak("theme", v)}
            options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} />
        </TweakSection>
        <TweakSection title="Accent">
          <TweakSelect label="Color" value={tweaks.accent} onChange={(v) => setTweak("accent", v)}
            options={Object.keys(ACCENTS).map(k => ({ value: k, label: ACCENTS[k].label }))} />
        </TweakSection>
        <TweakSection title="Layout">
          <TweakRadio label="Hero" value={tweaks.heroVariant} onChange={(v) => setTweak("heroVariant", v)}
            options={[{ value: "split", label: "Split" }, { value: "centered", label: "Centered" }]} />
          <TweakRadio label="Tool grid" value={tweaks.density} onChange={(v) => setTweak("density", v)}
            options={[{ value: "compact", label: "Compact" }, { value: "default", label: "Default" }, { value: "cozy", label: "Cozy" }]} />
        </TweakSection>
        <TweakSection title="Language">
          <TweakRadio label="Locale" value={tweaks.lang} onChange={(v) => setTweak("lang", v)}
            options={[{ value: "en", label: "EN" }, { value: "tr", label: "TR" }, { value: "es", label: "ES" }]} />
        </TweakSection>
      </TweaksPanel>
    </React.Fragment>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
