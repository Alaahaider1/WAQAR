"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const S = {
  mono: { fontFamily: "'DM Mono', monospace" },
} as const;

type ProductGalleryProps = {
  images: string[];
  name: string;
};

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
      <div className="product-gallery" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Main image */}
      <div
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onMouseMove={handleMouseMove}
        style={{
          position: "relative",
          aspectRatio: "1 / 1",
          backgroundColor: "#F5F0E8",
          overflow: "hidden",
          cursor: zoomed ? "crosshair" : "zoom-in",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ position: "absolute", inset: 0 }}
          >
            <Image
              src={images[active]}
              alt={`${name} — view ${active + 1}`}
              fill
              priority={active === 0}
              style={{
                objectFit: "cover",
                transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                transform: zoomed ? "scale(1.85)" : "scale(1)",
                transition: zoomed ? "transform 0.1s ease-out" : "transform 0.4s ease",
              }}
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </motion.div>
        </AnimatePresence>

        {/* Zoom hint */}
        {!zoomed && (
          <div style={{ position: "absolute", bottom: 12, right: 12, backgroundColor: "rgba(250,250,247,0.85)", backdropFilter: "blur(4px)", padding: "4px 10px" }}>
            <p style={{ ...S.mono, fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B6B63", margin: 0 }}>Hover to zoom</p>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="product-gallery-thumbnails" style={{ display: "flex", gap: 8 }}>
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                position: "relative",
                width: 72, height: 72, flexShrink: 0,
                border: `2px solid ${i === active ? "#B8965A" : "transparent"}`,
                padding: 0, background: "none", cursor: "pointer",
                transition: "border-color 0.2s",
                backgroundColor: "#F5F0E8",
              }}
            >
              <Image
                src={img}
                alt={`${name} thumbnail ${i + 1}`}
                fill
                style={{ objectFit: "cover" }}
                sizes="72px"
              />
            </button>
          ))}
        </div>
      )}
      <style>{`
        @media (max-width: 520px) {
          .product-gallery { min-width: 0; max-width: 100%; }
          .product-gallery-thumbnails { max-width: 100%; overflow-x: auto; overscroll-behavior-x: contain; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
          .product-gallery-thumbnails::-webkit-scrollbar { display: none; }
        }
      `}</style>
    </div>
  );
}
