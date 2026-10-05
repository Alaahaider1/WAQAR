"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils/formatPrice";

const S = {
  d: { fontFamily:"'Cormorant Garamond',Georgia,serif" },
  b: { fontFamily:"'DM Sans',system-ui,sans-serif" },
  m: { fontFamily:"'DM Mono',monospace" },
} as const;

export type CustomerOrder = {
  id: string;
  order_number: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
};

export type EnrichedCustomer = {
  id: string;
  full_name: string;
  phone: string;
  is_active: boolean;
  ordersCount: number;
  totalSpent: number;
  lastOrder: CustomerOrder | null;
  initials: string;
  orders: CustomerOrder[];
};

const th: React.CSSProperties = { ...S.m, fontSize:8, letterSpacing:"0.18em", textTransform:"uppercase", color:"#6B6B63", padding:"10px 14px", textAlign:"left", backgroundColor:"#F5F0E8", borderBottom:"1px solid #EDE8DC", whiteSpace:"nowrap" };
const dateFormat: Intl.DateTimeFormatOptions = { day:"2-digit", month:"short", year:"numeric" };

export function CustomersClient({ customers }: { customers: EnrichedCustomer[] }) {
  const [selectedCustomer, setSelectedCustomer] = useState<EnrichedCustomer | null>(null);

  function selectCustomer(customer: EnrichedCustomer) {
    setSelectedCustomer(customer);
  }

  return (
    <>
      <div style={{ backgroundColor:"#FAFAF7", border:"1px solid #EDE8DC", overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", minWidth:620 }}>
          <thead>
            <tr>
              {["Customer","Orders","Spent","Last Order","Status"].map(header => (
                <th key={header} style={th}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign:"center", padding:"48px 24px" }}>
                <p style={{ ...S.d, fontSize:20, fontWeight:300, color:"#EDE8DC" }}>No customers found</p>
              </td></tr>
            ) : customers.map((customer, index) => (
              <tr
                key={customer.id}
                role="button"
                tabIndex={0}
                aria-label={`View purchase history for ${customer.full_name}`}
                onClick={() => selectCustomer(customer)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectCustomer(customer);
                  }
                }}
                style={{ borderBottom: index < customers.length - 1 ? "1px solid #EDE8DC" : "none", cursor:"pointer", backgroundColor:selectedCustomer?.id === customer.id ? "#F5F0E8" : undefined }}
              >
                <td style={{ padding:"12px 14px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:34, height:34, borderRadius:"50%", backgroundColor:"#EDE8DC", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ ...S.m, fontSize:10, color:"#6B6B63" }}>{customer.initials}</span>
                    </div>
                    <div style={{ minWidth:0 }}>
                      <p style={{ ...S.b, fontSize:13, fontWeight:500, color:"#1A1A18", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{customer.full_name}</p>
                      <p style={{ ...S.m, fontSize:9, color:"#6B6B63", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{customer.phone}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding:"12px 14px", textAlign:"center" }}><span style={{ ...S.m, fontSize:12, color:"#1A1A18" }}>{customer.ordersCount}</span></td>
                <td style={{ padding:"12px 14px" }}><span style={{ ...S.m, fontSize:12, color:"#1A1A18" }}>{formatPrice(customer.totalSpent)}</span></td>
                <td style={{ padding:"12px 14px" }}><span style={{ ...S.m, fontSize:10, color:"#6B6B63", whiteSpace:"nowrap" }}>{customer.lastOrder ? new Date(customer.lastOrder.created_at).toLocaleDateString("en-GB", dateFormat) : "—"}</span></td>
                <td style={{ padding:"12px 14px" }}>
                  <span style={{ ...S.m, fontSize:8, letterSpacing:"0.12em", textTransform:"uppercase" as const, color:"#2d7a2d", backgroundColor:"rgba(34,139,34,0.07)", border:"1px solid rgba(34,139,34,0.15)", padding:"3px 8px" }}>active</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCustomer && (
        <section aria-live="polite" style={{ backgroundColor:"#FAFAF7", border:"1px solid #EDE8DC", padding:18 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginBottom:12 }}>
            <div>
              <p style={{ ...S.m, fontSize:9, letterSpacing:"0.15em", textTransform:"uppercase", color:"#6B6B63", margin:"0 0 3px" }}>Purchase history</p>
              <h2 style={{ ...S.d, fontSize:24, fontWeight:300, color:"#1A1A18", margin:0 }}>{selectedCustomer.full_name}</h2>
            </div>
            <button type="button" onClick={() => setSelectedCustomer(null)} style={{ border:"1px solid #EDE8DC", backgroundColor:"#F5F0E8", color:"#6B6B63", padding:"7px 10px", cursor:"pointer", ...S.m, fontSize:8, letterSpacing:"0.1em", textTransform:"uppercase" }}>Close</button>
          </div>
          <div style={{ display:"grid", gap:8 }}>
            {selectedCustomer.orders.map((order) => (
              <div key={order.id} style={{ display:"grid", gridTemplateColumns:"minmax(90px, 1fr) auto auto", gap:14, alignItems:"center", borderTop:"1px solid #EDE8DC", paddingTop:8 }}>
                <div>
                  <p style={{ ...S.m, fontSize:11, color:"#1A1A18", margin:0 }}>{order.order_number}</p>
                  <p style={{ ...S.m, fontSize:9, color:"#6B6B63", margin:"3px 0 0" }}>{new Date(order.created_at).toLocaleDateString("en-GB", dateFormat)}</p>
                </div>
                <span style={{ ...S.m, fontSize:8, color:"#6B6B63", textTransform:"uppercase" }}>{order.status}</span>
                <span style={{ ...S.m, fontSize:11, color:"#1A1A18", whiteSpace:"nowrap" }}>{formatPrice(order.status !== "cancelled" && order.payment_status === "paid" ? order.total : 0)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
