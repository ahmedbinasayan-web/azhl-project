"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const C = {
  navy: "#0C1B33",
  teal: "#0A8F7F",
  tealLight: "#12C4AD",
  cream: "#FAFAF7",
  warm: "#F5F3EE",
  border: "#E0DDD5",
  gray: "#4A4A45",
  light: "#8A8A82",
  error: "#D35E5E",
  white: "#FFFFFF",
};

const inputStyle = {
  width: "100%",
  background: C.warm,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: "12px 16px",
  fontSize: 14,
  color: C.gray,
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: C.light,
  marginBottom: 6,
  letterSpacing: "0.04em",
};

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12, background: C.navy, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, color: "#FFF", fontFamily: "'Noto Kufi Arabic', sans-serif", fontWeight: 700,
      }}>أ</div>
      <div>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: C.navy, lineHeight: 1.1 }}>Azhl</div>
        <div style={{ fontSize: 11, color: C.teal, fontWeight: 600 }}>أزهل</div>
      </div>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: C.light, marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

function RadioOption({ label, value, selected, onChange }) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
      border: `1px solid ${selected ? C.teal : C.border}`,
      borderRadius: 10, cursor: "pointer",
      background: selected ? "rgba(10,143,127,0.05)" : C.warm,
      transition: "all 0.15s",
    }}>
      <input
        type="radio"
        value={value}
        checked={selected}
        onChange={() => onChange(value)}
        style={{ accentColor: C.teal }}
      />
      <span style={{ fontSize: 14, color: selected ? C.teal : C.gray, fontWeight: selected ? 700 : 500 }}>{label}</span>
    </label>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState(null);
  const [businessId, setBusinessId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [data, setData] = useState({
    businessName: "",
    description: "",
    hours: "",
    instagram: "",
    services: "",
    language: "both",
    tone: "friendly",
    phone: "",
  });

  useEffect(() => {
    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setUserId(session.user.id);

      const { data: biz } = await supabase
        .from("businesses")
        .select("id, name, phone")
        .eq("owner_id", session.user.id)
        .single();

      if (biz) {
        setBusinessId(biz.id);
        setData((prev) => ({
          ...prev,
          businessName: biz.name || "",
          phone: biz.phone || "",
        }));
      }
    }
    loadSession();
  }, [router]);

  function set(field, value) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  async function saveStep(nextStep) {
    if (!businessId) return;
    setLoading(true);
    const updateData = {};
    if (step === 1) {
      updateData.name = data.businessName;
      updateData.description = data.description;
      updateData.hours = data.hours;
      updateData.instagram = data.instagram;
    } else if (step === 2) {
      updateData.services = data.services;
      updateData.language = data.language;
      updateData.tone = data.tone;
    }
    await supabase.from("businesses").update(updateData).eq("id", businessId);
    setLoading(false);
    setStep(nextStep);
  }

  async function finishOnboarding() {
    if (!businessId) return;
    setLoading(true);
    await supabase.from("businesses").update({
      name: data.businessName,
      description: data.description,
      hours: data.hours,
      instagram: data.instagram,
      services: data.services,
      language: data.language,
      tone: data.tone,
      onboarding_complete: true,
    }).eq("id", businessId);
    setLoading(false);
    router.push("/dashboard");
  }

  function copyPhone() {
    if (data.phone) {
      navigator.clipboard.writeText(data.phone).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  const steps = ["Business Info", "Services & AI", "Connect WhatsApp"];

  return (
    <div style={{
      minHeight: "100vh", background: C.cream, display: "flex",
      alignItems: "flex-start", justifyContent: "center", padding: "40px 16px",
    }}>
      <div style={{
        width: "100%", maxWidth: 520, background: C.white,
        border: `1px solid ${C.border}`, borderRadius: 16,
        padding: "36px 36px",
      }}>
        <Logo />

        {/* Progress */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            {steps.map((label, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700,
                  background: i + 1 < step ? C.teal : i + 1 === step ? C.navy : C.warm,
                  color: i + 1 <= step ? "#FFF" : C.light,
                  border: i + 1 > step ? `1px solid ${C.border}` : "none",
                }}>
                  {i + 1 < step ? "✓" : i + 1}
                </div>
                <span style={{
                  fontSize: 12, fontWeight: i + 1 === step ? 700 : 500,
                  color: i + 1 === step ? C.navy : C.light,
                }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div style={{ height: 4, background: C.warm, borderRadius: 4 }}>
            <div style={{
              height: "100%", borderRadius: 4, background: C.teal,
              width: `${((step - 1) / (steps.length - 1)) * 100}%`,
              transition: "width 0.4s",
            }} />
          </div>
        </div>

        <p style={{ fontSize: 12, color: C.light, marginBottom: 4 }}>Step {step} of {steps.length}</p>

        {/* Step 1 — Business Info */}
        {step === 1 && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.navy, marginBottom: 4 }}>Tell us about your business</h2>
            <p style={{ fontSize: 13, color: C.light, marginBottom: 24 }}>This helps your AI give accurate, personalized replies</p>

            <Field label="Business Name">
              <input
                type="text"
                value={data.businessName}
                onChange={(e) => set("businessName", e.target.value)}
                style={inputStyle}
                placeholder="Lina Beauty Salon"
              />
            </Field>

            <Field label="Business Description" hint="Describe what your business does in 1–2 sentences">
              <textarea
                rows={3}
                value={data.description}
                onChange={(e) => set("description", e.target.value)}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                placeholder="We are a premium ladies' salon in JBR, Dubai, specializing in keratin treatments, hair coloring, and nail care..."
              />
            </Field>

            <Field label="Opening Hours">
              <input
                type="text"
                value={data.hours}
                onChange={(e) => set("hours", e.target.value)}
                style={inputStyle}
                placeholder="Sat–Thu 10AM–9PM, Fri 2PM–9PM"
              />
            </Field>

            <Field label="Instagram Handle (optional)">
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                  fontSize: 14, color: C.light,
                }}>@</span>
                <input
                  type="text"
                  value={data.instagram}
                  onChange={(e) => set("instagram", e.target.value.replace(/^@/, ""))}
                  style={{ ...inputStyle, paddingLeft: 30 }}
                  placeholder="linasalon.dubai"
                />
              </div>
            </Field>

            <button
              onClick={() => saveStep(2)}
              disabled={loading}
              style={{
                width: "100%", background: loading ? C.light : C.navy, color: "#FFF",
                border: "none", borderRadius: 10, padding: "14px", fontWeight: 700,
                fontSize: 15, minHeight: 48, cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit", marginTop: 8,
              }}
            >
              {loading ? "Saving..." : "Continue →"}
            </button>
          </>
        )}

        {/* Step 2 — Services & AI */}
        {step === 2 && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.navy, marginBottom: 4 }}>Services & AI setup</h2>
            <p style={{ fontSize: 13, color: C.light, marginBottom: 24 }}>Your AI will use this to answer customer questions automatically</p>

            <Field
              label="Services & Prices"
              hint="List your services and prices. The AI reads this to answer price questions."
            >
              <textarea
                rows={5}
                value={data.services}
                onChange={(e) => set("services", e.target.value)}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }}
                placeholder={"Haircut: AED 80–150\nKeratin: AED 350–600\nHair Color: AED 250–450\nBlowout: AED 80\nManicure: AED 60"}
              />
            </Field>

            <Field label="Language Preference">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { value: "arabic", label: "Arabic only · عربي فقط" },
                  { value: "english", label: "English only" },
                  { value: "both", label: "Arabic + English (recommended)" },
                ].map((opt) => (
                  <RadioOption
                    key={opt.value}
                    value={opt.value}
                    label={opt.label}
                    selected={data.language === opt.value}
                    onChange={(v) => set("language", v)}
                  />
                ))}
              </div>
            </Field>

            <Field label="AI Tone">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { value: "friendly", label: "Friendly 🌸 — warm, emoji-friendly, approachable" },
                  { value: "professional", label: "Professional 💼 — formal, concise, business-like" },
                  { value: "casual", label: "Casual 😊 — relaxed, conversational, local feel" },
                ].map((opt) => (
                  <RadioOption
                    key={opt.value}
                    value={opt.value}
                    label={opt.label}
                    selected={data.tone === opt.value}
                    onChange={(v) => set("tone", v)}
                  />
                ))}
              </div>
            </Field>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: "0 0 auto", background: C.warm, color: C.gray,
                  border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 20px",
                  fontWeight: 700, fontSize: 14, minHeight: 48, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                ← Back
              </button>
              <button
                onClick={() => saveStep(3)}
                disabled={loading}
                style={{
                  flex: 1, background: loading ? C.light : C.navy, color: "#FFF",
                  border: "none", borderRadius: 10, padding: "14px", fontWeight: 700,
                  fontSize: 15, minHeight: 48, cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {loading ? "Saving..." : "Continue →"}
              </button>
            </div>
          </>
        )}

        {/* Step 3 — Connect WhatsApp */}
        {step === 3 && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.navy, marginBottom: 4 }}>Connect WhatsApp</h2>
            <p style={{ fontSize: 13, color: C.light, marginBottom: 20 }}>
              Your AI will receive and reply to messages via 360dialog.io — follow these steps to activate it.
            </p>

            <div style={{
              background: C.warm, border: `1px solid ${C.border}`, borderRadius: 14,
              padding: "20px 22px", marginBottom: 16,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.light, marginBottom: 8, letterSpacing: "0.04em" }}>
                YOUR WHATSAPP NUMBER
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  flex: 1, fontSize: 22, fontWeight: 700, color: C.navy,
                  fontFamily: "'Instrument Serif', serif", letterSpacing: "0.02em",
                }}>
                  {data.phone || "+971 — not set"}
                </div>
                <button
                  onClick={copyPhone}
                  disabled={!data.phone}
                  style={{
                    background: copied ? "rgba(10,143,127,0.1)" : C.white,
                    border: `1px solid ${copied ? C.teal : C.border}`,
                    borderRadius: 8, padding: "8px 14px", cursor: data.phone ? "pointer" : "not-allowed",
                    color: copied ? C.teal : C.gray, fontSize: 12, fontWeight: 700, fontFamily: "inherit",
                    transition: "all 0.15s", whiteSpace: "nowrap",
                  }}
                >
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
            </div>

            <div style={{
              background: "rgba(10,143,127,0.04)", border: `1px solid rgba(10,143,127,0.15)`,
              borderRadius: 12, padding: "16px 18px", marginBottom: 20,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.teal, marginBottom: 12 }}>
                Setup instructions — 9 steps
              </div>
              {[
                { n: 1, text: "Go to 360dialog.io and click \"Get Started\"" },
                { n: 2, text: "Register your business WhatsApp number shown above" },
                { n: 3, text: "Wait for number approval (usually 24–48 hours)" },
                { n: 4, text: "Once approved, go to your 360dialog dashboard" },
                { n: 5, text: "Copy your API Key from the dashboard" },
                { n: 6, text: "Go to Azhl Settings → WhatsApp Connection → paste your API key" },
                { n: 7, text: `In 360dialog, set the Webhook URL to: ${typeof window !== "undefined" ? window.location.origin : "https://your-app.com"}/api/whatsapp` },
                { n: 8, text: "Set the Verify Token to: azhl-verify-2026" },
                { n: 9, text: "Done — your AI will now reply to customers automatically!" },
              ].map((item) => (
                <div key={item.n} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: item.n < 9 ? 10 : 0 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", background: C.teal,
                    color: "#FFF", fontSize: 10, fontWeight: 700, display: "flex",
                    alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
                  }}>{item.n}</div>
                  <span style={{ fontSize: 12, color: C.gray, lineHeight: 1.5 }}>{item.text}</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, color: C.light, marginBottom: 24, lineHeight: 1.5 }}>
              You can skip this for now and set up WhatsApp later from your dashboard settings.
              Your AI dashboard will still be fully accessible.
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  flex: "0 0 auto", background: C.warm, color: C.gray,
                  border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 20px",
                  fontWeight: 700, fontSize: 14, minHeight: 48, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                ← Back
              </button>
              <button
                onClick={finishOnboarding}
                disabled={loading}
                style={{
                  flex: 1, background: loading ? C.light : C.navy, color: "#FFF",
                  border: "none", borderRadius: 10, padding: "14px", fontWeight: 700,
                  fontSize: 15, minHeight: 48, cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {loading ? "Setting up..." : "Go to Dashboard →"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
