"use client";

import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";

export function OrderDetailDrawerButton({
  orderId,
  orderNumber,
}: {
  orderId: string;
  orderNumber: string;
}) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(`/admin/orders/${encodeURIComponent(orderNumber)}`)}
      title={`View ${orderNumber}`}
      style={{
        width: 28, height: 28,
        display: "flex", alignItems: "center", justifyContent: "center",
        border: "1px solid #EDE8DC", backgroundColor: "#F5F0E8",
        cursor: "pointer", color: "#6B6B63", transition: "all 0.15s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "#B8965A";
        (e.currentTarget as HTMLButtonElement).style.color = "#B8965A";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "#EDE8DC";
        (e.currentTarget as HTMLButtonElement).style.color = "#6B6B63";
      }}
    >
      <Eye size={12} strokeWidth={1.5} />
    </button>
  );
}
