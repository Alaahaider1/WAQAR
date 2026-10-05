import Link from "next/link";

const S = {
  d: { fontFamily: "'Cormorant Garamond', Georgia, serif" },
  b: { fontFamily: "'DM Sans', system-ui, sans-serif" },
  m: { fontFamily: "'DM Mono', monospace" },
} as const;

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FAFAF7", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <p style={{ ...S.m, fontSize: 80, fontWeight: 300, color: "#EDE8DC", lineHeight: 1, margin: "0 0 8px", letterSpacing: "-0.02em" }}>404</p>
        <div style={{ width: 40, height: 1, backgroundColor: "#B8965A", opacity: 0.5, margin: "0 auto 24px" }} />
        <h1 style={{ ...S.d, fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 300, color: "#1A1A18", margin: "0 0 12px" }}>
          Page Not Found
        </h1>
        <p style={{ ...S.b, fontSize: 14, color: "#6B6B63", lineHeight: 1.75, margin: "0 0 36px" }}>
          The page you are looking for does not exist or has been moved. Let us help you find what you need.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "#1A1A18", color: "#FAFAF7", padding: "12px 28px", textDecoration: "none", ...S.m, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Return Home
          </Link>
          <Link href="/products" style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid #1A1A18", color: "#1A1A18", padding: "12px 28px", textDecoration: "none", ...S.m, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Browse Fragrances
          </Link>
        </div>
      </div>
    </div>
  );
}
