import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/src/lib/supabase/server";
import { OrderRepository } from "@/src/repositories/order.repository";
import { formatPrice } from "@/lib/utils/formatPrice";
import { ShipmentControls } from "../ShipmentControls";

const S = {
  d: { fontFamily: "'Cormorant Garamond',Georgia,serif" },
  b: { fontFamily: "'DM Sans',system-ui,sans-serif" },
  m: { fontFamily: "'DM Mono',monospace" },
} as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ ...S.m, fontSize: 9, letterSpacing: "0.24em", textTransform: "uppercase", color: "#6B6B63", margin: "0 0 12px" }}>{children}</p>;
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();
  const repo = new OrderRepository(supabase);

  let order;
  try {
    order = await repo.findByOrderNumber(id);
  } catch {
    notFound();
  }
  const billingAddress = order.billingAddress ?? order.shippingAddress;

  const { data: paymentData } = await supabase
    .from("payments")
    .select("provider, amount, currency, status, provider_reference, provider_response")
    .eq("order_id", order.id)
    .maybeSingle();

  const providerResponse = paymentData?.provider_response && typeof paymentData.provider_response === "object"
    ? paymentData.provider_response as Record<string, unknown>
    : {};

  const proofUrl = typeof providerResponse.proofUrl === "string" ? providerResponse.proofUrl : null;
  const proofStatus = typeof providerResponse.proofStatus === "string" ? providerResponse.proofStatus : null;
  const reviewNotes = typeof providerResponse.reviewNotes === "string" ? providerResponse.reviewNotes : null;

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#FAFAF7", paddingTop: 88 }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "48px 24px 96px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
          <div>
            <p style={{ ...S.m, fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6B6B63", marginBottom: 4 }}>Admin</p>
            <h1 style={{ ...S.d, fontSize: "clamp(22px,4vw,32px)", fontWeight: 300, color: "#1A1A18", margin: 0 }}>Order {order.orderNumber}</h1>
          </div>
          <Link href="/admin/orders" style={{ ...S.m, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#1A1A18", textDecoration: "none", border: "1px solid #EDE8DC", backgroundColor: "#FAFAF7", padding: "11px 16px" }}>
            Back to orders
          </Link>
        </div>

        <div style={{ display: "grid", gap: 18, marginBottom: 32 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 16 }}>
            {[
              { label: "Status", value: order.status },
              { label: "Payment", value: order.paymentStatus },
              { label: "Total", value: formatPrice(order.total) },
            ].map((item) => (
              <div key={item.label} style={{ backgroundColor: "#F5F0E8", border: "1px solid #EDE8DC", padding: 18 }}>
                <p style={{ ...S.m, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B6B63", margin: "0 0 8px" }}>{item.label}</p>
                <p style={{ ...S.d, fontSize: 18, color: "#1A1A18", margin: 0 }}>{item.value}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ backgroundColor: "#FAFAF7", border: "1px solid #EDE8DC", padding: 24 }}>
              <SectionLabel>Customer</SectionLabel>
              <p style={{ ...S.b, fontSize: 13, color: "#1A1A18", margin: 0 }}>{billingAddress.fullName || "Guest"}</p>
              <p style={{ ...S.m, fontSize: 12, color: "#6B6B63", margin: "8px 0 0" }}>{billingAddress.phone || "No contact number"}</p>
            </div>
            <div style={{ backgroundColor: "#FAFAF7", border: "1px solid #EDE8DC", padding: 24 }}>
              <SectionLabel>Billing Address</SectionLabel>
              <p style={{ ...S.b, fontSize: 13, color: "#1A1A18", margin: 0 }}>{billingAddress.fullName}</p>
              <p style={{ ...S.m, fontSize: 12, color: "#6B6B63", margin: "8px 0 0" }}>{billingAddress.addressLine1}</p>
              {billingAddress.addressLine2 && <p style={{ ...S.m, fontSize: 12, color: "#6B6B63", margin: "4px 0 0" }}>{billingAddress.addressLine2}</p>}
              <p style={{ ...S.m, fontSize: 12, color: "#6B6B63", margin: "8px 0 0" }}>{billingAddress.city}, {billingAddress.state ?? ""} {billingAddress.postalCode}</p>
              <p style={{ ...S.m, fontSize: 12, color: "#6B6B63", margin: "4px 0 0" }}>{billingAddress.countryCode}</p>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: "#FAFAF7", border: "1px solid #EDE8DC", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
            <thead>
              <tr>
                {['Product', 'Variant', 'Qty', 'Price', 'Total'].map((title) => (
                  <th key={title} style={{ ...S.m, fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6B6B63', padding: '12px 14px', textAlign: 'left', backgroundColor: '#F5F0E8', borderBottom: '1px solid #EDE8DC' }}>{title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #EDE8DC' }}>
                  <td style={{ padding: '12px 14px' }}><p style={{ ...S.b, fontSize: 12, color: '#1A1A18', margin: 0 }}>{item.productName}</p></td>
                  <td style={{ padding: '12px 14px' }}><span style={{ ...S.m, fontSize: 11, color: '#6B6B63' }}>{item.variantSize}</span></td>
                  <td style={{ padding: '12px 14px' }}><span style={{ ...S.m, fontSize: 11, color: '#1A1A18' }}>{item.quantity}</span></td>
                  <td style={{ padding: '12px 14px' }}><span style={{ ...S.m, fontSize: 11, color: '#1A1A18' }}>{formatPrice(item.unitPrice)}</span></td>
                  <td style={{ padding: '12px 14px' }}><span style={{ ...S.m, fontSize: 11, color: '#1A1A18' }}>{formatPrice(item.totalPrice)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginTop: 32 }}>
          <div style={{ backgroundColor: '#FAFAF7', border: '1px solid #EDE8DC', padding: 24 }}>
            <SectionLabel>Payment details</SectionLabel>
            <p style={{ ...S.b, fontSize: 13, color: '#1A1A18', margin: 0 }}>Payment method: {paymentData?.provider ?? 'Manual payment'}</p>
            <p style={{ ...S.m, fontSize: 12, color: '#6B6B63', margin: '8px 0 0' }}>Payment amount: {paymentData ? formatPrice(Number(paymentData.amount || 0)) : 'N/A'}</p>
            <p style={{ ...S.m, fontSize: 12, color: '#6B6B63', margin: '8px 0 0' }}>Payment status: {paymentData?.status ?? 'N/A'}</p>
            {paymentData?.provider_reference && (
              <p style={{ ...S.m, fontSize: 12, color: '#6B6B63', margin: '8px 0 0' }}>Reference: {paymentData.provider_reference}</p>
            )}
          </div>
          <div style={{ backgroundColor: '#FAFAF7', border: '1px solid #EDE8DC', padding: 24 }}>
            <SectionLabel>Shipment</SectionLabel>
            <ShipmentControls orderId={order.id} shipmentId={order.shipmentId} />
            {order.shipmentId && <div style={{ display:'grid', gap:6, marginTop:12 }}><p style={{ ...S.m, fontSize:12, color:'#6B6B63', margin:0 }}>Shipment ID: {order.shipmentId}</p><p style={{ ...S.m, fontSize:12, color:'#6B6B63', margin:0 }}>Tracking number: {order.trackingNumber ?? 'N/A'}</p><p style={{ ...S.m, fontSize:12, color:'#6B6B63', margin:0 }}>Shipping status: {order.shippingStatus ?? 'N/A'}</p>{order.trackingUrl && <a href={order.trackingUrl} target="_blank" rel="noreferrer" style={{ ...S.m, fontSize:12, color:'#B8965A' }}>Open tracking</a>}</div>}
          </div>
          <div style={{ backgroundColor: '#FAFAF7', border: '1px solid #EDE8DC', padding: 24 }}>
            <SectionLabel>Payment proof</SectionLabel>
            {proofUrl ? (
              <>
                <p style={{ ...S.b, fontSize: 13, color: '#1A1A18', margin: 0 }}>Proof uploaded</p>
                <p style={{ ...S.m, fontSize: 12, color: '#6B6B63', margin: '8px 0 0' }}>Review status: {proofStatus ?? 'pending'}</p>
                {reviewNotes && <p style={{ ...S.m, fontSize: 12, color: '#6B6B63', margin: '8px 0 0' }}>Rejection reason: {reviewNotes}</p>}
                <a href={proofUrl} target="_blank" rel="noreferrer" style={{ marginTop: 12, display: 'inline-block' }}>
                  <img src={proofUrl} alt="Payment proof" style={{ width: 120, height: 120, objectFit: 'cover', border: '1px solid #EDE8DC', display: 'block' }} />
                </a>
              </>
            ) : (
              <p style={{ ...S.m, fontSize: 12, color: '#6B6B63', margin: 0 }}>No payment proof uploaded yet.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
