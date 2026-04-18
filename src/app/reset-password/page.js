"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push("/login?message=Password updated successfully");
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
          Set new password
        </h1>
        <p style={{ fontSize: 13, color: C.light, marginBottom: 28 }}>
          Choose a strong password for your account
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              style={{
                ...inputStyle,
                borderColor: focusedField === "password" ? C.teal : C.border,
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Confirm New Password</label>
            <input
              type="password"
              placeholder="Repeat password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(""); }}
              onFocus={() => setFocusedField("confirm")}
              onBlur={() => setFocusedField(null)}
              style={{
                ...inputStyle,
                borderColor: focusedField === "confirm" ? C.teal : C.border,
              }}
            />
          </div>

          {error && (
            <div style={{
              background: "rgba(211,94,94,0.08)", border: `1px solid rgba(211,94,94,0.2)`,
              borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.error, marginBottom: 16,
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
            {loading ? "Updating..." : "Update Password →"}
          </button>
        </form>
      </div>
    </div>
  );
}
