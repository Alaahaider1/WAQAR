"use client";

import { useEffect } from "react";
import Link from "next/link";

const S = {
  d: { fontFamily: "'Cormorant Garamond', Georgia, serif" },
  b: { fontFamily: "'DM Sans', system-ui, sans-serif" },
  m: { fontFamily: "'DM Mono', monospace" },
} as const;

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FAFAF7", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <p style={{ ...S.m, fontSize: 80, fontWeight: 300, color: "#EDE8DC", lineHeight: 1, margin: "0 0 8px", letterSpacing: "-0.02em" }}>500</p>
        <div style={{ width: 40, height: 1, backgroundColor: "#B8965A", opacity: 0.5, margin: "0 auto 24px" }} />
        <h1 style={{ ...S.d, fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 300, color: "#1A1A18", margin: "0 0 12px" }}>
          Something Went Wrong
        </h1>
        <p style={{ ...S.b, fontSize: 14, color: "#6B6B63", lineHeight: 1.75, margin: "0 0 36px" }}>
          An unexpected error occurred. Please try again. If the problem persists, contact our support team.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={reset} style={{ display: "inline-flex", alignItems: "center", backgroundColor: "#1A1A18", color: "#FAFAF7", padding: "12px 28px", border: "none", cursor: "pointer", ...S.m, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Try Again
          </button>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", border: "1px solid #1A1A18", color: "#1A1A18", padding: "12px 28px", textDecoration: "none", ...S.m, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
