"use client";

import { Minus, Plus } from "lucide-react";

const S = { mono: { fontFamily: "'DM Mono', monospace" } } as const;

type Props = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
};

export function QuantitySelector({ value, onChange, min = 1, max = 10 }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", border: "1px solid #EDE8DC" }}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        style={{ width: 40, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: value <= min ? "not-allowed" : "pointer", color: value <= min ? "#EDE8DC" : "#1A1A18", transition: "color 0.2s" }}
      >
        <Minus size={13} strokeWidth={1.5} />
      </button>
      <span style={{ width: 44, textAlign: "center", ...S.mono, fontSize: 13, color: "#1A1A18", borderLeft: "1px solid #EDE8DC", borderRight: "1px solid #EDE8DC", lineHeight: "44px", userSelect: "none" }}>
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        style={{ width: 40, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: value >= max ? "not-allowed" : "pointer", color: value >= max ? "#EDE8DC" : "#1A1A18", transition: "color 0.2s" }}
      >
        <Plus size={13} strokeWidth={1.5} />
      </button>
    </div>
  );
}
