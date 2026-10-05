"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { signInAction } from "@/src/actions/auth.actions";

const S = {
  display: { fontFamily: "'Cormorant Garamond', Georgia, serif" },
  body: { fontFamily: "'DM Sans', system-ui, sans-serif" },
  mono: { fontFamily: "'DM Mono', monospace" },
} as const;

export function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    const result = await signInAction({ email: email.trim().toLowerCase(), password });

    if (!result.success) {
      setLoading(false);
      // Map error codes to friendly messages
      const msg =
        result.code === "INVALID_CREDENTIALS"
          ? "Invalid email or password."
          : result.code === "EMAIL_NOT_CONFIRMED"
          ? "Please confirm your email address before signing in."
          : result.error ?? "Sign in failed. Please try again.";
      setErrors({ general: msg });
      return;
    }

    // Auth succeeded — redirect based on role
    const role = result.data.role;
    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get("redirectTo");

    if (redirectTo && redirectTo.startsWith("/")) {
      router.push(redirectTo);
    } else if (role === "admin" || role === "super_admin") {
      router.push("/admin");
    } else {
      router.push("/");
    }

    // Keep loading spinner during navigation
    router.refresh();
  };

  return (
    <>
      <div style={{ paddingTop: 88, backgroundColor: "#FAFAF7" }}>
        <GoldDivider />
      </div>

      <div style={{ minHeight: "calc(100vh - 88px)", backgroundColor: "#FAFAF7", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: "100%", maxWidth: 440 }}
        >
          {/* Brand mark */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <Link href="/" style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", textDecoration: "none" }}>
              <span style={{ ...S.display, fontSize: 28, fontWeight: 300, letterSpacing: "0.12em", color: "#1A1A18" }}>WAQAR</span>
              <span style={{ ...S.mono, fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: "#B8965A", marginTop: -2 }}>PERFUMES</span>
            </Link>
            <div style={{ width: 40, height: 1, backgroundColor: "#B8965A", opacity: 0.5, margin: "20px auto 0" }} />
          </div>

          <p style={{ ...S.mono, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: "#6B6B63", textAlign: "center", marginBottom: 8 }}>Welcome back</p>
          <h1 style={{ ...S.display, fontSize: 32, fontWeight: 300, color: "#1A1A18", textAlign: "center", margin: "0 0 36px" }}>Sign In</h1>

          {errors.general && (
            <div style={{ padding: "12px 16px", backgroundColor: "rgba(204,68,68,0.06)", border: "1px solid rgba(204,68,68,0.2)", marginBottom: 20 }}>
              <p style={{ ...S.body, fontSize: 13, color: "#cc4444", margin: 0 }}>{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Email */}
            <div>
              <label style={{ ...S.mono, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: errors.email ? "#cc4444" : "#6B6B63", display: "block", marginBottom: 6 }}>Email Address</label>
              <div style={{ position: "relative" }}>
                <Mail size={14} strokeWidth={1.5} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#6B6B63", pointerEvents: "none" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "", general: "" })); }}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder="your@email.com"
                  autoComplete="email"
                  style={{ width: "100%", boxSizing: "border-box", paddingLeft: 38, paddingRight: 14, paddingTop: 11, paddingBottom: 11, border: `1px solid ${errors.email ? "#cc4444" : emailFocused ? "#B8965A" : "#EDE8DC"}`, backgroundColor: "#FAFAF7", ...S.body, fontSize: 13, color: "#1A1A18", outline: "none", transition: "border-color 0.2s" }}
                />
              </div>
              {errors.email && <p style={{ ...S.body, fontSize: 11, color: "#cc4444", marginTop: 4 }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label style={{ ...S.mono, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: errors.password ? "#cc4444" : "#6B6B63", display: "block", marginBottom: 6 }}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={14} strokeWidth={1.5} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#6B6B63", pointerEvents: "none" }} />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "", general: "" })); }}
                  onFocus={() => setPwFocused(true)}
                  onBlur={() => setPwFocused(false)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ width: "100%", boxSizing: "border-box", paddingLeft: 38, paddingRight: 40, paddingTop: 11, paddingBottom: 11, border: `1px solid ${errors.password ? "#cc4444" : pwFocused ? "#B8965A" : "#EDE8DC"}`, backgroundColor: "#FAFAF7", ...S.body, fontSize: 13, color: "#1A1A18", outline: "none", transition: "border-color 0.2s" }}
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6B6B63", padding: 2, display: "flex", alignItems: "center" }}>
                  {showPw ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
                </button>
              </div>
              {errors.password && <p style={{ ...S.body, fontSize: 11, color: "#cc4444", marginTop: 4 }}>{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "13px 32px", backgroundColor: "#1A1A18", color: "#FAFAF7", border: "none", cursor: loading ? "not-allowed" : "pointer", ...S.mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", opacity: loading ? 0.7 : 1, transition: "background-color 0.3s, opacity 0.3s", marginTop: 4 }}
              onMouseEnter={e => !loading && ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#6B6B63")}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1A1A18")}
            >
              {loading
                ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} style={{ width: 13, height: 13, border: "1.5px solid rgba(250,250,247,0.4)", borderTopColor: "#FAFAF7", borderRadius: "50%", flexShrink: 0 }} /> Signing in…</>
                : "Sign In"
              }
            </button>
          </form>

          <p style={{ ...S.body, fontSize: 13, color: "#6B6B63", textAlign: "center", marginTop: 28 }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" style={{ ...S.body, fontSize: 13, color: "#B8965A", textDecoration: "underline" }}>
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </>
  );
}
