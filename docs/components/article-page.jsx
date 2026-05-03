// article-page.jsx — Blog detail page with TOC, related tools, related posts

const { useI18n: arUseI18n, Header: ARHeader, Footer: ARFooter, Icon: ARIcon, ToolIcon: ARToolIcon, ToolCard: ARToolCard, TOOLS: AR_TOOLS } = window;

function ArticlePage({ lang = "en", setLang = () => {}, mobile = false }) {
  const { t } = arUseI18n(lang);

  const sections = [
    { id: "tldr",       title: "The short version" },
    { id: "why-pdf",    title: "Why PDFs grow this large" },
    { id: "compress",   title: "Lossless vs. lossy compression" },
    { id: "ocr",        title: "When OCR helps (and when it doesn't)" },
    { id: "workflow",   title: "A workflow that takes ten seconds" },
    { id: "wrap",       title: "Wrap-up" },
  ];

  const related = ["compress", "ocr", "merge"];

  const Body = () => (
    <article style={{ minWidth: 0 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--fg-subtle)", fontSize: 12, fontFamily: "var(--font-mono)", marginBottom: 16, flexWrap: "wrap" }}>
        <a style={{ color: "var(--accent)", fontWeight: 500 }}>← {t("article_back")}</a>
        <span>·</span>
        <span>Engineering</span>
        <span>·</span>
        <span>March 14, 2026</span>
        <span>·</span>
        <span>7 {t("article_minutes")}</span>
      </div>

      <h1 style={{ fontSize: mobile ? 32 : 48, fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: 16, textWrap: "balance" }}>
        Why your 90 MB PDF is 4 MB after we touch it
      </h1>
      <p style={{ fontSize: mobile ? 16 : 19, color: "var(--fg-muted)", lineHeight: 1.55, marginBottom: 32, textWrap: "pretty" }}>
        A short, plain-English tour of what actually happens when you compress a PDF — and the three things to check before you accept the result.
      </p>

      {/* Author strip */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", marginBottom: 32 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 999,
          background: "linear-gradient(135deg, oklch(0.6 0.16 252), oklch(0.55 0.18 30))",
          color: "white", display: "grid", placeItems: "center", fontSize: 14, fontWeight: 600,
        }}>EA</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Ekin Arslan</div>
          <div style={{ fontSize: 12, color: "var(--fg-subtle)" }}>Engineer, Compression team</div>
        </div>
        <button className="pl-btn pl-btn-ghost pl-btn-sm">{t("article_share")}</button>
      </div>

      {/* Hero figure — striped placeholder, no SVG illustration */}
      <div style={{
        width: "100%", height: mobile ? 200 : 320, borderRadius: 16,
        background: "repeating-linear-gradient(135deg, oklch(0.92 0.04 252), oklch(0.92 0.04 252) 12px, oklch(0.95 0.025 252) 12px, oklch(0.95 0.025 252) 24px)",
        border: "1px solid var(--line)",
        position: "relative", overflow: "hidden",
        marginBottom: 32,
      }}>
        <div style={{
          position: "absolute", inset: 0,
          display: "grid", placeItems: "center",
          color: "var(--fg-subtle)", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase",
        }}>
          <div style={{
            background: "var(--bg-elev)", border: "1px solid var(--line)",
            padding: "6px 10px", borderRadius: 999,
          }}>fig.01 · before / after</div>
        </div>
      </div>

      {/* Body sections */}
      <section id="tldr" style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: mobile ? 22 : 28, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 12, scrollMarginTop: 80 }}>The short version</h2>
        <p style={{ fontSize: 16, color: "var(--fg)", lineHeight: 1.7, marginBottom: 16 }}>
          Most large PDFs are large because of images, not text. The text in a 200-page novel takes a few hundred kilobytes. The PDF is forty megabytes because every figure was exported at print resolution and embedded uncompressed. Re-encode them at screen resolution and almost nothing else changes.
        </p>
        <blockquote style={{
          margin: "24px 0",
          padding: "16px 20px",
          borderLeft: "3px solid var(--accent)",
          background: "var(--accent-soft)",
          borderRadius: "0 12px 12px 0",
          fontSize: 16, lineHeight: 1.55,
          color: "var(--fg)",
          fontWeight: 500,
        }}>
          Three numbers tell you everything you need: image count, average DPI, and font subset coverage. Get those right and the file shrinks itself.
        </blockquote>
      </section>

      <section id="why-pdf" style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: mobile ? 22 : 28, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 12, scrollMarginTop: 80 }}>Why PDFs grow this large</h2>
        <p style={{ fontSize: 16, color: "var(--fg)", lineHeight: 1.7, marginBottom: 16 }}>
          The PDF format was designed for print. That heritage matters: every image is stored at the resolution it was placed at, every font is embedded in full unless explicitly subsetted, and every revision can leave silent debris in the document's object table. A file that was edited in five different applications often carries copies of objects nobody can see.
        </p>
        <p style={{ fontSize: 16, color: "var(--fg)", lineHeight: 1.7 }}>
          We see three patterns over and over in the files customers send through our compressor. Each is responsible, on its own, for roughly 30–70% of the bloat in a typical document.
        </p>
      </section>

      {/* Pull-quote callout */}
      <div style={{
        margin: "40px -8px",
        padding: mobile ? 24 : 32,
        background: "var(--fg)",
        color: "var(--bg)",
        borderRadius: 16,
        position: "relative",
      }}>
        <div style={{
          position: "absolute", top: 16, left: 24,
          fontSize: 80, lineHeight: 1, fontFamily: "var(--font-display)",
          opacity: 0.18, fontWeight: 600,
        }}>"</div>
        <p style={{ fontSize: mobile ? 18 : 24, lineHeight: 1.4, fontWeight: 500, letterSpacing: "-0.015em", textWrap: "balance", paddingLeft: mobile ? 0 : 36 }}>
          A 4 MB PDF that opens instantly is almost always more useful than a 40 MB PDF that's marginally crisper.
        </p>
      </div>

      <section id="compress" style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: mobile ? 22 : 28, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 12, scrollMarginTop: 80 }}>Lossless vs. lossy compression</h2>
        <p style={{ fontSize: 16, color: "var(--fg)", lineHeight: 1.7, marginBottom: 16 }}>
          You'll see two terms thrown around. Lossless compression keeps every pixel; the file gets smaller because we re-encode it more efficiently. Lossy compression accepts a small reduction in image fidelity in exchange for a much smaller file. Both are appropriate; neither is a silver bullet.
        </p>
        <ul style={{ paddingLeft: 20, margin: "16px 0", display: "grid", gap: 10 }}>
          <li style={{ fontSize: 15, color: "var(--fg)", lineHeight: 1.6 }}>For text-heavy documents — contracts, books, reports — start with lossless. The savings come from font subsetting and stream re-encoding.</li>
          <li style={{ fontSize: 15, color: "var(--fg)", lineHeight: 1.6 }}>For image-heavy documents — design portfolios, photo books, scanned receipts — lossy at "screen resolution" is almost always the right call.</li>
          <li style={{ fontSize: 15, color: "var(--fg)", lineHeight: 1.6 }}>For mixed documents, our compressor decides per-image. We treat photographs differently from diagrams.</li>
        </ul>
      </section>

      <section id="ocr" style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: mobile ? 22 : 28, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 12, scrollMarginTop: 80 }}>When OCR helps (and when it doesn't)</h2>
        <p style={{ fontSize: 16, color: "var(--fg)", lineHeight: 1.7 }}>
          OCR — optical character recognition — turns an image of text into searchable text. It's tempting to run it on everything, but on a born-digital PDF it adds nothing and can occasionally hurt: the recogniser can disagree with the embedded text and confuse search. Run it on scans. Skip it on exports.
        </p>
      </section>

      <section id="workflow" style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: mobile ? 22 : 28, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 12, scrollMarginTop: 80 }}>A workflow that takes ten seconds</h2>
        <p style={{ fontSize: 16, color: "var(--fg)", lineHeight: 1.7, marginBottom: 16 }}>
          Drop the file. Pick the level. Download. That's the design we settled on after six months of testing more elaborate flows. The progress bar tells you what we did, the result tells you what changed, and a "revert" button is one click away if anything looks wrong.
        </p>
      </section>

      <section id="wrap">
        <h2 style={{ fontSize: mobile ? 22 : 28, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 12, scrollMarginTop: 80 }}>Wrap-up</h2>
        <p style={{ fontSize: 16, color: "var(--fg)", lineHeight: 1.7 }}>
          PDF compression is a quiet craft. The right defaults handle 95% of cases without anyone needing to think about it. Our job is to make sure that for the other 5%, the controls you reach for are actually the controls you needed — and not a settings panel from the year 2003.
        </p>
      </section>
    </article>
  );

  if (mobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "var(--bg)" }}>
        <ARHeader lang={lang} setLang={setLang} mobile active="blog" />
        <div style={{ padding: "24px 20px 64px" }}>
          <Body />
          <div style={{ marginTop: 40, padding: 20, borderRadius: 16, background: "var(--bg-muted)", border: "1px solid var(--line)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, fontFamily: "var(--font-mono)" }}>{t("article_related_tools")}</div>
            <div style={{ display: "grid", gap: 8 }}>
              {related.map(k => <ARToolCard key={k} toolKey={k} lang={lang} />)}
            </div>
          </div>
        </div>
        <ARFooter lang={lang} mobile />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "var(--bg)" }}>
      <ARHeader lang={lang} setLang={setLang} active="blog" />

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 280px", gap: 48, maxWidth: 1280, margin: "0 auto", padding: "48px 32px 80px", minWidth: 0, width: "100%" }}>
        {/* Left: TOC */}
        <aside style={{ minWidth: 0 }}>
          <div style={{ position: "sticky", top: 88 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, fontFamily: "var(--font-mono)" }}>{t("article_toc")}</div>
            <nav style={{ display: "grid", gap: 2 }}>
              {sections.map((s, i) => (
                <a key={s.id} href={"#" + s.id} style={{
                  fontSize: 13, lineHeight: 1.4,
                  color: i === 0 ? "var(--accent)" : "var(--fg-muted)",
                  fontWeight: i === 0 ? 600 : 500,
                  padding: "6px 10px",
                  borderLeft: i === 0 ? "2px solid var(--accent)" : "2px solid transparent",
                  borderRadius: "0 6px 6px 0",
                  transition: "color .15s ease",
                }}>{s.title}</a>
              ))}
            </nav>

            <div style={{ marginTop: 32, padding: 14, borderRadius: 12, background: "var(--bg-muted)", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "var(--font-mono)" }}>{t("article_share")}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["X", "LinkedIn", "Copy"].map(s => (
                  <button key={s} className="pl-btn pl-btn-quiet pl-btn-sm" style={{ height: 28, fontSize: 12, padding: "0 10px" }}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Center: article */}
        <Body />

        {/* Right: related tools */}
        <aside style={{ minWidth: 0 }}>
          <div style={{ position: "sticky", top: 88 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, fontFamily: "var(--font-mono)" }}>{t("article_related_tools")}</div>
            <div style={{ display: "grid", gap: 10 }}>
              {related.map(k => <ARToolCard key={k} toolKey={k} lang={lang} />)}
            </div>

            <div style={{ marginTop: 32 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, fontFamily: "var(--font-mono)" }}>{t("article_related_posts")}</div>
              <div style={{ display: "grid", gap: 12 }}>
                {[
                  { title: "What we mean when we say \"private\"", time: "5 min" },
                  { title: "Building a PDF engine in WebAssembly", time: "11 min" },
                ].map(p => (
                  <a key={p.title} className="pl-card" style={{ padding: 12, display: "block", cursor: "pointer" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, marginBottom: 4 }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>{p.time} {t("article_minutes")}</div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      <ARFooter lang={lang} />
    </div>
  );
}

window.ArticlePage = ArticlePage;
