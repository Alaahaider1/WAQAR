'use client';

import { createContext, useContext, useMemo } from 'react';
import type { Product } from '@/lib/data/products';

type CatalogContextValue = {
  products: Product[];
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({
  products,
  children,
}: {
  products: Product[];
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ products }), [products]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalogProducts(): Product[] {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error('useCatalogProducts must be used within CatalogProvider');
  }
  return ctx.products;
}
