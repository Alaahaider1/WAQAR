/**
 * Review server actions.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth, requireAdmin } from '@/src/lib/auth/guards';
import { createServerClient } from '@/src/lib/supabase/server';
import { createAdminClient } from '@/src/lib/supabase/admin';
import { ReviewRepository } from '@/src/repositories/review.repository';
import { validate, ReviewSchema } from '@/src/validations';
import { actionSuccess, actionError, WaqarError, BusinessError, ConflictError } from '@/src/lib/errors';
import type { ActionResult } from '@/src/lib/errors';
import type { Review } from '@/src/types/domain';
import type { ReviewStatus } from '@/src/types/database';

export async function submitReviewAction(rawData: unknown): Promise<ActionResult<Review>> {
  try {
    const user = await requireAuth();
    const input = validate(ReviewSchema, rawData);
    const db = await createServerClient();
    const repo = new ReviewRepository(db);

    const alreadyReviewed = await repo.hasUserReviewedProduct(user.id, input.productId);
    if (alreadyReviewed) {
      throw new ConflictError('You have already submitted a review for this product');
    }

    const review = await repo.create(user.id, input);
    revalidatePath(`/products/${input.productId}`, 'page');
    return actionSuccess(review);
  } catch (error) {
    if (error instanceof WaqarError) return actionError(error);
    return actionError(new WaqarError('Failed to submit review', 'UNKNOWN_ERROR'));
  }
}

export async function updateReviewStatusAction(
  id: string,
  status: ReviewStatus
): Promise<ActionResult<Review>> {
  try {
    await requireAdmin();
    const db = createAdminClient();
    const repo = new ReviewRepository(db);
    const review = await repo.updateStatus(id, status);
    revalidatePath('/admin/reviews', 'page');
    revalidatePath(`/products/${review.productId}`, 'page');
    return actionSuccess(review);
  } catch (error) {
    if (error instanceof WaqarError) return actionError(error);
    return actionError(new WaqarError('Failed to update review status', 'UNKNOWN_ERROR'));
  }
}

export async function deleteReviewAction(id: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const db = createAdminClient();
    const repo = new ReviewRepository(db);
    await repo.delete(id);
    revalidatePath('/admin/reviews', 'page');
    return actionSuccess(undefined);
  } catch (error) {
    if (error instanceof WaqarError) return actionError(error);
    return actionError(new WaqarError('Failed to delete review', 'UNKNOWN_ERROR'));
  }
}
