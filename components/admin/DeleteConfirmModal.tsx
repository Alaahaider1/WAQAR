"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

const S = {
  display: { fontFamily: "'Cormorant Garamond', Georgia, serif" },
  body: { fontFamily: "'DM Sans', system-ui, sans-serif" },
  mono: { fontFamily: "'DM Mono', monospace" },
} as const;

type Props = {
  isOpen: boolean;
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteConfirmModal({ isOpen, productName, onConfirm, onCancel }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
            style={{ position: "fixed", inset: 0, zIndex: 50, backgroundColor: "rgba(26,26,24,0.4)", backdropFilter: "blur(4px)" }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              position: "fixed", top: "50%", left: "50%", zIndex: 51,
              transform: "translate(-50%, -50%)",
              width: "min(440px, calc(100vw - 32px))",
              backgroundColor: "#FAFAF7",
              boxShadow: "0 24px 64px rgba(26,26,24,0.16)",
              padding: "32px",
            }}
          >
            {/* Icon */}
            <div style={{ width: 48, height: 48, backgroundColor: "rgba(204,68,68,0.08)", border: "1px solid rgba(204,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <AlertTriangle size={20} strokeWidth={1.5} style={{ color: "#cc4444" }} />
            </div>

            <p style={{ ...S.mono, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#cc4444", marginBottom: 8 }}>
              Confirm Deletion
            </p>
            <h2 style={{ ...S.display, fontSize: 24, fontWeight: 300, color: "#1A1A18", margin: "0 0 12px", lineHeight: 1.2 }}>
              Delete &ldquo;{productName}&rdquo;?
            </h2>
            <p style={{ ...S.body, fontSize: 13, color: "#6B6B63", lineHeight: 1.75, margin: "0 0 28px" }}>
              This action cannot be undone. The product will be permanently removed from the catalogue and all collections.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={onCancel}
                style={{ flex: 1, padding: "11px 0", border: "1px solid #EDE8DC", backgroundColor: "#F5F0E8", cursor: "pointer", ...S.mono, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#1A1A18", transition: "background-color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#EDE8DC")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#F5F0E8")}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                style={{ flex: 1, padding: "11px 0", border: "1px solid #cc4444", backgroundColor: "#cc4444", cursor: "pointer", ...S.mono, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#FAFAF7", transition: "background-color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#aa3333")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#cc4444")}
              >
                Delete Product
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
