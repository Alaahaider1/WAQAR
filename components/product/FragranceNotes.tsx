"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { FragranceNote } from "@/lib/data/products";

const S = {
  display: { fontFamily: "'Cormorant Garamond', Georgia, serif" },
  body: { fontFamily: "'DM Sans', system-ui, sans-serif" },
  mono: { fontFamily: "'DM Mono', monospace" },
} as const;

const NOTE_LAYERS = [
  { key: "top" as const, label: "Top Notes", description: "First impression — the opening burst, lasting 15–30 min" },
  { key: "heart" as const, label: "Heart Notes", description: "The character — emerges as top notes fade, lasting 2–4 hrs" },
  { key: "base" as const, label: "Base Notes", description: "The soul — lingers longest on skin, 6–24+ hrs" },
];

type Props = {
  notes: FragranceNote;
  ingredients: string;
};

export function FragranceNotes({ notes, ingredients }: Props) {
  const [open, setOpen] = useState<string | null>("top");
  const [ingrOpen, setIngrOpen] = useState(false);

  return (
    <div>
      <p style={{ ...S.mono, fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 16 }}>
        Fragrance Notes
      </p>

      {/* Pyramid visual */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {NOTE_LAYERS.map((layer) => (
          <div
            key={layer.key}
            style={{ flex: 1, height: 3, backgroundColor: open === layer.key ? "#B8965A" : "#EDE8DC", transition: "background-color 0.2s", cursor: "pointer" }}
            onClick={() => setOpen(open === layer.key ? null : layer.key)}
          />
        ))}
      </div>

      {/* Accordion */}
      <div className="fragrance-notes-accordion" style={{ border: "1px solid #EDE8DC" }}>
        {NOTE_LAYERS.map((layer, idx) => (
          <div key={layer.key} style={{ borderBottom: idx < NOTE_LAYERS.length - 1 ? "1px solid #EDE8DC" : "none" }}>
            <button
              onClick={() => setOpen(open === layer.key ? null : layer.key)}
              className="fragrance-notes-trigger"
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "none", border: "none", cursor: "pointer" }}
            >
              <div className="fragrance-notes-label" style={{ textAlign: "left" }}>
                <p style={{ ...S.body, fontSize: 13, fontWeight: 500, color: "#1A1A18", margin: 0 }}>{layer.label}</p>
                <p style={{ ...S.mono, fontSize: 9, color: "#6B6B63", marginTop: 2, letterSpacing: "0.1em" }}>{layer.description}</p>
              </div>
              <motion.div animate={{ rotate: open === layer.key ? 45 : 0 }} transition={{ duration: 0.2 }}>
                <Plus size={14} strokeWidth={1.5} style={{ color: "#B8965A", flexShrink: 0 }} />
              </motion.div>
            </button>

            <AnimatePresence>
              {open === layer.key && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ padding: "0 16px 16px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {notes[layer.key].map((note) => (
                      <span className="fragrance-note-chip"
                        key={note}
                        style={{ padding: "4px 12px", backgroundColor: "#F5F0E8", border: "1px solid #EDE8DC", ...S.body, fontSize: 12, color: "#1A1A18" }}
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Ingredients accordion */}
      <div style={{ marginTop: 12, border: "1px solid #EDE8DC" }}>
        <button
          className="fragrance-notes-trigger"
          onClick={() => setIngrOpen((v) => !v)}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "none", border: "none", cursor: "pointer" }}
        >
          <p style={{ ...S.body, fontSize: 13, fontWeight: 500, color: "#1A1A18", margin: 0 }}>Full Ingredients</p>
          <motion.div animate={{ rotate: ingrOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
            <Plus size={14} strokeWidth={1.5} style={{ color: "#B8965A" }} />
          </motion.div>
        </button>
        <AnimatePresence>
          {ingrOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: "hidden" }}>
              <p className="product-detail-copy" style={{ ...S.body, fontSize: 12, color: "#6B6B63", lineHeight: 1.7, padding: "0 16px 16px", margin: 0 }}>{ingredients}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <style>{`
        @media (max-width: 520px) {
          .fragrance-notes-accordion, .fragrance-notes-accordion * { min-width: 0; max-width: 100%; box-sizing: border-box; }
          .fragrance-notes-trigger { gap: 12px; white-space: normal; text-align: left; }
          .fragrance-notes-label { flex: 1; overflow-wrap: anywhere; }
          .fragrance-notes-label p, .fragrance-note-chip, .product-detail-copy { overflow-wrap: anywhere; word-break: normal; }
          .fragrance-note-chip { max-width: 100%; }
        }
      `}</style>
    </div>
  );
}
