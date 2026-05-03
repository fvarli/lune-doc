// tools-index-page.jsx — Full tool library with category filters + FAQ

const { useI18n: tiUseI18n, Header: TIHeader, Footer: TIFooter, MobileBottomNav: TIBottomNav, TOOLS: TI_TOOLS, ToolCard: TIToolCard, Icon: TIIcon } = window;

function ToolsIndexPage({ lang = "en", setLang = () => {}, mobile = false }) {
  const { t } = tiUseI18n(lang);
  const [query, setQuery] = React.useState("");
  const [cat, setCat] = React.useState("all");

  const cats = [
    { id: "all",       label: t("tools_all") },
    { id: "organize",  label: t("cat_organize") },
    { id: "convert",   label: t("cat_convert") },
    { id: "compress",  label: t("cat_compress") },
    { id: "edit",      label: t("cat_edit") },
    { id: "security",  label: t("cat_security") },
  ];

  const q = query.trim().toLowerCase();
  const filtered = TI_TOOLS.filter(tool => {
    if (cat !== "all" && tool.cat !== cat) return false;
    if (!q) return true;
    const name = t("t_" + tool.key).toLowerCase();
    const desc = t("t_" + tool.key + "_d").toLowerCase();
    return name.includes(q) || desc.includes(q);
  });

  const FaqItem = ({ q: question, a }) => {
    const [open, setOpen] = React.useState(false);
    return (
      <div style={{
        borderBottom: "1px solid var(--line)",
        padding: "20px 0",
      }}>
        <button onClick={() => setOpen(!open)} style={{
          width: "100%", border: 0, background: "transparent", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: 0, color: "var(--fg)", fontWeight: 600, fontSize: 16,
          textAlign: "left", letterSpacing: "-0.01em",
        }}>
          <span style={{ minWidth: 0 }}>{question}</span>
          <span style={{
            marginLeft: 16, flexShrink: 0,
            width: 24, height: 24, borderRadius: 999,
            display: "grid", placeItems: "center",
            background: "var(--bg-muted)", color: "var(--fg-muted)",
            transform: open ? "rotate(45deg)" : "rotate(0)",
            transition: "transform .2s ease",
          }}><TIIcon name="plus" size={14} /></span>
        </button>
        {open && (
          <p style={{
            marginTop: 12,
            color: "var(--fg-muted)", fontSize: 14, lineHeight: 1.6,
            maxWidth: 680,
          }}>{a}</p>
        )}
      </div>
    );
  };

  if (mobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "var(--bg)" }}>
        <TIHeader lang={lang} setLang={setLang} mobile active="tools" />

        <div style={{ padding: "20px 16px 8px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{t("tools_index_eyebrow")}</div>
          <h1 style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.025em" }}>{t("tools_index_title")}</h1>
          <p style={{ marginTop: 10, color: "var(--fg-muted)", fontSize: 14, lineHeight: 1.55 }}>{t("tools_index_sub")}</p>
        </div>

        <div style={{ padding: "12px 16px", position: "sticky", top: 56, background: "var(--bg)", zIndex: 3, borderBottom: "1px solid var(--line)" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)" }}>
              <TIIcon name="search" size={16} />
            </span>
            <input
              className="pl-input"
              value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder={t("tools_search_placeholder")}
              style={{ paddingLeft: 36, height: 40 }}
            />
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginInline: -16, paddingInline: 16 }}>
            {cats.map(c => (
              <button key={c.id} onClick={() => setCat(c.id)} className="pl-btn pl-btn-sm" style={{
                background: cat === c.id ? "var(--fg)" : "var(--bg-muted)",
                color: cat === c.id ? "var(--bg)" : "var(--fg-muted)",
                border: "1px solid " + (cat === c.id ? "var(--fg)" : "var(--line)"),
                fontWeight: 500, flexShrink: 0,
              }}>{c.label}</button>
            ))}
          </div>
        </div>

        <div style={{ padding: "16px", display: "grid", gap: 10 }}>
          {filtered.map(tool => (
            <TIToolCard key={tool.key} toolKey={tool.key} lang={lang} />
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--fg-muted)", fontSize: 14 }}>
              {t("no_results").replace("{q}", query)}
            </div>
          )}
        </div>

        <div style={{ padding: "24px 16px 32px" }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>{t("faq_title")}</h2>
          <FaqItem q={t("faq_q1")} a={t("faq_a1")} />
          <FaqItem q={t("faq_q2")} a={t("faq_a2")} />
          <FaqItem q={t("faq_q3")} a={t("faq_a3")} />
          <FaqItem q={t("faq_q4")} a={t("faq_a4")} />
        </div>

        <div style={{ flex: 1 }} />
        <TIBottomNav active="tools" lang={lang} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "var(--bg)" }}>
      <TIHeader lang={lang} setLang={setLang} active="tools" />

      {/* Header band */}
      <section style={{ padding: "64px 28px 32px", borderBottom: "1px solid var(--line)", background: "var(--bg-muted)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>{t("tools_index_eyebrow")}</div>
          <h1 style={{ fontSize: 48, fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.03em", maxWidth: 800 }}>{t("tools_index_title")}</h1>
          <p style={{ marginTop: 16, color: "var(--fg-muted)", fontSize: 17, lineHeight: 1.55, maxWidth: 640 }}>{t("tools_index_sub")}</p>

          <div style={{ marginTop: 28, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 320px", maxWidth: 480 }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)" }}>
                <TIIcon name="search" size={16} />
              </span>
              <input
                className="pl-input"
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder={t("tools_search_placeholder")}
                style={{ paddingLeft: 40 }}
              />
            </div>
            <div style={{ fontSize: 13, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>
              {filtered.length} / {TI_TOOLS.length} {t("tools_count_label")}
            </div>
          </div>
        </div>
      </section>

      {/* Category filter rail */}
      <div style={{ padding: "16px 28px", borderBottom: "1px solid var(--line)", background: "var(--bg)", position: "sticky", top: 56, zIndex: 3, backdropFilter: "saturate(140%) blur(8px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {cats.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)} style={{
              border: "1px solid " + (cat === c.id ? "var(--fg)" : "var(--line)"),
              background: cat === c.id ? "var(--fg)" : "transparent",
              color: cat === c.id ? "var(--bg)" : "var(--fg-muted)",
              padding: "8px 14px",
              fontSize: 13, fontWeight: 500,
              borderRadius: 999, cursor: "pointer",
              fontFamily: "inherit",
              transition: "all .15s ease",
            }}>{c.label}</button>
          ))}
        </div>
      </div>

      {/* Tool grid, grouped by category when "all" */}
      <section style={{ padding: "40px 28px 64px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {cat === "all" && !q ? (
            ["organize", "convert", "compress", "edit", "security"].map((c) => {
              const items = TI_TOOLS.filter(x => x.cat === c);
              return (
                <div key={c} style={{ marginBottom: 48 }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid var(--line)" }}>
                    <h2 style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>{t("cat_" + c)}</h2>
                    <span style={{ fontSize: 12, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>{items.length} {t("tools_count_label")}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                    {items.map(tool => (
                      <TIToolCard key={tool.key} toolKey={tool.key} lang={lang} />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {filtered.map(tool => (
                <TIToolCard key={tool.key} toolKey={tool.key} lang={lang} />
              ))}
              {filtered.length === 0 && (
                <div style={{ gridColumn: "1 / -1", padding: "64px 16px", textAlign: "center", color: "var(--fg-muted)" }}>
                  {t("no_results").replace("{q}", query)}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "64px 28px", borderTop: "1px solid var(--line)", background: "var(--bg-muted)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ fontSize: 32, fontWeight: 600, marginBottom: 8, letterSpacing: "-0.025em" }}>{t("faq_title")}</h2>
          <div style={{ marginTop: 16 }}>
            <FaqItem q={t("faq_q1")} a={t("faq_a1")} />
            <FaqItem q={t("faq_q2")} a={t("faq_a2")} />
            <FaqItem q={t("faq_q3")} a={t("faq_a3")} />
            <FaqItem q={t("faq_q4")} a={t("faq_a4")} />
          </div>
        </div>
      </section>

      <TIFooter lang={lang} />
    </div>
  );
}

window.ToolsIndexPage = ToolsIndexPage;
