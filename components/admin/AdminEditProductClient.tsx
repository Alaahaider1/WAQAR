"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm, ProductFormData } from "@/components/admin/ProductForm";
import { toast } from "@/components/ui/Toast";
import { updateProductAction } from "@/src/actions/product.actions";
import { formToProductInput } from "@/lib/catalog/adminForm";
import type { Category } from "@/src/types/domain";

const S = { d:{fontFamily:"'Cormorant Garamond',Georgia,serif"}, m:{fontFamily:"'DM Mono',monospace"} } as const;

export function AdminEditProductClient({
  productId,
  productSlug,
  initial,
  categories,
}: {
  productId: string;
  productSlug: string;
  initial: ProductFormData;
  categories: Category[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: ProductFormData) => {
    const categoryId = categories.find((c) => c.slug === data.category)?.id;
    if (!categoryId) {
      toast.error("Selected category was not found");
      return;
    }

    setLoading(true);
    const payload = formToProductInput(data, categoryId, productSlug);
    const stock = data.inStock ? data.stock : 0;
    const result = await updateProductAction(productId, { ...payload, stock });

    if (result.success) {
      toast.success(`"${data.name}" updated successfully`);
      router.refresh();
      router.push("/admin/products");
    } else {
      toast.error(result.error ?? "Failed to update product");
      setLoading(false);
    }
  };

  return (
    <div style={{ padding:"clamp(16px,3vw,32px)", maxWidth:900, flex:1 }}>
      <Link href="/admin/products"
        style={{ display:"inline-flex", alignItems:"center", gap:6, ...S.m, fontSize:9, letterSpacing:"0.15em", textTransform:"uppercase", color:"#6B6B63", textDecoration:"none", marginBottom:20 }}
        onMouseEnter={e=>(e.currentTarget.style.color="#B8965A")}
        onMouseLeave={e=>(e.currentTarget.style.color="#6B6B63")}
      >
        <ArrowLeft size={11}/> Back to Products
      </Link>
      <p style={{ ...S.m, fontSize:9, letterSpacing:"0.25em", textTransform:"uppercase", color:"#6B6B63", marginBottom:4 }}>Product Management</p>
      <h1 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:"clamp(22px,4vw,32px)", fontWeight:300, color:"#1A1A18", margin:"0 0 24px" }}>
        Edit: <em>{initial.name}</em>
      </h1>
      <ProductForm initial={initial} onSubmit={handleSubmit} submitLabel="Save Changes" loading={loading}/>
    </div>
  );
}
