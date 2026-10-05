import { create } from "zustand";

// ── Categories ──────────────────────────────────────────
export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
  createdAt: string;
};

type CategoryStore = {
  categories: AdminCategory[];
  addCategory: (c: Omit<AdminCategory, "id" | "createdAt" | "productCount">) => void;
  updateCategory: (id: string, c: Partial<AdminCategory>) => void;
  deleteCategory: (id: string) => void;
};

const SEED_CATEGORIES: AdminCategory[] = [
  { id: "cat-summer", name: "Summer Collection", slug: "summer", description: "Light, fresh fragrances for warm days.", image: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=400&q=80", productCount: 8, createdAt: "2024-01-01T00:00:00Z" },
  { id: "cat-winter", name: "Winter Collection", slug: "winter", description: "Rich, warm, and enveloping winter scents.", image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&q=80", productCount: 7, createdAt: "2024-01-01T00:00:00Z" },
  { id: "cat-bundle", name: "Gift Sets", slug: "bundle", description: "Curated gift sets and discovery collections.", image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400&q=80", productCount: 3, createdAt: "2024-01-01T00:00:00Z" },
];

export const useCategoryStore = create<CategoryStore>()((set) => ({
  categories: SEED_CATEGORIES,

  addCategory: (data) => {
    const id = `cat-${Date.now()}`;
    set((s) => ({
      categories: [...s.categories, { ...data, id, productCount: 0, createdAt: new Date().toISOString() }],
    }));
  },

  updateCategory: (id, data) => {
    set((s) => ({
      categories: s.categories.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
  },

  deleteCategory: (id) => {
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
  },
}));

// ── Coupons ─────────────────────────────────────────────
export type CouponStatus = "active" | "expired" | "draft";

export type AdminCoupon = {
  id: string;
  code: string;
  discount: number; // percentage
  expiryDate: string; // ISO date string
  status: CouponStatus;
  usageLimit: number;
  usageCount: number;
  minimumOrder: number;
  createdAt: string;
};

type CouponStore = {
  coupons: AdminCoupon[];
  addCoupon: (c: Omit<AdminCoupon, "id" | "createdAt" | "usageCount">) => void;
  updateCoupon: (id: string, c: Partial<AdminCoupon>) => void;
  deleteCoupon: (id: string) => void;
};

const SEED_COUPONS: AdminCoupon[] = [
  { id: "coup-1", code: "WELCOME10", discount: 10, expiryDate: "2025-12-31", status: "active", usageLimit: 500, usageCount: 127, minimumOrder: 100, createdAt: "2024-06-01T00:00:00Z" },
  { id: "coup-2", code: "WAQAR15", discount: 15, expiryDate: "2025-09-30", status: "active", usageLimit: 200, usageCount: 43, minimumOrder: 150, createdAt: "2024-07-01T00:00:00Z" },
  { id: "coup-3", code: "WELCOME20", discount: 20, expiryDate: "2025-03-01", status: "expired", usageLimit: 100, usageCount: 100, minimumOrder: 0, createdAt: "2024-01-01T00:00:00Z" },
  { id: "coup-4", code: "WINTER25", discount: 25, expiryDate: "2026-02-28", status: "draft", usageLimit: 300, usageCount: 0, minimumOrder: 200, createdAt: "2024-11-01T00:00:00Z" },
];

export const useCouponStore = create<CouponStore>()((set) => ({
  coupons: SEED_COUPONS,

  addCoupon: (data) => {
    const id = `coup-${Date.now()}`;
    set((s) => ({
      coupons: [...s.coupons, { ...data, id, usageCount: 0, createdAt: new Date().toISOString() }],
    }));
  },

  updateCoupon: (id, data) => {
    set((s) => ({
      coupons: s.coupons.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
  },

  deleteCoupon: (id) => {
    set((s) => ({ coupons: s.coupons.filter((c) => c.id !== id) }));
  },
}));
