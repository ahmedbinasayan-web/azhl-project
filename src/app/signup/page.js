"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
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

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      {children}
      {error && <div style={{ fontSize: 12, color: C.error, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

function getPasswordStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

function PasswordStrength({ password }) {
  const score = getPasswordStrength(password);
  if (!password) return null;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", C.error, "#E8A838", "#6A9BCC", C.teal];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 4,
            background: i <= score ? colors[score] : C.border,
            transition: "background 0.2s",
          }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: colors[score], fontWeight: 600 }}>{labels[score]}</div>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    businessName: "",
    businessType: "",
    city: "",
    phone: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validate() {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Password must be at least 8 characters";
    if (!form.businessName.trim()) e.businessName = "Business name is required";
    if (!form.businessType) e.businessType = "Select a business type";
    if (!form.city) e.city = "Select a city";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) { setErrors(e2); return; }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.fullName } },
    });

    if (error) {
      setErrors({ submit: error.message });
      setLoading(false);
      return;
    }

    const phone = form.phone ? `+971${form.phone.replace(/^\+971/, "").replace(/^0/, "")}` : "";

    // Use server-side API route (service role key) to bypass RLS on INSERT
    const accessToken = data.session?.access_token;
    const res = await fetch("/api/businesses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: form.businessName,
        type: form.businessType,
        location: form.city,
        phone,
      }),
    });

    if (!res.ok) {
      const json = await res.json();
      setErrors({ submit: json.error || "Failed to create business. Please try again." });
      setLoading(false);
      return;
    }

    router.push("/onboarding");
  }

  function getInputStyle(field) {
    return {
      ...inputStyle,
      borderColor: errors[field] ? C.error : focusedField === field ? C.teal : C.border,
    };
  }

  return (
    <div style={{
      minHeight: "100vh", background: C.cream, display: "flex",
      alignItems: "flex-start", justifyContent: "center", padding: "40px 16px",
    }}>
      <div style={{
        width: "100%", maxWidth: 420, background: C.white,
        border: `1px solid ${C.border}`, borderRadius: 16,
        padding: "36px 32px",
      }}>
        <Logo />
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.navy, marginBottom: 4 }}>
          Create your account
        </h1>
        <p style={{ fontSize: 13, color: C.light, marginBottom: 28 }}>
          Start your free 14-day trial — no credit card required
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <Field label="Full Name" error={errors.fullName}>
            <input
              type="text"
              placeholder="Ahmed Al Mansouri"
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              onFocus={() => setFocusedField("fullName")}
              onBlur={() => setFocusedField(null)}
              style={getInputStyle("fullName")}
            />
          </Field>

          <Field label="Email Address" error={errors.email}>
            <input
              type="email"
              placeholder="ahmed@business.ae"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              style={getInputStyle("email")}
            />
          </Field>

          <Field label="Password" error={errors.password}>
            <input
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              style={getInputStyle("password")}
            />
            <PasswordStrength password={form.password} />
          </Field>

          <Field label="Business Name" error={errors.businessName}>
            <input
              type="text"
              placeholder="Lina Beauty Salon"
              value={form.businessName}
              onChange={(e) => set("businessName", e.target.value)}
              onFocus={() => setFocusedField("businessName")}
              onBlur={() => setFocusedField(null)}
              style={getInputStyle("businessName")}
            />
          </Field>

          <Field label="Business Type" error={errors.businessType}>
            <select
              value={form.businessType}
              onChange={(e) => set("businessType", e.target.value)}
              onFocus={() => setFocusedField("businessType")}
              onBlur={() => setFocusedField(null)}
              style={{
                ...getInputStyle("businessType"),
                cursor: "pointer",
                appearance: "auto",
              }}
            >
              <option value="">Select type...</option>
              <option value="salon">Salon</option>
              <option value="restaurant">Restaurant</option>
              <option value="clinic">Clinic</option>
              <option value="ac_repair">AC Repair</option>
              <option value="retail">Retail</option>
              <option value="other">Other</option>
            </select>
          </Field>

          <Field label="City" error={errors.city}>
            <select
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              onFocus={() => setFocusedField("city")}
              onBlur={() => setFocusedField(null)}
              style={{
                ...getInputStyle("city"),
                cursor: "pointer",
                appearance: "auto",
              }}
            >
              <option value="">Select city...</option>
              <option value="Dubai">Dubai</option>
              <option value="Abu Dhabi">Abu Dhabi</option>
              <option value="Sharjah">Sharjah</option>
              <option value="Ajman">Ajman</option>
              <option value="Other">Other</option>
            </select>
          </Field>

          <Field label="WhatsApp Number">
            <div style={{ display: "flex", gap: 0 }}>
              <div style={{
                background: C.warm, border: `1px solid ${C.border}`, borderRight: "none",
                borderRadius: "10px 0 0 10px", padding: "12px 12px",
                fontSize: 14, color: C.gray, whiteSpace: "nowrap", display: "flex", alignItems: "center",
              }}>
                +971
              </div>
              <input
                type="tel"
                placeholder="50 123 4567"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value.replace(/[^0-9 ]/g, ""))}
                onFocus={() => setFocusedField("phone")}
                onBlur={() => setFocusedField(null)}
                style={{
                  ...inputStyle,
                  borderRadius: "0 10px 10px 0",
                  borderColor: focusedField === "phone" ? C.teal : C.border,
                }}
              />
            </div>
          </Field>

          {errors.submit && (
            <div style={{
              background: "rgba(211,94,94,0.08)", border: `1px solid rgba(211,94,94,0.2)`,
              borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.error, marginBottom: 16,
            }}>
              {errors.submit}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", background: loading ? C.light : C.navy, color: "#FFF",
              border: "none", borderRadius: 10, padding: "14px", fontWeight: 700,
              fontSize: 15, minHeight: 48, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit", marginTop: 4, transition: "background 0.2s",
            }}
          >
            {loading ? "Creating account..." : "Create Account →"}
          </button>
        </form>

        <p style={{ fontSize: 13, color: C.light, textAlign: "center", marginTop: 20 }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: C.teal, fontWeight: 700, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
