import Link from "next/link";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { formatPrice } from "@/lib/utils/formatPrice";

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ orderNumber?: string; total?: string; method?: string }> }) {
  const params = await searchParams;
  const orderNumber = params.orderNumber ?? "";
  const total = params.total ?? "";

  if (!orderNumber || !total) {
    redirect("/checkout");
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#FAFAF7", paddingTop: 88 }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "72px 24px 96px", textAlign: "center" }}>
        <div style={{ width: 84, height: 84, borderRadius: "50%", border: "2px solid #B8965A", backgroundColor: "rgba(184,150,90,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
          <Check size={34} strokeWidth={1.5} style={{ color: "#B8965A" }} />
        </div>
        <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 12 }}>Order Confirmed</p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 300, color: "#1A1A18", marginBottom: 16 }}>Your order is being prepared</h1>
        <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, color: "#6B6B63", lineHeight: 1.8, marginBottom: 12 }}>
          We’ve received your order and it is now marked as <strong style={{ color: "#1A1A18" }}>Pending Shipment</strong>.
        </p>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#1A1A18", marginBottom: 28 }}>Order Number: {orderNumber}</p>
        <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, color: "#6B6B63", marginBottom: 36 }}>Order Total: <strong style={{ color: "#1A1A18" }}>{formatPrice(Number(total))}</strong></p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" style={{ padding: "12px 24px", backgroundColor: "#1A1A18", color: "#FAFAF7", textDecoration: "none", fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Return Home
          </Link>
          <Link href="/products" style={{ padding: "12px 24px", border: "1px solid #1A1A18", color: "#1A1A18", textDecoration: "none", fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
