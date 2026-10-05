"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { StaggerContainer, StaggerItem, FadeIn } from "@/components/ui/FadeIn";

type FeaturedCategory = {
  id: string;
  label: string;
  description: string;
  image: string;
  href: string;
};

export function FeaturedCategoriesClient({ categories }: { categories: FeaturedCategory[] }) {
  return (
    <section style={{ backgroundColor: "#FAFAF7" }}>
      <GoldDivider />

      <div className="featured-categories-container" style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 40px" }}>
        <FadeIn style={{ marginBottom: 56 }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 12 }}>
            Our Collections
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 300, color: "#1A1A18", lineHeight: 1.1, margin: 0 }}>
            Four Seasons, <em>One House</em>
          </h2>
        </FadeIn>

        {categories.length === 0 ? (
          <div style={{ border: "1px solid #EDE8DC", backgroundColor: "#F5F0E8", padding: "32px 24px", textAlign: "center" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 300, color: "#1A1A18", margin: "0 0 8px" }}>
              No collections available yet
            </p>
            <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, color: "#6B6B63", margin: 0 }}>
              Add categories in the admin panel to populate the storefront.
            </p>
          </div>
        ) : (
          <StaggerContainer
            className="featured-categories-rail"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {categories.map((cat) => (
              <StaggerItem key={cat.id}>
                <CategoryCard cat={cat} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </section>
  );
}

function CategoryCard({ cat }: { cat: FeaturedCategory }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={cat.href}
      style={{ display: "block", textDecoration: "none" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        animate={{ y: hovered ? -4 : 0 }}
        transition={{ duration: 0.3 }}
        className="featured-category-card"
        style={{ position: "relative", overflow: "hidden", aspectRatio: "3/4", backgroundColor: "#F5F0E8" }}
      >
        {cat.image ? (
          <Image
            src={cat.image}
            alt={cat.label}
            fill
            unoptimized
            style={{ objectFit: "cover", transition: "transform 0.7s ease", transform: hovered ? "scale(1.05)" : "scale(1)" }}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, backgroundColor: "#F5F0E8" }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(26,26,24,0.75) 0%, transparent 55%)" }} />

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px" }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(184,150,90,0.85)", marginBottom: 6 }}>
            {cat.description}
          </p>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 300, color: "#FAFAF7", lineHeight: 1.1, margin: 0 }}>
              {cat.label}
            </h3>
            <motion.span
              animate={{ x: hovered ? 2 : 0, y: hovered ? -2 : 0, opacity: hovered ? 1 : 0.5 }}
              transition={{ duration: 0.2 }}
              style={{ color: "#FAFAF7" }}
            >
              <ArrowUpRight size={15} strokeWidth={1.5} />
            </motion.span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
