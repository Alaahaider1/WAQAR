import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type { Product, ProductSizeVariant } from "@/lib/data/products";

/** The complete product is deliberately never persisted. */
export type CartItem = {
  productId: string;
  variantId?: string;
  productName?: string;
  variantSize?: string;
  unitPrice?: number;
  quantity: number;
};

export function getCartItemKey(item: Pick<CartItem, "productId" | "variantId">): string {
  return item.variantId ? `${item.productId}:${item.variantId}` : item.productId;
}

type CartStore = {
  items: CartItem[];
  addItem: (product: Product, variantOrQuantity?: ProductSizeVariant | number, quantity?: number) => void;
  removeItem: (cartItemKey: string) => void;
  updateQuantity: (cartItemKey: string, quantity: number) => void;
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
        variantId?: unknown;
        productName?: unknown;
        variantSize?: unknown;
        unitPrice?: unknown;
        quantity?: unknown;
        product?: { id?: unknown };
      };
      const productId = legacyItem.productId ?? legacyItem.product?.id;
      const quantity = Number(legacyItem.quantity);

      return typeof productId === "string" && productId && Number.isFinite(quantity) && quantity > 0
        ? [{
          productId,
          ...(typeof legacyItem.variantId === "string" ? { variantId: legacyItem.variantId } : {}),
          ...(typeof legacyItem.productName === "string" ? { productName: legacyItem.productName } : {}),
          ...(typeof legacyItem.variantSize === "string" ? { variantSize: legacyItem.variantSize } : {}),
          ...(typeof legacyItem.unitPrice === "number" && Number.isFinite(legacyItem.unitPrice) ? { unitPrice: legacyItem.unitPrice } : {}),
          quantity: Math.floor(quantity),
        }]
        : [];
    }),
  };
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, variantOrQuantity, requestedQuantity = 1) => {
        const variant = typeof variantOrQuantity === "object"
          ? variantOrQuantity
          : Array.isArray(product.variants)
            ? product.variants.find((availableVariant) => availableVariant.isDefault)
            : undefined;
        const quantity = typeof variantOrQuantity === "number" ? variantOrQuantity : requestedQuantity;
        if (!UUID_PATTERN.test(product.databaseId)) return;
        if (!Number.isFinite(quantity) || quantity < 1) return;
        if (variant && (!UUID_PATTERN.test(variant.id) || !Array.isArray(product.variants) || !product.variants.some((availableVariant) => availableVariant.id === variant.id))) return;
        const unitPrice = variant && Number.isFinite(variant.price) && variant.price > 0
          ? variant.price
          : null;
        if (variant && unitPrice === null) return;
        set((state) => {
          if (!variant) {
            const existingLegacyItem = state.items.find((item) => item.productId === product.databaseId || item.productId === product.id);
            if (existingLegacyItem) {
              return { items: state.items.map((item) => item === existingLegacyItem
                ? { ...item, productId: product.databaseId, quantity: item.quantity + Math.floor(quantity) }
                : item) };
            }
            return { items: [...state.items, { productId: product.databaseId, quantity: Math.floor(quantity) }] };
          }
          const existing = state.items.find((item) =>
            item.productId === product.databaseId &&
            (item.variantId === variant.id || (!item.variantId && product.defaultVariantId === variant.id))
          );
          if (existing) {
            return {
              items: state.items.map((item) =>
                item === existing
                  ? { productId: product.databaseId, variantId: variant.id, productName: product.name, variantSize: variant.size, unitPrice: unitPrice!, quantity: item.quantity + Math.floor(quantity) }
                  : item
              ),
            };
          }
          return { items: [...state.items, { productId: product.databaseId, variantId: variant.id, productName: product.name, variantSize: variant.size, unitPrice: unitPrice!, quantity: Math.floor(quantity) }] };
        });
      },

      removeItem: (itemKey) =>
        set((state) => ({ items: state.items.filter((item) => getCartItemKey(item) !== itemKey) })),

      updateQuantity: (itemKey, quantity) => {
        if (quantity < 1) return get().removeItem(itemKey);
        set((state) => ({
          items: state.items.map((item) =>
            getCartItemKey(item) === itemKey ? { ...item, quantity: Math.floor(quantity) } : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: "storefront-cart",
      version: 3,
      storage,
      partialize: (state): PersistedCartState => ({ items: state.items }),
      migrate: migrateCart,
    }
  )
);
