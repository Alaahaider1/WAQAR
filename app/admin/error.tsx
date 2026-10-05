"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

const S = {
  d: { fontFamily: "'Cormorant Garamond', Georgia, serif" },
  b: { fontFamily: "'DM Sans', system-ui, sans-serif" },
  m: { fontFamily: "'DM Mono', monospace" },
} as const;

export default function AdminErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Admin route error:", error);
  }, [error]);

  return (
    <div style={{ padding: "clamp(24px,5vw,64px) clamp(16px,3vw,32px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 440, backgroundColor: "#FAFAF7", border: "1px solid #EDE8DC", padding: "clamp(28px,4vw,44px)" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: "rgba(204,68,68,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertTriangle size={20} strokeWidth={1.5} color="#cc4444" />
          </div>
        </div>
        <h2 style={{ ...S.d, fontSize: 22, fontWeight: 300, color: "#1A1A18", margin: "0 0 8px" }}>
          Couldn&apos;t load this page
        </h2>
        <p style={{ ...S.b, fontSize: 13, color: "#6B6B63", lineHeight: 1.6, margin: "0 0 24px" }}>
          {error.message || "Something went wrong while fetching data from the server."}
        </p>
        <button
          onClick={reset}
          style={{ display: "inline-flex", alignItems: "center", backgroundColor: "#1A1A18", color: "#FAFAF7", padding: "11px 26px", border: "none", cursor: "pointer", ...S.m, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
