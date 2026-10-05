"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { reviewManualPaymentProofAction } from "@/src/actions/order.actions";

type Props = { orderId: string; proofUrl: string; proofStatus: string | null; reviewNotes: string | null };
const font = "'DM Sans', system-ui, sans-serif";

const badges: Record<string, { label: string; color: string; background: string }> = {
  pending: { label: "Pending Review", color: "#6B6B63", background: "#F5F0E8" },
  approved: { label: "Approved", color: "#2d7a2d", background: "rgba(34,139,34,0.08)" },
  rejected: { label: "Rejected", color: "#cc4444", background: "rgba(204,68,68,0.08)" },
};

export function PaymentProofReview({ orderId, proofUrl, proofStatus, reviewNotes }: Props) {
  const router = useRouter();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const status = proofStatus ?? "pending";
  const badge = badges[status] ?? badges.pending;

  function review(decision: "approved" | "rejected") {
    setError("");
    const formData = new FormData();
    formData.set("orderId", orderId);
    formData.set("decision", decision);
    if (decision === "rejected") formData.set("notes", reason.trim());

    startTransition(async () => {
      const result = await reviewManualPaymentProofAction(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setShowRejectDialog(false);
      router.refresh();
    });
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <a href={proofUrl} target="_blank" rel="noreferrer" aria-label="Open payment proof image" style={{ width: 54, height: 54, display: "block", border: "1px solid #EDE8DC" }}>
        <img src={proofUrl} alt="Payment proof" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </a>
      <span style={{ width: "fit-content", padding: "3px 7px", border: "1px solid #EDE8DC", backgroundColor: badge.background, color: badge.color, fontFamily: font, fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{badge.label}</span>
      {status === "rejected" && reviewNotes && <span style={{ fontFamily: font, fontSize: 11, color: "#6B6B63", maxWidth: 160 }}>Reason: {reviewNotes}</span>}
      {status === "pending" && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button type="button" disabled={isPending} onClick={() => review("approved")} style={{ padding: "6px 10px", border: "1px solid #B8965A", backgroundColor: "#FAFAF7", color: "#B8965A", cursor: isPending ? "not-allowed" : "pointer", fontFamily: font, fontSize: 10, fontWeight: 600 }}>
            {isPending ? <LoaderCircle size={12} style={{ animation: "spin 1s linear infinite" }} /> : "Approve"}
          </button>
          <button type="button" disabled={isPending} onClick={() => setShowRejectDialog(true)} style={{ padding: "6px 10px", border: "1px solid #cc4444", backgroundColor: "#FAFAF7", color: "#cc4444", cursor: isPending ? "not-allowed" : "pointer", fontFamily: font, fontSize: 10, fontWeight: 600 }}>Reject</button>
        </div>
      )}
      {error && <span role="alert" style={{ fontFamily: font, fontSize: 11, color: "#cc4444" }}>{error}</span>}
      {showRejectDialog && (
        <div role="dialog" aria-modal="true" aria-label="Reject payment proof" style={{ position: "fixed", inset: 0, zIndex: 10000, backgroundColor: "rgba(26,26,24,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ width: "min(100%, 400px)", backgroundColor: "#FAFAF7", border: "1px solid #EDE8DC", padding: 24, display: "grid", gap: 14 }}>
            <div>
              <p style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: "#1A1A18", margin: 0 }}>Reject payment proof</p>
              <p style={{ fontFamily: font, fontSize: 12, color: "#6B6B63", margin: "6px 0 0" }}>Tell the customer why a new proof is needed.</p>
            </div>
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Rejection reason" rows={3} style={{ width: "100%", boxSizing: "border-box", padding: 10, border: "1px solid #EDE8DC", backgroundColor: "#FAFAF7", fontFamily: font, fontSize: 13 }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" onClick={() => setShowRejectDialog(false)} disabled={isPending} style={{ padding: "8px 12px", border: "1px solid #EDE8DC", backgroundColor: "#FAFAF7", color: "#1A1A18", cursor: "pointer", fontFamily: font, fontSize: 12 }}>Cancel</button>
              <button type="button" onClick={() => review("rejected")} disabled={!reason.trim() || isPending} style={{ padding: "8px 12px", border: "1px solid #cc4444", backgroundColor: "#cc4444", color: "#FAFAF7", cursor: !reason.trim() || isPending ? "not-allowed" : "pointer", opacity: !reason.trim() || isPending ? 0.55 : 1, fontFamily: font, fontSize: 12 }}>Reject proof</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
