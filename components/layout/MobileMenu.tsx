"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X } from "lucide-react";
import { useEffect } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Collections" },
  { href: "/products", label: "Best Sellers" },
  { href: "/products?category=bundle", label: "Gift Sets" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
];

type MobileMenuProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "fixed", inset: 0, zIndex: 40,
              backgroundColor: "rgba(26,26,24,0.18)",
              backdropFilter: "blur(4px)",
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              position: "fixed", right: 0, top: 0, zIndex: 50,
              height: "100%", width: 320, maxWidth: "85vw",
              backgroundColor: "#FAFAF7",
              boxShadow: "-8px 0 48px rgba(26,26,24,0.1)",
              display: "flex", flexDirection: "column",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "24px 32px",
              borderBottom: "1px solid #EDE8DC",
            }}>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
                <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 300, letterSpacing: "0.1em", color: "#1A1A18" }}>WAQAR</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: "0.4em", textTransform: "uppercase", color: "#B8965A", marginTop: -2 }}>PERFUMES</span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close menu"
                style={{ padding: 6, background: "none", border: "none", cursor: "pointer", color: "#1A1A18", opacity: 0.7 }}
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Nav links */}
            <nav style={{ flex: 1, padding: "32px" }}>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {navLinks.map((link, i) => (
                  <motion.li
                    key={`${link.href}-${link.label}`}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.05, duration: 0.35 }}
                  >
                    <Link
                      href={link.href}
                      onClick={onClose}
                      style={{
                        display: "block",
                        padding: "14px 0",
                        fontFamily: "'DM Sans', system-ui, sans-serif",
                        fontSize: 15,
                        color: "#1A1A18",
                        textDecoration: "none",
                        borderBottom: "1px solid rgba(237,232,220,0.6)",
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#6B6B63")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#1A1A18")}
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </nav>

            {/* Footer tag */}
            <div style={{ padding: "24px 32px", borderTop: "1px solid #EDE8DC" }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6B6B63" }}>
                Luxury Perfumery
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6B6B63", marginTop: 4 }}>
                Est. 1987
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
