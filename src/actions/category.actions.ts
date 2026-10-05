'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/src/lib/auth/guards';
import { createAdminClient } from '@/src/lib/supabase/admin';
import { CategoryRepository } from '@/src/repositories/category.repository';
import { validate, CategorySchema } from '@/src/validations';
import { actionSuccess, actionError, WaqarError } from '@/src/lib/errors';
import type { ActionResult } from '@/src/lib/errors';
import type { Category } from '@/src/types/domain';

const CATEGORY_BUCKET = 'category-images';

function categoryStoragePath(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  try {
    const url = new URL(imageUrl);
    const marker = `/storage/v1/object/public/${CATEGORY_BUCKET}/`;
    const index = url.pathname.indexOf(marker);
    if (index < 0) return null;
    const path = decodeURIComponent(url.pathname.slice(index + marker.length));
    return path.startsWith('categories/') ? path : null;
  } catch {
    return null;
  }
}

function revalidate() {
  revalidatePath('/admin/categories', 'page');
  revalidatePath('/products', 'page');
  revalidatePath('/', 'page');
}

export async function createCategoryAction(rawData: unknown): Promise<ActionResult<Category>> {
  try {
    await requireAdmin();
    const input = validate(CategorySchema, rawData);
    const db = createAdminClient();
    const category = await new CategoryRepository(db).create(input);
    revalidate();
    return actionSuccess(category);
  } catch (e) {
    if (e instanceof WaqarError) return actionError(e);
    return actionError(new WaqarError('Failed to create category', 'UNKNOWN_ERROR'));
  }
}

export async function updateCategoryAction(id: string, rawData: unknown): Promise<ActionResult<Category>> {
  try {
    await requireAdmin();
    const input = validate(CategorySchema.partial(), rawData);
    const db = createAdminClient();
    const repository = new CategoryRepository(db);
    const previous = input.imageUrl !== undefined ? await repository.findById(id) : null;
    const category = await repository.update(id, input);
    if (previous && previous.imageUrl !== category.imageUrl) {
      const previousPath = categoryStoragePath(previous.imageUrl);
      if (previousPath) {
        try {
          const { error } = await db.storage.from(CATEGORY_BUCKET).remove([previousPath]);
          if (error) console.error('[categories] unable to remove replaced storage image', error);
        } catch (error) {
          console.error('[categories] unable to remove replaced storage image', error);
        }
      }
    }
    revalidate();
    return actionSuccess(category);
  } catch (e) {
    if (e instanceof WaqarError) return actionError(e);
    return actionError(new WaqarError('Failed to update category', 'UNKNOWN_ERROR'));
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const db = createAdminClient();
    const repository = new CategoryRepository(db);
    const category = await repository.findById(id);
    await repository.delete(id);
    const imagePath = categoryStoragePath(category.imageUrl);
    if (imagePath) {
      try {
        const { error } = await db.storage.from(CATEGORY_BUCKET).remove([imagePath]);
        if (error) console.error('[categories] unable to remove deleted category image', error);
      } catch (error) {
        console.error('[categories] unable to remove deleted category image', error);
      }
    }
    revalidate();
    return actionSuccess(undefined);
  } catch (e) {
    if (e instanceof WaqarError) return actionError(e);
    return actionError(new WaqarError('Failed to delete category', 'UNKNOWN_ERROR'));
  }
}
