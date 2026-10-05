import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type { Product } from "@/lib/data/products";

/** The complete product is deliberately never persisted. */
export type CartItem = {
  productId: string;
  quantity: number;
};

type CartStore = {
  items: CartItem[];
  addItem: (product: Pick<Product, "id" | "databaseId">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
};

type PersistedCartState = Pick<CartStore, "items">;

const isQuotaExceededError = (error: unknown) => {
  const storageError = error as { name?: unknown; code?: unknown };
  return (
    storageError?.name === "QuotaExceededError" ||
    storageError?.code === 22 ||
    storageError?.code === 1014
  );
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const cartStorage: StateStorage = {
  getItem: (name) => window.localStorage.getItem(name),
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch (error) {
      if (!isQuotaExceededError(error)) throw error;

      // Remove the previous (possibly legacy, oversized) cart before retrying
      // the compact cart payload. Never let storage availability break the cart UI.
      try {
        window.localStorage.removeItem(name);
        window.localStorage.setItem(name, value);
      } catch (retryError) {
        console.warn("Unable to persist the cart because browser storage is full.", retryError);
      }
    }
  },
  removeItem: (name) => window.localStorage.removeItem(name),
};

const storage = createJSONStorage<PersistedCartState>(() => {
  if (typeof window === "undefined") throw new Error("localStorage is unavailable during SSR");
  return cartStorage;
});

const migrateCart = (persistedState: unknown): PersistedCartState => {
  const items =
    persistedState && typeof persistedState === "object" && Array.isArray((persistedState as { items?: unknown }).items)
      ? (persistedState as { items: unknown[] }).items
      : [];

  return {
    items: items.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const legacyItem = item as {
        productId?: unknown;
        quantity?: unknown;
        product?: { id?: unknown };
      };
      const productId = legacyItem.productId ?? legacyItem.product?.id;
      const quantity = Number(legacyItem.quantity);

      return typeof productId === "string" && productId && Number.isFinite(quantity) && quantity > 0
        ? [{ productId, quantity: Math.floor(quantity) }]
        : [];
    }),
  };
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        if (!UUID_PATTERN.test(product.databaseId)) return;
        if (!Number.isFinite(quantity) || quantity < 1) return;
        set((state) => {
          const existing = state.items.find((item) =>
            item.productId === product.databaseId || item.productId === product.id
          );
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.productId === product.databaseId || item.productId === product.id
                  ? { ...item, productId: product.databaseId, quantity: item.quantity + Math.floor(quantity) }
                  : item
              ),
            };
          }
          return { items: [...state.items, { productId: product.databaseId, quantity: Math.floor(quantity) }] };
        });
      },

      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((item) => item.productId !== productId) })),

      updateQuantity: (productId, quantity) => {
        if (quantity < 1) return get().removeItem(productId);
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId ? { ...item, quantity: Math.floor(quantity) } : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: "storefront-cart",
      version: 2,
      storage,
      partialize: (state): PersistedCartState => ({
        items: state.items.map(({ productId, quantity }) => ({ productId, quantity })),
      }),
      migrate: migrateCart,
    }
  )
);
