"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { FadeIn } from "@/components/ui/FadeIn";
import { featuredFAQs } from "@/lib/data/faqs";

export function FAQPreview() {
  const [open, setOpen] = useState<string | null>(null);

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
            <div style={{ borderTop: "1px solid #EDE8DC" }} dir="rtl">
              {featuredFAQs.map((faq) => (
                <div key={faq.id} style={{ borderBottom: "1px solid #EDE8DC" }}>
                  <button
                    onClick={() => setOpen(open === faq.id ? null : faq.id)}
                    aria-expanded={open === faq.id}
                    style={{
                      width: "100%", display: "flex", alignItems: "flex-start",
                      justifyContent: "space-between", gap: 16, padding: "20px 0",
                      background: "none", border: "none", cursor: "pointer", textAlign: "right",
                    }}
                  >
                    <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, fontWeight: 500, color: "#1A1A18", lineHeight: 1.4 }}>
                      {faq.question}
                    </span>
                    <motion.div
                      animate={{ rotate: open === faq.id ? 45 : 0 }}
                      transition={{ duration: 0.22 }}
                      style={{ flexShrink: 0, marginTop: 2 }}
                    >
                      <Plus size={16} strokeWidth={1.5} style={{ color: "#B8965A" }} />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {open === faq.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
                        style={{ overflow: "hidden" }}
                      >
                        <p dir="rtl" style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, color: "#6B6B63", lineHeight: 1.8, paddingBottom: 20, paddingRight: 32, textAlign: "right", whiteSpace: "pre-line" }}>
                          {faq.answer}
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
