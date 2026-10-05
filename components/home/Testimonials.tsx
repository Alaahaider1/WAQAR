"use client";

import { motion, useInView } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useRef } from "react";
import { testimonials } from "@/lib/data/testimonials";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { FadeIn } from "@/components/ui/FadeIn";

export function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section style={{ backgroundColor: "#F5F0E8", overflow: "hidden" }}>
      <GoldDivider />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 40px" }}>
        {/* Header */}
        <FadeIn style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 12 }}>
            What They Say
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 300, color: "#1A1A18", lineHeight: 1.1, margin: 0 }}>
            <em></em>
          </h2>
        </FadeIn>

        {/* Grid */}
        <div
          ref={ref}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 20,
          }}
          className="testimonials-grid"
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: i * 0.09, ease: [0.25, 0.1, 0.25, 1] }}
              style={{
                backgroundColor: "#FAFAF7",
                padding: "32px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Quote icon */}
              <Quote size={18} strokeWidth={1} fill="#B8965A" style={{ color: "#B8965A", opacity: 0.35, marginBottom: 18, flexShrink: 0 }} />

              {/* Stars */}
              <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} size={10} strokeWidth={0} fill={idx < t.rating ? "#B8965A" : "#EDE8DC"} />
                ))}
              </div>

              {/* Review text */}
              <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, color: "#6B6B63", lineHeight: 1.85, flex: 1, marginBottom: 24 }}>
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Gold rule */}
              <div style={{ width: 32, height: 1, backgroundColor: "#B8965A", opacity: 0.35, marginBottom: 20 }} />

              {/* Author */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  backgroundColor: "#EDE8DC",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#6B6B63", letterSpacing: "0.05em" }}>
                    {t.avatar}
                  </span>
                </div>
                <div>
                  <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, fontWeight: 500, color: "#1A1A18", margin: 0 }}>
                    {t.name}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(107,107,99,0.55)" }}>
                      {t.location}
                    </span>
                    <span style={{ color: "#EDE8DC", fontSize: 12 }}>·</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(184,150,90,0.65)" }}>
                      {t.product}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Aggregate */}
        <FadeIn delay={0.25} style={{ textAlign: "center", marginTop: 56 }}>
          <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} strokeWidth={0} fill="#B8965A" />
              ))}
            </div>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 300, color: "#1A1A18", margin: 0 }}>
              4.9 out of 5
            </p>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B6B63" }}>
              Based on 1,847 verified reviews
            </p>
          </div>
        </FadeIn>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .testimonials-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
