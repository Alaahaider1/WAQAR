"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/ui/FadeIn";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { ArrowRight } from "lucide-react";

export function BrandStory() {
  return (
    <section id="brand-story" style={{ backgroundColor: "#FAFAF7" }}>
      <GoldDivider />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 40px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 80,
            alignItems: "center",
          }}
          className="brand-story-grid"
        >
          {/* Left: Images */}
          <FadeIn direction="left" style={{ position: "relative" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div
                style={{
                  gridColumn: "1 / -1",
                  position: "relative",
                  aspectRatio: "16/9",
                  overflow: "hidden",
                  backgroundColor: "#F5F0E8",
                }}
              >
                <Image
                  src="/1.jpeg"
                  alt="Perfumer crafting a fragrance"
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>

              <div
                style={{
                  position: "relative",
                  aspectRatio: "4/3",
                  overflow: "hidden",
                  backgroundColor: "#F5F0E8",
                }}
              >
                <Image
                  src="/2.jpeg"
                  alt="Natural perfume ingredients"
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 768px) 45vw, 25vw"
                />
              </div>

              <div
                style={{
                  position: "relative",
                  aspectRatio: "4/3",
                  overflow: "hidden",
                  backgroundColor: "#F5F0E8",
                }}
              >
                <Image
                  src="/3.png"
                  alt="WAQAR perfume studio"
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 768px) 45vw, 25vw"
                />
              </div>
            </div>

            {/* Responsive WAQAR stamp */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="brand-story-stamp"
            >
              <p className="brand-story-stamp-title">WAQAR</p>
              <p className="brand-story-stamp-subtitle">Est. 2025</p>
            </motion.div>
          </FadeIn>

          {/* Right: Copy */}
          <FadeIn direction="right" delay={0.15}>
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "#6B6B63",
                marginBottom: 16,
              }}
            >
              Our Heritage
            </p>

            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
                fontWeight: 300,
                color: "#1A1A18",
                lineHeight: 1.15,
                marginBottom: 24,
              }}
            >
              Built on Excellence, <em>Made to Be Remembered</em>
            </h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                marginBottom: 28,
              }}
            >
              {[
                "WAQAR was born in 2025 with a simple belief: fragrance is more than a scent — it is a signature.",
                "We create refined fragrances inspired by timeless elegance, modern character, and the moments that stay with you. Every composition is carefully selected to offer a distinctive experience, from the first note to the last.",
                "Made for those who appreciate the details. Made to leave an impression. Made to be remembered.",
              ].map((para, i) => (
                <p
                  key={i}
                  style={{
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontSize: 14,
                    color: "#6B6B63",
                    lineHeight: 1.85,
                    margin: 0,
                  }}
                >
                  {para}
                </p>
              ))}
            </div>

            <div
              style={{
                width: 48,
                height: 1,
                backgroundColor: "#B8965A",
                opacity: 0.5,
                marginBottom: 28,
              }}
            />

            <Link
              href="/contact"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#1A1A18",
                textDecoration: "none",
                paddingBottom: 2,
                borderBottom: "1px solid #1A1A18",
                transition: "color 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#B8965A";
                e.currentTarget.style.borderBottomColor = "#B8965A";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#1A1A18";
                e.currentTarget.style.borderBottomColor = "#1A1A18";
              }}
            >
              Contact WAQAR <ArrowRight size={11} />
            </Link>
          </FadeIn>
        </div>
      </div>

      <style>{`
        .brand-story-stamp {
          position: absolute;
          bottom: -20px;
          right: -24px;
          z-index: 2;
          background-color: #F5F0E8;
          padding: 20px 24px;
          box-shadow: 0 4px 24px rgba(26,26,24,0.07);
          max-width: calc(100% - 12px);
          box-sizing: border-box;
        }

        .brand-story-stamp-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 36px;
          font-weight: 300;
          color: #1A1A18;
          line-height: 1;
          margin: 0;
          white-space: nowrap;
        }

        .brand-story-stamp-subtitle {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #6B6B63;
          margin: 8px 0 0;
        }

        @media (max-width: 768px) {
          .brand-story-grid {
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 48px !important;
          }

          .brand-story-stamp {
            bottom: -12px;
            right: 8px;
            padding: 10px 13px;
            max-width: 48%;
          }

          .brand-story-stamp-title {
            font-size: clamp(18px, 5vw, 24px);
          }

          .brand-story-stamp-subtitle {
            font-size: 7px;
            letter-spacing: 0.16em;
            margin-top: 5px;
          }
        }

        @media (max-width: 380px) {
          .brand-story-stamp {
            right: 5px;
            padding: 8px 10px;
            max-width: 46%;
          }

          .brand-story-stamp-title {
            font-size: 18px;
          }

          .brand-story-stamp-subtitle {
            font-size: 6px;
            letter-spacing: 0.12em;
          }
        }
      `}</style>
    </section>
  );
}