/**
 * Review repository.
 */

import { BaseRepository } from './base';
import { NotFoundError, toWaqarError } from '@/src/lib/errors';
import type { Review, PaginationParams, PaginatedResult } from '@/src/types/domain';
import type { ReviewStatus } from '@/src/types/database';
import type { ReviewInput } from '@/src/validations';

function mapReview(row: Record<string, unknown> & { profiles?: { full_name?: string | null } | null }): Review {
  const profile = row.profiles && typeof row.profiles === 'object' ? row.profiles : null;

  return {
    id: String(row.id ?? ''),
    productId: String(row.product_id ?? ''),
    userId: String(row.user_id ?? ''),
    authorName: profile?.full_name ?? null,
    rating: Number(row.rating ?? 0),
    title: row.title != null ? String(row.title) : null,
    body: row.body != null ? String(row.body) : null,
    status: row.status as Review['status'],
    helpfulCount: Number(row.helpful_count ?? 0),
    isVerifiedPurchase: row.order_id != null,
    createdAt: String(row.created_at ?? ''),
  };
}

export class ReviewRepository extends BaseRepository {

  async findByProduct(
    productId: string,
    pagination: PaginationParams = { page: 1, pageSize: 10 }
  ): Promise<PaginatedResult<Review>> {
    const { from, to } = this.toRange(pagination);

    const { data, error, count } = await this.db
      .from('reviews')
      .select('*, profiles(full_name)', { count: 'exact' })
      .eq('product_id', productId)
      .eq('status', 'approved' as ReviewStatus)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw toWaqarError(error, 'ReviewRepository.findByProduct');
    const rows = ((data ?? []) as unknown) as Array<Record<string, unknown> & { profiles?: { full_name?: string | null } | null }>;
    return this.paginate(rows.map(mapReview), count ?? 0, pagination);
  }

  async findByUser(userId: string): Promise<Review[]> {
    const { data, error } = await this.db
      .from('reviews')
      .select('*, profiles(full_name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw toWaqarError(error, 'ReviewRepository.findByUser');
    const rows = ((data ?? []) as unknown) as Array<Record<string, unknown> & { profiles?: { full_name?: string | null } | null }>;
    return rows.map(mapReview);
  }

  /** Admin: all reviews across statuses */
  async findAllAdmin(
    filters: { status?: ReviewStatus; productId?: string } = {},
    pagination: PaginationParams = { page: 1, pageSize: 20 }
  ): Promise<PaginatedResult<Review>> {
    const { from, to } = this.toRange(pagination);

    let query = this.db
      .from('reviews')
      .select('*, profiles(full_name)', { count: 'exact' });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.productId) query = query.eq('product_id', filters.productId);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw toWaqarError(error, 'ReviewRepository.findAllAdmin');
    const rows = ((data ?? []) as unknown) as Array<Record<string, unknown> & { profiles?: { full_name?: string | null } | null }>;
    return this.paginate(rows.map(mapReview), count ?? 0, pagination);
  }

  async findById(id: string): Promise<Review> {
    const { data, error } = await this.db
      .from('reviews')
      .select('*, profiles(full_name)')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundError('Review', id);
    return mapReview((data as unknown) as Record<string, unknown> & { profiles?: { full_name?: string | null } | null });
  }

  async create(userId: string, input: ReviewInput, orderId?: string): Promise<Review> {
    const { data, error } = await this.db
      .from('reviews')
      .insert({
        product_id: input.productId,
        user_id: userId,
        order_id: orderId ?? null,
        rating: input.rating,
        title: input.title ?? null,
        body: input.body,
        status: 'pending' as ReviewStatus,
      })
      .select('*, profiles(full_name)')
      .single();

    if (error || !data) throw toWaqarError(error, 'ReviewRepository.create');
    return mapReview((data as unknown) as Record<string, unknown> & { profiles?: { full_name?: string | null } | null });
  }

  async updateStatus(id: string, status: ReviewStatus): Promise<Review> {
    const { data, error } = await this.db
      .from('reviews')
      .update({ status })
      .eq('id', id)
      .select('*, profiles(full_name)')
      .single();

    if (error || !data) throw toWaqarError(error, 'ReviewRepository.updateStatus');
    return mapReview((data as unknown) as Record<string, unknown> & { profiles?: { full_name?: string | null } | null });
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.anyDb.from('reviews').delete().eq('id', id);
    if (error) throw toWaqarError(error, 'ReviewRepository.delete');
  }

  async hasUserReviewedProduct(userId: string, productId: string): Promise<boolean> {
    const { data } = await this.db
      .from('reviews')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();
    return !!data;
  }
}
