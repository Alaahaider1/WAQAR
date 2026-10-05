"use client";

import { useState, useTransition } from "react";
import { Trash2, X, Check } from "lucide-react";
import { deleteProductAction } from "@/src/actions/product.actions";
import { toast } from "@/components/ui/Toast";

const S = { m: { fontFamily: "'DM Mono', monospace" } } as const;

export function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProductAction(productId);
      if (result.success) {
        toast.success(`"${productName}" deleted`);
      } else {
        toast.error(result.error ?? "Failed to delete product");
      }
      setConfirm(false);
    });
  };

  if (confirm) {
    return (
      <div style={{ display: "flex", gap: 4 }}>
        <button
          onClick={handleDelete}
          disabled={pending}
          style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #cc4444", backgroundColor: "#cc4444", cursor: "pointer", color: "#FAFAF7" }}
        >
          <Check size={12} strokeWidth={2} />
        </button>
        <button
          onClick={() => setConfirm(false)}
          style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #EDE8DC", backgroundColor: "#F5F0E8", cursor: "pointer", color: "#6B6B63" }}
        >
          <X size={12} strokeWidth={1.5} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #EDE8DC", backgroundColor: "#F5F0E8", cursor: "pointer", color: "#6B6B63", transition: "all 0.15s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#cc4444"; (e.currentTarget as HTMLButtonElement).style.color = "#cc4444"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#EDE8DC"; (e.currentTarget as HTMLButtonElement).style.color = "#6B6B63"; }}
    >
      <Trash2 size={12} strokeWidth={1.5} />
    </button>
  );
}
