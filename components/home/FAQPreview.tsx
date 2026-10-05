"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { FadeIn } from "@/components/ui/FadeIn";

const faqs = [
  {
    q: "How long does a fragrance last on skin?",
    a: "Our Eau de Parfum concentrations typically last 8–12 hours on skin. Pulse points — wrists, neck, inner elbows — maximise projection and longevity. Extrait de Parfum formulations can last up to 24 hours.",
  },
  {
    q: "Do you offer samples before committing to a full bottle?",
    a: "Yes. We offer a Discovery Set of five 2ml vials from our core collection, available in our Gift Sets section. We also offer single sample vials upon request — contact us and our team will help you find your perfect scent.",
  },
  {
    q: "What is your return policy?",
    a: "We accept returns within 30 days of delivery for unopened, sealed bottles. Due to the nature of fragrances, we cannot accept returns on opened products. Gift orders may be exchanged within 60 days.",
  },
];

export function FAQPreview() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section style={{ backgroundColor: "#FAFAF7" }}>
      <GoldDivider />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}
          className="faq-grid">

          {/* Left: intro */}
          <FadeIn direction="left">
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 16 }}>
              Common Questions
            </p>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 300, color: "#1A1A18", lineHeight: 1.1, marginBottom: 20 }}>
              You Asked, <em>We Answer</em>
            </h2>
            <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, color: "#6B6B63", lineHeight: 1.8, marginBottom: 32, maxWidth: 340 }}>
              Browse our most frequently asked questions, or visit the full FAQ page for everything you need to know about WAQAR.
            </p>
            <Link
              href="/faq"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em",
                textTransform: "uppercase", color: "#1A1A18", textDecoration: "none",
                paddingBottom: 2, borderBottom: "1px solid #1A1A18",
                transition: "color 0.2s, border-color 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#B8965A"; e.currentTarget.style.borderBottomColor = "#B8965A"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#1A1A18"; e.currentTarget.style.borderBottomColor = "#1A1A18"; }}
            >
              View All Questions <ArrowRight size={11} />
            </Link>
          </FadeIn>

          {/* Right: accordion */}
          <FadeIn direction="right" delay={0.15}>
            <div style={{ borderTop: "1px solid #EDE8DC" }}>
              {faqs.map((faq, i) => (
                <div key={i} style={{ borderBottom: "1px solid #EDE8DC" }}>
                  <button
                    onClick={() => setOpen(open === i ? null : i)}
                    style={{
                      width: "100%", display: "flex", alignItems: "flex-start",
                      justifyContent: "space-between", gap: 16, padding: "20px 0",
                      background: "none", border: "none", cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, fontWeight: 500, color: "#1A1A18", lineHeight: 1.4 }}>
                      {faq.q}
                    </span>
                    <motion.div
                      animate={{ rotate: open === i ? 45 : 0 }}
                      transition={{ duration: 0.22 }}
                      style={{ flexShrink: 0, marginTop: 2 }}
                    >
                      <Plus size={16} strokeWidth={1.5} style={{ color: "#B8965A" }} />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {open === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
                        style={{ overflow: "hidden" }}
                      >
                        <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, color: "#6B6B63", lineHeight: 1.8, paddingBottom: 20, paddingRight: 32 }}>
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .faq-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </section>
  );
}
