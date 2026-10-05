/**
 * Admin Categories — hybrid: Server Component fetches data,
 * client sub-components handle mutations.
 */

import { createServerClient } from "@/src/lib/supabase/server";
import { CategoryRepository } from "@/src/repositories/category.repository";
import { CategoriesClient } from "./CategoriesClient";

import type { Category } from "@/src/types/domain";

type AdminCategory = Category & { productCount: number };

type ProductCountRow = {
  category_id: string;
};

export default async function AdminCategoriesPage() {
  const supabase = await createServerClient();
  const repository = new CategoryRepository(supabase);
  const categories = await repository.findAll(true);

  const { data: counts } = await supabase
    .from("products")
    .select("category_id")
    .eq("status", "published")
    .is("deleted_at", null);

  const countMap: Record<string, number> = {};
  (counts ?? []).forEach((r: ProductCountRow) => {
    countMap[r.category_id] = (countMap[r.category_id] ?? 0) + 1;
  });

  const enriched: AdminCategory[] = categories.map((category) => ({
    ...category,
    productCount: countMap[category.id] ?? 0,
  }));

  return <CategoriesClient initialCategories={enriched} />;
}
