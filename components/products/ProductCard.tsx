"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, Star } from "lucide-react";
import { Product } from "@/lib/data/products";
import { useCartStore } from "@/lib/store/cartStore";
import { formatPrice } from "@/lib/utils/formatPrice";
import { useState } from "react";

type ProductCardProps = {
  product: Product;
  className?: string;
};

export function ProductCard({ product, className }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className={className}
      style={{ display: "block", textDecoration: "none" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.article
        animate={{ y: hovered ? -4 : 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Image */}
        <div style={{ position: "relative", overflow: "hidden", backgroundColor: "#F5F0E8", aspectRatio: "3/4", marginBottom: 16 }}>
          <Image
            src={product.image}
            alt={product.name}
            fill
            style={{ objectFit: "cover", transition: "transform 0.7s ease", transform: hovered ? "scale(1.05)" : "scale(1)" }}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />

          {/* Badges */}
          <div style={{ position: "absolute", top: 12, left: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            {product.isNew && (
              <span style={{ backgroundColor: "#FAFAF7", fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "#1A1A18", padding: "3px 8px" }}>
                New
              </span>
            )}
            {product.isBestSeller && (
              <span style={{ backgroundColor: "#B8965A", fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "#FAFAF7", padding: "3px 8px" }}>
                Best Seller
              </span>
            )}
            {product.originalPrice && (
              <span style={{ backgroundColor: "#1A1A18", fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "#FAFAF7", padding: "3px 8px" }}>
                Save {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
              </span>
            )}
          </div>

          {/* Quick Add button — slides up on hover */}
          <motion.button
            onClick={handleAddToCart}
            animate={{ y: hovered ? 0 : 12, opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            aria-label={`Add ${product.name} to cart`}
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              padding: "12px 0",
              backgroundColor: added ? "#B8965A" : "rgba(26,26,24,0.88)",
              color: "#FAFAF7",
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "background-color 0.3s",
            }}
          >
            <ShoppingBag size={11} strokeWidth={1.5} />
            {added ? "Added to Cart" : "Quick Add"}
          </motion.button>
        </div>

        {/* Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div>
            <h3 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 19,
              fontWeight: 300,
              color: hovered ? "#6B6B63" : "#1A1A18",
              transition: "color 0.2s",
              margin: 0,
              lineHeight: 1.2,
            }}>
              {product.name}
            </h3>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(107,107,99,0.55)", marginTop: 4 }}>
              {product.subtitle} · {product.size}
            </p>
          </div>

          {/* Stars */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ display: "flex", gap: 2 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={9}
                  strokeWidth={0}
                  fill={i < Math.floor(product.rating) ? "#B8965A" : "#EDE8DC"}
                />
              ))}
            </div>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(107,107,99,0.55)" }}>
              ({product.reviewCount})
            </span>
          </div>

          {/* Price */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 500, color: "#1A1A18" }}>
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(107,107,99,0.45)", textDecoration: "line-through" }}>
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
