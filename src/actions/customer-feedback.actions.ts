'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/src/lib/auth/guards';
import { createAdminClient } from '@/src/lib/supabase/admin';
import { CustomerFeedbackRepository } from '@/src/repositories/customer-feedback.repository';
import { actionError, actionSuccess, StorageError, WaqarError } from '@/src/lib/errors';
import type { ActionResult } from '@/src/lib/errors';
import type { CustomerFeedbackImage } from '@/src/types/domain';

const BUCKET = 'customer-feedback';

function revalidate() { revalidatePath('/admin/settings', 'page'); revalidatePath('/', 'page'); }

export async function getAdminCustomerFeedbackAction(): Promise<ActionResult<CustomerFeedbackImage[]>> {
  try {
    await requireAdmin();
    return actionSuccess(await new CustomerFeedbackRepository(createAdminClient()).findAll());
  } catch (error) {
    return actionError(error instanceof WaqarError ? error : new WaqarError('Failed to load customer feedback images', 'UNKNOWN_ERROR'));
  }
}

export async function createCustomerFeedbackAction(input: { imageUrl: string; storagePath: string }): Promise<ActionResult<CustomerFeedbackImage>> {
  try {
    await requireAdmin();
    const image = await new CustomerFeedbackRepository(createAdminClient()).create(input);
    revalidate(); return actionSuccess(image);
  } catch (error) {
    return actionError(error instanceof WaqarError ? error : new WaqarError('Failed to save customer feedback image', 'UNKNOWN_ERROR'));
  }
}

export async function updateCustomerFeedbackAction(id: string, input: { position?: number; isVisible?: boolean }): Promise<ActionResult<CustomerFeedbackImage>> {
  try {
    await requireAdmin();
    const image = await new CustomerFeedbackRepository(createAdminClient()).update(id, input);
    revalidate(); return actionSuccess(image);
  } catch (error) {
    return actionError(error instanceof WaqarError ? error : new WaqarError('Failed to update customer feedback image', 'UNKNOWN_ERROR'));
  }
}

export async function moveCustomerFeedbackAction(id: string, direction: -1 | 1): Promise<ActionResult<CustomerFeedbackImage[]>> {
  try {
    await requireAdmin();
    const repo = new CustomerFeedbackRepository(createAdminClient());
    const images = await repo.findAll();
    const index = images.findIndex((image) => image.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= images.length) return actionSuccess(images);
    [images[index], images[target]] = [images[target], images[index]];
    const ordered = await Promise.all(images.map((image, position) => repo.update(image.id, { position })));
    revalidate(); return actionSuccess(ordered);
  } catch (error) {
    return actionError(error instanceof WaqarError ? error : new WaqarError('Failed to reorder customer feedback images', 'UNKNOWN_ERROR'));
  }
}

export async function deleteCustomerFeedbackAction(id: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const image = await new CustomerFeedbackRepository(createAdminClient()).delete(id);
    const { error } = await createAdminClient().storage.from(BUCKET).remove([image.storagePath]);
    if (error) throw new StorageError(`Failed to remove customer feedback image: ${error.message}`);
    revalidate(); return actionSuccess(undefined);
  } catch (error) {
    return actionError(error instanceof WaqarError ? error : new WaqarError('Failed to delete customer feedback image', 'UNKNOWN_ERROR'));
  }
}
