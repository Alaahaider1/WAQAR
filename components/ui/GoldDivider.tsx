import { CSSProperties } from "react";

type GoldDividerProps = {
  className?: string;
  style?: CSSProperties;
  short?: boolean;
};

export function GoldDivider({ className, style, short = false }: GoldDividerProps) {
  if (short) {
    return (
      <div
        aria-hidden="true"
        className={className}
        style={{
          width: 60,
          height: 1,
          backgroundColor: "#B8965A",
          opacity: 0.6,
          ...style,
        }}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        width: "100%",
        height: 1,
        background: "linear-gradient(90deg, transparent 0%, #B8965A 30%, #B8965A 70%, transparent 100%)",
        opacity: 0.25,
        ...style,
      }}
    />
  );
}
