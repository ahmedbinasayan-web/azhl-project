"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const C = {
  navy: "#0C1B33", teal: "#0A8F7F", tealLight: "#12C4AD",
  cream: "#FAFAF7", warm: "#F5F3EE", border: "#E0DDD5",
  gray: "#4A4A45", light: "#8A8A82", error: "#D35E5E", white: "#FFF",
};

const font = {
  serif: "'Instrument Serif', serif",
  sans: "'Syne', -apple-system, sans-serif",
};

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "AED 199",
    period: "/mo",
    tagline: "Perfect for small businesses getting started",
    features: [
      "WhatsApp AI replies",
      "Up to 500 messages/month",
      "Customer conversation history",
      "Basic analytics",
    ],
    cta: "Choose Starter",
    highlight: false,
  },
  {
    id: "growth",
    name: "Growth",
    price: "AED 399",
    period: "/mo",
    tagline: "For growing businesses that need more reach",
    features: [
      "Everything in Starter",
      "AI social media posts",
      "Automated follow-ups",
      "Weekly content calendar",
      "Priority support",
    ],
    cta: "Choose Growth",
    highlight: true,
    badge: "Most Popular",
  },
  {
    id: "pro",
    name: "Pro",
    price: "AED 699",
    period: "/mo",
    tagline: "Full automation for established businesses",
    features: [
      "Everything in Growth",
      "Meta Ads management",
      "Google Reviews automation",
      "Full analytics dashboard",
      "Dedicated account manager",
    ],
    cta: "Choose Pro",
    highlight: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [businessId, setBusinessId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", session.user.id)
        .single();
      if (biz) setBusinessId(biz.id);
      setLoading(false);
    }
    init();
  }, []);

  async function handleChoosePlan(planId) {
    if (!businessId) return;
    setLoadingPlan(planId);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, businessId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create checkout session");
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "No checkout URL returned");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: C.cream, fontFamily: font.sans,
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "60px 24px",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 56, maxWidth: 560 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          marginBottom: 24, cursor: "pointer",
        }} onClick={() => router.push("/dashboard")}>
          <div style={{
            width: 34, height: 34, borderRadius: 8, background: C.navy,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 16, color: C.white,
          }}>أ</div>
          <span style={{ fontFamily: font.serif, fontSize: 20, color: C.navy }}>Azhl</span>
        </div>
        <h1 style={{
          fontFamily: font.serif, fontSize: 42, color: C.navy,
          fontWeight: 400, marginBottom: 16, lineHeight: 1.2,
        }}>
          Simple, transparent pricing
        </h1>
        <p style={{ fontSize: 16, color: C.light, lineHeight: 1.6 }}>
          Choose the plan that fits your business. All plans include our core WhatsApp AI engine.
        </p>
      </div>

      {error && (
        <div style={{
          background: "rgba(211,94,94,0.06)", border: `1px solid rgba(211,94,94,0.2)`,
          borderRadius: 12, padding: "14px 24px", color: C.error,
          fontSize: 14, marginBottom: 32, maxWidth: 520, textAlign: "center",
        }}>
          {error}
        </div>
      )}

      {/* Plans */}
      <div style={{
        display: "flex", gap: 20, maxWidth: 1000, width: "100%",
        flexWrap: "wrap", justifyContent: "center",
      }}>
        {PLANS.map(plan => (
          <div
            key={plan.id}
            style={{
              flex: "1 1 280px", maxWidth: 320,
              background: plan.highlight ? C.navy : C.white,
              border: `1px solid ${plan.highlight ? C.navy : C.border}`,
              borderRadius: 20, padding: "32px 28px",
              display: "flex", flexDirection: "column",
              position: "relative", boxShadow: plan.highlight
                ? "0 16px 48px rgba(12,27,51,0.18)"
                : "0 2px 12px rgba(12,27,51,0.04)",
            }}
          >
            {plan.badge && (
              <div style={{
                position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                background: C.tealLight, color: C.white, fontSize: 11, fontWeight: 700,
                letterSpacing: "0.06em", padding: "4px 16px", borderRadius: 100,
                whiteSpace: "nowrap",
              }}>{plan.badge}</div>
            )}

            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 13, fontWeight: 700, letterSpacing: "0.06em",
                color: plan.highlight ? "rgba(255,255,255,0.5)" : C.light,
                textTransform: "uppercase", marginBottom: 8,
              }}>{plan.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{
                  fontFamily: font.serif, fontSize: 40,
                  color: plan.highlight ? C.white : C.navy, lineHeight: 1,
                }}>{plan.price}</span>
                <span style={{
                  fontSize: 14, color: plan.highlight ? "rgba(255,255,255,0.5)" : C.light,
                }}>{plan.period}</span>
              </div>
              <p style={{
                fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.65)" : C.light,
                marginTop: 8, lineHeight: 1.5,
              }}>{plan.tagline}</p>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
              {plan.features.map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ color: C.tealLight, fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{
                    fontSize: 14, lineHeight: 1.5,
                    color: plan.highlight ? "rgba(255,255,255,0.85)" : C.gray,
                  }}>{f}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleChoosePlan(plan.id)}
              disabled={loading || loadingPlan !== null}
              style={{
                background: plan.highlight ? C.tealLight : C.navy,
                color: C.white, border: "none", borderRadius: 12,
                padding: "14px 24px", fontFamily: font.sans, fontWeight: 700,
                fontSize: 15, cursor: loading || loadingPlan !== null ? "not-allowed" : "pointer",
                opacity: loading || (loadingPlan !== null && loadingPlan !== plan.id) ? 0.6 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {loadingPlan === plan.id ? "Loading…" : plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p style={{ fontSize: 13, color: C.light, marginTop: 48, textAlign: "center" }}>
        All prices in AED. Cancel anytime. Questions?{" "}
        <a href="mailto:hello@azhl.ai" style={{ color: C.teal, textDecoration: "none" }}>
          hello@azhl.ai
        </a>
      </p>
    </div>
  );
}
