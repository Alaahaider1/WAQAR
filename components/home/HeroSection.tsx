"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="hero-section relative min-h-[calc(100vh-80px)] overflow-hidden bg-[#181818]">

      {/* Hero Image */}
      <motion.div
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 1.3,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className="hero-image absolute inset-0"
      >
        <Image
          src="/landing.png"
          alt="WAQAR signature perfume"
          fill
          priority
        className="hero-image-element object-cover object-center"
          sizes="100vw"
        />

        {/* Dark luxury overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(
                to right,
                rgba(15,15,15,0.88) 0%,
                rgba(15,15,15,0.68) 28%,
                rgba(15,15,15,0.25) 58%,
                rgba(15,15,15,0.08) 100%
              )
            `,
          }}
        />

        {/* Bottom subtle darkening */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(10,10,10,0.35) 0%, transparent 45%)",
          }}
        />
      </motion.div>

      {/* Hero Content */}
      <div className="hero-content relative z-10 flex min-h-[calc(100vh-80px)] items-center">

        <div className="hero-copy w-full max-w-2xl px-8 py-24 md:px-14 lg:px-20 xl:px-28">

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-7 flex items-center gap-3"
          >
<div
  style={{
    width: 34,
    height: 1,
    backgroundColor: "#C9A45C",
  }}
/>

<p
  style={{
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: "#F5F0E6",
  }}
>
  WAQAR PERFUMES
</p>
          </motion.div>

          {/* Heading */}
          <motion.h1 className="hero-heading"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 1,
              delay: 0.35,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(2.25rem, 6vw, 5.5rem)",
              fontWeight: 300,
              lineHeight: 0.95,
              letterSpacing: "-0.015em",
              color: "#F5F0E6",
              maxWidth: 620,
              marginBottom: "1.5rem",
            }}
          >
            FIND YOUR
            <br />
            SIGNATURE
            <br />
            <em
              style={{
                fontStyle: "normal",
                color: "#D5B878",
              }}
            >
              FRAGRANCE
            </em>
          </motion.h1>

          {/* Description */}
          <motion.p className="hero-description"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: 0.55,
            }}
            style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: "clamp(13px, 1.2vw, 15px)",
              color: "rgba(245,240,230,0.78)",
              lineHeight: 1.8,
              maxWidth: 440,
              marginBottom: "2rem",
            }}
          >
            Discover the timeless elegance and sophisticated scents of
            <strong style={{ color: "#F5F0E6" }}> WAQAR</strong>.
            Handcrafted for moments of confidence.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.7,
            }}
          >
            <Link
              href="/products"
              className="hero-cta"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#C7A45D",
                color: "#171717",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "14px 30px",
                borderRadius: "999px",
                textDecoration: "none",
                transition:
                  "background-color 0.3s, transform 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#DFC483";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#C7A45D";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Discover the Collection
            </Link>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
