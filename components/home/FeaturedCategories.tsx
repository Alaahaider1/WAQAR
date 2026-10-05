import { fetchFeaturedCategories } from "@/lib/catalog/server";
import { FeaturedCategoriesClient } from "./FeaturedCategoriesClient";

export async function FeaturedCategories() {
  const categories = await fetchFeaturedCategories();

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
