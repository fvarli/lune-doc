// homepage.jsx — Desktop + mobile homepage

const { useI18n, Header, Footer, Logo, Icon, ToolCard, TOOLS, PdfThumb } = window;

function HomeContent({ lang, mobile = false, heroVariant = "split" }) {
  const { t } = useI18n(lang);
  const [cat, setCat] = React.useState("all");
  const cats = ["all", "organize", "convert", "optimize", "security"];
  const filtered = cat === "all" ? TOOLS : TOOLS.filter(x => x.cat === cat);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <Header lang={lang} setLang={() => {}} mobile={mobile} />
      <Hero lang={lang} mobile={mobile} variant={heroVariant} />
      <TrustedBy lang={lang} mobile={mobile} />

      {/* Tools section */}
      <section style={{ padding: mobile ? "48px 16px" : "96px 28px", background: "var(--bg)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ display: "flex", flexDirection: mobile ? "column" : "row", alignItems: mobile ? "flex-start" : "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 28 }}>
            <div style={{ maxWidth: 560 }}>
              <div className="pl-chip" style={{ marginBottom: 12 }}>{t("tools_title")}</div>
              <h2 style={{ fontSize: mobile ? 28 : 40, fontWeight: 600, lineHeight: 1.1 }}>{t("tools_subtitle")}</h2>
            </div>
            {!mobile && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--bg-muted)", border: "1px solid var(--line)", borderRadius: 999, minWidth: 280 }}>
                <Icon name="search" size={16} stroke="var(--fg-subtle)" />
                <input placeholder={t("tools_search")} style={{ border: 0, outline: 0, background: "transparent", fontSize: 13.5, flex: 1, color: "var(--fg)", fontFamily: "inherit" }} />
                <kbd style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-subtle)", border: "1px solid var(--line)", borderRadius: 4, padding: "1px 5px", background: "var(--bg)" }}>⌘K</kbd>
              </div>
            )}
          </div>

          {/* Category pills */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 24, flexWrap: mobile ? "nowrap" : "wrap" }}>
            {cats.map((c) => {
              const active = cat === c;
              return (
                <button key={c} onClick={() => setCat(c)} style={{
                  border: 0, cursor: "pointer", whiteSpace: "nowrap",
                  padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 500, fontFamily: "inherit",
                  background: active ? "var(--fg)" : "var(--bg-muted)",
                  color: active ? "var(--bg)" : "var(--fg-muted)",
                  border: active ? "1px solid var(--fg)" : "1px solid var(--line)",
                  transition: "background .15s ease, color .15s ease",
                }}>{t("tools_" + c)}</button>
              );
            })}
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: mobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
            gap: mobile ? 10 : 14,
          }}>
            {filtered.map((tool, i) => (
              <ToolCard key={tool.key} toolKey={tool.key} lang={lang} featured={!mobile && i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* Why section */}
      {!mobile && <WhySection lang={lang} />}
      {mobile && <WhySectionMobile lang={lang} />}

      <Footer lang={lang} mobile={mobile} />
    </div>
  );
}

function Hero({ lang, mobile, variant }) {
  const { t } = useI18n(lang);
  const padding = mobile ? "40px 16px 32px" : "72px 28px 56px";

  if (variant === "centered" || mobile) {
    return (
      <section className="pl-grid-dots" style={{ padding, position: "relative" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: mobile ? 16 : 22 }}>
          <div className="pl-chip"><span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--accent)" }} />{t("hero_eyebrow")}</div>
          <h1 style={{ fontSize: mobile ? 34 : 60, fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.025em", maxWidth: 820 }}>{t("hero_title")}</h1>
          <p style={{ fontSize: mobile ? 15 : 18, color: "var(--fg-muted)", maxWidth: 600, lineHeight: 1.5 }}>{t("hero_subtitle")}</p>
          <DropZone lang={lang} mobile={mobile} compact={mobile} />
          <div style={{ fontSize: 12, color: "var(--fg-subtle)" }}>{t("hero_drop_hint")}</div>
        </div>
      </section>
    );
  }

  // split — default desktop
  return (
    <section className="pl-grid-dots" style={{ padding }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 64, alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 22, minWidth: 0 }}>
          <div className="pl-chip" style={{ alignSelf: "flex-start" }}><span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--accent)" }} />{t("hero_eyebrow")}</div>
          <h1 style={{ fontSize: 56, fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.025em" }}>{t("hero_title")}</h1>
          <p style={{ fontSize: 17, color: "var(--fg-muted)", maxWidth: 520, lineHeight: 1.55 }}>{t("hero_subtitle")}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="pl-btn pl-btn-primary pl-btn-lg">
              <Icon name="upload" size={16} />
              {t("hero_cta_primary")}
            </button>
            <button className="pl-btn pl-btn-ghost pl-btn-lg">
              {t("hero_cta_secondary")}
              <Icon name="arrow-right" size={16} />
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--fg-subtle)" }}>
            <Icon name="shield" size={14} />
            <span>{t("upload_secure")}</span>
          </div>
        </div>
        <DropZone lang={lang} />
      </div>
    </section>
  );
}

function DropZone({ lang, mobile = false, compact = false }) {
  const { t } = useI18n(lang);
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setHover(true); }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => { e.preventDefault(); setHover(false); }}
      style={{
        position: "relative",
        width: "100%",
        background: hover ? "var(--accent-soft)" : "var(--bg-elev)",
        border: `1.5px dashed ${hover ? "var(--accent)" : "var(--line-strong)"}`,
        borderRadius: 18,
        padding: compact ? "28px 20px" : "44px 32px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
        transition: "background .15s ease, border-color .15s ease, transform .15s ease",
        boxShadow: hover ? "0 0 0 6px var(--accent-ring)" : "var(--shadow-md)",
        textAlign: "center",
      }}>
      {/* Stacked page glyph */}
      <div style={{ position: "relative", width: 72, height: 80 }}>
        <div style={{ position: "absolute", left: 14, top: 8, width: 44, height: 56, borderRadius: 8, background: "var(--bg-elev)", border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)", transform: "rotate(-7deg)" }} />
        <div style={{ position: "absolute", left: 18, top: 14, width: 44, height: 56, borderRadius: 8, background: "var(--bg-elev)", border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)", transform: "rotate(5deg)" }} />
        <div style={{ position: "absolute", left: 14, top: 12, width: 44, height: 56, borderRadius: 8, background: "var(--bg-elev)", border: "1px solid var(--line-strong)", boxShadow: "var(--shadow-md)", display: "grid", placeItems: "center", color: "var(--accent)" }}>
          <Icon name="upload" size={20} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontSize: compact ? 17 : 19, fontWeight: 600 }}>{t("upload_title")}</div>
        <div style={{ fontSize: 13, color: "var(--fg-muted)" }}>{t("upload_subtitle")}</div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        <button className="pl-btn pl-btn-primary">{t("upload_browse")}</button>
        <button className="pl-btn pl-btn-ghost"><Icon name="drive" size={14} />{t("upload_from_drive")}</button>
        {!compact && <button className="pl-btn pl-btn-ghost"><Icon name="dropbox" size={14} />{t("upload_from_dropbox")}</button>}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--fg-subtle)" }}>
        <Icon name="shield" size={12} />
        {t("upload_secure")}
      </div>
    </div>
  );
}

function TrustedBy({ lang, mobile }) {
  const { t } = useI18n(lang);
  const logos = ["Northwind", "Linear & Co", "Foldermark", "Atlas Studio", "Quill", "Loomly"];
  return (
    <section style={{ padding: mobile ? "16px" : "32px 28px", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", background: "var(--bg-muted)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: mobile ? "flex-start" : "space-between", gap: mobile ? 16 : 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--fg-subtle)" }}>{t("trusted_by")}</div>
        <div style={{ display: "flex", gap: mobile ? 16 : 32, flexWrap: "wrap", alignItems: "center", opacity: 0.65 }}>
          {logos.map((n) => (
            <div key={n} style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, letterSpacing: "-0.01em", color: "var(--fg-muted)" }}>{n}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhySection({ lang }) {
  const { t } = useI18n(lang);
  const cells = [
    { icon: "sparkle", title: "Fast where it matters", body: "Streaming uploads, parallel processing, and a result that's ready before you've context-switched." },
    { icon: "shield", title: "Private by default",     body: "TLS in transit. Files are deleted within an hour. We never train models on your documents." },
    { icon: "globe", title: "Works everywhere",        body: "Same experience on a phone, a Chromebook, or a workstation. A native mobile app is on the way." },
  ];
  return (
    <section style={{ padding: "96px 28px", borderTop: "1px solid var(--line)", background: "var(--bg-muted)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ maxWidth: 560, marginBottom: 40 }}>
          <h2 style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.1 }}>The boring parts, done well.</h2>
          <p style={{ marginTop: 12, fontSize: 16, color: "var(--fg-muted)" }}>We're not building a swiss army knife. We're sharpening three knives.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {cells.map((c) => (
            <div key={c.title} className="pl-card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, display: "grid", placeItems: "center", background: "var(--accent-soft)", color: "var(--accent)" }}>
                <Icon name={c.icon} size={18} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{c.title}</div>
              <div style={{ fontSize: 14, color: "var(--fg-muted)", lineHeight: 1.55 }}>{c.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhySectionMobile({ lang }) {
  return (
    <section style={{ padding: "32px 16px", borderTop: "1px solid var(--line)", background: "var(--bg-muted)" }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>The boring parts, done well.</h2>
      <div style={{ display: "grid", gap: 10 }}>
        {[
          { icon: "sparkle", t: "Fast where it matters",  b: "Streaming uploads. Results before you context-switch." },
          { icon: "shield",  t: "Private by default",     b: "TLS in transit. Files deleted within an hour." },
          { icon: "globe",   t: "Works everywhere",       b: "Same on phone, Chromebook, workstation." },
        ].map((c) => (
          <div key={c.t} className="pl-card" style={{ padding: 16, display: "flex", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, display: "grid", placeItems: "center", background: "var(--accent-soft)", color: "var(--accent)", flexShrink: 0 }}>
              <Icon name={c.icon} size={16} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{c.t}</div>
              <div style={{ fontSize: 12.5, color: "var(--fg-muted)", marginTop: 2 }}>{c.b}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

Object.assign(window, { HomeContent });
