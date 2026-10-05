"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Search, Plus, X, ArrowRight } from "lucide-react";
import { faqs, faqCategories } from "@/lib/data/faqs";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/FadeIn";

const S = {
  display: { fontFamily: "'Cormorant Garamond', Georgia, serif" },
  body: { fontFamily: "'DM Sans', system-ui, sans-serif" },
  mono: { fontFamily: "'DM Mono', monospace" },
} as const;

export function FAQClient() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const filtered = useMemo(() => {
    let list = [...faqs];
    if (activeCategory !== "all") {
      list = list.filter((f) => f.category === activeCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (f) =>
          f.question.toLowerCase().includes(q) ||
          f.answer.toLowerCase().includes(q)
      );
    }
    return list;
  }, [query, activeCategory]);

  // Reset open item when filter changes
  const handleCategory = (id: string) => {
    setActiveCategory(id);
    setOpenId(null);
  };

  const handleQuery = (v: string) => {
    setQuery(v);
    setOpenId(null);
  };

  return (
    <>
      {/* ── Page Hero ── */}
      <div style={{ paddingTop: 88, backgroundColor: "#FAFAF7" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 40px 48px" }}>
          <p style={{ ...S.mono, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 14 }}>
            Help Centre
          </p>
          <h1 style={{ ...S.display, fontSize: "clamp(2.4rem, 5vw, 4rem)", fontWeight: 300, color: "#1A1A18", lineHeight: 1.05, margin: "0 0 16px" }}>
            Frequently Asked <em>Questions</em>
          </h1>
          <p style={{ ...S.body, fontSize: 14, color: "#6B6B63", lineHeight: 1.8, maxWidth: 500, margin: 0 }}>
            Everything you need to know about our fragrances, orders, and service. Can&apos;t find an answer?{" "}
            <Link href="/contact" style={{ color: "#B8965A", textDecoration: "none", borderBottom: "1px solid #B8965A" }}>
              Contact us directly.
            </Link>
          </p>
        </div>
        <GoldDivider />
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 40px 80px" }}>

        {/* ── Search Bar ── */}
        <FadeIn style={{ maxWidth: 600, margin: "0 auto 48px" }}>
          <div style={{ position: "relative" }}>
            <Search
              size={15}
              strokeWidth={1.5}
              style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#6B6B63", pointerEvents: "none" }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search questions…"
              style={{
                width: "100%", boxSizing: "border-box",
                paddingLeft: 44, paddingRight: query ? 40 : 16,
                paddingTop: 13, paddingBottom: 13,
                border: `1px solid ${searchFocused ? "#B8965A" : "#EDE8DC"}`,
                backgroundColor: "#FAFAF7",
                ...S.body, fontSize: 14, color: "#1A1A18",
                outline: "none", transition: "border-color 0.2s",
              }}
            />
            {query && (
              <button
                onClick={() => handleQuery("")}
                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6B6B63", padding: 2, display: "flex", alignItems: "center" }}
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            )}
          </div>
          {query && (
            <p style={{ ...S.mono, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#6B6B63", marginTop: 10, textAlign: "center" }}>
              {filtered.length} {filtered.length === 1 ? "result" : "results"} for &ldquo;{query}&rdquo;
            </p>
          )}
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 56, alignItems: "flex-start" }} className="faq-layout">

          {/* ── Category Sidebar ── */}
          <FadeIn direction="left" className="faq-sidebar">
            <div style={{ position: "sticky", top: 100 }}>
              <p style={{ ...S.mono, fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 14 }}>
                Categories
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {faqCategories.map((cat) => {
                  const count = cat.id === "all" ? faqs.length : faqs.filter((f) => f.category === cat.id).length;
                  const active = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategory(cat.id)}
                      style={{
                        textAlign: "left", padding: "9px 12px",
                        background: "none", border: "none", cursor: "pointer",
                        borderLeft: `2px solid ${active ? "#B8965A" : "transparent"}`,
                        backgroundColor: active ? "#F5F0E8" : "transparent",
                        transition: "all 0.2s",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <span style={{ ...S.body, fontSize: 13, color: active ? "#B8965A" : "#1A1A18", transition: "color 0.2s" }}>
                        {cat.label}
                      </span>
                      <span style={{ ...S.mono, fontSize: 9, color: active ? "#B8965A" : "#6B6B63", backgroundColor: active ? "rgba(184,150,90,0.12)" : "#F5F0E8", padding: "1px 6px", borderRadius: 99, transition: "all 0.2s" }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile category scroll — rendered via CSS */}
              <div style={{ width: "100%", height: 1, backgroundColor: "#EDE8DC", margin: "20px 0" }} />

              <div>
                <p style={{ ...S.mono, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 10 }}>Still need help?</p>
                <Link
                  href="/contact"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, ...S.mono, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#1A1A18", textDecoration: "none", borderBottom: "1px solid #1A1A18", paddingBottom: 1, transition: "color 0.2s, border-color 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#B8965A"; e.currentTarget.style.borderBottomColor = "#B8965A"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#1A1A18"; e.currentTarget.style.borderBottomColor = "#1A1A18"; }}
                >
                  Contact Us <ArrowRight size={10} />
                </Link>
              </div>
            </div>
          </FadeIn>

          {/* ── FAQ Accordion ── */}
          <div>
            {/* Mobile category pills */}
            <div className="faq-pills" style={{ display: "none", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
              {faqCategories.map((cat) => {
                const active = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategory(cat.id)}
                    style={{
                      padding: "6px 14px", border: `1px solid ${active ? "#B8965A" : "#EDE8DC"}`,
                      backgroundColor: active ? "#B8965A" : "#FAFAF7",
                      color: active ? "#FAFAF7" : "#1A1A18",
                      ...S.mono, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase",
                      cursor: "pointer", transition: "all 0.2s",
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {filtered.length === 0 ? (
                /* Empty state */
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ textAlign: "center", padding: "64px 24px" }}
                >
                  <p style={{ ...S.display, fontSize: 36, fontWeight: 300, color: "#EDE8DC", marginBottom: 12 }}>∅</p>
                  <p style={{ ...S.display, fontSize: 22, fontWeight: 300, color: "#1A1A18", marginBottom: 8 }}>No results found</p>
                  <p style={{ ...S.body, fontSize: 14, color: "#6B6B63", marginBottom: 24 }}>
                    Try different keywords or{" "}
                    <button onClick={() => { handleQuery(""); handleCategory("all"); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#B8965A", ...S.body, fontSize: 14, textDecoration: "underline", padding: 0 }}>
                      clear all filters
                    </button>
                    .
                  </p>
                  <Link href="/contact"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#1A1A18", color: "#FAFAF7", padding: "11px 24px", textDecoration: "none", ...S.mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" }}
                  >
                    Ask Us Directly <ArrowRight size={11} />
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  key={`${activeCategory}-${query}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <StaggerContainer style={{ borderTop: "1px solid #EDE8DC" }}>
                    {filtered.map((faq, i) => (
                      <StaggerItem key={faq.id}>
                        <div style={{ borderBottom: "1px solid #EDE8DC" }}>
                          <button
                            onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                            style={{
                              width: "100%", display: "flex", alignItems: "flex-start",
                              justifyContent: "space-between", gap: 20,
                              padding: "20px 0", background: "none", border: "none",
                              cursor: "pointer", textAlign: "left",
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              {/* Category tag if "all" selected */}
                              {activeCategory === "all" && !query && (
                                <span style={{ ...S.mono, fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "#B8965A", display: "block", marginBottom: 4 }}>
                                  {faqCategories.find((c) => c.id === faq.category)?.label}
                                </span>
                              )}
                              {/* Highlight matching query */}
                              <p style={{ ...S.body, fontSize: 15, fontWeight: 500, color: "#1A1A18", margin: 0, lineHeight: 1.45 }}>
                                {query.trim()
                                  ? highlightText(faq.question, query)
                                  : faq.question}
                              </p>
                            </div>
                            <motion.div
                              animate={{ rotate: openId === faq.id ? 45 : 0 }}
                              transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                              style={{ flexShrink: 0, marginTop: 2 }}
                            >
                              <Plus size={16} strokeWidth={1.5} style={{ color: "#B8965A" }} />
                            </motion.div>
                          </button>

                          <AnimatePresence>
                            {openId === faq.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
                                style={{ overflow: "hidden" }}
                              >
                                <p style={{ ...S.body, fontSize: 14, color: "#6B6B63", lineHeight: 1.85, paddingBottom: 22, paddingRight: 40, margin: 0 }}>
                                  {query.trim()
                                    ? highlightText(faq.answer, query)
                                    : faq.answer}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>

                  {/* Result count footer */}
                  {filtered.length > 0 && (
                    <p style={{ ...S.mono, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#6B6B63", marginTop: 24 }}>
                      Showing {filtered.length} of {faqs.length} questions
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── CTA Banner ── */}
      <div style={{ backgroundColor: "#F5F0E8" }}>
        <GoldDivider />
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 40px" }}>
          <FadeIn style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
            <div>
              <p style={{ ...S.mono, fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 10 }}>
                Still have questions?
              </p>
              <h2 style={{ ...S.display, fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 300, color: "#1A1A18", margin: 0 }}>
                Our team is here to help
              </h2>
            </div>
            <Link
              href="/contact"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "#1A1A18", color: "#FAFAF7", padding: "13px 28px", textDecoration: "none", ...S.mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", flexShrink: 0, transition: "background-color 0.3s" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#6B6B63")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#1A1A18")}
            >
              Contact WAQAR <ArrowRight size={12} />
            </Link>
          </FadeIn>
        </div>
        <GoldDivider />
      </div>

      <style>{`
        .faq-layout { grid-template-columns: 200px 1fr; }
        .faq-sidebar { display: block; }
        .faq-pills { display: none; }
        @media (max-width: 768px) {
          .faq-layout { grid-template-columns: 1fr !important; }
          .faq-sidebar { display: none !important; }
          .faq-pills { display: flex !important; }
        }
      `}</style>
    </>
  );
}

/* Utility: wrap matching text in a highlight span */
function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} style={{ backgroundColor: "rgba(184,150,90,0.18)", color: "#1A1A18", padding: "0 1px" }}>
        {part}
      </mark>
    ) : part
  );
}
