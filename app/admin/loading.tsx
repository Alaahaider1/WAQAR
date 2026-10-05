const S = { m: { fontFamily: "'DM Mono', monospace" } } as const;

export default function AdminLoading() {
  return (
    <div style={{ padding: "clamp(16px,3vw,32px)", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ width: 160, height: 12, backgroundColor: "#EDE8DC" }} className="pulse" />
      <div style={{ width: 220, height: 28, backgroundColor: "#EDE8DC" }} className="pulse" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ height: 70, backgroundColor: "#FAFAF7", border: "1px solid #EDE8DC" }} className="pulse" />
        ))}
      </div>

      <div style={{ backgroundColor: "#FAFAF7", border: "1px solid #EDE8DC", overflow: "hidden" }}>
        <div style={{ height: 38, backgroundColor: "#F5F0E8" }} />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ height: 52, borderTop: "1px solid #EDE8DC" }} className="pulse" />
        ))}
      </div>

      <p style={{ ...S.m, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6B6B63", textAlign: "center" }}>
        Loading…
      </p>

      <style>{`
        .pulse { animation: admin-pulse 1.4s ease-in-out infinite; }
        @keyframes admin-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
      `}</style>
    </div>
  );
}
