import Link from "next/link";
import { redirect } from "next/navigation";
import { getPaymentMethodLabel } from "@/src/lib/payment/methods";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { SiteSettingsRepository } from "@/src/repositories/site-settings.repository";
import { formatPrice } from "@/lib/utils/formatPrice";
import { PaymentProofUpload } from "./PaymentProofUpload";

const paymentMethodIdsByProvider: Record<string, string> = {
  vodafone_cash: "vodafone",
  orange_cash: "orange",
  etisalat_cash: "etisalat",
  we_pay: "wepay",
  instapay: "instapay",
  cash_on_delivery: "cod",
  stripe: "card",
};

const paymentSettingFieldsByProvider = {
  vodafone_cash: "vodafoneCashNumber",
  orange_cash: "orangeCashNumber",
  etisalat_cash: "etisalatCashNumber",
  we_pay: "wePayNumber",
  instapay: "instaPayAccount",
} as const;

export default async function Page({ searchParams }: { searchParams: Promise<{ orderNumber?: string; accessToken?: string; total?: string; method?: string }> }) {
  const params = await searchParams;
  const orderNumber = params.orderNumber ?? "";
  const proofAccessToken = params.accessToken ?? "";

  if (!orderNumber || !/^[0-9a-f-]{36}$/i.test(proofAccessToken)) {
    redirect("/checkout");
  }

  const db = createAdminClient();
  const { data: orderData } = await db
    .from("orders")
    .select("id, total")
    .eq("order_number", orderNumber)
    .eq("proof_access_token", proofAccessToken)
    .maybeSingle();

  if (!orderData) {
    redirect("/checkout");
  }

  const [paymentResult, settings] = await Promise.all([
    db
      .from("payments")
      .select("provider, provider_response")
      .eq("order_id", orderData.id)
      .maybeSingle(),
    new SiteSettingsRepository(db).findPaymentDetails(),
  ]);
  const paymentData = paymentResult.data;

  const provider = paymentData?.provider ?? "";
  const method = paymentMethodIdsByProvider[provider] ?? provider;
  const label = provider ? getPaymentMethodLabel(method) : "Payment method unavailable";
  const manualProviders = ["vodafone_cash", "orange_cash", "etisalat_cash", "we_pay", "instapay"];
  const isManualMethod = manualProviders.includes(provider);
  let proofStatus: string | null = null;
  let proofUrl: string | null = null;
  let proofNotes: string | null = null;

  if (isManualMethod) {
    const response = paymentData?.provider_response && typeof paymentData.provider_response === "object"
      ? paymentData.provider_response as Record<string, unknown>
      : {};

    proofStatus = typeof response.proofStatus === "string" ? response.proofStatus : null;
    proofUrl = typeof response.proofUrl === "string" ? response.proofUrl : null;
    proofNotes = typeof response.reviewNotes === "string" ? response.reviewNotes : null;
  }

  const paymentDetails = (() => {
    if (!settings || !provider) return null;

    const settingField = paymentSettingFieldsByProvider[provider as keyof typeof paymentSettingFieldsByProvider];
    const value = settingField ? settings[settingField] : null;

    return typeof value === "string" && value.trim()
      ? { label, value }
      : null;
  })();

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#FAFAF7", paddingTop: 88 }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 96px" }}>
        <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 12 }}>Payment Instructions</p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 300, color: "#1A1A18", marginBottom: 16 }}>Complete your payment to confirm this order</h1>
        <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, color: "#6B6B63", lineHeight: 1.8, marginBottom: 32 }}>
          Your order has been received. Please complete your payment using the details below.
        </p>

        <div style={{ backgroundColor: "#F5F0E8", border: "1px solid #EDE8DC", padding: 24, marginBottom: 24 }}>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, color: "#6B6B63" }}>Order Number</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#1A1A18" }}>{orderNumber}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, color: "#6B6B63" }}>Total Amount</span>
              <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 15, color: "#1A1A18", fontWeight: 600 }}>{formatPrice(Number(orderData.total))}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, color: "#6B6B63" }}>Selected Payment Method</span>
              <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 15, color: "#1A1A18", fontWeight: 600 }}>{label}</span>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: "#FAFAF7", border: "1px solid #EDE8DC", padding: 24 }}>
          <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, fontWeight: 600, color: "#1A1A18", marginBottom: 8 }}>Payment Details</p>
          {paymentDetails ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, color: "#6B6B63" }}>{paymentDetails.label}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, color: "#1A1A18" }}>{paymentDetails.value}</span>
              </div>
            </div>
          ) : (
            <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, color: "#6B6B63", margin: 0 }}>Payment details are not configured yet. Please contact support.</p>
          )}
        </div>

        {isManualMethod && (
          <PaymentProofUpload orderNumber={orderNumber} proofAccessToken={proofAccessToken} initialStatus={proofStatus} proofUrl={proofUrl} rejectionReason={proofNotes} />
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
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
