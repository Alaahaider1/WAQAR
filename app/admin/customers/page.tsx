/**
 * Admin Customers — Server Component.
 * Customers are derived from order shipping details so guest checkout orders are included.
 */

import { createServerClient } from "@/src/lib/supabase/server";
import { formatPrice } from "@/lib/utils/formatPrice";
import { CustomersClient, type CustomerOrder, type EnrichedCustomer } from "./CustomersClient";

type OrderRow = CustomerOrder & {
  shipping_address: unknown;
};

const S = {
  d: { fontFamily:"'Cormorant Garamond',Georgia,serif" },
  m: { fontFamily:"'DM Mono',monospace" },
} as const;

function getCustomerDetails(address: unknown) {
  const value = address && typeof address === "object" ? address as Record<string, unknown> : {};
  const name = typeof value.fullName === "string"
    ? value.fullName.trim()
    : typeof value.full_name === "string"
      ? value.full_name.trim()
      : "";
  const phone = typeof value.phone === "string" ? value.phone.trim() : "";
  return { name: name || "Guest", phone };
}

function customerKey(name: string, phone: string, orderId: string) {
  const normalizedPhone = phone.replace(/\D/g, "");
  if (normalizedPhone) return `phone:${normalizedPhone}`;
  const normalizedName = name.toLocaleLowerCase().replace(/\s+/g, " ").trim();
  return normalizedName ? `name:${normalizedName}` : `order:${orderId}`;
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createServerClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, order_number, total, status, payment_status, created_at, shipping_address")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load customer orders: ${error.message}`);
  }

  const groups = new Map<string, EnrichedCustomer>();
  for (const order of (orders ?? []) as OrderRow[]) {
    const { name, phone } = getCustomerDetails(order.shipping_address);
    const key = customerKey(name, phone, order.id);
    const existing = groups.get(key);
    const orderSummary: CustomerOrder = {
      id: order.id,
      order_number: order.order_number,
      total: Number(order.total),
      status: order.status,
      payment_status: order.payment_status,
      created_at: order.created_at,
    };

    if (existing) {
      existing.orders.push(orderSummary);
      continue;
    }

    const initials = name.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2) || "GU";
    groups.set(key, {
      id: key,
      full_name: name,
      phone: phone || "—",
      is_active: true,
      ordersCount: 0,
      totalSpent: 0,
      lastOrder: null,
      initials,
      orders: [orderSummary],
    });
  }

  let customers = Array.from(groups.values()).map((customer) => {
    const customerOrders = [...customer.orders].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const paidOrders = customerOrders.filter(
      (order) => order.status !== "cancelled" && order.payment_status === "paid"
    );

    return {
      ...customer,
      orders: customerOrders,
      ordersCount: customerOrders.length,
      totalSpent: paidOrders.reduce((sum, order) => sum + order.total, 0),
      lastOrder: customerOrders[0] ?? null,
    };
  });

  const search = params.q?.trim().toLocaleLowerCase();
  if (search) {
    customers = customers.filter((customer) =>
      customer.full_name.toLocaleLowerCase().includes(search) || customer.phone.toLocaleLowerCase().includes(search)
    );
  }
  if (params.status === "inactive") customers = [];

  const paidOrders = customers.flatMap((customer) => customer.orders).filter(
    (order) => order.status !== "cancelled" && order.payment_status === "paid"
  );
  const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const avgOrderValue = paidOrders.length ? totalRevenue / paidOrders.length : 0;

  return (
    <div style={{ padding:"clamp(16px,3vw,32px)", display:"flex", flexDirection:"column", gap:20 }}>
      <div>
        <p style={{ ...S.m, fontSize:9, letterSpacing:"0.25em", textTransform:"uppercase", color:"#6B6B63", marginBottom:4 }}>Admin</p>
        <h1 style={{ ...S.d, fontSize:"clamp(22px,4vw,32px)", fontWeight:300, color:"#1A1A18", margin:0 }}>Customers</h1>
      </div>

      <div className="cust-stats">
        {[
          { label:"Total Customers", value:customers.length },
          { label:"Active", value:customers.length },
          { label:"Total Revenue", value:formatPrice(totalRevenue) },
          { label:"Avg. Order Value", value:formatPrice(Math.round(avgOrderValue)) },
        ].map(({ label, value }) => (
          <div key={label} style={{ backgroundColor:"#FAFAF7", border:"1px solid #EDE8DC", padding:"14px 18px" }}>
            <p style={{ ...S.d, fontSize:22, fontWeight:300, color:"#1A1A18", margin:"0 0 4px" }}>{value}</p>
            <p style={{ ...S.m, fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase" as const, color:"#6B6B63", margin:0 }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {["all","active","inactive"].map(status => {
          const active = (params.status ?? "all") === status;
          return (
            <a key={status} href={`/admin/customers${status !== "all" ? `?status=${status}` : ""}`}
              style={{ padding:"8px 14px", border:`1px solid ${active?"#B8965A":"#EDE8DC"}`, backgroundColor:active?"#B8965A":"#FAFAF7", color:active?"#FAFAF7":"#6B6B63", textDecoration:"none", ...S.m, fontSize:8, letterSpacing:"0.12em", textTransform:"uppercase" }}>
              {status}
            </a>
          );
        })}
      </div>

      <CustomersClient customers={customers} />

      <style>{`.cust-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;} @media(max-width:800px){.cust-stats{grid-template-columns:repeat(2,1fr);}} @media(max-width:480px){.cust-stats{grid-template-columns:1fr;}}`}</style>
    </div>
  );
}
