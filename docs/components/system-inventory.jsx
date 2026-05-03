// system-inventory.jsx — Component & token reference, displayed as a static gallery

const { useI18n: siUseI18n, Header: SIHeader, Footer: SIFooter, Icon: SIIcon, Logo: SILogo, ToolIcon: SIToolIcon, ToolCard: SIToolCard, PdfThumb: SIPdfThumb, TOOLS: SI_TOOLS } = window;

function SystemInventoryPage({ lang = "en", setLang = () => {} }) {

  const Section = ({ id, eyebrow, title, children }) => (
    <section id={id} style={{ padding: "48px 32px", borderTop: "1px solid var(--line)", scrollMarginTop: 80 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-mono)", marginBottom: 8 }}>{eyebrow}</div>
          <h2 style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.025em" }}>{title}</h2>
        </div>
        {children}
      </div>
    </section>
  );

  const Tile = ({ children, label, mono = false, h = 80, bg }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
      <div style={{
        height: h,
        background: bg || "var(--bg-muted)",
        border: "1px solid var(--line)",
        borderRadius: 10,
        display: "grid", placeItems: "center",
        position: "relative",
        overflow: "hidden",
      }}>{children}</div>
      <div style={{ fontSize: 11, color: "var(--fg-muted)", fontFamily: mono ? "var(--font-mono)" : "inherit", letterSpacing: mono ? 0 : "0.005em" }}>{label}</div>
    </div>
  );

  const PaletteSwatch = ({ color, name, value }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
      <div style={{ height: 64, borderRadius: 10, background: color, border: "1px solid var(--line)" }} />
      <div style={{ fontSize: 12, fontWeight: 600 }}>{name}</div>
      <div style={{ fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
    </div>
  );

  const TypeRow = ({ size, label, sample, weight = 400, tracking = 0, line = 1.4 }) => (
    <div style={{
      display: "grid", gridTemplateColumns: "120px 1fr 80px", gap: 16, alignItems: "baseline",
      padding: "16px 0", borderBottom: "1px solid var(--line)",
    }}>
      <div style={{ fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>{label}</div>
      <div style={{ fontSize: size, fontWeight: weight, letterSpacing: tracking + "em", lineHeight: line, color: "var(--fg)", textWrap: "balance" }}>{sample}</div>
      <div style={{ fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)", textAlign: "right" }}>{size}px / {weight}</div>
    </div>
  );

  const TokenRow = ({ name, value, swatch }) => (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 16, alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
      <div style={{ width: 32, height: 32, borderRadius: 6, background: swatch || "var(--bg-muted)", border: "1px solid var(--line)" }} />
      <div style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--fg)" }}>{name}</div>
      <div style={{ fontSize: 12, color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>{value}</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "var(--bg)" }}>
      <SIHeader lang={lang} setLang={setLang} active="" />

      {/* Hero */}
      <section style={{ padding: "64px 32px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
            <SILogo size={20} />
            <span className="pl-chip" style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}>v1.0 · System</span>
          </div>
          <h1 style={{ fontSize: 56, fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1.05, maxWidth: 800 }}>The Lunedoc system, one page</h1>
          <p style={{ marginTop: 16, fontSize: 17, color: "var(--fg-muted)", lineHeight: 1.55, maxWidth: 640 }}>
            Tokens, primitives, and components used across every page in the canvas. Drop-in references for the Flutter port and for anyone touching the codebase later.
          </p>

          {/* Quick nav */}
          <nav style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 28 }}>
            {[
              ["palette", "Palette"],
              ["type", "Typography"],
              ["spacing", "Spacing & radii"],
              ["icons", "Icon set"],
              ["buttons", "Buttons"],
              ["inputs", "Inputs"],
              ["cards", "Cards & chips"],
              ["tools", "Tool catalog"],
              ["i18n", "i18n status"],
              ["pages", "Page inventory"],
            ].map(([id, label]) => (
              <a key={id} href={"#" + id} style={{
                fontSize: 12, padding: "6px 12px", borderRadius: 999,
                background: "var(--bg-muted)", color: "var(--fg-muted)",
                border: "1px solid var(--line)",
                fontFamily: "var(--font-mono)",
              }}>{label}</a>
            ))}
          </nav>
        </div>
      </section>

      {/* Palette */}
      <Section id="palette" eyebrow="01 — Palette" title="Color tokens, light and dark">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 32 }}>
          <PaletteSwatch color="var(--accent)" name="accent" value="oklch(.55 .18 252)" />
          <PaletteSwatch color="var(--accent-soft)" name="accent-soft" value="oklch(.96 .04 252)" />
          <PaletteSwatch color="var(--fg)" name="fg" value="#0b0b0f" />
          <PaletteSwatch color="var(--fg-muted)" name="fg-muted" value="#5b5b66" />
          <PaletteSwatch color="var(--fg-subtle)" name="fg-subtle" value="#8a8a96" />
          <PaletteSwatch color="var(--bg)" name="bg" value="#ffffff" />
          <PaletteSwatch color="var(--bg-elev)" name="bg-elev" value="#ffffff" />
          <PaletteSwatch color="var(--bg-muted)" name="bg-muted" value="#fafafa" />
          <PaletteSwatch color="var(--bg-sunken)" name="bg-sunken" value="#f6f6f7" />
          <PaletteSwatch color="var(--line)" name="line" value="#ececef" />
        </div>

        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-mono)", marginBottom: 12 }}>Accent presets · swap via Tweaks</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
          {[
            { name: "Indigo",  c: "oklch(0.55 0.18 252)" },
            { name: "Blue",    c: "oklch(0.55 0.17 235)" },
            { name: "Emerald", c: "oklch(0.50 0.15 165)" },
            { name: "Graphite",c: "oklch(0.20 0.02 260)" },
            { name: "Amber",   c: "oklch(0.60 0.16 60)"  },
          ].map(p => <PaletteSwatch key={p.name} color={p.c} name={p.name} value={p.c} />)}
        </div>
      </Section>

      {/* Typography */}
      <Section id="type" eyebrow="02 — Typography" title="Inter, with disciplined scale">
        <div>
          <TypeRow size={56} weight={600} tracking={-0.035} line={1.05} label="display/xl"  sample="Boring parts done well." />
          <TypeRow size={40} weight={600} tracking={-0.03}  line={1.1}  label="display/lg"  sample="Boring parts done well." />
          <TypeRow size={32} weight={600} tracking={-0.025} line={1.15} label="heading/lg"  sample="Boring parts done well." />
          <TypeRow size={22} weight={600} tracking={-0.02}  line={1.25} label="heading/md"  sample="Boring parts done well." />
          <TypeRow size={17} weight={400} tracking={-0.005} line={1.55} label="body/lg"     sample="A short, plain-English tour of what actually happens when you compress a PDF." />
          <TypeRow size={14} weight={400} tracking={0}      line={1.55} label="body/md"     sample="Files encrypted in transit, processed in isolated workers, deleted within an hour." />
          <TypeRow size={12} weight={500} tracking={0.06}   line={1.4}  label="label/mono"  sample="QUARTERLY-REVIEW-2026-Q1.pdf · 3.2 MB · 16 PAGES" />
        </div>
      </Section>

      {/* Spacing & radii */}
      <Section id="spacing" eyebrow="03 — Spacing & radii" title="A 4-pixel rhythm">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-mono)", marginBottom: 12 }}>Spacing scale</div>
            {[
              ["--s-1", "4px"], ["--s-2", "8px"], ["--s-3", "12px"], ["--s-4", "16px"],
              ["--s-5", "24px"], ["--s-6", "32px"], ["--s-7", "48px"], ["--s-8", "64px"], ["--s-9", "96px"],
            ].map(([n, v]) => (
              <div key={n} style={{ display: "grid", gridTemplateColumns: "120px 1fr 60px", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--line)", gap: 12 }}>
                <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--fg-muted)" }}>{n}</span>
                <div style={{ height: 12, background: "var(--accent-soft)", border: "1px solid color-mix(in oklch, var(--accent) 30%, var(--line))", width: v, borderRadius: 3 }} />
                <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--fg-subtle)", textAlign: "right" }}>{v}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-mono)", marginBottom: 12 }}>Radii</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
              {[
                ["sm", "6px"], ["md", "10px"], ["lg", "14px"], ["xl", "20px"], ["2xl", "28px"],
              ].map(([n, v]) => (
                <Tile key={n} h={88} label={`--r-${n} · ${v}`} mono>
                  <div style={{ width: 56, height: 56, background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: v, boxShadow: "var(--shadow-sm)" }} />
                </Tile>
              ))}
            </div>

            <div style={{ marginTop: 28, fontSize: 12, fontWeight: 600, color: "var(--fg-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-mono)", marginBottom: 12 }}>Shadows</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                ["sm", "var(--shadow-sm)"],
                ["md", "var(--shadow-md)"],
                ["lg", "var(--shadow-lg)"],
              ].map(([n, v]) => (
                <Tile key={n} h={88} label={`--shadow-${n}`} mono bg="var(--bg)">
                  <div style={{ width: 60, height: 36, background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: 8, boxShadow: v }} />
                </Tile>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Icons */}
      <Section id="icons" eyebrow="04 — Icon set" title="Custom stroke set, 1.6 weight, 20px grid">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 8 }}>
          {[
            "merge", "split", "compress", "convert",
            "doc", "image", "rotate", "lock",
            "unlock", "sign", "edit", "watermark",
            "number", "ocr", "search", "upload",
            "download", "check", "arrow-right", "arrow-left",
            "chevron-down", "chevron-right", "globe", "shield",
            "sparkle", "menu", "close", "plus",
            "minus", "trash", "drag", "drive",
            "home", "grid", "user", "star",
            "clock", "folder", "more", "list",
            "filter", "bell",
          ].map(name => (
            <div key={name} className="pl-card" style={{ aspectRatio: "1 / 1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: 8 }}>
              <SIIcon name={name} size={18} />
              <div style={{ fontSize: 10, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>{name}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Buttons */}
      <Section id="buttons" eyebrow="05 — Buttons" title="Three families, three sizes">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {[
            { name: "Primary", cls: "pl-btn pl-btn-primary" },
            { name: "Ghost",   cls: "pl-btn pl-btn-ghost" },
            { name: "Quiet",   cls: "pl-btn pl-btn-quiet" },
          ].map(b => (
            <div key={b.name}>
              <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--fg-subtle)", marginBottom: 12, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>{b.name}</div>
              <div className="pl-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
                <button className={`${b.cls} pl-btn-lg`}><SIIcon name="upload" size={16} /> Large action</button>
                <button className={b.cls}>Default action</button>
                <button className={`${b.cls} pl-btn-sm`}>Small</button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Inputs */}
      <Section id="inputs" eyebrow="06 — Inputs" title="Forms, fields, controls">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
          <div className="pl-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label className="pl-label">Email</label>
              <input className="pl-input" placeholder="you@company.com" />
            </div>
            <div>
              <label className="pl-label">Password</label>
              <input className="pl-input" type="password" placeholder="••••••••••" />
            </div>
          </div>
          <div className="pl-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Default", checked: false, focused: false },
              { label: "Selected", checked: true, focused: false },
              { label: "Focused", checked: false, focused: true },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 5,
                  background: s.checked ? "var(--accent)" : "var(--bg-elev)",
                  border: "1.5px solid " + (s.checked ? "var(--accent)" : "var(--line-strong)"),
                  boxShadow: s.focused ? "0 0 0 4px var(--accent-ring)" : "none",
                  display: "grid", placeItems: "center", color: "var(--accent-fg)",
                }}>{s.checked && <SIIcon name="check" size={11} />}</div>
                <div style={{ fontSize: 13 }}>{s.label} checkbox</div>
              </div>
            ))}
            {[
              { label: "Default", active: false },
              { label: "Selected", active: true },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 999,
                  border: "1.5px solid " + (r.active ? "var(--accent)" : "var(--line-strong)"),
                  display: "grid", placeItems: "center",
                }}>{r.active && <div style={{ width: 8, height: 8, borderRadius: 999, background: "var(--accent)" }} />}</div>
                <div style={{ fontSize: 13 }}>{r.label} radio</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Cards & chips */}
      <Section id="cards" eyebrow="07 — Cards & chips" title="Containers and small surfaces">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          <div className="pl-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Default card</div>
            <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>1px line, sm shadow</div>
          </div>
          <div className="pl-card" style={{ padding: 20, borderColor: "color-mix(in oklch, var(--accent) 35%, var(--line))", boxShadow: "var(--shadow-md)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Featured card</div>
            <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>Accent border tint</div>
          </div>
          <div style={{ padding: 20, background: "var(--fg)", color: "var(--bg)", borderRadius: 14, boxShadow: "var(--shadow-lg)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Inverted card</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>For pull-quotes & CTAs</div>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <span className="pl-chip"><SIIcon name="shield" size={11} /> SOC 2</span>
          <span className="pl-chip"><SIIcon name="globe" size={11} /> GDPR</span>
          <span className="pl-chip" style={{ background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid color-mix(in oklch, var(--accent) 30%, var(--line))" }}>New</span>
          <span className="pl-chip" style={{ background: "oklch(0.92 0.10 145)", color: "oklch(0.40 0.18 145)", border: "1px solid color-mix(in oklch, oklch(0.55 0.14 145) 30%, var(--line))" }}>Saved 68%</span>
        </div>
      </Section>

      {/* Tool catalog */}
      <Section id="tools" eyebrow="08 — Tool catalog" title="18 single-purpose tools">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {SI_TOOLS.map(tool => <SIToolCard key={tool.key} toolKey={tool.key} lang={lang} />)}
        </div>
      </Section>

      {/* i18n */}
      <Section id="i18n" eyebrow="09 — Internationalization" title="EN, TR, ES — and structured for more">
        <div className="pl-card" style={{ padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
            {[
              { code: "EN", name: "English",  count: "≈ 200 strings", status: "Source" },
              { code: "TR", name: "Türkçe",   count: "≈ 200 strings", status: "Hand-written" },
              { code: "ES", name: "Español",  count: "≈ 200 strings", status: "Hand-written" },
              { code: "—",  name: "More",     count: "ARB-ready",       status: "Wire next" },
            ].map(l => (
              <div key={l.code} style={{ padding: 16, borderRadius: 10, background: "var(--bg-muted)", border: "1px solid var(--line)" }}>
                <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--accent)", marginBottom: 8 }}>{l.code}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{l.name}</div>
                <div style={{ fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)", marginTop: 4 }}>{l.count}</div>
                <div style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 8 }}>{l.status}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, color: "var(--fg-muted)", lineHeight: 1.55, padding: "16px 0 0", borderTop: "1px solid var(--line)" }}>
            All strings are stored in a single dictionary keyed by language code. The `useI18n(lang)` hook returns a `t(key)` function used by every component. The shape mirrors Flutter's ARB format closely enough that exporting to <code style={{ background: "var(--bg-muted)", padding: "1px 6px", borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: 12 }}>app_en.arb</code> is a flat conversion when the team ports to Flutter.
          </div>
        </div>
      </Section>

      {/* Page inventory */}
      <Section id="pages" eyebrow="10 — Page inventory" title="What ships in the canvas">
        <div className="pl-card" style={{ padding: 0 }}>
          {[
            ["01", "Homepage", "Hero, trusted-by, tool grid, principles", "Desktop · Mobile"],
            ["02", "Tool · Compress", "Empty / uploading / processing / result", "Desktop · Mobile"],
            ["03", "Tool · Merge",   "Reorderable file list with running total", "Desktop"],
            ["04", "Tool · Split",   "Range mode + page-grid mode", "Desktop"],
            ["05", "Tool · Convert", "Format pickers, dropzone, options", "Desktop"],
            ["06", "Tools index",    "Search, category filter, FAQ", "Desktop · Mobile"],
            ["07", "Pricing",        "Free / Pro / Business · monthly/yearly", "Desktop · Mobile"],
            ["08", "Sign in / Register", "Split layout · SSO + email", "Desktop · Mobile"],
            ["09", "Dashboard",      "Recent files · saved actions · sidebar", "Desktop · Mobile · Empty"],
            ["10", "Blog index",     "Featured + magazine grid", "Desktop · Mobile"],
            ["11", "Blog · Article", "TOC · related tools · related posts", "Desktop · Mobile"],
            ["12", "Design system",  "This page", "Desktop"],
          ].map(([n, name, desc, surfaces], i) => (
            <div key={n} style={{
              display: "grid", gridTemplateColumns: "auto 1fr 2fr 1fr", gap: 16,
              padding: "16px 24px", borderTop: i === 0 ? "none" : "1px solid var(--line)",
              alignItems: "center", minWidth: 0,
            }}>
              <div style={{ fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{n}</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{name}</div>
              <div style={{ fontSize: 13, color: "var(--fg-muted)" }}>{desc}</div>
              <div style={{ fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)", textAlign: "right" }}>{surfaces}</div>
            </div>
          ))}
        </div>
      </Section>

      <SIFooter lang={lang} />
    </div>
  );
}

window.SystemInventoryPage = SystemInventoryPage;
