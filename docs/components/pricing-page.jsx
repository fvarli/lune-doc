// pricing-page.jsx — Free / Pro / Business with monthly/yearly toggle

const { useI18n: prUseI18n, Header: PRHeader, Footer: PRFooter, MobileBottomNav: PRBottomNav, Icon: PRIcon } = window;

function PricingPage({ lang = "en", setLang = () => {}, mobile = false }) {
  const { t } = prUseI18n(lang);
  const [billing, setBilling] = React.useState("yearly"); // monthly | yearly

  const tier = (id, price, sub, features, cta, popular = false) => ({ id, price, sub, features, cta, popular });

  const tiers = [
    tier("free",
      { monthly: 0, yearly: 0 },
      t("pricing_free_sub"),
      [t("pricing_free_f1"), t("pricing_free_f2"), t("pricing_free_f3"), t("pricing_free_f4")],
      t("pricing_cta_free"),
      false
    ),
    tier("pro",
      { monthly: 9, yearly: 7 },
      t("pricing_pro_sub"),
      [t("pricing_pro_f1"), t("pricing_pro_f2"), t("pricing_pro_f3"), t("pricing_pro_f4"), t("pricing_pro_f5"), t("pricing_pro_f6")],
      t("pricing_cta_pro"),
      true
    ),
    tier("biz",
      { monthly: 29, yearly: 24 },
      t("pricing_biz_sub"),
      [t("pricing_biz_f1"), t("pricing_biz_f2"), t("pricing_biz_f3"), t("pricing_biz_f4"), t("pricing_biz_f5"), t("pricing_biz_f6")],
      t("pricing_cta_biz"),
      false
    ),
  ];

  const BillingToggle = (
    <div style={{
      display: "inline-flex", alignItems: "center",
      background: "var(--bg-muted)", border: "1px solid var(--line)",
      borderRadius: 999, padding: 4, gap: 4,
    }}>
      {[["monthly", t("pricing_monthly")], ["yearly", t("pricing_yearly")]].map(([k, label]) => {
        const active = billing === k;
        return (
          <button key={k} onClick={() => setBilling(k)} style={{
            border: 0, background: active ? "var(--bg-elev)" : "transparent",
            color: active ? "var(--fg)" : "var(--fg-muted)",
            fontWeight: active ? 600 : 500, fontSize: 13,
            height: 32, padding: "0 14px",
            borderRadius: 999, cursor: "pointer",
            boxShadow: active ? "var(--shadow-sm)" : "none",
            display: "inline-flex", alignItems: "center", gap: 8,
            fontFamily: "inherit",
          }}>
            {label}
            {k === "yearly" && (
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: "var(--accent)",
                background: "var(--accent-soft)",
                padding: "2px 6px", borderRadius: 999,
                letterSpacing: "0.02em",
              }}>{t("pricing_save")}</span>
            )}
          </button>
        );
      })}
    </div>
  );

  const TierCard = ({ tier: T, idx }) => {
    const price = T.price[billing];
    const isPopular = T.popular;
    return (
      <div className="pl-card" style={{
        padding: 28,
        position: "relative",
        background: isPopular ? "var(--fg)" : "var(--bg-elev)",
        color: isPopular ? "var(--bg)" : "var(--fg)",
        border: isPopular ? "1px solid var(--fg)" : "1px solid var(--line)",
        boxShadow: isPopular ? "0 24px 48px -16px rgba(15,15,20,.24), 0 8px 16px -8px rgba(15,15,20,.14)" : "var(--shadow-sm)",
        display: "flex", flexDirection: "column", gap: 24,
        minWidth: 0,
      }}>
        {isPopular && (
          <div style={{
            position: "absolute", top: -12, left: 28,
            background: "var(--accent)", color: "var(--accent-fg)",
            fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
            padding: "5px 10px", borderRadius: 999,
          }}>{t("pricing_popular")}</div>
        )}

        <div>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" }}>{t("pricing_" + T.id)}</div>
          <div style={{ marginTop: 4, fontSize: 13, color: isPopular ? "color-mix(in oklch, var(--bg), transparent 30%)" : "var(--fg-muted)" }}>{T.sub}</div>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, opacity: 0.7, alignSelf: "flex-start", marginTop: 6 }}>$</span>
          <span style={{ fontSize: 56, fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1 }}>{price}</span>
          <span style={{ fontSize: 14, color: isPopular ? "color-mix(in oklch, var(--bg), transparent 30%)" : "var(--fg-muted)", marginLeft: 4 }}>
            {price === 0 ? "" : t("pricing_per_month")}
          </span>
        </div>
        {price > 0 && billing === "yearly" && (
          <div style={{ marginTop: -16, fontSize: 12, color: isPopular ? "color-mix(in oklch, var(--bg), transparent 30%)" : "var(--fg-subtle)" }}>
            ${price * 12} {t("pricing_billed_yearly")}
          </div>
        )}

        <button className={isPopular ? "pl-btn pl-btn-lg" : "pl-btn pl-btn-ghost pl-btn-lg"} style={{
          width: "100%",
          background: isPopular ? "var(--accent)" : "transparent",
          color: isPopular ? "var(--accent-fg)" : "var(--fg)",
          borderColor: isPopular ? "var(--accent)" : "var(--line-strong)",
        }}>{T.cta}</button>

        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
          {T.features.map((f) => (
            <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, lineHeight: 1.5, minWidth: 0 }}>
              <span style={{
                width: 18, height: 18, borderRadius: 999, flexShrink: 0, marginTop: 2,
                display: "grid", placeItems: "center",
                background: isPopular ? "color-mix(in oklch, var(--bg), transparent 80%)" : "var(--accent-soft)",
                color: isPopular ? "var(--bg)" : "var(--accent)",
              }}><PRIcon name="check" size={11} /></span>
              <span style={{ minWidth: 0, color: isPopular ? "color-mix(in oklch, var(--bg), transparent 10%)" : "var(--fg)" }}>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  if (mobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "var(--bg)" }}>
        <PRHeader lang={lang} setLang={setLang} mobile active="pricing" />
        <div style={{ padding: "20px 16px 8px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{t("pricing_eyebrow")}</div>
          <h1 style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.025em" }}>{t("pricing_title")}</h1>
          <p style={{ marginTop: 10, color: "var(--fg-muted)", fontSize: 14, lineHeight: 1.55 }}>{t("pricing_sub")}</p>
          <div style={{ marginTop: 16 }}>{BillingToggle}</div>
        </div>
        <div style={{ padding: "16px", display: "grid", gap: 16 }}>
          {tiers.map((T, i) => <TierCard key={T.id} tier={T} idx={i} />)}
        </div>
        <div style={{ flex: 1 }} />
        <PRBottomNav active="account" lang={lang} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "var(--bg)" }}>
      <PRHeader lang={lang} setLang={setLang} active="pricing" />

      <section style={{ padding: "72px 28px 32px", borderBottom: "1px solid var(--line)", textAlign: "center" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>{t("pricing_eyebrow")}</div>
          <h1 style={{ fontSize: 56, fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.035em" }}>{t("pricing_title")}</h1>
          <p style={{ marginTop: 18, color: "var(--fg-muted)", fontSize: 18, lineHeight: 1.5 }}>{t("pricing_sub")}</p>
          <div style={{ marginTop: 28 }}>{BillingToggle}</div>
        </div>
      </section>

      <section style={{ padding: "56px 28px 64px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, alignItems: "start" }}>
          {tiers.map((T, i) => <TierCard key={T.id} tier={T} idx={i} />)}
        </div>
      </section>

      {/* Comparison strip */}
      <section style={{ padding: "48px 28px 80px", borderTop: "1px solid var(--line)", background: "var(--bg-muted)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
            {[
              { icon: "shield",  title: t("pricing_cmp1_t"), body: t("pricing_cmp1_b") },
              { icon: "clock",   title: t("pricing_cmp2_t"), body: t("pricing_cmp2_b") },
              { icon: "globe",   title: t("pricing_cmp3_t"), body: t("pricing_cmp3_b") },
              { icon: "sparkle", title: t("pricing_cmp4_t"), body: t("pricing_cmp4_b") },
            ].map(item => (
              <div key={item.title} style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-elev)", border: "1px solid var(--line)", display: "grid", placeItems: "center", color: "var(--accent)" }}>
                  <PRIcon name={item.icon} size={16} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: "var(--fg-muted)", lineHeight: 1.5 }}>{item.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PRFooter lang={lang} />
    </div>
  );
}

window.PricingPage = PricingPage;
