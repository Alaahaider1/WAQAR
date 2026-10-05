/**
 * Storefront product types — UI shape used across catalog components.
 * Live catalog data comes from Supabase via CatalogProvider.
 */

export type FragranceNote = {
  top: string[];
  heart: string[];
  base: string[];
};

export type Product = {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  price: number;
  originalPrice?: number;
  size: string;
  image: string;
  gallery: string[];
  description: string;
  longDescription: string;
  notes: FragranceNote;
  ingredients: string;
  isBestSeller?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  tags: string[];
};
