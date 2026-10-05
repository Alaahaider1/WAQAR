/**
 * Admin Products — Server Component.
 * Fetches from Supabase; no Zustand store.
 */

import Link from "next/link";
import { createServerClient } from "@/src/lib/supabase/server";
import { formatPrice } from "@/lib/utils/formatPrice";
import { Plus, Eye, Pencil } from "lucide-react";
import { updateProductStatusAction } from "@/src/actions/product.actions";
import { DeleteProductButton } from "./DeleteProductButton";

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  base_price: number;
  compare_at_price: number | null;
  status: string;
  is_best_seller: boolean;
  is_new: boolean;
  is_featured: boolean;
  rating: number;
  review_count: number;
  created_at: string;
  categories?: Array<{ id: string; slug: string; name: string }> | { id: string; slug: string; name: string } | null;
  product_images?: Array<{ url: string | null; position: number }>;
  product_variants?: Array<{ id: string; sku: string; size: string; price: number; is_default: boolean; is_active: boolean }>;
};

const S = {
  d: { fontFamily:"'Cormorant Garamond',Georgia,serif" },
  b: { fontFamily:"'DM Sans',system-ui,sans-serif" },
  m: { fontFamily:"'DM Mono',monospace" },
} as const;

const th: React.CSSProperties = {
  ...S.m, fontSize:8, letterSpacing:"0.18em", textTransform:"uppercase",
  color:"#6B6B63", padding:"10px 14px", textAlign:"left",
  backgroundColor:"#F5F0E8", borderBottom:"1px solid #EDE8DC", whiteSpace:"nowrap",
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createServerClient();

  let query = supabase
    .from("products")
    .select(`
      id, slug, name, subtitle, base_price, compare_at_price,
      status, is_best_seller, is_new, is_featured,
      rating, review_count, created_at,
      categories!inner(id, slug, name),
      product_images(url, position),
      product_variants(id, sku, size, price, is_default)
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status as "published" | "draft" | "archived");
  }
  if (params.category && params.category !== "all") {
    query = query.eq("categories.slug", params.category);
  }

  const { data: products, error } = await query;

  if (error) {
    console.error("Products query error:", error);
  }

  const rows = ((products ?? []) as unknown) as ProductRow[];

  const FILTERS = [
    { id: "all",       label: "All" },
    { id: "published", label: "Published" },
    { id: "draft",     label: "Draft" },
    { id: "archived",  label: "Archived" },
  ];

  return (
    <div style={{ padding:"clamp(16px,3vw,32px)", display:"flex", flexDirection:"column", gap:20 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <p style={{ ...S.m, fontSize:9, letterSpacing:"0.25em", textTransform:"uppercase", color:"#6B6B63", marginBottom:4 }}>Admin</p>
          <h1 style={{ ...S.d, fontSize:"clamp(22px,4vw,32px)", fontWeight:300, color:"#1A1A18", margin:0 }}>Products</h1>
        </div>
        <Link href="/admin/products/new"
          style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 20px", backgroundColor:"#1A1A18", color:"#FAFAF7", textDecoration:"none", ...S.m, fontSize:10, letterSpacing:"0.15em", textTransform:"uppercase" }}>
          <Plus size={13} strokeWidth={2} /> Add Product
        </Link>
      </div>

      {/* Status filter */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {FILTERS.map(f => {
          const active = (params.status ?? "all") === f.id;
          return (
            <Link key={f.id} href={`/admin/products${f.id !== "all" ? `?status=${f.id}` : ""}`}
              style={{ padding:"7px 14px", border:`1px solid ${active?"#B8965A":"#EDE8DC"}`, backgroundColor:active?"#B8965A":"#FAFAF7", color:active?"#FAFAF7":"#6B6B63", textDecoration:"none", ...S.m, fontSize:8, letterSpacing:"0.12em", textTransform:"uppercase" }}>
              {f.label}
            </Link>
          );
        })}
        <span style={{ ...S.m, fontSize:9, letterSpacing:"0.1em", color:"#6B6B63", marginLeft:"auto", alignSelf:"center" }}>{rows.length} products</span>
      </div>

      {/* Table */}
      <div style={{ backgroundColor:"#FAFAF7", border:"1px solid #EDE8DC", overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", minWidth:700 }}>
          <thead>
            <tr>
              <th style={th}>Image</th>
              <th style={th}>Name</th>
              <th style={th}>Category</th>
              <th style={th}>Price</th>
              <th style={th}>Status</th>
              <th style={th}>Badges</th>
              <th style={{ ...th, textAlign:"right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign:"center", padding:"48px 24px" }}>
                <p style={{ ...S.d, fontSize:22, fontWeight:300, color:"#EDE8DC" }}>No products found</p>
              </td></tr>
            ) : rows.map((p: ProductRow, i: number) => {
              const cat = Array.isArray(p.categories) ? p.categories[0] : p.categories;
              const img = (p.product_images ?? []).find((x) => x.position === 0) ?? p.product_images?.[0];
              const status = p.status as string;
              return (
                <tr key={p.id} style={{ borderBottom: i < rows.length - 1 ? "1px solid #EDE8DC" : "none" }}>
                  <td style={{ padding:"10px 14px", width:56 }}>
                    <div style={{ width:44, height:44, backgroundColor:"#F5F0E8", overflow:"hidden" }}>
                      {img?.url && <img src={img.url} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />}
                    </div>
                  </td>
                  <td style={{ padding:"10px 14px", maxWidth:180 }}>
                    <p style={{ ...S.b, fontSize:13, fontWeight:500, color:"#1A1A18", margin:"0 0 2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</p>
                    <p style={{ ...S.m, fontSize:9, color:"#6B6B63", margin:0 }}>{p.subtitle}</p>
                  </td>
                  <td style={{ padding:"10px 14px" }}>
                    <span style={{ ...S.m, fontSize:9, letterSpacing:"0.1em", textTransform:"uppercase" as const, color:"#6B6B63" }}>
                      {cat?.name ?? "—"}
                    </span>
                  </td>
                  <td style={{ padding:"10px 14px" }}>
                    <p style={{ ...S.m, fontSize:13, color:"#1A1A18", margin:0 }}>{formatPrice(Number(p.base_price))}</p>
                  </td>
                  <td style={{ padding:"10px 14px" }}>
                    <form action={async () => { "use server"; await updateProductStatusAction(p.id, status === "published" ? "draft" : "published"); }}>
                      <button type="submit" style={{ ...S.m, fontSize:8, letterSpacing:"0.12em", textTransform:"uppercase" as const, color:status==="published"?"#B8965A":"#6B6B63", backgroundColor:status==="published"?"rgba(184,150,90,0.1)":"#F5F0E8", padding:"3px 8px", border:`1px solid ${status==="published"?"rgba(184,150,90,0.2)":"#EDE8DC"}`, cursor:"pointer" }}>
                        {status}
                      </button>
                    </form>
                  </td>
                  <td style={{ padding:"10px 14px" }}>
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                      {p.is_best_seller && <span style={{ ...S.m, fontSize:7, letterSpacing:"0.08em", textTransform:"uppercase" as const, backgroundColor:"#B8965A", color:"#FAFAF7", padding:"2px 5px" }}>Best</span>}
                      {p.is_new && <span style={{ ...S.m, fontSize:7, letterSpacing:"0.08em", textTransform:"uppercase" as const, backgroundColor:"#1A1A18", color:"#FAFAF7", padding:"2px 5px" }}>New</span>}
                      {p.is_featured && <span style={{ ...S.m, fontSize:7, letterSpacing:"0.08em", textTransform:"uppercase" as const, backgroundColor:"#6B6B63", color:"#FAFAF7", padding:"2px 5px" }}>Feat.</span>}
                    </div>
                  </td>
                  <td style={{ padding:"10px 14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:5, justifyContent:"flex-end" }}>
                      <Link href={`/products/${p.slug}`} target="_blank"
                        style={{ width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid #EDE8DC", backgroundColor:"#F5F0E8", color:"#6B6B63", textDecoration:"none" }}>
                        <Eye size={12} strokeWidth={1.5} />
                      </Link>
                      <Link href={`/admin/products/${p.id}/edit`}
                        style={{ width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid #EDE8DC", backgroundColor:"#F5F0E8", color:"#6B6B63", textDecoration:"none" }}>
                        <Pencil size={12} strokeWidth={1.5} />
                      </Link>
                      <DeleteProductButton productId={p.id} productName={p.name} />
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
