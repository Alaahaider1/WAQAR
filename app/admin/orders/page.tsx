/**
 * Admin Orders — Server Component.
 */

import { createServerClient } from "@/src/lib/supabase/server";
import { formatPrice } from "@/lib/utils/formatPrice";
import { OrderDetailDrawerButton } from "./OrderDetailDrawerButton";
import { PaymentProofReview } from "./PaymentProofReview";
import { DeleteOrderButton } from "./DeleteOrderButton";

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string | null;
  customer_email: string | null;
  item_count: number;
  total: number;
  status: string;
  payment_status: string;
  shipping_status: string | null;
  created_at: string;
};

type PaymentProofInfo = {
  proofUrl: string | null;
  proofStatus: string | null;
  reviewNotes: string | null;
};

const S = {
  d: { fontFamily:"'Cormorant Garamond',Georgia,serif" },
  b: { fontFamily:"'DM Sans',system-ui,sans-serif" },
  m: { fontFamily:"'DM Mono',monospace" },
} as const;

const STATUS_C: Record<string,{bg:string;text:string;border:string}> = {
  pending:    {bg:"rgba(107,107,99,0.08)", text:"#6B6B63",  border:"rgba(107,107,99,0.2)"},
  processing: {bg:"rgba(184,150,90,0.08)", text:"#B8965A",  border:"rgba(184,150,90,0.2)"},
  shipped:    {bg:"rgba(26,26,24,0.06)",   text:"#1A1A18",  border:"rgba(26,26,24,0.15)"},
  delivered:  {bg:"rgba(34,139,34,0.07)",  text:"#2d7a2d",  border:"rgba(34,139,34,0.15)"},
  cancelled:  {bg:"rgba(204,68,68,0.07)",  text:"#cc4444",  border:"rgba(204,68,68,0.15)"},
  refunded:   {bg:"rgba(107,107,99,0.08)", text:"#6B6B63",  border:"rgba(107,107,99,0.2)"},
  paid:       {bg:"rgba(34,139,34,0.07)",  text:"#2d7a2d",  border:"rgba(34,139,34,0.15)"},
  failed:     {bg:"rgba(204,68,68,0.07)",  text:"#cc4444",  border:"rgba(204,68,68,0.15)"},
};

function Pill({ label }: { label: string }) {
  const c = STATUS_C[label] ?? STATUS_C.pending;
  return (
    <span style={{ ...S.m, fontSize:8, letterSpacing:"0.12em", textTransform:"uppercase" as const, color:c.text, backgroundColor:c.bg, border:`1px solid ${c.border}`, padding:"3px 8px", whiteSpace:"nowrap" as const }}>
      {label}
    </span>
  );
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createServerClient();

  let query = supabase
    .from("admin_order_summary")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }
  if (params.q) {
    query = query.or(
      `order_number.ilike.%${params.q}%,customer_name.ilike.%${params.q}%,customer_email.ilike.%${params.q}%`
    );
  }

  const { data: orders, error } = await query;
  if (error) console.error("Orders query error:", error);
  const rows = (orders ?? []) as unknown as OrderRow[];

  const proofByOrderId = new Map<string, PaymentProofInfo>();
  if (rows.length > 0) {
    const { data: paymentRows } = await supabase
      .from("payments")
      .select("order_id, provider_response")
      .in("order_id", rows.map((row) => row.id));

    for (const paymentRow of paymentRows ?? []) {
      const response = paymentRow.provider_response && typeof paymentRow.provider_response === "object"
        ? paymentRow.provider_response as Record<string, unknown>
        : {};

      proofByOrderId.set(paymentRow.order_id, {
        proofUrl: typeof response.proofUrl === "string" ? response.proofUrl : null,
        proofStatus: typeof response.proofStatus === "string" ? response.proofStatus : null,
        reviewNotes: typeof response.reviewNotes === "string" ? response.reviewNotes : null,
      });
    }
  }

  const STATUSES = ["all","pending","processing","shipped","delivered","cancelled","refunded"];
  const th: React.CSSProperties = { ...S.m, fontSize:8, letterSpacing:"0.18em", textTransform:"uppercase", color:"#6B6B63", padding:"10px 14px", textAlign:"left", backgroundColor:"#F5F0E8", borderBottom:"1px solid #EDE8DC", whiteSpace:"nowrap" };

  return (
    <div style={{ padding:"clamp(16px,3vw,32px)", display:"flex", flexDirection:"column", gap:20 }}>
      <div>
        <p style={{ ...S.m, fontSize:9, letterSpacing:"0.25em", textTransform:"uppercase", color:"#6B6B63", marginBottom:4 }}>Admin</p>
        <h1 style={{ ...S.d, fontSize:"clamp(22px,4vw,32px)", fontWeight:300, color:"#1A1A18", margin:0 }}>Orders</h1>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
        {STATUSES.map(s => {
          const active = (params.status ?? "all") === s;
          return (
            <a key={s} href={`/admin/orders${s !== "all" ? `?status=${s}` : ""}`}
              style={{ padding:"7px 12px", border:`1px solid ${active?"#B8965A":"#EDE8DC"}`, backgroundColor:active?"#B8965A":"#FAFAF7", color:active?"#FAFAF7":"#6B6B63", textDecoration:"none", ...S.m, fontSize:8, letterSpacing:"0.12em", textTransform:"uppercase" }}>
              {s}
            </a>
          );
        })}
        <span style={{ ...S.m, fontSize:9, color:"#6B6B63", marginLeft:"auto" }}>{rows.length} orders</span>
      </div>

      {/* Table */}
      <div style={{ backgroundColor:"#FAFAF7", border:"1px solid #EDE8DC", overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", minWidth:600 }}>
          <thead>
            <tr>
              {["Order","Customer","Items","Total","Status","Payment","Shipping","Proof","Date",""].map(h => (
                <th key={h} style={{ ...th, textAlign: h === "" ? "right" : "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign:"center", padding:"48px 24px" }}>
                <p style={{ ...S.d, fontSize:20, fontWeight:300, color:"#EDE8DC" }}>No orders found</p>
              </td></tr>
            ) : rows.map((o: OrderRow, i: number) => {
              const proof = proofByOrderId.get(o.id);
              const hasProof = Boolean(proof?.proofUrl);
              return (
              <tr key={o.id} style={{ borderBottom: i < rows.length-1 ? "1px solid #EDE8DC" : "none" }}>
                <td style={{ padding:"12px 14px" }}>
                  <span style={{ ...S.m, fontSize:11, color:"#1A1A18" }}>{o.order_number}</span>
                </td>
                <td style={{ padding:"12px 14px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:28, height:28, borderRadius:"50%", backgroundColor:"#EDE8DC", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ ...S.m, fontSize:8, color:"#6B6B63" }}>
                        {(o.customer_name ?? "GU").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0,2)}
                      </span>
                    </div>
                    <div style={{ minWidth:0 }}>
                      <p style={{ ...S.b, fontSize:12, fontWeight:500, color:"#1A1A18", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:120 }}>{o.customer_name ?? "Guest"}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding:"12px 14px" }}>
                  <span style={{ ...S.m, fontSize:11, color:"#6B6B63" }}>{o.item_count}</span>
                </td>
                <td style={{ padding:"12px 14px" }}>
                  <span style={{ ...S.m, fontSize:12, color:"#1A1A18" }}>{formatPrice(Number(o.total))}</span>
                </td>
                <td style={{ padding:"12px 14px" }}><Pill label={o.status} /></td>
                <td style={{ padding:"12px 14px" }}><Pill label={o.payment_status} /></td>
                <td style={{ padding:"12px 14px" }}><Pill label={o.shipping_status ?? "pending"} /></td>
                <td style={{ padding:"12px 14px" }}>
                  {hasProof && proof?.proofUrl ? (
                    <PaymentProofReview orderId={o.id} proofUrl={proof.proofUrl} proofStatus={proof.proofStatus} reviewNotes={proof.reviewNotes} />
                  ) : (
                      <span style={{ ...S.m, fontSize:10, color:"#6B6B63" }}>No proof uploaded</span>
                  )}
                </td>
                <td style={{ padding:"12px 14px" }}>
                  <span style={{ ...S.m, fontSize:10, color:"#6B6B63", whiteSpace:"nowrap" }}>
                    {new Date(o.created_at).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}
                  </span>
                </td>
                <td style={{ padding:"12px 14px", textAlign:"right" }}>
                  <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
                  <OrderDetailDrawerButton orderId={o.id} orderNumber={o.order_number} />
                    <DeleteOrderButton orderId={o.id} orderNumber={o.order_number} />
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
