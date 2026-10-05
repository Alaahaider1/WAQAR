/**
 * Coupon repository.
 */

import { BaseRepository } from './base';
import { NotFoundError, toWaqarError } from '@/src/lib/errors';
import type { Coupon, DiscountType, CouponStatus } from '@/src/types/domain';
import type { CouponRow, Database } from '@/src/types/database';
import type { CouponInput } from '@/src/validations';

function mapCoupon(row: CouponRow): Coupon {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    discountType: row.discount_type as DiscountType,
    discountValue: Number(row.discount_value),
    minimumOrderValue: Number(row.minimum_order_value ?? 0),
    maximumDiscount: row.maximum_discount === null ? null : Number(row.maximum_discount),
    usageLimit: row.usage_limit,
    usageCount: row.usage_count ?? 0,
    perUserLimit: row.per_user_limit ?? 1,
    status: row.status as CouponStatus,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
  };
}

export class CouponRepository extends BaseRepository {

  async findAll(): Promise<Coupon[]> {
    const { data, error } = await this.db
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw toWaqarError(error, 'CouponRepository.findAll');
    return (data ?? []).map(mapCoupon);
  }

  async findById(id: string): Promise<Coupon> {
    const { data, error } = await this.db
      .from('coupons')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundError('Coupon', id);
    return mapCoupon(data);
  }

  async findByCode(code: string): Promise<Coupon> {
    const { data, error } = await this.db
      .from('coupons')
      .select('*')
      .eq('code', code)
      .single();

    if (error || !data) throw new NotFoundError('Coupon', code);
    return mapCoupon(data);
  }

  async create(input: CouponInput): Promise<Coupon> {
    const { data, error } = await this.anyDb
      .from('coupons')
      .insert({
        code: input.code,
        description: input.description ?? null,
        discount_type: input.discountType,
        discount_value: input.discountValue,
        minimum_order_value: input.minimumOrderValue ?? 0,
        maximum_discount: input.maximumDiscount ?? null,
        usage_limit: input.usageLimit ?? null,
        per_user_limit: input.perUserLimit ?? 1,
        status: input.status ?? 'active',
        valid_from: input.validFrom ?? new Date().toISOString(),
        valid_until: input.validUntil ?? null,
      })
      .select()
      .single();

    if (error || !data) throw toWaqarError(error, 'CouponRepository.create');
    return mapCoupon(data);
  }

  async update(id: string, input: Partial<CouponInput>): Promise<Coupon> {
    const updateData: Database['public']['Tables']['coupons']['Update'] = {};
    if (input.code              !== undefined) updateData.code                = input.code;
    if (input.description       !== undefined) updateData.description         = input.description;
    if (input.discountType      !== undefined) updateData.discount_type       = input.discountType;
    if (input.discountValue     !== undefined) updateData.discount_value      = input.discountValue;
    if (input.minimumOrderValue !== undefined) updateData.minimum_order_value = input.minimumOrderValue;
    if (input.maximumDiscount   !== undefined) updateData.maximum_discount    = input.maximumDiscount;
    if (input.usageLimit        !== undefined) updateData.usage_limit         = input.usageLimit;
    if (input.perUserLimit      !== undefined) updateData.per_user_limit      = input.perUserLimit;
    if (input.status            !== undefined) updateData.status              = input.status;
    if (input.validFrom         !== undefined) updateData.valid_from          = input.validFrom;
    if (input.validUntil        !== undefined) updateData.valid_until         = input.validUntil;

    const { data, error } = await this.db
      .from('coupons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw toWaqarError(error, 'CouponRepository.update');
    return mapCoupon(data);
  }

  async updateStatus(id: string, status: Coupon['status']): Promise<void> {
    const { error } = await this.db
      .from('coupons')
      .update({ status })
      .eq('id', id);

    if (error) throw toWaqarError(error, 'CouponRepository.updateStatus');
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.anyDb.from('coupons').delete().eq('id', id);
    if (error) throw toWaqarError(error, 'CouponRepository.delete');
  }
}
