"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useSyncExternalStore } from "react";
import { ShoppingBag, Search, Menu, User } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/store/cartStore";
import { MobileMenu } from "./MobileMenu";
import { SearchDropdown } from "@/components/ui/SearchDropdown";

const S = {
  d: { fontFamily: "'Cormorant Garamond', Georgia, serif" },
  m: { fontFamily: "'DM Mono', monospace" },
  b: { fontFamily: "'DM Sans', system-ui, sans-serif" },
} as const;

const navLinks = [
  { href: "/products", label: "Collections" },
  { href: "/products?category=summer", label: "Summer" },
  { href: "/products?category=winter", label: "Winter" },
  { href: "/products?category=bundle", label: "Gift Sets" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const totalItems = useCartStore((s) => (mounted ? s.totalItems() : 0));
  const cartCount = totalItems;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 30,
          transition: "background-color 0.5s, box-shadow 0.5s",
          backgroundColor: scrolled ? "rgba(250,250,247,0.96)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          boxShadow: scrolled ? "0 1px 0 rgba(237,232,220,0.9)" : "none",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 clamp(16px,4vw,40px)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>

            {/* Logo */}
            <Link href="/" aria-label="WAQAR Perfumes home" style={{ display: "flex", alignItems: "center", lineHeight: 1, textDecoration: "none", flexShrink: 0 }}>
              <Image src="/waqaar-logo.png" alt="WAQAR Perfumes" width={64} height={64} priority style={{ width: 64, height: 64, objectFit: "contain" }} />
            </Link>

            {/* Desktop Nav */}
            <nav style={{ display: "flex", alignItems: "center", gap: 28 }} className="nav-desktop">
    {navLinks.map((link) => (
  <Link
    key={`${link.label}-${link.href}`}
    href={link.href}
    style={{
      ...S.b,
      fontSize: 11,
      letterSpacing: "0.15em",
      textTransform: "uppercase",
      color: "#6B6B63",
      textDecoration: "none",
      position: "relative",
      paddingBottom: 4,
      transition: "color 0.2s",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.color = "#1A1A18")}
    onMouseLeave={(e) => (e.currentTarget.style.color = "#6B6B63")}
  >
    {link.label}
  </Link>
))}
            </nav>

            {/* Right Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                style={{ padding: 10, background: "none", border: "none", cursor: "pointer", color: "#1A1A18", transition: "color 0.2s", display: "flex", alignItems: "center" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#6B6B63")}
                onMouseLeave={e => (e.currentTarget.style.color = "#1A1A18")}
              >
                <Search size={18} strokeWidth={1.5} />
              </button>

              {/* Cart */}
              <Link href="/cart" aria-label={mounted ? `Cart — ${cartCount} items` : "Cart"}
                style={{ position: "relative", padding: 10, color: "#1A1A18", transition: "color 0.2s", display: "flex", alignItems: "center" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#6B6B63")}
                onMouseLeave={e => (e.currentTarget.style.color = "#1A1A18")}
              >
                <ShoppingBag size={18} strokeWidth={1.5} />
                <AnimatePresence>
                  {mounted && cartCount > 0 && (
                    <span style={{ position: "absolute", top: 4, right: 4, width: 16, height: 16, borderRadius: "50%", backgroundColor: "#B8965A", color: "#FAFAF7", fontSize: 9, fontFamily: "'DM Mono', monospace", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </AnimatePresence>
              </Link>

              {/* Login */}
              <Link href="/login" aria-label="Login"
                style={{ padding: 10, color: "#1A1A18", transition: "color 0.2s", display: "flex", alignItems: "center" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#6B6B63")}
                onMouseLeave={e => (e.currentTarget.style.color = "#1A1A18")}
              >
                <User size={18} strokeWidth={1.5} />
              </Link>

              {/* Mobile menu toggle */}
              <button onClick={() => setMobileOpen(true)} aria-label="Open menu"
                className="nav-mobile-btn"
                style={{ padding: 10, background: "none", border: "none", cursor: "pointer", color: "#1A1A18", marginLeft: 4, display: "none", alignItems: "center" }}
              >
                <Menu size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search Dropdown */}
      <AnimatePresence>
        {searchOpen && <SearchDropdown onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>

      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <style>{`
        .nav-desktop { display: flex !important; }
        .nav-mobile-btn { display: none !important; }
        @media (max-width: 900px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
