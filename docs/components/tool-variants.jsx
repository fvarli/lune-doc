// tool-variants.jsx — Merge / Split / Convert tool pages, sharing the Compress shell aesthetic

const { useI18n: tvUseI18n, Header: TVHeader, Icon: TVIcon, PdfThumb: TVPdfThumb } = window;

// ── Merge ──────────────────────────────────────────────────────
function MergeToolPage({ lang = "en", setLang = () => {}, mobile = false }) {
  const { t } = tvUseI18n(lang);
  const [files, setFiles] = React.useState([
    { id: 1, name: "01-cover.pdf",          size: "0.4 MB", pages: 1  },
    { id: 2, name: "02-executive-summary.pdf", size: "1.2 MB", pages: 4  },
    { id: 3, name: "03-financials.pdf",     size: "5.8 MB", pages: 18 },
    { id: 4, name: "04-appendix.pdf",       size: "2.1 MB", pages: 12 },
  ]);
  const totalMB = (files.reduce((s, f) => s + parseFloat(f.size), 0)).toFixed(1);

  const move = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= files.length) return;
    const next = [...files];
    [next[idx], next[j]] = [next[j], next[idx]];
    setFiles(next);
  };
  const remove = (id) => setFiles(files.filter(f => f.id !== id));

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "var(--bg-muted)" }}>
      <TVHeader lang={lang} setLang={setLang} mobile={mobile} />
      <div style={{ padding: mobile ? "16px" : "32px 28px 64px", flex: 1 }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <a style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--fg-muted)", marginBottom: 18 }}>
            <TVIcon name="arrow-left" size={14} />{t("tool_back")}
          </a>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "oklch(0.96 0.04 252)", color: "oklch(0.45 0.16 252)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <TVIcon name="merge" size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ fontSize: mobile ? 24 : 32, fontWeight: 600, letterSpacing: "-0.02em" }}>{t("merge_title")}</h1>
              <p style={{ marginTop: 4, fontSize: mobile ? 14 : 15, color: "var(--fg-muted)" }}>{t("merge_sub")}</p>
            </div>
          </div>

          <div className="pl-card" style={{ padding: mobile ? 16 : 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{t("merge_files")} <span style={{ color: "var(--fg-subtle)", fontFamily: "var(--font-mono)", marginLeft: 6 }}>{files.length}</span></div>
              <div style={{ fontSize: 12, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>{totalMB} MB {t("merge_total")}</div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {files.map((f, i) => (
                <div key={f.id} style={{
                  display: "grid", gridTemplateColumns: "auto auto 1fr auto auto", gap: 12, alignItems: "center",
                  padding: 12, borderRadius: 10,
                  background: "var(--bg-elev)", border: "1px solid var(--line)",
                }}>
                  <div style={{ width: 22, height: 22, borderRadius: 999, background: "var(--bg-muted)", color: "var(--fg-subtle)", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 600, fontFamily: "var(--font-mono)" }}>{i + 1}</div>
                  <TVPdfThumb w={32} h={42} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{f.size} · {f.pages} {t("pages_short")}</div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => move(i, -1)} disabled={i === 0} style={btnGhost(i === 0)}><TVIcon name="chevron-down" size={12} style={{ transform: "rotate(180deg)" }} /></button>
                    <button onClick={() => move(i, 1)} disabled={i === files.length - 1} style={btnGhost(i === files.length - 1)}><TVIcon name="chevron-down" size={12} /></button>
                  </div>
                  <button onClick={() => remove(f.id)} style={btnGhost(false)}><TVIcon name="trash" size={14} /></button>
                </div>
              ))}
            </div>

            <button style={{
              marginTop: 12, width: "100%",
              padding: "14px", borderRadius: 10,
              background: "transparent", border: "1.5px dashed var(--line-strong)",
              color: "var(--fg-muted)", fontSize: 13, fontWeight: 500,
              cursor: "pointer", fontFamily: "inherit",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <TVIcon name="plus" size={14} /> {t("merge_add")}
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button className="pl-btn pl-btn-ghost pl-btn-lg">{t("start_over")}</button>
            <button className="pl-btn pl-btn-primary pl-btn-lg">
              <TVIcon name="merge" size={16} />
              {t("merge_cta").replace("{n}", files.length)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const btnGhost = (disabled) => ({
  width: 28, height: 28, borderRadius: 8,
  border: "1px solid var(--line)", background: "var(--bg-elev)",
  color: disabled ? "var(--fg-subtle)" : "var(--fg-muted)",
  cursor: disabled ? "not-allowed" : "pointer",
  display: "grid", placeItems: "center",
  opacity: disabled ? 0.4 : 1,
});

// ── Split ──────────────────────────────────────────────────────
function SplitToolPage({ lang = "en", setLang = () => {}, mobile = false }) {
  const { t } = tvUseI18n(lang);
  const [mode, setMode] = React.useState("range");
  const [selected, setSelected] = React.useState(new Set([3, 4, 5, 6, 12]));
  const totalPages = 16;

  const togglePage = (n) => {
    const s = new Set(selected);
    if (s.has(n)) s.delete(n); else s.add(n);
    setSelected(s);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "var(--bg-muted)" }}>
      <TVHeader lang={lang} setLang={setLang} mobile={mobile} />
      <div style={{ padding: mobile ? "16px" : "32px 28px 64px", flex: 1 }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <a style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--fg-muted)", marginBottom: 18 }}>
            <TVIcon name="arrow-left" size={14} />{t("tool_back")}
          </a>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "oklch(0.96 0.04 252)", color: "oklch(0.45 0.16 252)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <TVIcon name="split" size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ fontSize: mobile ? 24 : 32, fontWeight: 600, letterSpacing: "-0.02em" }}>{t("split_title")}</h1>
              <p style={{ marginTop: 4, fontSize: mobile ? 14 : 15, color: "var(--fg-muted)" }}>{t("split_sub")}</p>
            </div>
          </div>

          {/* Mode toggle */}
          <div role="tablist" style={{ display: "inline-flex", padding: 4, gap: 4, background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: 10, marginBottom: 18 }}>
            {[["range", t("split_mode_range")], ["pages", t("split_mode_pages")]].map(([k, label]) => {
              const active = mode === k;
              return (
                <button key={k} onClick={() => setMode(k)} style={{
                  border: 0, cursor: "pointer", fontFamily: "inherit",
                  background: active ? "var(--accent-soft)" : "transparent",
                  color: active ? "var(--accent)" : "var(--fg-muted)",
                  fontSize: 13, fontWeight: 600, height: 32, padding: "0 14px", borderRadius: 8,
                }}>{label}</button>
              );
            })}
          </div>

          <div className="pl-card" style={{ padding: mobile ? 16 : 24 }}>
            {/* Document strip */}
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--line)" }}>
              <TVPdfThumb w={36} h={48} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>quarterly-review-2026-Q1.pdf</div>
                <div style={{ fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)", marginTop: 2 }}>3.2 MB · {totalPages} {t("pages_short")}</div>
              </div>
            </div>

            {mode === "range" ? (
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  { from: 1, to: 4, name: "summary.pdf" },
                  { from: 5, to: 12, name: "financials.pdf" },
                  { from: 13, to: 16, name: "appendix.pdf" },
                ].map((r, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "auto auto 1fr auto", gap: 12, alignItems: "center", padding: 12, borderRadius: 10, background: "var(--bg-muted)", border: "1px solid var(--line)" }}>
                    <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--fg-subtle)", fontWeight: 600 }}>{t("split_range")} {i + 1}</span>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input className="pl-input" defaultValue={r.from} style={{ width: 56, height: 32, textAlign: "center", fontFamily: "var(--font-mono)" }} />
                      <span style={{ color: "var(--fg-subtle)" }}>→</span>
                      <input className="pl-input" defaultValue={r.to} style={{ width: 56, height: 32, textAlign: "center", fontFamily: "var(--font-mono)" }} />
                    </div>
                    <div style={{ fontSize: 12, color: "var(--fg-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                    <button style={btnGhost(false)}><TVIcon name="trash" size={14} /></button>
                  </div>
                ))}
                <button style={{ marginTop: 4, padding: "10px", borderRadius: 10, background: "transparent", border: "1.5px dashed var(--line-strong)", color: "var(--fg-muted)", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <TVIcon name="plus" size={14} /> {t("add_range")}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 8 }}>
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const n = i + 1;
                    const active = selected.has(n);
                    return (
                      <button key={n} onClick={() => togglePage(n)} style={{
                        position: "relative",
                        padding: 0, border: 0, background: "transparent", cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                      }}>
                        <div style={{
                          width: "100%", aspectRatio: "3 / 4",
                          background: "var(--bg-elev)",
                          border: "2px solid " + (active ? "var(--accent)" : "var(--line)"),
                          borderRadius: 6,
                          boxShadow: active ? "0 0 0 4px var(--accent-ring)" : "var(--shadow-sm)",
                          position: "relative", overflow: "hidden",
                          transition: "all .15s ease",
                        }}>
                          <div style={{ position: "absolute", top: 4, left: 4, right: 4, height: 2, background: "var(--bg-sunken)", borderRadius: 1 }} />
                          <div style={{ position: "absolute", top: 9, left: 4, right: 8, height: 2, background: "var(--bg-sunken)", borderRadius: 1 }} />
                          <div style={{ position: "absolute", top: 14, left: 4, right: 6, height: 2, background: "var(--bg-sunken)", borderRadius: 1 }} />
                          {active && (
                            <div style={{ position: "absolute", top: 4, right: 4, width: 16, height: 16, borderRadius: 999, background: "var(--accent)", color: "var(--accent-fg)", display: "grid", placeItems: "center" }}>
                              <TVIcon name="check" size={10} />
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: active ? "var(--accent)" : "var(--fg-subtle)", fontWeight: 600 }}>{n}</span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 14, fontSize: 12, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>
                  {selected.size} {t("split_pages_selected")}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
            <button className="pl-btn pl-btn-ghost pl-btn-lg">{t("start_over")}</button>
            <button className="pl-btn pl-btn-primary pl-btn-lg">
              <TVIcon name="split" size={16} /> {t("split_extract_cta")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Convert ────────────────────────────────────────────────────
function ConvertToolPage({ lang = "en", setLang = () => {}, mobile = false }) {
  const { t } = tvUseI18n(lang);
  const [from, setFrom] = React.useState("PDF");
  const [to, setTo] = React.useState("DOCX");
  const [opts, setOpts] = React.useState({ ocr: true, layout: true, images: false });
  const fmts = ["PDF", "DOCX", "XLSX", "PPTX", "JPG", "PNG"];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "var(--bg-muted)" }}>
      <TVHeader lang={lang} setLang={setLang} mobile={mobile} />
      <div style={{ padding: mobile ? "16px" : "32px 28px 64px", flex: 1 }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <a style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--fg-muted)", marginBottom: 18 }}>
            <TVIcon name="arrow-left" size={14} />{t("tool_back")}
          </a>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "oklch(0.96 0.04 220)", color: "oklch(0.45 0.16 220)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <TVIcon name="convert" size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ fontSize: mobile ? 24 : 32, fontWeight: 600, letterSpacing: "-0.02em" }}>{t("convert_title")}</h1>
              <p style={{ marginTop: 4, fontSize: mobile ? 14 : 15, color: "var(--fg-muted)" }}>{t("convert_sub")}</p>
            </div>
          </div>

          <div className="pl-card" style={{ padding: mobile ? 16 : 24 }}>
            {/* From / To */}
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr auto 1fr", gap: 14, alignItems: "end", marginBottom: 24 }}>
              <FormatPicker label={t("convert_from")} value={from} options={fmts} onChange={setFrom} />
              <div style={{
                width: 36, height: 36, borderRadius: 999,
                background: "var(--bg-elev)", border: "1px solid var(--line)",
                display: "grid", placeItems: "center",
                color: "var(--accent)",
                margin: mobile ? "0 auto" : "0 0 4px 0",
                transform: mobile ? "rotate(90deg)" : "none",
              }}><TVIcon name="arrow-right" size={16} /></div>
              <FormatPicker label={t("convert_to")} value={to} options={fmts.filter(f => f !== from)} onChange={setTo} />
            </div>

            {/* Dropzone */}
            <div style={{
              padding: mobile ? "32px 16px" : "48px 24px",
              borderRadius: 12, background: "var(--bg-muted)",
              border: "1.5px dashed var(--line-strong)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center",
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--bg-elev)", border: "1px solid var(--line)", display: "grid", placeItems: "center", color: "var(--accent)" }}>
                <TVIcon name="upload" size={20} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{t("convert_drop").replace("{from}", from)}</div>
                <div style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 4 }}>{t("convert_limit")}</div>
              </div>
              <button className="pl-btn pl-btn-primary">{t("upload_browse")}</button>
            </div>

            {/* Options */}
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid var(--line)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{t("convert_options")}</div>
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  { k: "ocr",     label: t("convert_opt_ocr") },
                  { k: "layout",  label: t("convert_opt_layout") },
                  { k: "images",  label: t("convert_opt_images") },
                ].map(o => {
                  const checked = !!opts[o.k];
                  return (
                    <button key={o.k} onClick={() => setOpts({ ...opts, [o.k]: !checked })} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 14px", borderRadius: 10,
                      background: checked ? "var(--accent-soft)" : "var(--bg-elev)",
                      border: "1px solid " + (checked ? "color-mix(in oklch, var(--accent) 35%, var(--line))" : "var(--line)"),
                      cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                    }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 5,
                        background: checked ? "var(--accent)" : "var(--bg-elev)",
                        border: "1.5px solid " + (checked ? "var(--accent)" : "var(--line-strong)"),
                        display: "grid", placeItems: "center",
                        color: "var(--accent-fg)",
                      }}>
                        {checked && <TVIcon name="check" size={11} />}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: checked ? "var(--accent)" : "var(--fg)" }}>{o.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
            <button className="pl-btn pl-btn-ghost pl-btn-lg">{t("start_over")}</button>
            <button className="pl-btn pl-btn-primary pl-btn-lg">
              <TVIcon name="convert" size={16} /> {t("convert_cta")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormatPicker({ label, value, options, onChange }) {
  return (
    <div style={{ minWidth: 0 }}>
      <label className="pl-label">{label}</label>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {options.map(o => {
          const active = o === value;
          return (
            <button key={o} onClick={() => onChange(o)} style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid " + (active ? "var(--accent)" : "var(--line)"),
              background: active ? "var(--accent)" : "var(--bg-elev)",
              color: active ? "var(--accent-fg)" : "var(--fg)",
              fontSize: 13, fontWeight: 600, fontFamily: "var(--font-mono)",
              cursor: "pointer",
              boxShadow: active ? "var(--shadow-sm)" : "none",
            }}>{o}</button>
          );
        })}
      </div>
    </div>
  );
}

// ── Watermark ──────────────────────────────────────────────────
function WatermarkToolPage({ lang = "en", setLang = () => {}, mobile = false }) {
  const { t } = tvUseI18n(lang);
  const [text, setText] = React.useState(t("watermark_text_default"));
  const [position, setPosition] = React.useState("center");
  const [opacity, setOpacity] = React.useState(30);
  const [rotation, setRotation] = React.useState(45);
  const [apply, setApply] = React.useState("all");

  // Re-seed default if locale changes mid-session
  React.useEffect(() => { setText(t("watermark_text_default")); }, [lang]);

  const positions = [
    { id: "tl",     label: t("watermark_pos_tl"),     x: "12%",  y: "12%",  align: "flex-start" },
    { id: "tr",     label: t("watermark_pos_tr"),     x: "88%",  y: "12%",  align: "flex-end" },
    { id: "center", label: t("watermark_pos_center"), x: "50%",  y: "50%",  align: "center" },
    { id: "bl",     label: t("watermark_pos_bl"),     x: "12%",  y: "88%",  align: "flex-start" },
    { id: "br",     label: t("watermark_pos_br"),     x: "88%",  y: "88%",  align: "flex-end" },
  ];
  const pos = positions.find(p => p.id === position) || positions[2];
  const rotations = [0, 30, 45];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "var(--bg-muted)" }}>
      <TVHeader lang={lang} setLang={setLang} mobile={mobile} />
      <div style={{ padding: mobile ? "16px" : "32px 28px 64px", flex: 1 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <a style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--fg-muted)", marginBottom: 18 }}>
            <TVIcon name="arrow-left" size={14} />{t("tool_back")}
          </a>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "oklch(0.96 0.04 290)", color: "oklch(0.45 0.18 290)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <TVIcon name="watermark" size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ fontSize: mobile ? 24 : 32, fontWeight: 600, letterSpacing: "-0.02em" }}>{t("watermark_title")}</h1>
              <p style={{ marginTop: 4, fontSize: mobile ? 14 : 15, color: "var(--fg-muted)" }}>{t("watermark_sub")}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "minmax(0, 1fr) minmax(0, 420px)", gap: 18, alignItems: "start" }}>
            {/* Controls */}
            <div className="pl-card" style={{ padding: mobile ? 16 : 24 }}>
              {/* Text */}
              <div style={{ marginBottom: 20 }}>
                <label className="pl-label">{t("watermark_text_label")}</label>
                <input
                  className="pl-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t("watermark_text_placeholder")}
                  style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase" }}
                />
              </div>

              {/* Position grid */}
              <div style={{ marginBottom: 20 }}>
                <label className="pl-label">{t("watermark_position")}</label>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gridTemplateRows: "repeat(3, 56px)",
                  gap: 6,
                  background: "var(--bg-muted)",
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  padding: 6,
                }}>
                  {[
                    { id: "tl", row: 1, col: 1 },
                    { id: null, row: 1, col: 2 },
                    { id: "tr", row: 1, col: 3 },
                    { id: null, row: 2, col: 1 },
                    { id: "center", row: 2, col: 2 },
                    { id: null, row: 2, col: 3 },
                    { id: "bl", row: 3, col: 1 },
                    { id: null, row: 3, col: 2 },
                    { id: "br", row: 3, col: 3 },
                  ].map((cell, i) => {
                    if (!cell.id) {
                      return <div key={i} style={{ gridRow: cell.row, gridColumn: cell.col }} />;
                    }
                    const active = position === cell.id;
                    const p = positions.find(x => x.id === cell.id);
                    return (
                      <button key={cell.id} onClick={() => setPosition(cell.id)} title={p.label} style={{
                        gridRow: cell.row, gridColumn: cell.col,
                        border: "1px solid " + (active ? "var(--accent)" : "var(--line)"),
                        background: active ? "var(--accent-soft)" : "var(--bg-elev)",
                        borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                        display: "grid", placeItems: "center",
                        boxShadow: active ? "0 0 0 3px var(--accent-ring)" : "none",
                        transition: "all .15s ease",
                      }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: 999,
                          background: active ? "var(--accent)" : "var(--fg-subtle)",
                        }} />
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>
                  {pos.label}
                </div>
              </div>

              {/* Opacity slider */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                  <label className="pl-label" style={{ marginBottom: 0 }}>{t("watermark_opacity")}</label>
                  <span style={{ fontSize: 12, color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>{opacity}%</span>
                </div>
                <input
                  type="range" min={5} max={100} step={5}
                  value={opacity}
                  onChange={(e) => setOpacity(parseInt(e.target.value, 10))}
                  style={{ width: "100%", accentColor: "var(--accent)" }}
                />
              </div>

              {/* Rotation segmented */}
              <div style={{ marginBottom: 20 }}>
                <label className="pl-label">{t("watermark_rotation")}</label>
                <div role="tablist" style={{ display: "inline-flex", padding: 4, gap: 4, background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: 10 }}>
                  {rotations.map(deg => {
                    const active = rotation === deg;
                    return (
                      <button key={deg} onClick={() => setRotation(deg)} style={{
                        border: 0, cursor: "pointer", fontFamily: "var(--font-mono)",
                        background: active ? "var(--accent-soft)" : "transparent",
                        color: active ? "var(--accent)" : "var(--fg-muted)",
                        fontSize: 13, fontWeight: 600, height: 32, padding: "0 14px", borderRadius: 8,
                      }}>{deg}°</button>
                    );
                  })}
                </div>
              </div>

              {/* Apply to */}
              <div>
                <label className="pl-label">{t("watermark_apply")}</label>
                <div style={{ display: "grid", gap: 8 }}>
                  {[
                    { id: "all",      label: t("watermark_apply_all") },
                    { id: "selected", label: t("watermark_apply_selected") },
                  ].map(o => {
                    const active = apply === o.id;
                    return (
                      <button key={o.id} onClick={() => setApply(o.id)} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 14px", borderRadius: 10,
                        background: active ? "var(--accent-soft)" : "var(--bg-elev)",
                        border: "1px solid " + (active ? "color-mix(in oklch, var(--accent) 35%, var(--line))" : "var(--line)"),
                        cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                      }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: 999,
                          border: "1.5px solid " + (active ? "var(--accent)" : "var(--line-strong)"),
                          background: "var(--bg-elev)",
                          display: "grid", placeItems: "center",
                          flexShrink: 0,
                        }}>
                          {active && <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--accent)" }} />}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: active ? "var(--accent)" : "var(--fg)" }}>{o.label}</div>
                      </button>
                    );
                  })}
                </div>
                {apply === "selected" && (
                  <input
                    className="pl-input"
                    placeholder={t("watermark_apply_selected_hint")}
                    style={{ marginTop: 8, fontFamily: "var(--font-mono)" }}
                  />
                )}
              </div>
            </div>

            {/* Preview */}
            <div className="pl-card" style={{ padding: mobile ? 16 : 20, position: mobile ? "static" : "sticky", top: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-mono)", marginBottom: 12 }}>
                {t("watermark_preview")}
              </div>
              <WatermarkPreviewPage
                text={text}
                opacity={opacity}
                rotation={rotation}
                pos={pos}
              />
              <div style={{ marginTop: 12, fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)", textAlign: "center" }}>
                {t("watermark_preview_caption")}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button className="pl-btn pl-btn-ghost pl-btn-lg">{t("start_over")}</button>
            <button className="pl-btn pl-btn-primary pl-btn-lg">
              <TVIcon name="watermark" size={16} /> {t("watermark_cta")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WatermarkPreviewPage({ text, opacity, rotation, pos }) {
  // Mock document page — striped placeholder body, with the live watermark overlaid
  const lines = [
    { w: "62%", h: 14, mt: 0,  bold: true },   // title
    { w: "38%", h: 8,  mt: 14, dim: true },    // subtitle
    { w: "94%", h: 6,  mt: 22 },
    { w: "88%", h: 6,  mt: 8 },
    { w: "92%", h: 6,  mt: 8 },
    { w: "70%", h: 6,  mt: 8 },
    { w: "94%", h: 6,  mt: 16 },
    { w: "86%", h: 6,  mt: 8 },
    { w: "90%", h: 6,  mt: 8 },
    { w: "44%", h: 6,  mt: 8 },
  ];

  return (
    <div style={{
      position: "relative",
      width: "100%",
      aspectRatio: "1 / 1.414", // A4
      background: "white",
      borderRadius: 6,
      boxShadow: "var(--shadow-md)",
      border: "1px solid var(--line)",
      overflow: "hidden",
    }}>
      {/* Mock page body */}
      <div style={{ position: "absolute", inset: "10% 8% 10% 8%" }}>
        {lines.map((l, i) => (
          <div key={i} style={{
            width: l.w,
            height: l.h,
            marginTop: l.mt,
            background: l.dim ? "oklch(0.85 0 0)" : (l.bold ? "oklch(0.25 0 0)" : "oklch(0.78 0 0)"),
            borderRadius: 2,
          }} />
        ))}
        {/* Mock figure */}
        <div style={{
          marginTop: 18,
          width: "100%",
          aspectRatio: "16 / 9",
          background: "repeating-linear-gradient(45deg, oklch(0.92 0 0) 0 6px, oklch(0.96 0 0) 6px 12px)",
          border: "1px solid oklch(0.85 0 0)",
          borderRadius: 3,
        }} />
        <div style={{ width: "78%", height: 6, marginTop: 14, background: "oklch(0.78 0 0)", borderRadius: 2 }} />
        <div style={{ width: "60%", height: 6, marginTop: 8, background: "oklch(0.78 0 0)", borderRadius: 2 }} />
      </div>

      {/* Watermark overlay */}
      <div style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        transform: `translate(-50%, -50%) rotate(-${rotation}deg)`,
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}>
        <div style={{
          fontSize: "min(13cqw, 64px)",
          fontWeight: 800,
          letterSpacing: "0.12em",
          color: "oklch(0.35 0.02 280)",
          opacity: opacity / 100,
          textTransform: "uppercase",
          fontFamily: "var(--font-mono)",
          textShadow: "0 1px 0 rgba(255,255,255,0.4)",
        }}>{text || " "}</div>
      </div>
    </div>
  );
}

// ── Sign ───────────────────────────────────────────────────────
function SignToolPage({ lang = "en", setLang = () => {}, mobile = false }) {
  const { t } = tvUseI18n(lang);
  const [method, setMethod] = React.useState("type"); // type | draw | upload
  const [name, setName] = React.useState(t("sign_typed_default"));
  const [styleId, setStyleId] = React.useState("signature");
  const [field, setField] = React.useState("signature");
  const [apply, setApply] = React.useState("current");

  // Re-seed default name if locale changes mid-session
  React.useEffect(() => { setName(t("sign_typed_default")); }, [lang]);

  const today = "May 02, 2026";
  const initials = (name || "").split(/\s+/).filter(Boolean).map(s => s[0]).slice(0, 3).join("").toUpperCase() || "MH";

  const styles = [
    { id: "signature", label: t("sign_style_signature"), font: '"Caveat", "Brush Script MT", cursive', weight: 600, slant: -2, size: 1.0 },
    { id: "classic",   label: t("sign_style_classic"),   font: '"Cormorant Garamond", "Times New Roman", serif', weight: 600, slant: -8, size: 1.0 },
    { id: "modern",    label: t("sign_style_modern"),    font: 'var(--font-mono)', weight: 600, slant: 0, size: 0.78 },
  ];
  const style = styles.find(s => s.id === styleId) || styles[0];

  const fields = [
    { id: "signature", label: t("sign_field_signature"), icon: "sign" },
    { id: "initials",  label: t("sign_field_initials"),  icon: "edit" },
    { id: "date",      label: t("sign_field_date"),      icon: "calendar" },
    { id: "text",      label: t("sign_field_text"),      icon: "doc" },
  ];

  const renderFieldContent = () => {
    if (field === "signature") {
      return (
        <span style={{
          fontFamily: style.font,
          fontWeight: style.weight,
          fontStyle: style.slant ? "italic" : "normal",
          transform: `skewX(${style.slant}deg)`,
          fontSize: `calc(28px * ${style.size})`,
          color: "oklch(0.30 0.06 250)",
          letterSpacing: style.id === "modern" ? "0.06em" : "normal",
          textTransform: style.id === "modern" ? "uppercase" : "none",
          whiteSpace: "nowrap",
          display: "inline-block",
        }}>{name || "—"}</span>
      );
    }
    if (field === "initials") {
      return (
        <span style={{
          fontFamily: style.font,
          fontWeight: 700,
          fontStyle: style.slant ? "italic" : "normal",
          transform: `skewX(${style.slant}deg)`,
          fontSize: 32,
          color: "oklch(0.30 0.06 250)",
          letterSpacing: "0.04em",
          display: "inline-block",
        }}>{initials}</span>
      );
    }
    if (field === "date") {
      return (
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: 14,
          fontWeight: 500,
          color: "oklch(0.30 0.06 250)",
        }}>{today}</span>
      );
    }
    return (
      <span style={{
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        color: "oklch(0.45 0.06 250)",
        fontStyle: "italic",
      }}>{t("sign_field_text")}</span>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "var(--bg-muted)" }}>
      <TVHeader lang={lang} setLang={setLang} mobile={mobile} />
      <div style={{ padding: mobile ? "16px" : "32px 28px 64px", flex: 1 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <a style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--fg-muted)", marginBottom: 18 }}>
            <TVIcon name="arrow-left" size={14} />{t("tool_back")}
          </a>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "oklch(0.96 0.04 30)", color: "oklch(0.45 0.16 30)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <TVIcon name="sign" size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ fontSize: mobile ? 24 : 32, fontWeight: 600, letterSpacing: "-0.02em" }}>{t("sign_title")}</h1>
              <p style={{ marginTop: 4, fontSize: mobile ? 14 : 15, color: "var(--fg-muted)" }}>{t("sign_sub")}</p>
            </div>
          </div>

          {/* Mock document strip */}
          <div className="pl-card" style={{ padding: "10px 14px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
            <TVPdfThumb pages={7} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>contract-2026-q2.pdf</div>
              <div style={{ fontSize: 11, color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>1.2 MB · 7 {t("file_pages")}</div>
            </div>
            <button style={{ background: "transparent", border: "1px solid var(--line)", color: "var(--fg-muted)", padding: "6px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              <TVIcon name="trash" size={12} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "minmax(0, 1fr) minmax(0, 460px)", gap: 18, alignItems: "start" }}>
            {/* Controls */}
            <div className="pl-card" style={{ padding: mobile ? 16 : 24 }}>
              {/* Method tabs */}
              <div style={{ marginBottom: 20 }}>
                <label className="pl-label">{t("sign_method")}</label>
                <div role="tablist" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4, padding: 4, background: "var(--bg-muted)", border: "1px solid var(--line)", borderRadius: 10 }}>
                  {[
                    { id: "draw",   label: t("sign_method_draw"),   icon: "edit" },
                    { id: "type",   label: t("sign_method_type"),   icon: "sign" },
                    { id: "upload", label: t("sign_method_upload"), icon: "upload" },
                  ].map(m => {
                    const active = method === m.id;
                    return (
                      <button key={m.id} onClick={() => setMethod(m.id)} style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                        border: 0, cursor: "pointer", fontFamily: "inherit",
                        background: active ? "var(--bg-elev)" : "transparent",
                        color: active ? "var(--fg)" : "var(--fg-muted)",
                        fontSize: 12.5, fontWeight: 600, height: 34, padding: "0 10px", borderRadius: 8,
                        boxShadow: active ? "var(--shadow-sm)" : "none",
                      }}>
                        <TVIcon name={m.icon} size={13} /> {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Method body */}
              {method === "type" && (
                <div style={{ marginBottom: 20 }}>
                  <label className="pl-label">{t("sign_typed_label")}</label>
                  <input
                    className="pl-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("sign_typed_placeholder")}
                  />
                  <label className="pl-label" style={{ marginTop: 16 }}>{t("sign_style")}</label>
                  <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: 8 }}>
                    {styles.map(s => {
                      const active = styleId === s.id;
                      return (
                        <button key={s.id} onClick={() => setStyleId(s.id)} style={{
                          padding: "16px 12px", borderRadius: 10,
                          background: active ? "var(--accent-soft)" : "var(--bg-elev)",
                          border: "1px solid " + (active ? "color-mix(in oklch, var(--accent) 35%, var(--line))" : "var(--line)"),
                          boxShadow: active ? "0 0 0 3px var(--accent-ring)" : "none",
                          cursor: "pointer", fontFamily: "inherit", textAlign: "center",
                          transition: "all .15s ease",
                          minHeight: 78,
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                        }}>
                          <span style={{
                            fontFamily: s.font,
                            fontWeight: s.weight,
                            fontStyle: s.slant ? "italic" : "normal",
                            transform: `skewX(${s.slant}deg)`,
                            fontSize: `calc(22px * ${s.size})`,
                            color: "oklch(0.30 0.06 250)",
                            letterSpacing: s.id === "modern" ? "0.06em" : "normal",
                            textTransform: s.id === "modern" ? "uppercase" : "none",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "100%",
                            display: "inline-block",
                          }}>{name || "—"}</span>
                          <span style={{ fontSize: 10, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {method === "draw" && (
                <div style={{ marginBottom: 20 }}>
                  <label className="pl-label">{t("sign_method_draw")}</label>
                  <div style={{
                    height: 140,
                    borderRadius: 10,
                    background: "var(--bg-elev)",
                    border: "1.5px dashed var(--line-strong)",
                    position: "relative",
                    display: "grid", placeItems: "center",
                    overflow: "hidden",
                  }}>
                    {/* Mock drawn signature path */}
                    <svg viewBox="0 0 320 100" style={{ width: "70%", height: "auto" }} aria-hidden="true">
                      <path d="M 10 70 Q 30 10, 60 50 T 110 60 Q 140 30, 170 60 T 230 50 Q 260 70, 290 35 L 305 60" stroke="oklch(0.30 0.06 250)" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div style={{ position: "absolute", bottom: 6, left: 0, right: 0, textAlign: "center", fontSize: 10, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {t("sign_draw_hint")}
                    </div>
                    <button style={{ position: "absolute", top: 8, right: 8, background: "var(--bg-elev)", border: "1px solid var(--line)", color: "var(--fg-muted)", padding: "4px 8px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                      {t("sign_draw_clear")}
                    </button>
                  </div>
                </div>
              )}

              {method === "upload" && (
                <div style={{ marginBottom: 20 }}>
                  <label className="pl-label">{t("sign_method_upload")}</label>
                  <div style={{
                    padding: "22px 16px",
                    borderRadius: 10,
                    background: "var(--bg-elev)",
                    border: "1.5px dashed var(--line-strong)",
                    textAlign: "center",
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--bg-muted)", color: "var(--accent)", display: "grid", placeItems: "center", margin: "0 auto 10px" }}>
                      <TVIcon name="upload" size={18} />
                    </div>
                    <div style={{ fontSize: 13, color: "var(--fg-muted)", marginBottom: 10 }}>
                      {t("sign_upload_hint")}
                    </div>
                    <button className="pl-btn pl-btn-ghost" style={{ fontSize: 12 }}>
                      {t("sign_upload_browse")}
                    </button>
                  </div>
                </div>
              )}

              {/* Fields panel */}
              <div style={{ marginBottom: 20 }}>
                <label className="pl-label">{t("sign_fields")}</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                  {fields.map(f => {
                    const active = field === f.id;
                    return (
                      <button key={f.id} onClick={() => setField(f.id)} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "12px 14px", borderRadius: 10,
                        background: active ? "var(--accent-soft)" : "var(--bg-elev)",
                        border: "1px solid " + (active ? "color-mix(in oklch, var(--accent) 35%, var(--line))" : "var(--line)"),
                        cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                        transition: "all .15s ease",
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: active ? "var(--accent)" : "var(--bg-muted)",
                          color: active ? "var(--accent-fg)" : "var(--fg-muted)",
                          display: "grid", placeItems: "center",
                          flexShrink: 0,
                        }}>
                          <TVIcon name={f.icon} size={14} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: active ? "var(--accent)" : "var(--fg)" }}>{f.label}</div>
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>
                  {t("sign_fields_hint")}
                </div>
              </div>

              {/* Apply to */}
              <div>
                <label className="pl-label">{t("sign_apply")}</label>
                <div style={{ display: "grid", gap: 8 }}>
                  {[
                    { id: "current", label: t("sign_apply_current") },
                    { id: "all",     label: t("sign_apply_all") },
                  ].map(o => {
                    const active = apply === o.id;
                    return (
                      <button key={o.id} onClick={() => setApply(o.id)} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 14px", borderRadius: 10,
                        background: active ? "var(--accent-soft)" : "var(--bg-elev)",
                        border: "1px solid " + (active ? "color-mix(in oklch, var(--accent) 35%, var(--line))" : "var(--line)"),
                        cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                      }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: 999,
                          border: "1.5px solid " + (active ? "var(--accent)" : "var(--line-strong)"),
                          background: "var(--bg-elev)",
                          display: "grid", placeItems: "center",
                          flexShrink: 0,
                        }}>
                          {active && <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--accent)" }} />}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: active ? "var(--accent)" : "var(--fg)" }}>{o.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="pl-card" style={{ padding: mobile ? 16 : 20, position: mobile ? "static" : "sticky", top: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-mono)", marginBottom: 12 }}>
                {t("sign_preview")}
              </div>
              <SignPreviewPage fieldType={field} renderContent={renderFieldContent} />
              <div style={{ marginTop: 12, fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)", textAlign: "center" }}>
                {t("sign_preview_caption")}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button className="pl-btn pl-btn-ghost pl-btn-lg">{t("start_over")}</button>
            <button className="pl-btn pl-btn-primary pl-btn-lg">
              <TVIcon name="sign" size={16} /> {t("sign_cta")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignPreviewPage({ fieldType, renderContent }) {
  // Mock contract page — title, paragraphs, signature line near the bottom
  const lines = [
    { w: "52%", h: 14, mt: 0,  bold: true },
    { w: "32%", h: 8,  mt: 14, dim: true },
    { w: "94%", h: 6,  mt: 22 },
    { w: "88%", h: 6,  mt: 8 },
    { w: "92%", h: 6,  mt: 8 },
    { w: "70%", h: 6,  mt: 8 },
    { w: "94%", h: 6,  mt: 16 },
    { w: "86%", h: 6,  mt: 8 },
    { w: "60%", h: 6,  mt: 8 },
  ];

  // Field box dimensions vary by type
  const boxSize = {
    signature: { w: "44%", h: "9%" },
    initials:  { w: "18%", h: "9%" },
    date:      { w: "26%", h: "7%" },
    text:      { w: "32%", h: "7%" },
  }[fieldType] || { w: "40%", h: "9%" };

  return (
    <div style={{
      position: "relative",
      width: "100%",
      aspectRatio: "1 / 1.414", // A4
      background: "white",
      borderRadius: 6,
      boxShadow: "var(--shadow-md)",
      border: "1px solid var(--line)",
      overflow: "hidden",
    }}>
      {/* Mock page body */}
      <div style={{ position: "absolute", inset: "8% 8% 8% 8%" }}>
        {lines.map((l, i) => (
          <div key={i} style={{
            width: l.w,
            height: l.h,
            marginTop: l.mt,
            background: l.dim ? "oklch(0.85 0 0)" : (l.bold ? "oklch(0.25 0 0)" : "oklch(0.78 0 0)"),
            borderRadius: 2,
          }} />
        ))}
        {/* Signature line label near the bottom */}
        <div style={{ marginTop: 28, fontSize: 9, color: "oklch(0.45 0 0)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
          Signed by
        </div>
        <div style={{ marginTop: 6, width: "44%", height: 1, background: "oklch(0.55 0 0)" }} />
      </div>

      {/* Draggable-looking signature field overlay */}
      <div style={{
        position: "absolute",
        left: "8%",
        top: "62%",
        width: boxSize.w,
        height: boxSize.h,
        minHeight: 36,
        border: "1.5px dashed oklch(0.55 0.18 30)",
        background: "oklch(0.97 0.04 30 / 0.6)",
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "grab",
        transition: "all .15s ease",
      }}>
        {renderContent()}
        {/* Drag handle dots — corners */}
        {["tl","tr","bl","br"].map(c => (
          <span key={c} style={{
            position: "absolute",
            width: 6, height: 6, borderRadius: 999,
            background: "oklch(0.55 0.18 30)",
            top:    c[0] === "t" ? -3 : "auto",
            bottom: c[0] === "b" ? -3 : "auto",
            left:   c[1] === "l" ? -3 : "auto",
            right:  c[1] === "r" ? -3 : "auto",
            boxShadow: "0 0 0 2px white",
          }} />
        ))}
      </div>
    </div>
  );
}

// ── OCR ────────────────────────────────────────────────────────
function OCRToolPage({ lang = "en", setLang = () => {}, mobile = false }) {
  const { t } = tvUseI18n(lang);
  const [ocrLang, setOcrLang] = React.useState("auto");
  const [mode, setMode] = React.useState("extract");

  const langs = [
    { id: "auto", label: t("ocr_lang_auto"), code: "AUTO" },
    { id: "en",   label: t("ocr_lang_en"),   code: "EN" },
    { id: "tr",   label: t("ocr_lang_tr"),   code: "TR" },
    { id: "es",   label: t("ocr_lang_es"),   code: "ES" },
  ];

  const modes = [
    { id: "extract",    label: t("ocr_mode_extract"),    hint: t("ocr_mode_extract_hint"),    icon: "doc" },
    { id: "searchable", label: t("ocr_mode_searchable"), hint: t("ocr_mode_searchable_hint"), icon: "search" },
  ];

  // Effective sample language: when auto, mirror the UI locale.
  const sampleLang = ocrLang === "auto" ? (lang === "tr" || lang === "es" ? lang : "en") : ocrLang;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "var(--bg-muted)" }}>
      <TVHeader lang={lang} setLang={setLang} mobile={mobile} />
      <div style={{ padding: mobile ? "16px" : "32px 28px 64px", flex: 1 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <a style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--fg-muted)", marginBottom: 18 }}>
            <TVIcon name="arrow-left" size={14} />{t("tool_back")}
          </a>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "oklch(0.96 0.04 290)", color: "oklch(0.45 0.18 290)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <TVIcon name="ocr" size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ fontSize: mobile ? 24 : 32, fontWeight: 600, letterSpacing: "-0.02em" }}>{t("ocr_title")}</h1>
              <p style={{ marginTop: 4, fontSize: mobile ? 14 : 15, color: "var(--fg-muted)" }}>{t("ocr_sub")}</p>
            </div>
          </div>

          {/* Mock document strip */}
          <div className="pl-card" style={{ padding: "10px 14px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
            <TVPdfThumb pages={1} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>scanned-invoice.pdf</div>
              <div style={{ fontSize: 11, color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>1.8 MB · 1 {t("file_pages")}</div>
            </div>
            <button style={{ background: "transparent", border: "1px solid var(--line)", color: "var(--fg-muted)", padding: "6px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              <TVIcon name="trash" size={12} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "minmax(0, 360px) minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
            {/* Controls */}
            <div className="pl-card" style={{ padding: mobile ? 16 : 24, minWidth: 0 }}>
              {/* Language selector */}
              <div style={{ marginBottom: 20 }}>
                <label className="pl-label">{t("ocr_lang")}</label>
                <div role="radiogroup" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                  {langs.map(l => {
                    const active = ocrLang === l.id;
                    return (
                      <button key={l.id} role="radio" aria-checked={active} onClick={() => setOcrLang(l.id)} style={{
                        display: "flex", alignItems: "center", gap: 10, minWidth: 0,
                        padding: "10px 12px", borderRadius: 10,
                        background: active ? "var(--accent-soft)" : "var(--bg-elev)",
                        border: "1px solid " + (active ? "color-mix(in oklch, var(--accent) 35%, var(--line))" : "var(--line)"),
                        cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                        transition: "all .15s ease",
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 7,
                          background: active ? "var(--accent)" : "var(--bg-muted)",
                          color: active ? "var(--accent-fg)" : "var(--fg-muted)",
                          display: "grid", placeItems: "center", flexShrink: 0,
                          fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
                        }}>
                          {l.id === "auto" ? <TVIcon name="globe" size={14} /> : l.code}
                        </div>
                        <span style={{ fontSize: 12.5, fontWeight: 500, color: active ? "var(--accent)" : "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>
                  {t("ocr_lang_hint")}
                </div>
              </div>

              {/* Mode selector */}
              <div style={{ marginBottom: 20 }}>
                <label className="pl-label">{t("ocr_mode")}</label>
                <div style={{ display: "grid", gap: 8 }}>
                  {modes.map(m => {
                    const active = mode === m.id;
                    return (
                      <button key={m.id} onClick={() => setMode(m.id)} style={{
                        display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0,
                        padding: "12px 14px", borderRadius: 10,
                        background: active ? "var(--accent-soft)" : "var(--bg-elev)",
                        border: "1px solid " + (active ? "color-mix(in oklch, var(--accent) 35%, var(--line))" : "var(--line)"),
                        cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                        transition: "all .15s ease",
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: active ? "var(--accent)" : "var(--bg-muted)",
                          color: active ? "var(--accent-fg)" : "var(--fg-muted)",
                          display: "grid", placeItems: "center", flexShrink: 0, marginTop: 1,
                        }}>
                          <TVIcon name={m.icon} size={14} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: active ? "var(--accent)" : "var(--fg)" }}>{m.label}</div>
                          <div style={{ fontSize: 11.5, color: "var(--fg-muted)", marginTop: 2 }}>{m.hint}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status / confidence chips */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span className="pl-chip" style={{ background: "color-mix(in oklch, var(--accent) 12%, var(--bg-muted))", color: "var(--accent)", borderColor: "color-mix(in oklch, var(--accent) 25%, var(--line))" }}>
                  <TVIcon name="check" size={11} /> {t("ocr_status_ready")}
                </span>
                <span className="pl-chip" style={{ fontFamily: "var(--font-mono)" }}>
                  {t("ocr_confidence")} · 94%
                </span>
              </div>
            </div>

            {/* Preview */}
            <div className="pl-card" style={{ padding: mobile ? 16 : 20, position: mobile ? "static" : "sticky", top: 24, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-mono)", marginBottom: 12 }}>
                {t("ocr_preview")}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)", gap: 14, alignItems: "stretch" }}>
                <OCRScannedPage label={t("ocr_scanned_label")} />
                <OCRExtractedBlock label={t("ocr_extracted_label")} mode={mode} sampleLang={sampleLang} />
              </div>
              <div style={{ marginTop: 12, fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)", textAlign: "center" }}>
                {t("ocr_preview_caption")}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button className="pl-btn pl-btn-ghost pl-btn-lg">{t("start_over")}</button>
            <button className="pl-btn pl-btn-primary pl-btn-lg">
              <TVIcon name="ocr" size={16} /> {t("ocr_cta")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OCRScannedPage({ label }) {
  // Mock scanned page: subtle off-white tint, slight skew, low-contrast text bars,
  // grain overlay to suggest a camera/scanner artefact.
  const lines = [
    { w: "70%", h: 12, mt: 0,  bold: true },
    { w: "44%", h: 8,  mt: 12, dim: true },
    { w: "94%", h: 6,  mt: 22 },
    { w: "88%", h: 6,  mt: 8 },
    { w: "92%", h: 6,  mt: 8 },
    { w: "62%", h: 6,  mt: 8 },
    { w: "94%", h: 6,  mt: 16 },
    { w: "82%", h: 6,  mt: 8 },
    { w: "58%", h: 6,  mt: 8 },
    { w: "40%", h: 6,  mt: 18, dim: true },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
      <div style={{ fontSize: 10, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1.414",
        background: "oklch(0.96 0.012 90)",
        borderRadius: 6,
        boxShadow: "var(--shadow-md)",
        border: "1px solid var(--line)",
        overflow: "hidden",
        transform: "rotate(-0.4deg)",
      }}>
        {/* Grain overlay */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 20% 30%, oklch(0.85 0.02 70 / 0.35) 0 1px, transparent 1px), radial-gradient(circle at 70% 60%, oklch(0.82 0.02 90 / 0.30) 0 1px, transparent 1px), radial-gradient(circle at 40% 80%, oklch(0.88 0.02 80 / 0.25) 0 1px, transparent 1px)",
          backgroundSize: "3px 3px, 5px 5px, 7px 7px",
          mixBlendMode: "multiply",
          pointerEvents: "none",
        }} />
        <div style={{ position: "absolute", inset: "9% 9% 9% 9%" }}>
          {lines.map((l, i) => (
            <div key={i} style={{
              width: l.w, height: l.h, marginTop: l.mt,
              background: l.dim ? "oklch(0.72 0.01 80)" : (l.bold ? "oklch(0.32 0.01 80)" : "oklch(0.55 0.01 80)"),
              borderRadius: 1,
              filter: "blur(0.3px)",
              opacity: 0.85,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function OCRExtractedBlock({ label, mode, sampleLang }) {
  // Mock OCR output. Hardcoded per language as accepted mock document content.
  const samples = {
    en: {
      title: "INVOICE #2026-0184",
      meta: "Issued · May 02, 2026",
      body: [
        "Bill to: Northwind Trading Co.",
        "440 Market Street, Suite 12",
        "Portland, OR 97204",
        "",
        "Description                Qty   Amount",
        "Annual support, tier B      1    $4,200.00",
        "Onboarding session          2      $480.00",
        "",
        "Subtotal                         $4,680.00",
        "Tax (8.5%)                         $397.80",
        "Total due                        $5,077.80",
      ],
    },
    tr: {
      title: "FATURA #2026-0184",
      meta: "Düzenleme · 02 Mayıs 2026",
      body: [
        "Alıcı: Kuzeyrüzgarı Ticaret A.Ş.",
        "Bağdat Caddesi 440, Daire 12",
        "Kadıköy, İstanbul 34710",
        "",
        "Açıklama                  Adet   Tutar",
        "Yıllık destek, B kademesi   1    ₺4.200,00",
        "Kurulum oturumu             2      ₺480,00",
        "",
        "Ara toplam                       ₺4.680,00",
        "KDV (%8,5)                         ₺397,80",
        "Toplam                           ₺5.077,80",
      ],
    },
    es: {
      title: "FACTURA #2026-0184",
      meta: "Emitida · 02 de mayo de 2026",
      body: [
        "Facturar a: Comercial Vientonorte S.L.",
        "Calle del Mercado 440, oficina 12",
        "28013 Madrid",
        "",
        "Descripción                Cant   Importe",
        "Soporte anual, nivel B       1    €4.200,00",
        "Sesión de incorporación      2      €480,00",
        "",
        "Subtotal                         €4.680,00",
        "IVA (8,5%)                         €397,80",
        "Total                            €5.077,80",
      ],
    },
  };
  const s = samples[sampleLang] || samples.en;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 10, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
        <span style={{ fontSize: 10, color: "var(--accent)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {mode === "extract" ? ".txt" : ".pdf"}
        </span>
      </div>
      <div style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1.414",
        background: "var(--bg-elev)",
        borderRadius: 6,
        boxShadow: "var(--shadow-md)",
        border: "1px solid var(--line)",
        overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}>
        {/* Faux editor header */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderBottom: "1px solid var(--line)", background: "var(--bg-muted)" }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "oklch(0.72 0.16 25)" }} />
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "oklch(0.80 0.14 90)" }} />
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "oklch(0.74 0.14 150)" }} />
          <span style={{ marginLeft: 6, fontSize: 10, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            scanned-invoice{mode === "extract" ? ".txt" : ".pdf"}
          </span>
        </div>
        {/* Text body */}
        <div style={{
          flex: 1,
          padding: "12px 14px",
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          lineHeight: 1.55,
          color: "var(--fg)",
          overflow: "hidden",
          minWidth: 0,
          wordBreak: "break-word",
          overflowWrap: "anywhere",
        }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: "var(--accent)", marginBottom: 2 }}>{s.title}</div>
          <div style={{ fontSize: 10, color: "var(--fg-muted)", marginBottom: 10 }}>{s.meta}</div>
          {s.body.map((line, i) => (
            <div key={i} style={{ whiteSpace: "pre", overflow: "hidden", textOverflow: "ellipsis", color: line.startsWith("Total") || line.startsWith("Toplam") || line.match(/^Total\s/) ? "var(--fg)" : "var(--fg-muted)", fontWeight: line.startsWith("Total") || line.startsWith("Toplam") ? 700 : 400, minHeight: line === "" ? 8 : "auto" }}>
              {line || " "}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Edit PDF ───────────────────────────────────────────────────
function EditPDFToolPage({ lang = "en", setLang = () => {}, mobile = false }) {
  const { t } = tvUseI18n(lang);
  const [tool, setTool] = React.useState("text");
  const [text, setText] = React.useState(t("edit_text_default"));
  const [color, setColor] = React.useState("yellow");
  const [strokeStyle, setStrokeStyle] = React.useState("outline");
  const [page, setPage] = React.useState(3);
  const totalPages = 7;

  React.useEffect(() => { setText(t("edit_text_default")); }, [lang]);

  const colors = [
    { id: "yellow", swatch: "oklch(0.92 0.16 95)",  ink: "oklch(0.30 0.10 95)" },
    { id: "pink",   swatch: "oklch(0.85 0.14 350)", ink: "oklch(0.40 0.16 350)" },
    { id: "cyan",   swatch: "oklch(0.86 0.10 220)", ink: "oklch(0.40 0.14 220)" },
    { id: "green",  swatch: "oklch(0.86 0.14 150)", ink: "oklch(0.36 0.14 150)" },
    { id: "black",  swatch: "oklch(0.20 0 0)",      ink: "oklch(0.20 0 0)" },
  ];
  const activeColor = colors.find(c => c.id === color) || colors[0];

  const tools = [
    { id: "text",      label: t("edit_tool_text"),      glyph: <EditGlyphText /> },
    { id: "highlight", label: t("edit_tool_highlight"), glyph: <EditGlyphHighlight /> },
    { id: "redact",    label: t("edit_tool_redact"),    glyph: <EditGlyphRedact /> },
    { id: "shape",     label: t("edit_tool_shape"),     glyph: <EditGlyphShape /> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "var(--bg-muted)" }}>
      <TVHeader lang={lang} setLang={setLang} mobile={mobile} />
      <div style={{ padding: mobile ? "16px" : "32px 28px 64px", flex: 1 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <a style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--fg-muted)", marginBottom: 18 }}>
            <TVIcon name="arrow-left" size={14} />{t("tool_back")}
          </a>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "oklch(0.96 0.04 290)", color: "oklch(0.45 0.18 290)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <TVIcon name="edit" size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ fontSize: mobile ? 24 : 32, fontWeight: 600, letterSpacing: "-0.02em" }}>{t("edit_title")}</h1>
              <p style={{ marginTop: 4, fontSize: mobile ? 14 : 15, color: "var(--fg-muted)" }}>{t("edit_sub")}</p>
            </div>
          </div>

          {/* Mock document strip */}
          <div className="pl-card" style={{ padding: "10px 14px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
            <TVPdfThumb pages={totalPages} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>annual-report.pdf</div>
              <div style={{ fontSize: 11, color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>2.4 MB · {totalPages} {t("file_pages")}</div>
            </div>
            <button style={{ background: "transparent", border: "1px solid var(--line)", color: "var(--fg-muted)", padding: "6px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              <TVIcon name="trash" size={12} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "minmax(0, 380px) minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
            {/* Controls */}
            <div className="pl-card" style={{ padding: mobile ? 16 : 24, minWidth: 0 }}>
              {/* Tool mode grid */}
              <div style={{ marginBottom: 20 }}>
                <label className="pl-label">{t("edit_tools")}</label>
                <div role="radiogroup" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                  {tools.map(tl => {
                    const active = tool === tl.id;
                    return (
                      <button key={tl.id} role="radio" aria-checked={active} onClick={() => setTool(tl.id)} style={{
                        display: "flex", alignItems: "center", gap: 10, minWidth: 0,
                        padding: "12px 12px", borderRadius: 10,
                        background: active ? "var(--accent-soft)" : "var(--bg-elev)",
                        border: "1px solid " + (active ? "color-mix(in oklch, var(--accent) 35%, var(--line))" : "var(--line)"),
                        cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                        boxShadow: active ? "0 0 0 3px var(--accent-ring)" : "none",
                        transition: "all .15s ease",
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: active ? "var(--bg-elev)" : "var(--bg-muted)",
                          border: "1px solid " + (active ? "color-mix(in oklch, var(--accent) 25%, var(--line))" : "var(--line)"),
                          display: "grid", placeItems: "center", flexShrink: 0,
                        }}>
                          {tl.glyph}
                        </div>
                        <span style={{ fontSize: 12.5, fontWeight: 500, color: active ? "var(--accent)" : "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {tl.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Text input — only when text tool active */}
              {tool === "text" && (
                <div style={{ marginBottom: 20 }}>
                  <label className="pl-label">{t("edit_text_label")}</label>
                  <input
                    className="pl-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t("edit_text_placeholder")}
                  />
                </div>
              )}

              {/* Color swatches */}
              <div style={{ marginBottom: 20 }}>
                <label className="pl-label">{t("edit_color")}</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {colors.map(c => {
                    const active = color === c.id;
                    return (
                      <button key={c.id} onClick={() => setColor(c.id)} title={c.id} aria-label={c.id} style={{
                        width: 32, height: 32, borderRadius: 999,
                        background: c.swatch,
                        border: "1px solid " + (c.id === "black" ? "transparent" : "color-mix(in oklch, " + c.swatch + " 70%, black 12%)"),
                        boxShadow: active ? "0 0 0 3px var(--accent-ring), 0 0 0 1.5px var(--accent)" : "none",
                        cursor: "pointer", padding: 0,
                        display: "grid", placeItems: "center",
                      }}>
                        {active && <TVIcon name="check" size={14} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stroke style — only meaningful for shape; shown always for layout consistency */}
              <div style={{ marginBottom: 20 }}>
                <label className="pl-label">{t("edit_style")}</label>
                <div role="tablist" style={{ display: "inline-flex", padding: 4, gap: 4, background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: 10 }}>
                  {[
                    { id: "outline", label: t("edit_style_outline") },
                    { id: "solid",   label: t("edit_style_solid") },
                  ].map(o => {
                    const active = strokeStyle === o.id;
                    return (
                      <button key={o.id} onClick={() => setStrokeStyle(o.id)} style={{
                        border: 0, cursor: "pointer", fontFamily: "inherit",
                        background: active ? "var(--accent-soft)" : "transparent",
                        color: active ? "var(--accent)" : "var(--fg-muted)",
                        fontSize: 12.5, fontWeight: 600, height: 32, padding: "0 14px", borderRadius: 8,
                      }}>{o.label}</button>
                    );
                  })}
                </div>
              </div>

              {/* Page stepper */}
              <div>
                <label className="pl-label">{t("edit_page")}</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: "var(--bg-elev)", border: "1px solid var(--line)",
                    color: page <= 1 ? "var(--fg-subtle)" : "var(--fg)",
                    cursor: page <= 1 ? "not-allowed" : "pointer",
                    display: "grid", placeItems: "center", padding: 0,
                  }}>
                    <TVIcon name="arrow-left" size={14} />
                  </button>
                  <div style={{ flex: 1, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>
                    {page} / {totalPages}
                  </div>
                  <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: "var(--bg-elev)", border: "1px solid var(--line)",
                    color: page >= totalPages ? "var(--fg-subtle)" : "var(--fg)",
                    cursor: page >= totalPages ? "not-allowed" : "pointer",
                    display: "grid", placeItems: "center", padding: 0,
                  }}>
                    <TVIcon name="arrow-right" size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="pl-card" style={{ padding: mobile ? 16 : 20, position: mobile ? "static" : "sticky", top: 24, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-mono)", marginBottom: 12 }}>
                {t("edit_preview")}
              </div>
              <EditPDFPreviewPage
                tool={tool}
                text={text}
                color={activeColor}
                strokeStyle={strokeStyle}
                redactLabel={t("edit_redact_label")}
              />
              <div style={{ marginTop: 12, fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)", textAlign: "center" }}>
                {t("edit_preview_caption")}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button className="pl-btn pl-btn-ghost pl-btn-lg">{t("start_over")}</button>
            <button className="pl-btn pl-btn-primary pl-btn-lg">
              <TVIcon name="edit" size={16} /> {t("edit_cta")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tiny per-mode glyphs rendered inside the tool-button squares
function EditGlyphText() {
  return (
    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--fg)", letterSpacing: "-0.02em" }}>T</span>
  );
}
function EditGlyphHighlight() {
  return (
    <span style={{ display: "inline-block", width: 16, height: 6, background: "oklch(0.92 0.16 95)", borderRadius: 1 }} />
  );
}
function EditGlyphRedact() {
  return (
    <span style={{ display: "inline-block", width: 16, height: 8, background: "oklch(0.20 0 0)", borderRadius: 1 }} />
  );
}
function EditGlyphShape() {
  return (
    <span style={{ display: "inline-block", width: 14, height: 10, border: "1.5px solid var(--fg)", borderRadius: 2, background: "transparent" }} />
  );
}

function EditPDFPreviewPage({ tool, text, color, strokeStyle, redactLabel }) {
  // Mock report page: title + body lines, then four overlay edit elements.
  // The element matching the active tool gets selected styling (handles + ring);
  // others stay visible so the preview demonstrates every mode at a glance.
  const lines = [
    { w: "58%", h: 14, mt: 0,  bold: true },
    { w: "34%", h: 8,  mt: 14, dim: true },
    { w: "94%", h: 6,  mt: 22 },
    { w: "88%", h: 6,  mt: 8 },
    { w: "92%", h: 6,  mt: 8 },
    { w: "70%", h: 6,  mt: 8 },
    { w: "94%", h: 6,  mt: 16 },
    { w: "86%", h: 6,  mt: 8 },
    { w: "90%", h: 6,  mt: 8 },
    { w: "44%", h: 6,  mt: 8 },
  ];

  // Visual styling for the currently-selected overlay
  const selectedRing = "0 0 0 2px white, 0 0 0 4px var(--accent)";

  return (
    <div style={{
      position: "relative",
      width: "100%",
      aspectRatio: "1 / 1.414",
      background: "white",
      borderRadius: 6,
      boxShadow: "var(--shadow-md)",
      border: "1px solid var(--line)",
      overflow: "hidden",
    }}>
      {/* Body */}
      <div style={{ position: "absolute", inset: "9% 9% 9% 9%" }}>
        {lines.map((l, i) => (
          <div key={i} style={{
            width: l.w, height: l.h, marginTop: l.mt,
            background: l.dim ? "oklch(0.85 0 0)" : (l.bold ? "oklch(0.25 0 0)" : "oklch(0.78 0 0)"),
            borderRadius: 2,
          }} />
        ))}
      </div>

      {/* 1) Highlight overlay — yellow stripe across the third body line */}
      <div style={{
        position: "absolute",
        left: "9%",
        top: "32%",
        width: "78%",
        height: "2.4%",
        background: tool === "highlight" ? color.swatch : "oklch(0.92 0.16 95)",
        opacity: 0.55,
        borderRadius: 2,
        boxShadow: tool === "highlight" ? selectedRing : "none",
        pointerEvents: "none",
      }} />

      {/* 2) Redaction block — solid black bar covering middle text */}
      <div style={{
        position: "absolute",
        left: "32%",
        top: "44%",
        width: "36%",
        height: "3.2%",
        background: "oklch(0.10 0 0)",
        borderRadius: 1,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: tool === "redact" ? selectedRing : "none",
      }}>
        <span style={{
          color: "white",
          fontFamily: "var(--font-mono)",
          fontSize: "min(2.2cqw, 9px)",
          fontWeight: 700,
          letterSpacing: "0.16em",
        }}>{redactLabel}</span>
      </div>

      {/* 3) Text box overlay — top-right callout */}
      <div style={{
        position: "absolute",
        right: "9%",
        top: "11%",
        maxWidth: "44%",
        padding: "4px 8px",
        background: "white",
        border: "1.5px " + (strokeStyle === "outline" ? "dashed " : "solid ") + (tool === "text" ? "var(--accent)" : color.ink),
        borderRadius: 4,
        boxShadow: tool === "text" ? "0 0 0 3px var(--accent-ring)" : "var(--shadow-sm)",
      }}>
        <span style={{
          fontFamily: "var(--font-display)",
          fontSize: "min(2.6cqw, 11px)",
          fontWeight: 600,
          color: tool === "text" ? color.ink : "oklch(0.30 0.04 290)",
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "block",
        }}>{text || " "}</span>
      </div>

      {/* 4) Shape rectangle — bottom area */}
      <div style={{
        position: "absolute",
        left: "12%",
        bottom: "10%",
        width: "42%",
        height: "12%",
        background: strokeStyle === "solid" ? color.swatch : "transparent",
        opacity: strokeStyle === "solid" ? 0.30 : 1,
        border: "2px " + (strokeStyle === "outline" ? "solid " : "solid ") + color.ink,
        borderRadius: 4,
        boxShadow: tool === "shape" ? selectedRing : "none",
      }} />

      {/* Drag handles for the selected element (decorative) */}
      {tool && <PreviewSelectionHandles tool={tool} />}
    </div>
  );
}

function PreviewSelectionHandles({ tool }) {
  // Map tool → bounding box coords of its overlay (must match the rects above)
  const boxes = {
    text:      { left: "47%",  top: "11%",  width: "44%",  height: "8%" },
    highlight: { left: "9%",   top: "32%",  width: "78%",  height: "2.4%" },
    redact:    { left: "32%",  top: "44%",  width: "36%",  height: "3.2%" },
    shape:     { left: "12%",  bottom: "10%", width: "42%", height: "12%" },
  };
  const b = boxes[tool];
  if (!b) return null;
  const corners = ["tl", "tr", "bl", "br"];
  return (
    <div style={{ position: "absolute", ...b, pointerEvents: "none" }}>
      {corners.map(c => (
        <span key={c} style={{
          position: "absolute",
          width: 7, height: 7, borderRadius: 999,
          background: "var(--accent)",
          boxShadow: "0 0 0 1.5px white",
          top:    c[0] === "t" ? -4 : "auto",
          bottom: c[0] === "b" ? -4 : "auto",
          left:   c[1] === "l" ? -4 : "auto",
          right:  c[1] === "r" ? -4 : "auto",
        }} />
      ))}
    </div>
  );
}

Object.assign(window, { MergeToolPage, SplitToolPage, ConvertToolPage, WatermarkToolPage, SignToolPage, OCRToolPage, EditPDFToolPage });
