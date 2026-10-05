import { notFound } from "next/navigation";
import { createServerClient } from "@/src/lib/supabase/server";
import { ProductRepository } from "@/src/repositories/product.repository";
import { CategoryRepository } from "@/src/repositories/category.repository";
import { AdminEditProductClient } from "@/components/admin/AdminEditProductClient";
import { domainToFormData } from "@/lib/catalog/adminForm";

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();
  const productRepo = new ProductRepository(supabase);
  const categoryRepo = new CategoryRepository(supabase);

  let product;
  try {
    product = await productRepo.findById(id);
  } catch {
    notFound();
  }

  const categories = await categoryRepo.findAll(true);
  const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const stock = defaultVariant?.availableQuantity ?? 0;
  const initial = domainToFormData(product, stock);

  return (
    <AdminEditProductClient
      productId={product.id}
      productSlug={product.slug}
      initial={initial}
      categories={categories}
    />
  );
}
