import type { Metadata } from "next";
import { Suspense } from "react";
import ProductsPageClient from "./ProductsPageClient";
import { fetchActiveCategories } from "@/lib/catalog/server";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Explore WAQAR's complete collection of luxury fragrances. Filter by season, category, and price to find your perfect scent.",
};

export default async function ProductsPage() {
  const categories = await fetchActiveCategories();
  return (
    <Suspense fallback={<div style={{ paddingTop: 160, textAlign: "center", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B6B63" }}>Loading…</div>}>
      <ProductsPageClient categories={categories.map((category) => ({ id: category.slug, label: category.name }))} />
    </Suspense>
  );
}
