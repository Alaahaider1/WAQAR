"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Check, ChevronRight, Star, Truck, RefreshCw, Shield } from "lucide-react";
import { useStorefrontProducts } from "@/lib/hooks/useStorefrontProducts";
import type { Product } from "@/lib/data/products";
import { useCartStore } from "@/lib/store/cartStore";
import { formatPrice } from "@/lib/utils/formatPrice";
import { ProductGallery } from "@/components/product/ProductGallery";
import { FragranceNotes } from "@/components/product/FragranceNotes";
import { QuantitySelector } from "@/components/product/QuantitySelector";
import { ProductReviews } from "@/components/product/ProductReviews";
import { ProductCard } from "@/components/products/ProductCard";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/FadeIn";

const S = {
  display: { fontFamily: "'Cormorant Garamond', Georgia, serif" },
  body: { fontFamily: "'DM Sans', system-ui, sans-serif" },
  mono: { fontFamily: "'DM Mono', monospace" },
} as const;

const GUARANTEES = [
  { Icon: Truck, label: "Free shipping over EGP 150" },
  { Icon: RefreshCw, label: "30-day returns" },
  { Icon: Shield, label: "Authentic & sealed" },
];

export default function ProductDetailClient({ product }: { product: Product }) {
  const { getRelated } = useStorefrontProducts();
  const related = getRelated(product.id, 4);
  const addItem = useCartStore((s) => s.addItem);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  return (
    <>
      {/* Breadcrumb */}
      <div style={{ paddingTop: 88, backgroundColor: "#FAFAF7" }}>
        <div className="product-breadcrumb-container" style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 40px" }}>
          <div className="product-breadcrumbs" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {[{ label: "Home", href: "/" }, { label: "Collections", href: "/products" }, { label: product.name }].map((crumb, i, arr) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {crumb.href ? (
                  <Link href={crumb.href} style={{ ...S.mono, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#6B6B63", textDecoration: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#B8965A")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#6B6B63")}
                  >{crumb.label}</Link>
                ) : (
                  <span style={{ ...S.mono, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#1A1A18" }}>{crumb.label}</span>
                )}
                {i < arr.length - 1 && <ChevronRight size={10} strokeWidth={1.5} style={{ color: "#EDE8DC" }} />}
              </span>
            ))}
          </div>
        </div>
        <GoldDivider />
      </div>

      {/* Main product area */}
      <div className="product-detail-container" style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 40px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "flex-start" }} className="product-detail-grid">

          {/* Gallery */}
          <FadeIn direction="left">
            <ProductGallery images={product.gallery.length > 1 ? product.gallery : [product.image, product.image]} name={product.name} />
          </FadeIn>

          {/* Info panel */}
          <FadeIn direction="right" delay={0.1}>
            <div className="product-info-panel" style={{ display: "flex", flexDirection: "column", gap: 0 }}>

              {/* Badges */}
              <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                {product.isBestSeller && <span style={{ ...S.mono, fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", backgroundColor: "#B8965A", color: "#FAFAF7", padding: "3px 10px" }}>Best Seller</span>}
                {product.isNew && <span style={{ ...S.mono, fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", backgroundColor: "#1A1A18", color: "#FAFAF7", padding: "3px 10px" }}>New</span>}
              </div>

              {/* Name */}
              <h1 className="product-detail-copy" style={{ ...S.display, fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 300, color: "#1A1A18", lineHeight: 1.05, margin: "0 0 4px" }}>
                {product.name}
              </h1>
              <p className="product-detail-copy" style={{ ...S.mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 16 }}>
                {product.subtitle} · {product.size}
              </p>

              {/* Rating */}
              <div className="product-rating" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
                <div style={{ display: "flex", gap: 3 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={11} strokeWidth={0} fill={i < Math.floor(product.rating) ? "#B8965A" : "#EDE8DC"} />
                  ))}
                </div>
                <span className="product-detail-copy" style={{ ...S.mono, fontSize: 10, color: "#6B6B63", letterSpacing: "0.1em" }}>{product.rating} ({product.reviewCount} reviews)</span>
              </div>

              {/* Gold rule */}
              <div style={{ width: "100%", height: 1, backgroundColor: "#EDE8DC", marginBottom: 24 }} />

              {/* Price */}
              <div className="product-price-row" style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16 }}>
                <span style={{ ...S.display, fontSize: 28, fontWeight: 300, color: "#1A1A18" }}>{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <span style={{ ...S.mono, fontSize: 14, color: "#6B6B63", textDecoration: "line-through" }}>{formatPrice(product.originalPrice)}</span>
                )}
                {product.originalPrice && (
                  <span style={{ ...S.mono, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#B8965A" }}>
                    Save {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="product-detail-copy" style={{ ...S.body, fontSize: 14, color: "#6B6B63", lineHeight: 1.8, marginBottom: 28 }}>
                {product.longDescription}
              </p>

              {/* Gold rule */}
              <div style={{ width: "100%", height: 1, backgroundColor: "#EDE8DC", marginBottom: 24 }} />

              {/* Quantity + Add to Cart */}
              <div className="product-cart-controls" style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                <QuantitySelector value={qty} onChange={setQty} />
                <button
                  onClick={handleAdd}
                  className="product-add-button"
                  style={{
                    flex: 1, minWidth: 180, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    backgroundColor: added ? "#B8965A" : "#1A1A18",
                    color: "#FAFAF7", border: "none", cursor: "pointer",
                    ...S.mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
                    padding: "14px 24px", transition: "background-color 0.3s",
                  }}
                >
                  <AnimatePresence mode="wait">
                    {added ? (
                      <motion.span key="done" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Check size={14} strokeWidth={2} /> Added to Cart
                      </motion.span>
                    ) : (
                      <motion.span key="add" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ShoppingBag size={14} strokeWidth={1.5} /> Add to Cart
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>

              {/* Guarantees */}
              <div className="product-guarantees" style={{ display: "flex", gap: 20, padding: "16px 0", borderTop: "1px solid #EDE8DC", borderBottom: "1px solid #EDE8DC", marginBottom: 28, flexWrap: "wrap" }}>
                {GUARANTEES.map(({ Icon, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon size={13} strokeWidth={1.5} style={{ color: "#B8965A", flexShrink: 0 }} />
                    <span style={{ ...S.mono, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B6B63" }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Fragrance notes */}
              <FragranceNotes notes={product.notes} ingredients={product.ingredients} />
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Reviews section */}
      <div style={{ backgroundColor: "#F5F0E8" }}>
        <GoldDivider />
        <div className="product-followup-container" style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 40px" }}>
          <ProductReviews rating={product.rating} reviewCount={product.reviewCount} productId={product.id} />
        </div>
      </div>

      {/* Related products */}
      <div style={{ backgroundColor: "#FAFAF7" }}>
        <GoldDivider />
        <div className="product-followup-container" style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 40px" }}>
          <FadeIn style={{ marginBottom: 40 }}>
            <p style={{ ...S.mono, fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 10 }}>You May Also Like</p>
            <h2 style={{ ...S.display, fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 300, color: "#1A1A18", margin: 0 }}>
              Related <em>Fragrances</em>
            </h2>
          </FadeIn>
          <StaggerContainer style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }} className="related-grid">
            {related.map((p) => (
              <StaggerItem key={p.id}>
                <ProductCard product={p} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
        <GoldDivider />
      </div>

      <style>{`
        .product-detail-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
        .product-detail-grid > *, .product-info-panel, .related-grid > * { min-width: 0; }
        .related-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        @media (max-width: 1024px) { .related-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 768px) {
          .product-detail-grid { grid-template-columns: minmax(0, 1fr) !important; gap: 40px !important; }
          .related-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 520px) {
          .product-breadcrumb-container { padding: 16px 20px !important; }
          .product-breadcrumbs { flex-wrap: wrap; min-width: 0; }
          .product-breadcrumbs > span { min-width: 0; max-width: 100%; overflow-wrap: anywhere; }
          .product-detail-container, .product-followup-container { padding-left: 20px !important; padding-right: 20px !important; }
          .product-info-panel, .product-detail-copy { min-width: 0; max-width: 100%; overflow-wrap: anywhere; word-break: normal; }
          .product-rating { flex-wrap: wrap; min-width: 0; }
          .product-price-row { flex-wrap: wrap; min-width: 0; }
          .product-cart-controls { align-items: stretch; min-width: 0; }
          .product-add-button { min-width: 0 !important; box-sizing: border-box; }
          .product-guarantees > * { min-width: 0; max-width: 100%; overflow-wrap: anywhere; }
          .related-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .related-grid h3, .related-grid p { overflow-wrap: anywhere; }
        }
        @media (max-width: 380px) {
          .product-cart-controls { flex-direction: column; }
          .product-cart-controls > button { width: 100%; }
        }
      `}</style>
    </>
  );
}
