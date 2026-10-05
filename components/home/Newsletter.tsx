"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { GoldDivider } from "@/components/ui/GoldDivider";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <section style={{ backgroundColor: "#1A1A18" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 40px" }}>
        <FadeIn style={{ maxWidth: 580, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(184,150,90,0.65)", marginBottom: 16 }}>
            WAQAR Newsletter
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 300, color: "#FAFAF7", lineHeight: 1.1, marginBottom: 16 }}>
            First to Know, <em>First to Wear</em>
          </h2>
          <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, color: "rgba(250,250,247,0.45)", lineHeight: 1.75, marginBottom: 36, maxWidth: 380, margin: "0 auto 36px" }}>
            Join our inner circle for early access to new fragrances, private events and exclusive members-only pricing.
          </p>

          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: "flex", gap: 10, maxWidth: 440, margin: "0 auto", flexWrap: "wrap" }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  required
                  style={{
                    flex: 1, minWidth: 200,
                    background: "transparent",
                    border: "1px solid rgba(250,250,247,0.15)",
                    padding: "13px 20px",
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontSize: 13,
                    color: "#FAFAF7",
                    outline: "none",
                  }}
                  onFocus={e => (e.target.style.borderColor = "rgba(184,150,90,0.5)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(250,250,247,0.15)")}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    backgroundColor: "#B8965A",
                    color: "#FAFAF7",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    padding: "13px 28px",
                    border: "none",
                    cursor: "pointer",
                    transition: "background-color 0.3s",
                    opacity: loading ? 0.6 : 1,
                  }}
                  onMouseEnter={e => !loading && ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#D4AF7A")}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#B8965A")}
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      style={{ width: 14, height: 14, border: "1.5px solid rgba(250,250,247,0.4)", borderTopColor: "#FAFAF7", borderRadius: "50%" }}
                    />
                  ) : (
                    <> Subscribe <ArrowRight size={11} /> </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "16px 0" }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  border: "1px solid #B8965A",
                  backgroundColor: "rgba(184,150,90,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Check size={14} style={{ color: "#B8965A" }} />
                </div>
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, color: "#FAFAF7", fontWeight: 500, margin: 0 }}>
                    Welcome to WAQAR
                  </p>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(250,250,247,0.35)", marginTop: 4 }}>
                    You&apos;ll hear from us soon
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(250,250,247,0.18)", marginTop: 24 }}>
            No spam. Unsubscribe anytime.
          </p>
        </FadeIn>
      </div>
      <GoldDivider style={{ opacity: 0.1 }} />
    </section>
  );
}
