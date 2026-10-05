"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { uploadPaymentProofAction } from "@/src/actions/order.actions";

type Props = {
  orderNumber: string;
  proofAccessToken: string;
  initialStatus: string | null;
  proofUrl: string | null;
  rejectionReason: string | null;
};

const font = "'DM Sans', system-ui, sans-serif";

function formatFileSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PaymentProofUpload({ orderNumber, proofAccessToken, initialStatus, proofUrl, rejectionReason }: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState("");
  const [uploaded, setUploaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadsLocked = status === "pending" || status === "approved";

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function selectFile(nextFile: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(nextFile);
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
    setError("");
  }

  function openFilePicker() {
    if (fileInputRef.current) {
      // Resetting allows a customer to reselect the same image after changing it.
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }

  function submit() {
    if (!file || uploadsLocked || isPending) return;
    setError("");
    const formData = new FormData();
    formData.set("orderNumber", orderNumber);
    formData.set("proofAccessToken", proofAccessToken);
    formData.set("proofFile", file);

    startTransition(async () => {
      const result = await uploadPaymentProofAction(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setStatus("pending");
      setUploaded(true);
      router.refresh();
    });
  }

  return (
    <div style={{ backgroundColor: "#FAFAF7", border: "1px solid #EDE8DC", padding: 24, marginTop: 24 }}>
      <p style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: "#1A1A18", marginBottom: 8 }}>Upload payment proof</p>

      {status === "approved" ? (
        <p style={{ fontFamily: font, fontSize: 13, color: "#2d7a2d", margin: 0 }}>✓ Payment proof approved.</p>
      ) : status === "pending" ? (
        <div style={{ display: "grid", gap: 8 }}>
          <p style={{ fontFamily: font, fontSize: 13, color: "#2d7a2d", margin: 0 }}>✓ Payment proof uploaded successfully.</p>
          <p style={{ fontFamily: font, fontSize: 13, color: "#6B6B63", margin: 0 }}>Waiting for admin review.</p>
          {proofUrl && <a href={proofUrl} target="_blank" rel="noreferrer" style={{ fontFamily: font, fontSize: 13, color: "#B8965A", textDecoration: "underline" }}>View uploaded proof</a>}
        </div>
      ) : (
        <>
          {status === "rejected" ? (
            <div style={{ display: "grid", gap: 6, marginBottom: 16 }}>
              <p style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: "#cc4444", margin: 0 }}>Payment Rejected</p>
              <p style={{ fontFamily: font, fontSize: 13, color: "#6B6B63", margin: 0 }}>Reason: {rejectionReason || "No reason provided"}</p>
              <p style={{ fontFamily: font, fontSize: 13, color: "#6B6B63", margin: 0 }}>Please upload a new payment proof.</p>
            </div>
          ) : (
            <p style={{ fontFamily: font, fontSize: 13, color: "#6B6B63", lineHeight: 1.7, marginBottom: 16 }}>Please upload a clear screenshot or photo of your payment confirmation so we can review it.</p>
          )}

          <div style={{ display: "grid", gap: 12 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              disabled={isPending}
              onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
              style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}
            />
            <button
              type="button"
              onClick={openFilePicker}
              disabled={isPending}
              style={{ width: "fit-content", padding: "12px 20px", backgroundColor: "#B8965A", color: "#FAFAF7", border: "none", cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.55 : 1, fontFamily: font, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase" }}
            >
              Choose Photo
            </button>
            {file && previewUrl && (
              <div style={{ display: "flex", gap: 12, alignItems: "center", border: "1px solid #EDE8DC", backgroundColor: "#FFFFFF", padding: 10 }}>
                <img src={previewUrl} alt="Payment proof preview" style={{ width: 72, height: 72, objectFit: "cover", border: "1px solid #EDE8DC" }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontFamily: font, fontSize: 13, color: "#1A1A18", margin: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{file.name}</p>
                  <p style={{ fontFamily: font, fontSize: 12, color: "#6B6B63", margin: "4px 0 0" }}>{formatFileSize(file.size)}</p>
                </div>
                <button type="button" onClick={openFilePicker} disabled={isPending} style={{ padding: "8px 10px", backgroundColor: "transparent", color: "#1A1A18", border: "1px solid #D8D1C2", cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.55 : 1, fontFamily: font, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  Change
                </button>
              </div>
            )}
            {error && <p role="alert" style={{ fontFamily: font, fontSize: 13, color: "#cc4444", margin: 0 }}>{error}</p>}
            {uploaded && <p style={{ fontFamily: font, fontSize: 13, color: "#2d7a2d", margin: 0 }}>✓ Payment proof uploaded successfully. Waiting for admin review.</p>}
            <button type="button" onClick={submit} disabled={!file || isPending} style={{ padding: "12px 20px", backgroundColor: "#B8965A", color: "#FAFAF7", border: "none", cursor: !file || isPending ? "not-allowed" : "pointer", opacity: !file || isPending ? 0.55 : 1, fontFamily: font, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {isPending && <LoaderCircle size={14} style={{ animation: "spin 1s linear infinite" }} />}
              {isPending ? "Uploading..." : "Upload Payment Proof"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
