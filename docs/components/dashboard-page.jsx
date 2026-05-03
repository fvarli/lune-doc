// dashboard-page.jsx — Logged-in workspace · recent files, saved actions, empty state

const { useI18n: dbUseI18n, Header: DBHeader, MobileBottomNav: DBBottomNav, Icon: DBIcon, ToolIcon: DBToolIcon, PdfThumb: DBPdfThumb, TOOLS: DB_TOOLS } = window;

function DashboardPage({ lang = "en", setLang = () => {}, mobile = false, empty = false }) {
  const { t } = dbUseI18n(lang);

  const recentFiles = [
    { name: "Q4-board-deck.pdf",       size: "12.4 MB", action: "compress",  ago: "3m",  pages: 24, savings: "−68%" },
    { name: "lease-agreement-v3.pdf",  size: "2.8 MB",  action: "sign",      ago: "27m", pages: 8,  savings: null  },
    { name: "team-photos.pdf",         size: "48 MB",   action: "split",     ago: "1h",  pages: 36, savings: null  },
    { name: "monthly-report.docx",     size: "1.1 MB",  action: "word_to_pdf", ago: "2h", pages: 12, savings: null },
  ];

  const savedActions = [
    { name: t("dash_action_compress_name"),  desc: t("dash_action_compress_desc"),  tool: "compress",  uses: 142 },
    { name: t("dash_action_watermark_name"), desc: t("dash_action_watermark_desc"), tool: "watermark", uses: 38 },
    { name: t("dash_action_metadata_name"),  desc: t("dash_action_metadata_desc"),  tool: "edit",      uses: 12 },
  ];

  const quickTools = ["compress", "merge", "split", "sign", "ocr", "pdf_to_word"];

  // ── Empty state ──────────────────────────────────────────────
  if (empty) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "var(--bg)" }}>
        {mobile ? (
          <DBHeader lang={lang} setLang={setLang} mobile active="files" />
        ) : (
          <DBHeader lang={lang} setLang={setLang} active="dashboard" />
        )}
        <div style={{ flex: 1, display: "grid", placeItems: "center", padding: mobile ? "32px 16px" : "80px 28px" }}>
          <div style={{ maxWidth: 480, textAlign: "center" }}>
            <div style={{
              width: 96, height: 96, borderRadius: 24,
              margin: "0 auto 24px",
              background: "var(--bg-muted)",
              border: "1px dashed var(--line-strong)",
              display: "grid", placeItems: "center",
              color: "var(--fg-subtle)",
              position: "relative",
            }}>
              <DBIcon name="folder" size={36} />
              <div style={{
                position: "absolute", top: -8, right: -8,
                width: 28, height: 28, borderRadius: 999,
                background: "var(--accent)", color: "var(--accent-fg)",
                display: "grid", placeItems: "center",
                boxShadow: "var(--shadow-md)",
              }}><DBIcon name="plus" size={14} /></div>
            </div>
            <h2 style={{ fontSize: mobile ? 24 : 32, fontWeight: 600, letterSpacing: "-0.025em", marginBottom: 12 }}>{t("dash_empty_title")}</h2>
            <p style={{ color: "var(--fg-muted)", fontSize: mobile ? 14 : 15, lineHeight: 1.55, marginBottom: 24 }}>{t("dash_empty_sub")}</p>
            <button className="pl-btn pl-btn-primary pl-btn-lg" style={{ minWidth: 220 }}>
              <DBIcon name="upload" size={16} /> {t("dash_empty_cta")}
            </button>
          </div>
        </div>
        {mobile && <DBBottomNav active="files" lang={lang} />}
      </div>
    );
  }

  // ── Mobile layout ────────────────────────────────────────────
  if (mobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "var(--bg)" }}>
        <DBHeader lang={lang} setLang={setLang} mobile active="files" />

        <div style={{ padding: "16px" }}>
          <div style={{ fontSize: 12, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)", marginBottom: 4 }}>{t("welcome_back")}</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em" }}>{t("dash_title")}</h1>
        </div>

        {/* Quick tools strip */}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, fontFamily: "var(--font-mono)" }}>{t("dash_quick")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {quickTools.map(k => {
              const tool = DB_TOOLS.find(x => x.key === k);
              return (
                <button key={k} className="pl-card" style={{
                  padding: 12, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8,
                  cursor: "pointer", textAlign: "left",
                }}>
                  <DBToolIcon name={tool.icon} tone={tool.tone} size={32} />
                  <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>{t("t_" + k)}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent files */}
        <div style={{ padding: "16px", borderTop: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-mono)" }}>{t("dash_recent")}</div>
            <a style={{ fontSize: 12, color: "var(--accent)", fontWeight: 500 }}>{t("dash_view_all")}</a>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {recentFiles.map(f => (
              <div key={f.name} className="pl-card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <DBPdfThumb w={36} h={48} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</div>
                  <div style={{ fontSize: 11, color: "var(--fg-subtle)", display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
                    <span>{f.size}</span>
                    <span style={{ width: 2, height: 2, borderRadius: 999, background: "currentColor" }} />
                    <span>{f.pages} {t("pages_short")}</span>
                    <span style={{ width: 2, height: 2, borderRadius: 999, background: "currentColor" }} />
                    <span>{f.ago} {t("ago_short")}</span>
                  </div>
                </div>
                <button style={{ width: 32, height: 32, border: 0, background: "transparent", borderRadius: 8, cursor: "pointer", color: "var(--fg-muted)", display: "grid", placeItems: "center" }}>
                  <DBIcon name="more" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }} />
        <DBBottomNav active="files" lang={lang} />
      </div>
    );
  }

  // ── Desktop layout ───────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "var(--bg)" }}>
      <DBHeader lang={lang} setLang={setLang} active="dashboard" />

      <main style={{ display: "grid", gridTemplateColumns: "240px 1fr", flex: 1, minWidth: 0 }}>
        {/* Sidebar */}
        <aside style={{ borderRight: "1px solid var(--line)", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 24, background: "var(--bg-muted)" }}>
          <nav style={{ display: "grid", gap: 2 }}>
            {[
              { id: "home", icon: "home", label: t("dash_nav_overview"), active: true },
              { id: "files", icon: "folder", label: t("dash_nav_files"), count: 24 },
              { id: "actions", icon: "sparkle", label: t("dash_nav_actions"), count: 3 },
              { id: "team", icon: "user", label: t("dash_nav_team") },
              { id: "billing", icon: "star", label: t("dash_nav_billing") },
            ].map(item => (
              <button key={item.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 10px", borderRadius: 8,
                border: 0,
                background: item.active ? "var(--bg-elev)" : "transparent",
                color: item.active ? "var(--fg)" : "var(--fg-muted)",
                fontWeight: item.active ? 600 : 500,
                fontSize: 13,
                cursor: "pointer", textAlign: "left",
                fontFamily: "inherit",
                boxShadow: item.active ? "var(--shadow-sm)" : "none",
              }}>
                <DBIcon name={item.icon} size={16} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.count != null && (
                  <span style={{ fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>{item.count}</span>
                )}
              </button>
            ))}
          </nav>

          <div style={{ marginTop: "auto" }}>
            <div className="pl-card" style={{ padding: 14, background: "var(--bg-elev)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-mono)", marginBottom: 10 }}>{t("dash_storage")}</div>
              <div style={{ height: 6, background: "var(--bg-muted)", borderRadius: 999, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ width: "34%", height: "100%", background: "var(--accent)", borderRadius: 999 }} />
              </div>
              <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>3.4 GB {t("dash_used_of")} 10 GB</div>
              <button className="pl-btn pl-btn-ghost pl-btn-sm" style={{ width: "100%", marginTop: 10 }}>{t("upgrade")}</button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div style={{ padding: "32px 32px 64px", minWidth: 0 }}>
          <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)", marginBottom: 4 }}>{t("welcome_back_named").replace("{name}", "Mert")}</div>
              <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.025em" }}>{t("dash_title")}</h1>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="pl-btn pl-btn-ghost"><DBIcon name="plus" size={14} /> {t("dash_pin_action")}</button>
              <button className="pl-btn pl-btn-primary"><DBIcon name="upload" size={14} /> {t("dash_empty_cta")}</button>
            </div>
          </div>

          {/* Quick tools */}
          <section style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-mono)", marginBottom: 12 }}>{t("dash_quick")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
              {quickTools.map(k => {
                const tool = DB_TOOLS.find(x => x.key === k);
                return (
                  <button key={k} className="pl-card" style={{
                    padding: 14, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8,
                    cursor: "pointer", textAlign: "left", minWidth: 0,
                  }}>
                    <DBToolIcon name={tool.icon} tone={tool.tone} size={32} />
                    <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{t("t_" + k)}</div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Two-column: recent files + saved actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
            {/* Recent files */}
            <section className="pl-card" style={{ padding: 0 }}>
              <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid var(--line)" }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t("dash_recent")}</div>
                <a style={{ fontSize: 12, color: "var(--accent)", fontWeight: 500 }}>{t("dash_view_all")}</a>
              </header>
              <div>
                {recentFiles.map((f, i) => (
                  <div key={f.name} style={{
                    display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 14, alignItems: "center",
                    padding: "14px 18px",
                    borderTop: i === 0 ? "none" : "1px solid var(--line)",
                    minWidth: 0,
                  }}>
                    <DBPdfThumb w={36} h={48} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</div>
                      <div style={{ fontSize: 11, color: "var(--fg-subtle)", display: "flex", gap: 8, alignItems: "center", marginTop: 3, fontFamily: "var(--font-mono)" }}>
                        <span>{f.size}</span>
                        <span style={{ width: 2, height: 2, borderRadius: 999, background: "currentColor" }} />
                        <span>{f.pages} {t("pages_short")}</span>
                        <span style={{ width: 2, height: 2, borderRadius: 999, background: "currentColor" }} />
                        <span>{f.ago} {t("ago_short")}</span>
                      </div>
                    </div>
                    <span className="pl-chip" style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}>
                      {t("t_" + f.action)}
                    </span>
                    {f.savings ? (
                      <span style={{ fontSize: 12, color: "oklch(0.55 0.14 145)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>{f.savings}</span>
                    ) : (
                      <button style={{ width: 32, height: 32, border: 0, background: "transparent", borderRadius: 8, cursor: "pointer", color: "var(--fg-muted)", display: "grid", placeItems: "center" }}>
                        <DBIcon name="more" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Saved actions */}
            <section className="pl-card" style={{ padding: 0 }}>
              <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid var(--line)" }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t("dash_saved")}</div>
                <button style={{ width: 28, height: 28, border: "1px solid var(--line)", background: "var(--bg-elev)", borderRadius: 8, cursor: "pointer", display: "grid", placeItems: "center", color: "var(--fg-muted)" }}>
                  <DBIcon name="plus" size={14} />
                </button>
              </header>
              <div>
                {savedActions.map((a, i) => {
                  const tool = DB_TOOLS.find(x => x.key === a.tool);
                  return (
                    <div key={a.name} style={{
                      display: "flex", gap: 12, alignItems: "flex-start",
                      padding: "14px 18px",
                      borderTop: i === 0 ? "none" : "1px solid var(--line)",
                      minWidth: 0,
                      cursor: "pointer",
                    }}>
                      <DBToolIcon name={tool.icon} tone={tool.tone} size={32} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{a.name}</div>
                        <div style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 4, lineHeight: 1.4, fontFamily: "var(--font-mono)" }}>{a.desc}</div>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{a.uses} {t("runs_label")}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

window.DashboardPage = DashboardPage;
