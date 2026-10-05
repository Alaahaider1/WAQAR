"use client";

import { useState, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { useStorefrontProducts } from "@/lib/hooks/useStorefrontProducts";
import { ProductCard } from "@/components/products/ProductCard";
import { PageHero } from "@/components/ui/PageHero";
import { GoldDivider } from "@/components/ui/GoldDivider";

const SORT_OPTIONS = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "newest", label: "Newest First" },
  { id: "rating", label: "Best Rated" },
];

const PER_PAGE = 9;

const S = {
  display: { fontFamily: "'Cormorant Garamond', Georgia, serif" },
  body: { fontFamily: "'DM Sans', system-ui, sans-serif" },
  mono: { fontFamily: "'DM Mono', monospace" },
} as const;

type CollectionCategory = {
  id: string;
  label: string;
};

export default function ProductsPageClient({ categories }: { categories: CollectionCategory[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { all: products } = useStorefrontProducts();
  const collections = useMemo(
    () => [{ id: "all", label: "All Fragrances" }, ...categories],
    [categories]
  );

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "all");
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState(1);
  const [searchFocused, setSearchFocused] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("category");
    else params.set("category", value);
    router.replace(`${pathname}${params.size ? `?${params.toString()}` : ""}`);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    setPage(1);
  };

  const filtered = useMemo(() => {
    let list = [...products];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q))
      );
    }

    if (category !== "all") {
      list = list.filter((p) => p.category === category);
    }

    switch (sort) {
      case "price-asc":  list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      case "newest":     list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
      case "rating":     list.sort((a, b) => b.rating - a.rating); break;
    }

    return list;
  }, [query, category, sort, products]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const currentSort = SORT_OPTIONS.find((s) => s.id === sort) ?? SORT_OPTIONS[0];
  const currentCategory = collections.find((c) => c.id === category) ?? collections[0];

  return (
    <>
      <PageHero
        eyebrow="Our Collections"
        title="All Fragrances"
        subtitle="Twenty singular worlds. Each one a story written in scent."
      />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 40px 80px" }}>

        {/* ── Toolbar ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>

          {/* Search input */}
          <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
            <Search size={14} strokeWidth={1.5} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6B6B63", pointerEvents: "none" }} />
            <input
              type="text"
              name="q"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search fragrances…"
              style={{
                width: "100%", boxSizing: "border-box",
                paddingLeft: 40, paddingRight: query ? 36 : 16, paddingTop: 10, paddingBottom: 10,
                border: `1px solid ${searchFocused ? "#B8965A" : "#EDE8DC"}`,
                backgroundColor: "#FAFAF7",
                ...S.body, fontSize: 13, color: "#1A1A18",
                outline: "none", transition: "border-color 0.2s",
              }}
            />
            {query && (
              <button onClick={() => handleQueryChange("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6B6B63", padding: 2 }}>
                <X size={13} strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setFiltersOpen(true)}
            className="lg-hide"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", border: "1px solid #EDE8DC", background: "#FAFAF7", cursor: "pointer", ...S.mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#1A1A18" }}
          >
            <SlidersHorizontal size={13} strokeWidth={1.5} /> Filter
          </button>

          {/* Sort dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setSortOpen((v) => !v)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", border: "1px solid #EDE8DC", background: "#FAFAF7", cursor: "pointer", ...S.mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#1A1A18", whiteSpace: "nowrap" }}
            >
              <ArrowUpDown size={12} strokeWidth={1.5} />
              {currentSort.label}
            </button>
            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 20, backgroundColor: "#FAFAF7", border: "1px solid #EDE8DC", boxShadow: "0 8px 32px rgba(26,26,24,0.08)", minWidth: 200 }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => { handleSortChange(opt.id); setSortOpen(false); }}
                      style={{
                        display: "block", width: "100%", textAlign: "left", padding: "11px 16px",
                        background: opt.id === sort ? "#F5F0E8" : "none", border: "none", cursor: "pointer",
                        ...S.body, fontSize: 13, color: opt.id === sort ? "#B8965A" : "#1A1A18",
                        borderBottom: "1px solid rgba(237,232,220,0.5)",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Result count */}
          <p style={{ ...S.mono, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#6B6B63", marginLeft: "auto" }}>
            {filtered.length} {filtered.length === 1 ? "result" : "results"}
          </p>
        </div>

        <div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>

          {/* ── Sidebar Filters (desktop) ── */}
          <aside style={{ width: 200, flexShrink: 0 }} className="sidebar-desktop">
            <p style={{ ...S.mono, fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 16 }}>
              Collections
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {collections.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  style={{
                    textAlign: "left", padding: "9px 12px", background: "none", border: "none", cursor: "pointer",
                    ...S.body, fontSize: 13,
                    color: category === cat.id ? "#B8965A" : "#1A1A18",
                    backgroundColor: category === cat.id ? "#F5F0E8" : "transparent",
                    borderLeft: `2px solid ${category === cat.id ? "#B8965A" : "transparent"}`,
                    transition: "all 0.2s",
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div style={{ width: "100%", height: 1, backgroundColor: "#EDE8DC", margin: "24px 0" }} />

            {/* Active filter pills */}
            {(query || category !== "all") && (
              <div>
                <p style={{ ...S.mono, fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 12 }}>Active Filters</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {query && (
                    <button onClick={() => handleQueryChange("")} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", backgroundColor: "#F5F0E8", border: "1px solid #EDE8DC", cursor: "pointer", ...S.mono, fontSize: 9, color: "#1A1A18" }}>
                      &ldquo;{query}&rdquo; <X size={10} strokeWidth={2} />
                    </button>
                  )}
                  {category !== "all" && (
                    <button onClick={() => handleCategoryChange("all")} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", backgroundColor: "#F5F0E8", border: "1px solid #EDE8DC", cursor: "pointer", ...S.mono, fontSize: 9, color: "#1A1A18" }}>
                      {currentCategory.label} <X size={10} strokeWidth={2} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </aside>

          {/* ── Product Grid ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <AnimatePresence mode="wait">
              {paginated.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ textAlign: "center", padding: "80px 24px" }}
                >
                  <p style={{ ...S.display, fontSize: 40, fontWeight: 300, color: "#EDE8DC", marginBottom: 16 }}>∅</p>
                  <p style={{ ...S.display, fontSize: 24, fontWeight: 300, color: "#1A1A18", marginBottom: 8 }}>No fragrances found</p>
                  <p style={{ ...S.body, fontSize: 14, color: "#6B6B63", marginBottom: 28 }}>Try adjusting your search or filter criteria</p>
                  <button
                    onClick={() => { setQuery(""); handleCategoryChange("all"); }}
                    style={{ padding: "11px 28px", backgroundColor: "#1A1A18", color: "#FAFAF7", border: "none", cursor: "pointer", ...S.mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" }}
                  >
                    Clear All Filters
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key={`${query}-${category}-${sort}-${page}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}
                  className="product-grid"
                >
                  {paginated.map((product, i) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Pagination ── */}
            {totalPages > 1 && paginated.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 56 }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ padding: "8px 10px", border: "1px solid #EDE8DC", background: "#FAFAF7", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1, color: "#1A1A18" }}
                >
                  <ChevronLeft size={14} strokeWidth={1.5} />
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const pg = i + 1;
                  const isActive = pg === page;
                  const isNear = Math.abs(pg - page) <= 1 || pg === 1 || pg === totalPages;
                  if (!isNear) {
                    if (pg === 2 && page > 3) return <span key={pg} style={{ ...S.mono, fontSize: 11, color: "#6B6B63", padding: "0 4px" }}>…</span>;
                    if (pg === totalPages - 1 && page < totalPages - 2) return <span key={pg} style={{ ...S.mono, fontSize: 11, color: "#6B6B63", padding: "0 4px" }}>…</span>;
                    return null;
                  }
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      style={{
                        width: 36, height: 36, border: isActive ? "1px solid #B8965A" : "1px solid #EDE8DC",
                        backgroundColor: isActive ? "#B8965A" : "#FAFAF7",
                        color: isActive ? "#FAFAF7" : "#1A1A18",
                        cursor: "pointer",
                        ...S.mono, fontSize: 11, letterSpacing: "0.05em",
                        transition: "all 0.2s",
                      }}
                    >
                      {pg}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{ padding: "8px 10px", border: "1px solid #EDE8DC", background: "#FAFAF7", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1, color: "#1A1A18" }}
                >
                  <ChevronRight size={14} strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div onClick={() => setFiltersOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 40, backgroundColor: "rgba(26,26,24,0.2)", backdropFilter: "blur(4px)" }} />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              style={{ position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 50, width: 280, backgroundColor: "#FAFAF7", boxShadow: "8px 0 40px rgba(26,26,24,0.1)", display: "flex", flexDirection: "column" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 24px 20px", borderBottom: "1px solid #EDE8DC" }}>
                <span style={{ ...S.display, fontSize: 20, fontWeight: 300, color: "#1A1A18" }}>Filters</span>
                <button onClick={() => setFiltersOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6B63" }}><X size={18} strokeWidth={1.5} /></button>
              </div>
              <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
                <p style={{ ...S.mono, fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 14 }}>Collections</p>
                {collections.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { handleCategoryChange(cat.id); setFiltersOpen(false); }}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 14px", background: category === cat.id ? "#F5F0E8" : "none", border: "none", borderLeft: `2px solid ${category === cat.id ? "#B8965A" : "transparent"}`, cursor: "pointer", ...S.body, fontSize: 14, color: category === cat.id ? "#B8965A" : "#1A1A18", marginBottom: 2 }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <GoldDivider />

      <style>{`
        @media (max-width: 1024px) { .sidebar-desktop { display: none !important; } .lg-hide { display: flex !important; } .product-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (min-width: 1024px) { .lg-hide { display: none !important; } }
        @media (max-width: 520px) { .product-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </>
  );
}
