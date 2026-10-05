"use client";

import { motion } from "framer-motion";

function Bone({ w = "100%", h = 16, radius = 0 }: { w?: string | number; h?: number; radius?: number }) {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      style={{ width: w, height: h, backgroundColor: "#EDE8DC", borderRadius: radius, flexShrink: 0 }}
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ backgroundColor: "#FAFAF7", border: "1px solid #EDE8DC" }}>
      {/* Header */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, padding: "12px 16px", backgroundColor: "#F5F0E8", borderBottom: "1px solid #EDE8DC" }}>
        {Array.from({ length: cols }).map((_, i) => <Bone key={i} h={10} w="60%" />)}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, padding: "16px", borderBottom: "1px solid #EDE8DC" }}>
          {Array.from({ length: cols }).map((_, c) => <Bone key={c} h={12} w={c === 0 ? "40px" : "70%"} />)}
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div style={{ backgroundColor: "#FAFAF7", border: "1px solid #EDE8DC", padding: "20px 22px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Bone w={36} h={36} radius={2} />
        <Bone w={20} h={20} radius={2} />
      </div>
      <Bone h={28} w="60%" />
      <div style={{ marginTop: 8 }}><Bone h={10} w="80%" /></div>
      <div style={{ marginTop: 4 }}><Bone h={10} w="50%" /></div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div>
      <Bone w="100%" h={300} />
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        <Bone h={18} w="70%" />
        <Bone h={10} w="50%" />
        <Bone h={14} w="30%" />
      </div>
    </div>
  );
}

export function FormSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Bone h={10} w="30%" />
          <Bone h={40} />
        </div>
      ))}
    </div>
  );
}
