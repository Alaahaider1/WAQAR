import { createServerClient } from "@/src/lib/supabase/server";
import { CategoryRepository } from "@/src/repositories/category.repository";
import { FeaturedCategoriesClient } from "./FeaturedCategoriesClient";

export async function FeaturedCategories() {
  const supabase = await createServerClient();
  const repository = new CategoryRepository(supabase);
  const categories = await repository.findFeatured();

  return (
    <FeaturedCategoriesClient
      categories={categories.map((category) => ({
        id: category.id,
        label: category.name,
        description: category.description ?? "Curated collection",
        image: category.imageUrl ?? "",
        href: `/products?category=${category.slug}`,
      }))}
    />
  );
}
