"use client";

import Link from "next/link";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { Globe, Mail, Phone } from "lucide-react";

const collections = [
  { label: "Summer Collection", href: "/products?category=summer" },
  { label: "Winter Collection", href: "/products?category=winter" },
  { label: "Best Sellers", href: "/products?filter=best-sellers" },
  { label: "Gift Sets", href: "/products?category=bundles" },
  { label: "New Arrivals", href: "/products?filter=new-arrivals" },
];
const information = [
  { label: "Our Story", href: "/#brand-story" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact Us", href: "/contact" },
  { label: "Shipping & Returns", href: "/faq" },
  { label: "Privacy Policy", href: "/privacy" },
];

export function Footer() {
  return (
    <footer style={{ backgroundColor: "#F5F0E8" }}>
      <GoldDivider />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px" }}>
        {/* Main grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr 1.3fr",
          gap: 48,
          padding: "64px 0",
        }} className="footer-grid">

          {/* Brand */}
          <div>
            <Link href="/" style={{ display: "flex", flexDirection: "column", lineHeight: 1, textDecoration: "none", marginBottom: 20 }}>
              <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 300, letterSpacing: "0.12em", color: "#1A1A18" }}>WAQAR</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: "#B8965A", marginTop: -2 }}>PERFUMES</span>
            </Link>
            <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, color: "#6B6B63", lineHeight: 1.75, maxWidth: 240 }}>
              Fine French perfumery. Each fragrance is crafted with the rarest natural ingredients, distilled into a singular sensory experience.
            </p>
            <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
              {[
                { href: "https://maisonlumiere.com", Icon: Globe, label: "Website" },
                { href: "mailto:hello@maisonlumiere.com", Icon: Mail, label: "Email" },
                { href: "tel:+33123456789", Icon: Phone, label: "Phone" },
              ].map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  style={{ color: "#6B6B63", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#B8965A")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#6B6B63")}
                >
                  <Icon size={16} strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          {/* Collections */}
          <div>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 20 }}>
              Collections
            </p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {collections.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, color: "#1A1A18", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#B8965A")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#1A1A18")}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Information */}
          <div>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 20 }}>
              Information
            </p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {information.map((link) => (
                <li key={`${link.label}-${link.href}`}>
                  <Link
                    href={link.href}
                    style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, color: "#1A1A18", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#B8965A")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#1A1A18")}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 20 }}>
              Newsletter
            </p>
            <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, color: "#6B6B63", lineHeight: 1.75, marginBottom: 20 }}>
              Receive exclusive previews of new fragrances and private sale access.
            </p>
            <form style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                type="email"
                placeholder="Your email address"
                style={{
                  backgroundColor: "#FAFAF7",
                  border: "1px solid #EDE8DC",
                  padding: "11px 16px",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: 13,
                  color: "#1A1A18",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => (e.target.style.borderColor = "#B8965A")}
                onBlur={e => (e.target.style.borderColor = "#EDE8DC")}
              />
              <button
                type="submit"
                style={{
                  backgroundColor: "#1A1A18",
                  color: "#FAFAF7",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 9,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  padding: "11px 0",
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#6B6B63")}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1A1A18")}
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <GoldDivider />

        {/* Bottom bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B6B63", margin: 0 }}>
            © {new Date().getFullYear()} WAQAR. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: 24 }}>
            {["Privacy", "Terms"].map((label) => (
              <Link
                key={label}
                href={`/${label.toLowerCase()}`}
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B6B63", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#B8965A")}
                onMouseLeave={e => (e.currentTarget.style.color = "#6B6B63")}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) { .footer-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 640px) { .footer-grid { grid-template-columns: 1fr !important; gap: 32px !important; } }
      `}</style>
    </footer>
  );
}
