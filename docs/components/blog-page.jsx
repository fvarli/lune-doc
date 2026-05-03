// blog-page.jsx — Magazine grid with featured article

const { useI18n, Header, Footer, Icon } = window;

function BlogPage({ lang, mobile = false }) {
  const { t, articles } = useI18n(lang);
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <Header lang={lang} setLang={() => {}} mobile={mobile} />

      <section style={{ padding: mobile ? "32px 16px 8px" : "72px 28px 24px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div className="pl-chip" style={{ marginBottom: 14 }}>{t("nav_blog")}</div>
          <h1 style={{ fontSize: mobile ? 32 : 56, fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.025em", maxWidth: 760 }}>{t("blog_title")}</h1>
          <p style={{ marginTop: 14, fontSize: mobile ? 15 : 17, color: "var(--fg-muted)", maxWidth: 620 }}>{t("blog_subtitle")}</p>
        </div>
      </section>

      {/* Featured */}
      <section style={{ padding: mobile ? "24px 16px" : "48px 28px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <FeaturedCard lang={lang} a={articles.featured} mobile={mobile} />
        </div>
      </section>

      {/* Magazine grid */}
      <section style={{ padding: mobile ? "0 16px 32px" : "0 28px 64px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
            <h2 style={{ fontSize: mobile ? 18 : 22, fontWeight: 600 }}>{t("blog_more")}</h2>
            <BlogTags />
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)",
            gap: mobile ? 12 : 18,
          }}>
            {articles.posts.map((a, i) => (
              <PostCard key={i} a={a} lang={lang} variant={i === 0 ? "tall" : "normal"} mobile={mobile} />
            ))}
          </div>
        </div>
      </section>

      <Subscribe lang={lang} mobile={mobile} />

      <Footer lang={lang} mobile={mobile} />
    </div>
  );
}

function ArticleArt({ tone = 252, label = "Field notes", aspect = 16 / 9 }) {
  // Striped placeholder with monospace label — never an SVG illustration
  return (
    <div style={{
      width: "100%", aspectRatio: String(aspect),
      borderRadius: 12, overflow: "hidden",
      background: `oklch(0.95 0.05 ${tone})`,
      border: "1px solid var(--line)",
      position: "relative",
      backgroundImage: `repeating-linear-gradient(135deg, oklch(0.92 0.06 ${tone}) 0 1px, transparent 1px 14px)`,
    }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", padding: 14 }}>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.04em",
          color: `oklch(0.40 0.18 ${tone})`,
          background: "var(--bg-elev)", padding: "4px 8px", borderRadius: 6,
          border: "1px solid var(--line)",
        }}>{label}</div>
      </div>
    </div>
  );
}

function FeaturedCard({ lang, a, mobile }) {
  const { t } = useI18n(lang);
  return (
    <article className="pl-card" style={{
      display: "grid",
      gridTemplateColumns: mobile ? "1fr" : "1.1fr 1fr",
      overflow: "hidden",
      padding: 0,
    }}>
      <div style={{ padding: mobile ? 16 : 32 }}>
        <ArticleArt tone={252} label="cover • workflow" aspect={mobile ? 16/9 : 5/4} />
      </div>
      <div style={{ padding: mobile ? "16px 16px 24px" : "32px 32px 32px 8px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="pl-chip" style={{ background: "var(--accent-soft)", color: "var(--accent)", borderColor: "color-mix(in oklch, var(--accent) 25%, var(--line))" }}>{t("blog_featured")}</span>
          <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>{a.kicker}</span>
        </div>
        <h2 style={{ fontSize: mobile ? 22 : 32, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.02em" }}>{a.title}</h2>
        <p style={{ fontSize: mobile ? 14 : 15, color: "var(--fg-muted)", lineHeight: 1.55 }}>{a.excerpt}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--fg-muted)", marginTop: 2 }}>
          <Avatar name={a.author} />
          <span style={{ color: "var(--fg)", fontWeight: 500 }}>{a.author}</span>
          <span>•</span>
          <span>{a.date}</span>
          <span>•</span>
          <span>{a.read} {t("blog_min")}</span>
        </div>
        <div>
          <button className="pl-btn pl-btn-primary" style={{ marginTop: 4 }}>
            {t("blog_read")}
            <Icon name="arrow-right" size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

function PostCard({ a, lang, variant, mobile }) {
  const { t } = useI18n(lang);
  const tones = { Guide: 200, Release: 252, Security: 30, Workflow: 252, "Field note": 145, Tip: 145, Rehber: 200, Sürüm: 252, Güvenlik: 30, "İş akışı": 252, Gözlem: 145, İpucu: 145, Guía: 200, Lanzamiento: 252, Seguridad: 30, Flujo: 252, "Nota de campo": 145, Consejo: 145 };
  const tone = tones[a.kicker] ?? 252;
  return (
    <article className="pl-card" style={{ padding: mobile ? 14 : 18, display: "flex", flexDirection: "column", gap: 14 }}>
      <ArticleArt tone={tone} label={a.kicker.toLowerCase()} aspect={variant === "tall" ? 4/3 : 16/9} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: `oklch(0.45 0.16 ${tone})` }}>{a.kicker}</div>
        <h3 style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.25, letterSpacing: "-0.015em", textWrap: "balance" }}>{a.title}</h3>
        <p style={{ fontSize: 13.5, color: "var(--fg-muted)", lineHeight: 1.55, textWrap: "pretty" }}>{a.excerpt}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--fg-subtle)", marginTop: 4 }}>
          <Avatar name={a.author} small />
          <span>{a.author}</span>
          <span>•</span>
          <span>{a.date}</span>
          <span>•</span>
          <span>{a.read} {t("blog_min")}</span>
        </div>
      </div>
    </article>
  );
}

function Avatar({ name, small }) {
  const initial = (name || "·").trim().charAt(0).toUpperCase();
  const tones = { L: 252, T: 30, A: 145, J: 200, M: 290 };
  const tone = tones[initial] ?? 252;
  const size = small ? 18 : 22;
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: `oklch(0.92 0.07 ${tone})`,
      color: `oklch(0.4 0.18 ${tone})`,
      display: "grid", placeItems: "center",
      fontSize: small ? 10 : 11, fontWeight: 600,
      border: "1px solid var(--line)",
    }}>{initial}</div>
  );
}

function BlogTags() {
  const tags = ["All", "Guides", "Releases", "Security"];
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {tags.map((tg, i) => (
        <span key={tg} style={{
          fontSize: 12, padding: "4px 10px", borderRadius: 999,
          background: i === 0 ? "var(--fg)" : "var(--bg-muted)",
          color: i === 0 ? "var(--bg)" : "var(--fg-muted)",
          border: "1px solid " + (i === 0 ? "var(--fg)" : "var(--line)"),
          fontWeight: 500,
        }}>{tg}</span>
      ))}
    </div>
  );
}

function Subscribe({ lang, mobile }) {
  const { t } = useI18n(lang);
  return (
    <section style={{ padding: mobile ? "32px 16px" : "64px 28px", borderTop: "1px solid var(--line)", background: "var(--bg-muted)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <h3 style={{ fontSize: mobile ? 22 : 28, fontWeight: 600, letterSpacing: "-0.02em" }}>{t("blog_subscribe_title")}</h3>
        <p style={{ fontSize: 14, color: "var(--fg-muted)", maxWidth: 460 }}>{t("blog_subscribe_sub")}</p>
        <form style={{ display: "flex", gap: 8, width: "100%", maxWidth: 460, flexWrap: "wrap" }} onSubmit={(e) => e.preventDefault()}>
          <input className="pl-input" placeholder={t("blog_email_placeholder")} style={{ flex: 1, minWidth: 200 }} />
          <button type="submit" className="pl-btn pl-btn-primary" style={{ height: 44 }}>{t("blog_subscribe_cta")}</button>
        </form>
      </div>
    </section>
  );
}

Object.assign(window, { BlogPage });
