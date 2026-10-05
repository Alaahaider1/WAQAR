"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/ui/FadeIn";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { ArrowRight } from "lucide-react";

const stats = [
  { value: "95%+", label: "Natural Ingredients" },
  { value: "18", label: "Countries Sourced" },
  { value: "37", label: "Years of Craft" },
  { value: "3", label: "Master Perfumers" },
];

export function BrandStory() {
  return (
    <section id="brand-story" style={{ backgroundColor: "#FAFAF7" }}>
      <GoldDivider />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}
          className="brand-story-grid">

          {/* Left: Images */}
          <FadeIn direction="left" style={{ position: "relative" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1 / -1", position: "relative", aspectRatio: "16/9", overflow: "hidden", backgroundColor: "#F5F0E8" }}>
                <Image
                  src="/1.jpeg"
                  alt="Perfumer crafting a fragrance"
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden", backgroundColor: "#F5F0E8" }}>
                <Image
                  src="/2.jpeg"
                  alt="Natural perfume ingredients"
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="25vw"
                />
              </div>
              <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden", backgroundColor: "#F5F0E8" }}>
                <Image
                  src="/3.png"
                  alt="WAQAR perfume studio"
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="25vw"
                />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              style={{
                position: "absolute", bottom: -20, right: -24,
                backgroundColor: "#F5F0E8",
                padding: "20px 24px",
                boxShadow: "0 4px 24px rgba(26,26,24,0.07)",
              }}
            >
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 36, fontWeight: 300, color: "#1A1A18", lineHeight: 1, margin: 0 }}>
                
              </p>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6B6B63", marginTop: 8 }}>
                Est. 2025
              </p>
            </motion.div>
          </FadeIn>

          {/* Right: Copy */}
          <FadeIn direction="right" delay={0.15}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 16 }}>
              Our Heritage
            </p>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 300, color: "#1A1A18", lineHeight: 1.15, marginBottom: 24 }}>
              Built on Excellence,{" "}
              <em>Worn Worldwide</em>
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
              {[
                "WAQAR was founded in 1987 with a singular vision: to create the world's most exceptional fragrances by sourcing only the finest natural ingredients from across the globe.",
                "We source only the rarest natural materials: Bulgarian rose harvested at dawn, Cambodian oud aged for twenty years, vanilla absolute from the rainforests of Madagascar. Each perfume begins as an idea — a memory, a landscape, a feeling — and ends only when it is exactly right.",
                "No compromises. No shortcuts. Only the finest fragrance, in every bottle.",
              ].map((para, i) => (
                <p key={i} style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, color: "#6B6B63", lineHeight: 1.85, margin: 0 }}>
                  {para}
                </p>
              ))}
            </div>

            <div style={{ width: 48, height: 1, backgroundColor: "#B8965A", opacity: 0.5, marginBottom: 28 }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", marginBottom: 36 }}>
              {stats.map((stat) => (
                <div key={stat.label}>
                  <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 300, color: "#1A1A18", display: "block", lineHeight: 1 }}>
                    {stat.value}
                  </span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B6B63", display: "block", marginTop: 6 }}>
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/contact"
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
              Contact WAQAR <ArrowRight size={11} />
            </Link>
          </FadeIn>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .brand-story-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
      `}</style>
    </section>
  );
}
