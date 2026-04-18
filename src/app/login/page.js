"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

const C = {
  navy: "#0C1B33",
  teal: "#0A8F7F",
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

function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const successMessage = searchParams.get("message");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password");
      return;
    }
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Enter your email address above first");
      return;
    }
    setForgotLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.NEXT_PUBLIC_APP_URL + "/reset-password",
    });
    setForgotLoading(false);
    setForgotSent(true);
  }

  return (
    <div style={{
      minHeight: "100vh", background: C.cream, display: "flex",
      alignItems: "center", justifyContent: "center", padding: "40px 16px",
    }}>
      <div style={{
        width: "100%", maxWidth: 420, background: C.white,
        border: `1px solid ${C.border}`, borderRadius: 16,
        padding: "36px 32px",
      }}>
        <Logo />

        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.navy, marginBottom: 4 }}>
          Welcome back
        </h1>
        <p style={{ fontSize: 13, color: C.light, marginBottom: 28 }}>
          Sign in to your Azhl dashboard
        </p>

        {successMessage && (
          <div style={{
            background: "rgba(10,143,127,0.08)", border: `1px solid rgba(10,143,127,0.2)`,
            borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.teal,
            marginBottom: 20, fontWeight: 600,
          }}>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              placeholder="ahmed@business.ae"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              style={{
                ...inputStyle,
                borderColor: focusedField === "email" ? C.teal : C.border,
              }}
            />
          </div>

          <div style={{ marginBottom: 6 }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                style={{
                  ...inputStyle,
                  borderColor: focusedField === "password" ? C.teal : C.border,
                  paddingRight: 44,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                style={{
                  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: C.light, display: "flex", alignItems: "center", padding: 0,
                }}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          <div style={{ textAlign: "right", marginBottom: 20 }}>
            {forgotSent ? (
              <span style={{ fontSize: 12, color: C.teal, fontWeight: 600 }}>
                Reset link sent — check your email
              </span>
            ) : (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={forgotLoading}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: C.teal, fontSize: 12, fontWeight: 700, fontFamily: "inherit",
                  padding: 0,
                }}
              >
                {forgotLoading ? "Sending..." : "Forgot password?"}
              </button>
            )}
          </div>

          {error && (
            <div style={{
              background: "rgba(211,94,94,0.08)", border: `1px solid rgba(211,94,94,0.2)`,
              borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.error,
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", background: loading ? C.light : C.navy, color: "#FFF",
              border: "none", borderRadius: 10, padding: "14px", fontWeight: 700,
              fontSize: 15, minHeight: 48, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit", transition: "background 0.2s",
            }}
          >
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        <p style={{ fontSize: 13, color: C.light, textAlign: "center", marginTop: 20 }}>
          Don't have an account?{" "}
          <Link href="/signup" style={{ color: C.teal, fontWeight: 700, textDecoration: "none" }}>
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
