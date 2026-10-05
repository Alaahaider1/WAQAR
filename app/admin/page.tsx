/**
 * Admin Dashboard — Server Component.
 * Fetches all data from Supabase on the server; no mock stores.
 */

import Link from "next/link";
import { createServerClient } from "@/src/lib/supabase/server";
import { formatPrice } from "@/lib/utils/formatPrice";
import { Package, ShoppingCart, Users, DollarSign, ArrowRight, Plus, AlertTriangle, Eye, TrendingUp } from "lucide-react";

const S = {
  d: { fontFamily:"'Cormorant Garamond',Georgia,serif" },
  b: { fontFamily:"'DM Sans',system-ui,sans-serif" },
  m: { fontFamily:"'DM Mono',monospace" },
} as const;

const STATUS_COLORS: Record<string,{bg:string;text:string}> = {
  pending:    { bg:"rgba(107,107,99,0.1)",   text:"#6B6B63" },
  processing: { bg:"rgba(184,150,90,0.1)",   text:"#B8965A" },
  shipped:    { bg:"rgba(26,26,24,0.08)",    text:"#1A1A18" },
  delivered:  { bg:"rgba(34,139,34,0.08)",   text:"#2d7a2d" },
  cancelled:  { bg:"rgba(204,68,68,0.08)",   text:"#cc4444" },
};

export default async function AdminDashboardPage() {
  const supabase = await createServerClient();

  // Run all queries in parallel for performance
  const [
    productsResult,
    ordersResult,
    customersResult,
    revenueResult,
    lowStockResult,
    bestSellersResult,
    recentOrdersResult,
  ] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'published').is('deleted_at', null),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer').is('deleted_at', null),
    supabase.from('orders').select('total').eq('payment_status', 'paid'),
    supabase.from('admin_inventory_status').select('*').eq('is_low_stock', true).limit(5),
    supabase.from('products').select('id, name, base_price, is_best_seller').eq('status', 'published').eq('is_best_seller', true).order('review_count', { ascending: false }).limit(5),
    supabase.from('admin_order_summary').select('*').order('created_at', { ascending: false }).limit(5),
  ]);

  const publishedCount = productsResult.count ?? 0;
  const orderCount = ordersResult.count ?? 0;
  const customerCount = customersResult.count ?? 0;
  const pendingOrders = 0; // lightweight — skip second query for now
  const totalRevenue = (revenueResult.data ?? []).reduce((s, o) => s + Number(o.total), 0);
  const lowStock = lowStockResult.data ?? [];
  const bestSellers = bestSellersResult.data ?? [];
  const recentOrders = recentOrdersResult.data ?? [];

  const stats = [
    { label:"Revenue",   value:formatPrice(totalRevenue), sub:`${orderCount} total orders`,         Icon:DollarSign,   color:"#B8965A", href:"/admin/orders" },
    { label:"Orders",    value:orderCount,                sub:`${pendingOrders} pending`,            Icon:ShoppingCart,  color:"#1A1A18", href:"/admin/orders" },
    { label:"Customers", value:customerCount,             sub:`${customerCount} active`,             Icon:Users,         color:"#6B6B63", href:"/admin/customers" },
    { label:"Products",  value:publishedCount,            sub:`${lowStock.length} low stock`,        Icon:Package,       color:"#B8965A", href:"/admin/products" },
  ];

  return (
    <div style={{ padding:"clamp(16px,3vw,32px)", display:"flex", flexDirection:"column", gap:24 }}>
      {/* Header */}
      <div>
        <p style={{ ...S.m, fontSize:9, letterSpacing:"0.25em", textTransform:"uppercase", color:"#6B6B63", marginBottom:4 }}>Overview</p>
        <h1 style={{ ...S.d, fontSize:"clamp(24px,4vw,32px)", fontWeight:300, color:"#1A1A18", margin:0 }}>Dashboard</h1>
      </div>

      {/* Stat cards */}
      <div className="dash-stats">
        {stats.map(({ label, value, sub, Icon, color, href }) => (
          <Link key={label} href={href} style={{ textDecoration:"none" }}>
            <div className="dash-stat-card" style={{ backgroundColor:"#FAFAF7", border:"1px solid #EDE8DC", padding:"18px 20px", cursor:"pointer", transition:"box-shadow 0.2s, border-color 0.2s", height:"100%", boxSizing:"border-box" as const }}
            >
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
                <div style={{ width:36, height:36, backgroundColor:`${color}14`, border:`1px solid ${color}22`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Icon size={16} strokeWidth={1.5} style={{ color }} />
                </div>
                <TrendingUp size={12} strokeWidth={1.5} style={{ color:"#EDE8DC", marginTop:4 }} />
              </div>
              <p style={{ ...S.d, fontSize:28, fontWeight:300, color:"#1A1A18", margin:"0 0 4px" }}>{value}</p>
              <p style={{ ...S.m, fontSize:9, letterSpacing:"0.15em", textTransform:"uppercase", color:"#6B6B63", margin:"0 0 2px" }}>{label}</p>
              <p style={{ ...S.b, fontSize:11, color:"#6B6B63", margin:0 }}>{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Main grid */}
      <div className="dash-main">

        {/* Recent orders */}
        <div style={{ backgroundColor:"#FAFAF7", border:"1px solid #EDE8DC", overflow:"hidden" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:"1px solid #EDE8DC" }}>
            <h2 style={{ ...S.d, fontSize:18, fontWeight:300, color:"#1A1A18", margin:0 }}>Recent Orders</h2>
            <Link href="/admin/orders" style={{ ...S.m, fontSize:9, letterSpacing:"0.15em", textTransform:"uppercase", color:"#B8965A", textDecoration:"none", display:"flex", alignItems:"center", gap:4 }}>
              View All <ArrowRight size={10} />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div style={{ padding:"32px 20px", textAlign:"center" }}>
              <p style={{ ...S.b, fontSize:13, color:"#6B6B63" }}>No orders yet.</p>
            </div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", minWidth:480 }}>
                <thead>
                  <tr>
                    {["Order","Customer","Total","Status"].map(h=>(
                      <th key={h} style={{ ...S.m, fontSize:8, letterSpacing:"0.18em", textTransform:"uppercase" as const, color:"#6B6B63", padding:"10px 14px", textAlign:"left" as const, backgroundColor:"#F5F0E8", borderBottom:"1px solid #EDE8DC", whiteSpace:"nowrap" as const }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o,i) => {
                    const sc = STATUS_COLORS[o.status] ?? STATUS_COLORS.pending;
                    return (
                      <tr key={o.id} style={{ borderBottom: i<recentOrders.length-1?"1px solid #EDE8DC":"none" }}>
                        <td style={{ padding:"12px 14px" }}><span style={{ ...S.m, fontSize:11, color:"#1A1A18" }}>{o.order_number}</span></td>
                        <td style={{ padding:"12px 14px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ width:26, height:26, borderRadius:"50%", backgroundColor:"#EDE8DC", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                              <span style={{ ...S.m, fontSize:8, color:"#6B6B63" }}>{(o.customer_name ?? 'GU').split(' ').map((w:string)=>w[0]).join('').toUpperCase().slice(0,2)}</span>
                            </div>
                            <div>
                              <p style={{ ...S.b, fontSize:12, fontWeight:500, color:"#1A1A18", margin:0 }}>{o.customer_name ?? 'Guest'}</p>
                              <p style={{ ...S.m, fontSize:9, color:"#6B6B63", margin:0 }}>{new Date(o.created_at).toLocaleDateString("en-GB",{day:"2-digit",month:"short"})}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:"12px 14px" }}><span style={{ ...S.m, fontSize:12, color:"#1A1A18" }}>{formatPrice(Number(o.total))}</span></td>
                        <td style={{ padding:"12px 14px" }}>
                          <span style={{ ...S.m, fontSize:8, letterSpacing:"0.12em", textTransform:"uppercase" as const, color:sc.text, backgroundColor:sc.bg, padding:"3px 8px" }}>{o.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Quick actions */}
          <div style={{ backgroundColor:"#FAFAF7", border:"1px solid #EDE8DC", padding:"16px 20px" }}>
            <h2 style={{ ...S.d, fontSize:18, fontWeight:300, color:"#1A1A18", margin:"0 0 14px" }}>Quick Actions</h2>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                { label:"Add New Product", href:"/admin/products/new", Icon:Plus, primary:true },
                { label:"View Products",   href:"/admin/products",     Icon:Package },
                { label:"View Orders",     href:"/admin/orders",       Icon:ShoppingCart },
                { label:"View Storefront", href:"/",                   Icon:Eye },
              ].map(({ label, href, Icon, primary }) => (
                <Link key={href} href={href}
                  className={primary ? "dash-qa-primary" : "dash-qa-secondary"}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", backgroundColor:primary?"#1A1A18":"#F5F0E8", textDecoration:"none", border:`1px solid ${primary?"#1A1A18":"#EDE8DC"}`, transition:"background-color 0.2s" }}
                >
                  <Icon size={13} strokeWidth={1.5} style={{ color:primary?"#FAFAF7":"#1A1A18", flexShrink:0 }} />
                  <span style={{ ...S.m, fontSize:9, letterSpacing:"0.15em", textTransform:"uppercase" as const, color:primary?"#FAFAF7":"#1A1A18" }}>{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Low stock alert */}
          {lowStock.length > 0 && (
            <div style={{ backgroundColor:"rgba(184,150,90,0.04)", border:"1px solid rgba(184,150,90,0.2)", padding:"16px 20px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12 }}>
                <AlertTriangle size={13} strokeWidth={1.5} style={{ color:"#B8965A" }} />
                <p style={{ ...S.m, fontSize:9, letterSpacing:"0.2em", textTransform:"uppercase", color:"#B8965A", margin:0 }}>Low Stock Alert</p>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {lowStock.map(p => (
                  <div key={p.variant_id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
                    <p style={{ ...S.b, fontSize:12, color:"#1A1A18", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{p.product_name}</p>
                    <span style={{ ...S.m, fontSize:10, color:p.is_out_of_stock?"#cc4444":"#B8965A", flexShrink:0 }}>{p.stock_quantity} left</span>
                  </div>
                ))}
              </div>
              <Link href="/admin/products" style={{ ...S.m, fontSize:9, letterSpacing:"0.15em", textTransform:"uppercase", color:"#B8965A", textDecoration:"none", display:"inline-flex", alignItems:"center", gap:4, marginTop:10 }}>
                Manage Stock <ArrowRight size={10} />
              </Link>
            </div>
          )}

          {/* Best selling */}
          <div style={{ backgroundColor:"#FAFAF7", border:"1px solid #EDE8DC", padding:"16px 20px" }}>
            <h2 style={{ ...S.d, fontSize:18, fontWeight:300, color:"#1A1A18", margin:"0 0 14px" }}>Best Selling</h2>
            {bestSellers.length === 0
              ? <p style={{ ...S.b, fontSize:13, color:"#6B6B63" }}>No best sellers flagged yet.</p>
              : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {bestSellers.map((p,i) => (
                    <div key={p.id} style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ ...S.m, fontSize:10, color:"#EDE8DC", width:16, flexShrink:0, textAlign:"center" }}>{i+1}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ ...S.b, fontSize:12, fontWeight:500, color:"#1A1A18", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</p>
                        <p style={{ ...S.m, fontSize:9, color:"#B8965A", margin:0 }}>{formatPrice(Number(p.base_price))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        </div>
      </div>

      <style>{`
        .dash-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
        .dash-main  { display:grid; grid-template-columns:1fr 300px; gap:16px; align-items:start; }
        @media(max-width:1200px){ .dash-main { grid-template-columns:1fr; } }
        @media(max-width:900px) { .dash-stats { grid-template-columns:repeat(2,1fr); } }
        @media(max-width:480px) { .dash-stats { grid-template-columns:1fr; } }
        .dash-stat-card:hover { border-color:#B8965A; }
        .dash-qa-primary:hover { background-color:#6B6B63 !important; }
        .dash-qa-secondary:hover { background-color:#EDE8DC !important; }
      `}</style>
    </div>
  );
}
