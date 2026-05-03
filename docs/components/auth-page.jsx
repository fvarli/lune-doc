// auth-page.jsx — Split login/register

const { useI18n, Logo, Icon, LangSwitch } = window;

function AuthPage({ lang, setLang, mobile = false, mode: initialMode = "signin" }) {
  const { t } = useI18n(lang);
  const [mode, setMode] = React.useState(initialMode);
  React.useEffect(() => setMode(initialMode), [initialMode]);
  const isSignup = mode === "register";

  if (mobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "var(--bg)" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
          <Logo size={15} />
          <LangSwitch lang={lang} setLang={setLang} compact />
        </header>
        <div style={{ padding: "32px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <AuthForm lang={lang} mode={mode} setMode={setMode} mobile />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 1fr)", minHeight: "100%", background: "var(--bg)" }}>
      {/* Left — form */}
      <div style={{ padding: "32px 56px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Logo size={16} />
          <LangSwitch lang={lang} setLang={setLang} />
        </div>
        <div style={{ flex: 1, display: "grid", placeItems: "center", padding: "32px 0" }}>
          <div style={{ width: "100%", maxWidth: 380 }}>
            <AuthForm lang={lang} mode={mode} setMode={setMode} />
          </div>
        </div>
        <div style={{ fontSize: 12, color: "var(--fg-subtle)" }}>{t("foot_copy")}</div>
      </div>

      {/* Right — visual / quote (the bold moment) */}
      <div style={{
        background: "linear-gradient(180deg, oklch(0.97 0.04 var(--accent-h)) 0%, oklch(0.93 0.06 var(--accent-h)) 100%)",
        borderLeft: "1px solid var(--line)",
        position: "relative", overflow: "hidden",
        padding: "48px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
      }}>
        {/* Floating documents */}
        <FloatingDocs />
        <div />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 460 }}>
          <Icon name="sparkle" size={20} stroke="var(--accent)" />
          <p style={{ marginTop: 14, fontSize: 22, fontWeight: 500, lineHeight: 1.35, letterSpacing: "-0.015em", textWrap: "balance", color: "var(--fg)" }}>
            {t("auth_quote")}
          </p>
          <div style={{ marginTop: 16, fontSize: 13, color: "var(--fg-muted)" }}>{t("auth_quote_author")}</div>
        </div>
      </div>
    </div>
  );
}

function FloatingDocs() {
  // Three stacked PDF cards, layered with rotation
  const cards = [
    { x: 36,  y: 24,  rot: -8, w: 220, h: 280, opacity: 0.55 },
    { x: 130, y: 80,  rot: 4,  w: 240, h: 300, opacity: 0.85 },
    { x: 250, y: 40,  rot: 10, w: 200, h: 260, opacity: 0.7 },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {/* dotted grid */}
      <div className="pl-grid-dots" style={{ position: "absolute", inset: 0, opacity: 0.6 }} />
      {cards.map((c, i) => (
        <div key={i} style={{
          position: "absolute", left: c.x, top: c.y,
          width: c.w, height: c.h,
          background: "var(--bg-elev)", border: "1px solid var(--line)",
          borderRadius: 14, boxShadow: "var(--shadow-lg)",
          transform: `rotate(${c.rot}deg)`,
          opacity: c.opacity,
          padding: 18,
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          <div style={{ height: 8, width: "55%", borderRadius: 4, background: "var(--bg-sunken)" }} />
          <div style={{ height: 4, width: "85%", borderRadius: 2, background: "var(--bg-sunken)" }} />
          <div style={{ height: 4, width: "75%", borderRadius: 2, background: "var(--bg-sunken)" }} />
          <div style={{ height: 4, width: "92%", borderRadius: 2, background: "var(--bg-sunken)" }} />
          <div style={{ height: 4, width: "60%", borderRadius: 2, background: "var(--bg-sunken)" }} />
          <div style={{ marginTop: "auto", display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: "var(--accent-soft)", display: "grid", placeItems: "center", color: "var(--accent)" }}>
              <Icon name="doc" size={12} />
            </div>
            <div style={{ height: 4, width: 60, borderRadius: 2, background: "var(--bg-sunken)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function AuthForm({ lang, mode, setMode, mobile = false }) {
  const { t } = useI18n(lang);
  const isSignup = mode === "register";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: mobile ? 24 : 28, fontWeight: 600, letterSpacing: "-0.02em" }}>
          {isSignup ? t("auth_register_title") : t("auth_signin_title")}
        </h1>
        <p style={{ marginTop: 6, fontSize: 14, color: "var(--fg-muted)", textWrap: "pretty" }}>
          {isSignup ? t("auth_register_sub") : t("auth_signin_sub")}
        </p>
      </div>

      {/* SSO */}
      <div style={{ display: "grid", gap: 8 }}>
        <button className="pl-btn pl-btn-ghost pl-btn-lg" style={{ justifyContent: "center" }}>
          <Icon name="google" size={16} />
          {t("auth_with_google")}
        </button>
        <button className="pl-btn pl-btn-ghost pl-btn-lg" style={{ justifyContent: "center" }}>
          <Icon name="apple" size={16} />
          {t("auth_with_apple")}
        </button>
      </div>

      {/* divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--fg-subtle)", fontSize: 12 }}>
        <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
        <span style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("auth_or")}</span>
        <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
      </div>

      {/* Form fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {isSignup && (
          <div>
            <label className="pl-label">{t("auth_name")}</label>
            <input className="pl-input" placeholder="Mira Holst" />
          </div>
        )}
        <div>
          <label className="pl-label">{t("auth_email")}</label>
          <input className="pl-input" type="email" placeholder="you@company.com" />
        </div>
        <div>
          <label className="pl-label">{t("auth_password")}</label>
          <input className="pl-input" type="password" placeholder="••••••••" />
        </div>
      </div>

      <button className="pl-btn pl-btn-primary pl-btn-lg" style={{ width: "100%" }}>
        {t("auth_continue")}
        <Icon name="arrow-right" size={14} />
      </button>

      <div style={{ fontSize: 13, color: "var(--fg-muted)", textAlign: "center" }}>
        {isSignup ? t("auth_have_account") : t("auth_no_account")}{" "}
        <a onClick={() => setMode(isSignup ? "signin" : "register")} style={{ color: "var(--accent)", fontWeight: 600, cursor: "pointer" }}>
          {isSignup ? t("auth_signin_link") : t("auth_create")}
        </a>
      </div>
    </div>
  );
}

Object.assign(window, { AuthPage });
