"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useStorefrontProducts } from "@/lib/hooks/useStorefrontProducts";
import { formatPrice } from "@/lib/utils/formatPrice";

const S = {
  b: { fontFamily: "'DM Sans', system-ui, sans-serif" },
  m: { fontFamily: "'DM Mono', monospace" },
  d: { fontFamily: "'Cormorant Garamond', Georgia, serif" },
} as const;

type Props = {
  onClose: () => void;
};

export function SearchDropdown({ onClose }: Props) {
  const router = useRouter();
  const { all: products } = useStorefrontProducts();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => query.trim().length >= 1
    ? products
        .filter((p) => {
          const q = query.toLowerCase();
          return (
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.tags.some((t) => t.includes(q))
          );
        })
        .slice(0, 7)
    : [], [products, query]);

  const go = useCallback((idx: number) => {
    const p = results[idx];
    if (p) {
      router.push(`/products/${p.id}`);
      onClose();
    }
  }, [results, router, onClose]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (cursor >= 0) {
        go(cursor);
      } else if (query.trim()) {
        router.push(`/products?q=${encodeURIComponent(query.trim())}`);
        onClose();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (cursor >= 0 && listRef.current) {
      const el = listRef.current.querySelector(`[data-idx="${cursor}"]`);
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [cursor]);

  const CATEGORY_LABELS: Record<string, string> = {
    summer: "Summer", winter: "Winter", bundle: "Gift Sets",
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 38, backgroundColor: "rgba(26,26,24,0.2)", backdropFilter: "blur(4px)" }}
      />

      {/* Search panel */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        style={{
          position: "fixed", top: 72, left: 0, right: 0, marginInline: "auto",
          zIndex: 39, width: "min(640px, calc(100vw - 24px))", boxSizing: "border-box", minWidth: 0,
          backgroundColor: "#FAFAF7",
          boxShadow: "0 16px 48px rgba(26,26,24,0.14)",
          border: "1px solid #EDE8DC",
        }}
      >
        {/* Input */}
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(6px, 2vw, 12px)", padding: "14px clamp(10px, 4vw, 18px)", minWidth: 0, boxSizing: "border-box", borderBottom: results.length > 0 ? "1px solid #EDE8DC" : "none" }}>
          <Search size={15} strokeWidth={1.5} style={{ color: "#6B6B63", flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setCursor(-1); }}
            onKeyDown={handleKey}
            placeholder="Search fragrances, notes, tags…"
            style={{ flex: "1 1 0%", minWidth: 0, width: 0, background: "none", border: "none", outline: "none", ...S.b, fontSize: 15, color: "#1A1A18" }}
          />
          {query && (
            <button onClick={() => { setQuery(""); setCursor(-1); inputRef.current?.focus(); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6B63", padding: 2, display: "flex" }}>
              <X size={14} strokeWidth={1.5} />
            </button>
          )}
          <button onClick={onClose}
            style={{ ...S.m, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#6B6B63", background: "none", border: "none", cursor: "pointer", paddingLeft: 8, borderLeft: "1px solid #EDE8DC", flexShrink: 0 }}>
            ESC
          </button>
        </div>

        {/* Results */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              ref={listRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ maxHeight: 380, overflowY: "auto" }}
            >
              {results.map((p, i) => {
                const active = cursor === i;
                return (
                  <div
                    key={p.id}
                    data-idx={i}
                    onClick={() => go(i)}
                    onMouseEnter={() => setCursor(i)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "12px 18px",
                      backgroundColor: active ? "#F5F0E8" : "transparent",
                      borderBottom: i < results.length - 1 ? "1px solid #EDE8DC" : "none",
                      cursor: "pointer", transition: "background-color 0.12s",
                    }}
                  >
                    {/* Product image */}
                    <div style={{ width: 44, height: 44, backgroundColor: "#F5F0E8", flexShrink: 0, position: "relative", overflow: "hidden" }}>
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        style={{ objectFit: "cover" }}
                        sizes="44px"
                      />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ ...S.b, fontSize: 14, fontWeight: 500, color: "#1A1A18", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {highlightMatch(p.name, query)}
                      </p>
                      <p style={{ ...S.m, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#B8965A", margin: "2px 0 0" }}>
                        {CATEGORY_LABELS[p.category] ?? p.category}
                      </p>
                    </div>

                    {/* Price */}
                    <span style={{ ...S.m, fontSize: 13, color: "#1A1A18", flexShrink: 0 }}>
                      {formatPrice(p.price)}
                    </span>

                    {active && <ArrowRight size={12} strokeWidth={1.5} style={{ color: "#B8965A", flexShrink: 0 }} />}
                  </div>
                );
              })}

              {/* View all results link */}
              {query.trim() && (
                <div
                  onClick={() => { router.push(`/products?q=${encodeURIComponent(query.trim())}`); onClose(); }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 18px", borderTop: "1px solid #EDE8DC", cursor: "pointer", backgroundColor: cursor === results.length ? "#F5F0E8" : "transparent" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F5F0E8")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <span style={{ ...S.m, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#B8965A" }}>
                    View all results for &ldquo;{query}&rdquo;
                  </span>
                  <ArrowRight size={10} style={{ color: "#B8965A" }} />
                </div>
              )}
            </motion.div>
          )}

          {query.trim() && results.length === 0 && (
            <div style={{ padding: "24px 18px", textAlign: "center" }}>
              <p style={{ ...S.d, fontSize: 18, fontWeight: 300, color: "#1A1A18", marginBottom: 6 }}>No results for &ldquo;{query}&rdquo;</p>
              <p style={{ ...S.b, fontSize: 13, color: "#6B6B63" }}>Try a different search term or browse all fragrances.</p>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} style={{ backgroundColor: "rgba(184,150,90,0.18)", color: "#1A1A18", padding: "0 1px" }}>{part}</mark>
      : part
  );
}
