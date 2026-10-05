"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Mail, Phone, MapPin, Clock } from "lucide-react";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { FadeIn } from "@/components/ui/FadeIn";

const S = {
  display: { fontFamily: "'Cormorant Garamond', Georgia, serif" },
  body: { fontFamily: "'DM Sans', system-ui, sans-serif" },
  mono: { fontFamily: "'DM Mono', monospace" },
} as const;

const SUBJECTS = [
  "General Enquiry",
  "Order Support",
  "Returns & Exchanges",
  "Wholesale & Partnerships",
  "Press & Media",
  "Other",
];

export function ContactClient() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const set = (k: string, v: string) => {
    setValues((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!values.name?.trim()) e.name = "Please enter your name";
    if (!values.email?.trim()) e.email = "Please enter your email";
    else if (!/\S+@\S+\.\S+/.test(values.email)) e.email = "Please enter a valid email";
    if (!values.message?.trim()) e.message = "Please enter your message";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSent(true);
  };

  const inputStyle = (name: string, multiline = false) => ({
    width: "100%", boxSizing: "border-box" as const,
    padding: multiline ? "12px 14px" : "11px 14px",
    border: `1px solid ${errors[name] ? "#cc4444" : focused === name ? "#B8965A" : "#EDE8DC"}`,
    backgroundColor: "#FAFAF7",
    ...S.body, fontSize: 13, color: "#1A1A18",
    outline: "none", transition: "border-color 0.2s",
    resize: multiline ? "vertical" as const : undefined,
    minHeight: multiline ? 140 : undefined,
  });

  return (
    <>
      {/* Hero */}
      <div style={{ paddingTop: 88, backgroundColor: "#FAFAF7" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 40px 48px" }}>
          <p style={{ ...S.mono, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 14 }}>Get In Touch</p>
          <h1 style={{ ...S.display, fontSize: "clamp(2.4rem, 5vw, 4rem)", fontWeight: 300, color: "#1A1A18", lineHeight: 1.05, margin: 0 }}>
            Contact <em>WAQAR</em>
          </h1>
          <p style={{ ...S.body, fontSize: 14, color: "#6B6B63", lineHeight: 1.8, marginTop: 16, maxWidth: 480 }}>
            We respond to every enquiry personally. Our team is available Monday–Friday, 9am–6pm CET.
          </p>
        </div>
        <GoldDivider />
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 40px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "flex-start" }} className="contact-grid">

          {/* Left: Form */}
          <FadeIn direction="left">
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div key="success" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "48px 0" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", border: "1px solid #B8965A", backgroundColor: "rgba(184,150,90,0.06)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                    <Check size={24} strokeWidth={1.5} style={{ color: "#B8965A" }} />
                  </div>
                  <p style={{ ...S.mono, fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#B8965A", marginBottom: 12 }}>Message Sent</p>
                  <h2 style={{ ...S.display, fontSize: 28, fontWeight: 300, color: "#1A1A18", marginBottom: 12 }}>Thank you, {values.name?.split(" ")[0]}</h2>
                  <p style={{ ...S.body, fontSize: 14, color: "#6B6B63", lineHeight: 1.8 }}>
                    We&apos;ve received your message and will reply to <strong style={{ color: "#1A1A18" }}>{values.email}</strong> within one business day.
                  </p>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="contact-name-row">
                    <div>
                      <label style={{ ...S.mono, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: errors.name ? "#cc4444" : "#6B6B63", display: "block", marginBottom: 6 }}>Full Name</label>
                      <input value={values.name ?? ""} onChange={(e) => set("name", e.target.value)} onFocus={() => setFocused("name")} onBlur={() => setFocused(null)} placeholder="Your Name" style={inputStyle("name")} />
                      {errors.name && <p style={{ ...S.body, fontSize: 11, color: "#cc4444", marginTop: 4 }}>{errors.name}</p>}
                    </div>
                    <div>
                      <label style={{ ...S.mono, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: errors.email ? "#cc4444" : "#6B6B63", display: "block", marginBottom: 6 }}>Email Address</label>
                      <input type="email" value={values.email ?? ""} onChange={(e) => set("email", e.target.value)} onFocus={() => setFocused("email")} onBlur={() => setFocused(null)} placeholder="elise@example.com" style={inputStyle("email")} />
                      {errors.email && <p style={{ ...S.body, fontSize: 11, color: "#cc4444", marginTop: 4 }}>{errors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <label style={{ ...S.mono, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B6B63", display: "block", marginBottom: 6 }}>Subject</label>
                    <select value={values.subject ?? ""} onChange={(e) => set("subject", e.target.value)} onFocus={() => setFocused("subject")} onBlur={() => setFocused(null)}
                      style={{ ...inputStyle("subject"), appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B6B63' stroke-width='1.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", cursor: "pointer" }}>
                      <option value="">Select a subject…</option>
                      {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ ...S.mono, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: errors.message ? "#cc4444" : "#6B6B63", display: "block", marginBottom: 6 }}>Message</label>
                    <textarea value={values.message ?? ""} onChange={(e) => set("message", e.target.value)} onFocus={() => setFocused("message")} onBlur={() => setFocused(null)} placeholder="Tell us how we can help…" style={inputStyle("message", true)} />
                    {errors.message && <p style={{ ...S.body, fontSize: 11, color: "#cc4444", marginTop: 4 }}>{errors.message}</p>}
                  </div>

                  <button type="submit" disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "14px 32px", backgroundColor: "#1A1A18", color: "#FAFAF7", border: "none", cursor: loading ? "not-allowed" : "pointer", ...S.mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", opacity: loading ? 0.7 : 1, transition: "background-color 0.3s" }}
                    onMouseEnter={e => !loading && ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#6B6B63")}
                    onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1A1A18")}
                  >
                    {loading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} style={{ width: 14, height: 14, border: "1.5px solid rgba(250,250,247,0.4)", borderTopColor: "#FAFAF7", borderRadius: "50%" }} /> : "Send Message"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </FadeIn>

          {/* Right: Info */}
          <FadeIn direction="right" delay={0.15}>
            <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>

              {/* Contact details */}
              <div>
                <p style={{ ...S.mono, fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 20 }}>Contact Details</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {[
                    { Icon: Mail, label: "Email", value: "mo2alaa01067507800@gmail.com", href: "mailto:mo2alaa01067507800@gmail.com" },
                    { Icon: Phone, label: "Phone", value: "+20 01067507800", href: "tel:+2001067507800" },
                    { Icon: MapPin, label: "Studio", value: "TALLAH, Elminya, EGY" },
                    { Icon: Clock, label: "Hours", value: "Sat – Fri, 9:00 – 18:00 CET" },
                  ].map(({ Icon, label, value, href }) => (
                    <div key={label} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <div style={{ width: 36, height: 36, border: "1px solid #EDE8DC", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={14} strokeWidth={1.5} style={{ color: "#B8965A" }} />
                      </div>
                      <div>
                        <p style={{ ...S.mono, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#6B6B63", margin: "0 0 3px" }}>{label}</p>
                        {href ? (
                          <a href={href} style={{ ...S.body, fontSize: 13, color: "#1A1A18", textDecoration: "none" }}
                            onMouseEnter={e => (e.currentTarget.style.color = "#B8965A")}
                            onMouseLeave={e => (e.currentTarget.style.color = "#1A1A18")}
                          >{value}</a>
                        ) : (
                          <p style={{ ...S.body, fontSize: 13, color: "#1A1A18", margin: 0 }}>{value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ width: "100%", height: 1, backgroundColor: "#EDE8DC" }} />

              {/* Map placeholder */}
              <div>
                <p style={{ ...S.mono, fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 16 }}>Our Location</p>
                <div style={{ aspectRatio: "16/9", backgroundColor: "#F5F0E8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, border: "1px solid #EDE8DC" }}>
                  <MapPin size={24} strokeWidth={1} style={{ color: "#B8965A" }} />
                  <p style={{ ...S.display, fontSize: 16, fontWeight: 300, color: "#1A1A18" }}>Elminya, EGY</p>
                  <p style={{ ...S.mono, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#6B6B63" }}>Premium Fragrance House</p>
                  <a href="https://www.google.com/maps/search/?api=1&query=Minya,Egypt" target="_blank" rel="noopener noreferrer"
                    style={{ marginTop: 4, ...S.mono, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#B8965A", textDecoration: "none", borderBottom: "1px solid #B8965A", paddingBottom: 1 }}>
                    View on Google Maps
                  </a>
                </div>
              </div>

              <div style={{ width: "100%", height: 1, backgroundColor: "#EDE8DC" }} />

              {/* Social links */}
              <div>
                <p style={{ ...S.mono, fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 16 }}>Follow WAQAR</p>
                <div style={{ display: "flex", gap: 10 }}>
                  {["Instagram", "Pinterest", "LinkedIn"].map((social) => (
                    <a key={social} href="#" style={{ padding: "8px 14px", border: "1px solid #EDE8DC", ...S.mono, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1A1A18", textDecoration: "none", transition: "border-color 0.2s, color 0.2s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#B8965A"; e.currentTarget.style.color = "#B8965A"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#EDE8DC"; e.currentTarget.style.color = "#1A1A18"; }}
                    >
                      {social}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      <GoldDivider />
      <style>{`
        .contact-grid { grid-template-columns: 1fr 1fr; }
        .contact-name-row { grid-template-columns: 1fr 1fr; }
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          .contact-name-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
