"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ProductGalleryProps = {
  images: string[];
  name: string;
};

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [active, setActive] = useState(0);

  return (
      <div className="product-gallery" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Main image */}
      <div
        className="product-gallery-main-image"
        style={{
          position: "relative",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ position: "relative", width: "100%" }}
          >
            <img
              src={images[active]}
              alt={`${name} — view ${active + 1}`}
              fetchPriority={active === 0 ? "high" : undefined}
              style={{ display: "block", width: "100%", height: "auto" }}
            />
          </motion.div>
        </AnimatePresence>
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
                width: 72, flexShrink: 0,
                border: `2px solid ${i === active ? "#B8965A" : "transparent"}`,
                padding: 0, background: "none", cursor: "pointer",
                transition: "border-color 0.2s",
              }}
            >
              <img
                src={img}
                alt={`${name} thumbnail ${i + 1}`}
                style={{ display: "block", width: "100%", height: "auto" }}
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
