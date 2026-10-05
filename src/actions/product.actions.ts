/**
 * Product server actions — admin CRUD.
 */

'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { requireAdmin } from '@/src/lib/auth/guards';
import { createAdminClient } from '@/src/lib/supabase/admin';
import { ProductRepository } from '@/src/repositories/product.repository';
import { validate, ProductSchema, UpdateProductSchema } from '@/src/validations';
import { actionSuccess, actionError, WaqarError } from '@/src/lib/errors';
import type { ActionResult } from '@/src/lib/errors';
import type { Product } from '@/src/types/domain';
import type { ProductStatus } from '@/src/types/database';

type AdminProductPayload = {
  stock?: number;
};

function revalidateProducts(slug?: string) {
  updateTag('storefront-catalog');
  revalidatePath('/products', 'page');
  revalidatePath('/admin/products', 'page');
  revalidatePath('/', 'page');
  if (slug) revalidatePath(`/products/${slug}`, 'page');
}

export async function createProductAction(rawData: unknown): Promise<ActionResult<Product>> {
  try {
    await requireAdmin();
    const { stock, ...rest } = (rawData ?? {}) as Record<string, unknown> & AdminProductPayload;
    const input = validate(ProductSchema, rest);
    const db = createAdminClient();
    const repo = new ProductRepository(db);
    const product = await repo.create(input);
    if (typeof stock === 'number') {
      const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
      if (defaultVariant) {
        await repo.upsertInventory(defaultVariant.id, stock, !input.variants[0]?.isActive);
      }
    }
    revalidateProducts();
    return actionSuccess(product);
  } catch (error) {
    if (error instanceof WaqarError) return actionError(error);
    return actionError(new WaqarError('Failed to create product', 'UNKNOWN_ERROR'));
  }
}

export async function updateProductAction(id: string, rawData: unknown): Promise<ActionResult<Product>> {
  try {
    await requireAdmin();
    const { stock, ...rest } = (rawData ?? {}) as Record<string, unknown> & AdminProductPayload;
    const input = validate(UpdateProductSchema, rest);
    const db = createAdminClient();
    const repo = new ProductRepository(db);
    const product = await repo.update(id, input);
    if (typeof stock === 'number') {
      const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
      if (defaultVariant) {
        await repo.upsertInventory(defaultVariant.id, stock);
      }
    }
    revalidateProducts(product.slug);
    return actionSuccess(product);
  } catch (error) {
    if (error instanceof WaqarError) return actionError(error);
    return actionError(new WaqarError('Failed to update product', 'UNKNOWN_ERROR'));
  }
}

// Accepts _formData so it works with form.action = updateProductStatusAction.bind(null, id, status)
export async function updateProductStatusAction(
  id: string,
  status: ProductStatus,
  _formData?: FormData
): Promise<ActionResult<void>> {
  try {
    void _formData;
    await requireAdmin();
    const db = createAdminClient();
    await new ProductRepository(db).updateStatus(id, status);
    revalidateProducts();
    return actionSuccess(undefined);
  } catch (error) {
    if (error instanceof WaqarError) return actionError(error);
    return actionError(new WaqarError('Failed to update product status', 'UNKNOWN_ERROR'));
  }
}

export async function deleteProductAction(id: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const db = createAdminClient();
    await new ProductRepository(db).softDelete(id);
    revalidateProducts();
    return actionSuccess(undefined);
  } catch (error) {
    if (error instanceof WaqarError) return actionError(error);
    return actionError(new WaqarError('Failed to delete product', 'UNKNOWN_ERROR'));
  }
}
