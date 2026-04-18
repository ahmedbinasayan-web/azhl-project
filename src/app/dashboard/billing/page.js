"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const C = {
  navy: "#0C1B33", navyMid: "#1A2D4A", teal: "#0A8F7F", tealLight: "#12C4AD",
  cream: "#FAFAF7", warm: "#F5F3EE", border: "#E0DDD5",
  gray: "#4A4A45", light: "#8A8A82", error: "#D35E5E", white: "#FFF",
};

const font = {
  serif: "'Instrument Serif', serif",
  sans: "'Syne', -apple-system, sans-serif",
  ar: "'Noto Kufi Arabic', sans-serif",
};

const PLAN_DETAILS = {
  starter: { name: "Starter", price: "AED 199/mo", color: C.teal, desc: "WhatsApp AI replies" },
  growth:  { name: "Growth",  price: "AED 399/mo", color: "#6C63FF", desc: "Social posts + Follow-ups" },
  pro:     { name: "Pro",     price: "AED 699/mo", color: C.navy,   desc: "Ads + Reviews + Analytics" },
  trial:   { name: "Trial",   price: "Free",        color: C.light,  desc: "Limited access" },
};

const STATUS_STYLE = {
  active:    { bg: "rgba(10,143,127,0.08)", color: "#0A8F7F",  label: "Active" },
  trial:     { bg: "rgba(232,168,56,0.10)", color: "#E8A838",  label: "Trial" },
  cancelled: { bg: "rgba(211,94,94,0.08)", color: "#D35E5E",  label: "Cancelled" },
  past_due:  { bg: "rgba(211,94,94,0.08)", color: "#D35E5E",  label: "Past Due" },
};

function Skel({ h = 20, w = "100%" }) {
  return (
    <div style={{
      height: h, width: w, background: C.border, borderRadius: 8,
      animation: "pulse 1.5s infinite",
    }} />
  );
}

export default function BillingPage() {
  const router = useRouter();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const { data: biz } = await supabase
        .from("businesses")
        .select("id, name, plan, plan_status, stripe_customer_id, stripe_subscription_id")
        .eq("owner_id", session.user.id)
        .single();
      if (biz) setBusiness(biz);
      setLoading(false);
    }
    init();
  }, []);

  async function handleManage() {
    if (!business) return;
    setPortalLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
    } finally {
      setPortalLoading(false);
    }
  }

  const plan = business?.plan || "starter";
  const status = business?.plan_status || "trial";
  const planInfo = PLAN_DETAILS[plan] || PLAN_DETAILS.starter;
  const statusInfo = STATUS_STYLE[status] || STATUS_STYLE.trial;
  const hasStripe = !!business?.stripe_customer_id;

  return (
    <div style={{
      minHeight: "100vh", background: C.cream, fontFamily: font.sans, color: C.navy,
    }}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>

      {/* Top nav */}
      <div style={{
        background: C.white, borderBottom: `1px solid ${C.border}`,
        padding: "0 32px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div
          onClick={() => router.push("/dashboard")}
          style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: 8, background: C.navy,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 14, color: C.white, fontFamily: font.ar,
          }}>أ</div>
          <span style={{ fontFamily: font.serif, fontSize: 18, color: C.navy }}>Azhl</span>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8,
            padding: "6px 16px", color: C.gray, fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: font.sans,
          }}
        >
          ← Back to Dashboard
        </button>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontFamily: font.serif, fontSize: 34, fontWeight: 400, marginBottom: 8 }}>
          Billing & Subscription
        </h1>
        <p style={{ fontSize: 14, color: C.light, marginBottom: 40 }}>
          Manage your Azhl plan and payment details.
        </p>

        {error && (
          <div style={{
            background: "rgba(211,94,94,0.06)", border: `1px solid rgba(211,94,94,0.2)`,
            borderRadius: 12, padding: "14px 20px", color: C.error,
            fontSize: 14, marginBottom: 24,
          }}>{error}</div>
        )}

        {/* Current Plan Card */}
        <div style={{
          background: C.white, border: `1px solid ${C.border}`, borderRadius: 20,
          padding: "32px 36px", marginBottom: 24,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.light, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 20 }}>
            Current Plan
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Skel h={32} w="40%" />
              <Skel h={20} w="60%" />
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <span style={{
                    fontFamily: font.serif, fontSize: 32, color: C.navy,
                  }}>{planInfo.name}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 100,
                    background: statusInfo.bg, color: statusInfo.color,
                  }}>{statusInfo.label}</span>
                </div>
                <div style={{ fontSize: 14, color: C.light, marginBottom: 4 }}>{planInfo.desc}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: planInfo.color }}>{planInfo.price}</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 180 }}>
                {hasStripe ? (
                  <button
                    onClick={handleManage}
                    disabled={portalLoading}
                    style={{
                      background: C.navy, color: C.white, border: "none",
                      borderRadius: 12, padding: "12px 24px", fontFamily: font.sans,
                      fontWeight: 700, fontSize: 14, cursor: portalLoading ? "not-allowed" : "pointer",
                      opacity: portalLoading ? 0.7 : 1,
                    }}
                  >
                    {portalLoading ? "Loading…" : "Manage Subscription →"}
                  </button>
                ) : (
                  <button
                    onClick={() => router.push("/pricing")}
                    style={{
                      background: C.tealLight, color: C.white, border: "none",
                      borderRadius: 12, padding: "12px 24px", fontFamily: font.sans,
                      fontWeight: 700, fontSize: 14, cursor: "pointer",
                    }}
                  >
                    Upgrade Plan →
                  </button>
                )}

                {plan !== "pro" && (
                  <button
                    onClick={() => router.push("/pricing")}
                    style={{
                      background: "transparent", color: C.teal,
                      border: `1px solid rgba(10,143,127,0.25)`,
                      borderRadius: 12, padding: "12px 24px", fontFamily: font.sans,
                      fontWeight: 700, fontSize: 14, cursor: "pointer",
                    }}
                  >
                    View All Plans
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Plan Features */}
        {!loading && (
          <div style={{
            background: C.white, border: `1px solid ${C.border}`, borderRadius: 20,
            padding: "28px 36px", marginBottom: 24,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.light, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 20 }}>
              What's included
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "WhatsApp AI Replies",     available: true },
                { label: "Social Media Posts",       available: ["growth", "pro"].includes(plan) },
                { label: "Automated Follow-ups",     available: ["growth", "pro"].includes(plan) },
                { label: "Meta Ads Management",      available: plan === "pro" },
                { label: "Google Reviews Automation", available: plan === "pro" },
                { label: "Full Analytics Dashboard", available: plan === "pro" },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    fontSize: 14,
                    color: f.available ? C.teal : C.border,
                  }}>
                    {f.available ? "✓" : "✕"}
                  </span>
                  <span style={{ fontSize: 14, color: f.available ? C.gray : C.light }}>
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subscription info */}
        {!loading && business?.stripe_subscription_id && (
          <div style={{
            background: C.warm, border: `1px solid ${C.border}`, borderRadius: 16,
            padding: "20px 28px",
          }}>
            <div style={{ fontSize: 12, color: C.light }}>
              Subscription ID: <span style={{ fontFamily: "monospace", fontSize: 12, color: C.gray }}>{business.stripe_subscription_id}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
