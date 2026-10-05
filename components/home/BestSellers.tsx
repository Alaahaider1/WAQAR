"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useStorefrontProducts } from "@/lib/hooks/useStorefrontProducts";
import { ProductCard } from "@/components/products/ProductCard";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/FadeIn";

export function BestSellers() {
  const { bestSellers } = useStorefrontProducts();
  if (!bestSellers.length) return null;

  return (
    <section style={{ backgroundColor: "#F5F0E8" }}>
      <GoldDivider />

      <div className="home-products-container" style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 40px" }}>
        {/* Header row */}
        <FadeIn style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 52, flexWrap: "wrap", gap: 16 }}>
          <div>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 10 }}>
              Most Loved
            </p>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 300, color: "#1A1A18", lineHeight: 1.1, margin: 0 }}>
              Best Sellers
            </h2>
          </div>
          <Link
            href="/products"
            className="group"
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
            View All
            <ArrowRight size={11} />
          </Link>
        </FadeIn>

        {/* Grid */}
        <StaggerContainer
          className="home-product-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 24,
          }}
        >
          {bestSellers.slice(0, 4).map((product) => (
            <StaggerItem key={product.id}>
              <ProductCard product={product} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .home-products-container { padding: 56px 20px !important; }
          .home-product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 16px !important; }
        }
      `}</style>
    </section>
  );
}
