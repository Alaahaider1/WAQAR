"use client";

import { useMemo } from "react";
import { useCatalogProducts } from "@/lib/catalog/CatalogProvider";
import type { Product } from "@/lib/data/products";

export function useStorefrontProducts() {
  const products = useCatalogProducts();

  return useMemo(() => {
    const summer = products.filter((p) => p.category === "summer");
    const winter = products.filter((p) => p.category === "winter");
    const bundles = products.filter((p) => p.category === "bundle");
    const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 4);
    const newArrivals = products.filter((p) => p.isNew).slice(0, 4);
    const featured = products.filter((p) => p.isFeatured).slice(0, 6);

    const getById = (id: string) => products.find((p) => p.id === id);

    const getByCategory = (cat: string) =>
      products.filter((p) => p.category === cat);

    const getRelated = (id: string, limit = 4) => {
      const current = products.find((p) => p.id === id);
      if (!current) return products.filter((p) => p.id !== id).slice(0, limit);
      return products
        .filter((p) => p.id !== id && p.category === current.category)
        .slice(0, limit);
    };

    return {
      all: products,
      summer,
      winter,
      bundles,
      bestSellers,
      newArrivals,
      featured,
      getById,
      getByCategory,
      getRelated,
    };
  }, [products]);
}
