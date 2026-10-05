/**
 * Coupon server actions — admin management.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/src/lib/auth/guards';
import { createAdminClient } from '@/src/lib/supabase/admin';
import { createServerClient } from '@/src/lib/supabase/server';
import { CouponRepository } from '@/src/repositories/coupon.repository';
import { validate, CouponSchema } from '@/src/validations';
import { actionSuccess, actionError, WaqarError } from '@/src/lib/errors';
import type { ActionResult } from '@/src/lib/errors';
import type { Coupon } from '@/src/types/domain';

function revalidate() {
  revalidatePath('/admin/coupons', 'page');
}

export async function createCouponAction(rawData: unknown): Promise<ActionResult<Coupon>> {
  try {
    await requireAdmin();
    const input = validate(CouponSchema, rawData);
    const db = createAdminClient();
    const coupon = await new CouponRepository(db).create(input);
    revalidate();
    return actionSuccess(coupon);
  } catch (e) {
    if (e instanceof WaqarError) return actionError(e);
    return actionError(new WaqarError('Failed to create coupon', 'UNKNOWN_ERROR'));
  }
}

export async function updateCouponAction(id: string, rawData: unknown): Promise<ActionResult<Coupon>> {
  try {
    await requireAdmin();
    const input = validate(CouponSchema.partial(), rawData);
    const db = createAdminClient();
    const coupon = await new CouponRepository(db).update(id, input);
    revalidate();
    return actionSuccess(coupon);
  } catch (e) {
    if (e instanceof WaqarError) return actionError(e);
    return actionError(new WaqarError('Failed to update coupon', 'UNKNOWN_ERROR'));
  }
}

export async function deleteCouponAction(id: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const db = createAdminClient();
    await new CouponRepository(db).delete(id);
    revalidate();
    return actionSuccess(undefined);
  } catch (e) {
    if (e instanceof WaqarError) return actionError(e);
    return actionError(new WaqarError('Failed to delete coupon', 'UNKNOWN_ERROR'));
  }
}

const ValidateCouponSchema = z.object({
  code: z.string().min(1, 'Code is required').trim().toUpperCase(),
  subtotal: z.coerce.number().nonnegative('Subtotal must be a non-negative number'),
});

type ValidateCouponInput = z.infer<typeof ValidateCouponSchema>;

type ValidateCouponResult = {
  code: string;
  discountAmount: number;
  discountType: Coupon['discountType'];
  discountValue: number;
  minimumOrderValue: number;
};

export async function validateCouponAction(rawData: unknown): Promise<ActionResult<ValidateCouponResult>> {
  try {
    const input = validate(ValidateCouponSchema, rawData) as ValidateCouponInput;
    const db = await createServerClient();
    const coupon = await new CouponRepository(db).findByCode(input.code);

    const now = new Date().toISOString();
    if (coupon.status !== 'active' || (coupon.validFrom && coupon.validFrom > now) || (coupon.validUntil && coupon.validUntil < now) || coupon.minimumOrderValue > input.subtotal) {
      throw new WaqarError('Invalid coupon code.', 'INVALID_COUPON');
    }

    const rawDiscount = coupon.discountType === 'percentage'
      ? input.subtotal * (coupon.discountValue / 100)
      : coupon.discountValue;
    const discountAmount = coupon.discountType === 'percentage' && coupon.maximumDiscount != null
      ? Math.min(rawDiscount, coupon.maximumDiscount)
      : rawDiscount;

    return actionSuccess({
      code: coupon.code,
      discountAmount,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minimumOrderValue: coupon.minimumOrderValue,
    });
  } catch (e) {
    if (e instanceof WaqarError) return actionError(e);
    return actionError(new WaqarError('Failed to validate coupon', 'COUPON_VALIDATION_FAILED'));
  }
}

export async function updateCouponStatusAction(id: string, status: string, _?: FormData): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const db = createAdminClient();
    await new CouponRepository(db).updateStatus(id, status as Coupon['status']);
    revalidate();
    return actionSuccess(undefined);
  } catch (e) {
    if (e instanceof WaqarError) return actionError(e);
    return actionError(new WaqarError('Failed to update coupon status', 'UNKNOWN_ERROR'));
  }
}
