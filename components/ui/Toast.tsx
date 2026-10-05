"use client";

import { create } from "zustand";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, AlertTriangle, Info } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastStore = {
  toasts: Toast[];
  add: (message: string, type?: ToastType) => void;
  remove: (id: string) => void;
};

export const useToastStore = create<ToastStore>()((set) => ({
  toasts: [],
  add: (message, type = "success") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (msg: string) => useToastStore.getState().add(msg, "success"),
  error: (msg: string) => useToastStore.getState().add(msg, "error"),
  warning: (msg: string) => useToastStore.getState().add(msg, "warning"),
  info: (msg: string) => useToastStore.getState().add(msg, "info"),
};

const ICONS = {
  success: Check,
  error: X,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: { bg: "#FAFAF7", border: "rgba(184,150,90,0.3)", icon: "#B8965A", bar: "#B8965A" },
  error:   { bg: "#FAFAF7", border: "rgba(204,68,68,0.3)",  icon: "#cc4444", bar: "#cc4444" },
  warning: { bg: "#FAFAF7", border: "rgba(184,150,90,0.3)", icon: "#B8965A", bar: "#B8965A" },
  info:    { bg: "#FAFAF7", border: "rgba(107,107,99,0.3)", icon: "#6B6B63", bar: "#6B6B63" },
};

function ToastItem({ toast: t }: { toast: Toast }) {
  const remove = useToastStore((s) => s.remove);
  const [progress, setProgress] = useState(100);
  const c = COLORS[t.type];
  const Icon = ICONS[t.type];

  useEffect(() => {
    const start = Date.now();
    const duration = 3500;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.max(0, 100 - (elapsed / duration) * 100));
    }, 16);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.22 }}
      style={{
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        boxShadow: "0 8px 32px rgba(26,26,24,0.12)",
        padding: "12px 16px",
        display: "flex", alignItems: "center", gap: 10,
        minWidth: 280, maxWidth: 380, position: "relative", overflow: "hidden",
      }}
    >
      <div style={{ width: 26, height: 26, borderRadius: "50%", backgroundColor: `${c.icon}14`, border: `1px solid ${c.icon}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={12} strokeWidth={2} style={{ color: c.icon }} />
      </div>
      <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, color: "#1A1A18", flex: 1, margin: 0, lineHeight: 1.4 }}>{t.message}</p>
      <button onClick={() => remove(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6B63", padding: 2, flexShrink: 0, display: "flex" }}>
        <X size={12} strokeWidth={1.5} />
      </button>
      {/* Progress bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: "#EDE8DC" }}>
        <div style={{ height: "100%", backgroundColor: c.bar, width: `${progress}%`, transition: "none" }} />
      </div>
    </motion.div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      <AnimatePresence>
        {toasts.map((t) => <ToastItem key={t.id} toast={t} />)}
      </AnimatePresence>
    </div>
  );
}
