"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteOrderAction } from "@/src/actions/order.actions";
import { toast } from "@/components/ui/Toast";

export function DeleteOrderButton({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function removeOrder() {
    startTransition(async () => {
      const result = await deleteOrderAction(orderId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setOpen(false);
      toast.success("Order deleted successfully.");
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={isPending}
        title={`Delete ${orderNumber}`}
        style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(204,68,68,0.3)", backgroundColor: "#FAFAF7", cursor: isPending ? "not-allowed" : "pointer", color: "#cc4444", opacity: isPending ? 0.55 : 1 }}
      >
        {isPending ? <LoaderCircle size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={12} strokeWidth={1.5} />}
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-labelledby="delete-order-title" style={{ position: "fixed", inset: 0, zIndex: 10000, backgroundColor: "rgba(26,26,24,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ width: "min(100%, 400px)", backgroundColor: "#FAFAF7", border: "1px solid #EDE8DC", padding: 24 }}>
            <h2 id="delete-order-title" style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 24, fontWeight: 400, color: "#1A1A18", margin: "0 0 10px" }}>Delete Order?</h2>
            <p style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 13, color: "#6B6B63", lineHeight: 1.6, margin: "0 0 20px" }}>This action cannot be undone. The order and its payment proof will be permanently removed.</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" onClick={() => setOpen(false)} disabled={isPending} style={{ padding: "9px 13px", border: "1px solid #EDE8DC", backgroundColor: "#FAFAF7", color: "#1A1A18", cursor: isPending ? "not-allowed" : "pointer", fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 12 }}>Cancel</button>
              <button type="button" onClick={removeOrder} disabled={isPending} style={{ padding: "9px 13px", border: "1px solid #cc4444", backgroundColor: "#cc4444", color: "#FAFAF7", cursor: isPending ? "not-allowed" : "pointer", fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}>
                {isPending && <LoaderCircle size={13} style={{ animation: "spin 1s linear infinite" }} />}
                {isPending ? "Deleting..." : "Delete Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
