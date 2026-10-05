/**
 * Base repository class.
 *
 * Provides the Supabase client and common helpers to all repository subclasses.
 * Repositories are responsible for all database access — no SQL or Supabase
 * calls should appear outside this layer.
 *
 * Usage pattern:
 *   - Server Components and Server Actions instantiate a repository per request
 *   - Repositories accept a pre-built Supabase client so the caller controls
 *     whether to use the user-scoped client (respects RLS) or the admin client
 *
 * @example
 *   const repo = new ProductRepository(await createServerClient())
 *   const product = await repo.findBySlug('golden-light')
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/src/types/database';
import { NotFoundError, toWaqarError } from '@/src/lib/errors';
import type { PaginationParams, PaginatedResult } from '@/src/types/domain';

export type DbClient = SupabaseClient<Database>;

export abstract class BaseRepository {
  protected readonly db: DbClient;

  constructor(db: DbClient) {
    this.db = db;
  }

  /**
   * Returns the db client cast to `any` for insert/update operations.
   *
   * Supabase's generated types use complex conditional types for Insert/Update
   * that TypeScript 5.x sometimes fails to resolve correctly when using
   * hand-written Database interfaces. This helper lets repositories bypass
   * the type inference on the payload while keeping full type safety on
   * the returned Row data (which is always correctly inferred).
   *
   * The insert/update data is always validated by Zod before reaching the
   * repository, so runtime safety is guaranteed independently of TypeScript.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected get anyDb(): any {
    return this.db;
  }

  // ── Pagination helper ───────────────────────────────────────────────────

  /**
   * Compute Supabase range parameters from pagination params.
   * Supabase uses 0-indexed ranges: page 1, size 10 → range(0, 9)
   */
  protected toRange(params: PaginationParams): { from: number; to: number } {
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    return { from, to };
  }

  /**
   * Build a PaginatedResult from raw DB results and the total count.
   */
  protected paginate<T>(
    data: T[],
    total: number,
    params: PaginationParams
  ): PaginatedResult<T> {
    const totalPages = Math.ceil(total / params.pageSize);
    return {
      data,
      total,
      page: params.page,
      pageSize: params.pageSize,
      totalPages,
      hasNextPage: params.page < totalPages,
      hasPreviousPage: params.page > 1,
    };
  }

  // ── Error handling ───────────────────────────────────────────────────────

  /**
   * Wrap a Supabase query result: throw a WaqarError if the query failed,
   * otherwise return the data.
   */
  protected unwrap<T>(
    result: { data: T | null; error: unknown },
    context: string
  ): T {
    if (result.error) throw toWaqarError(result.error, context);
    if (result.data === null) {
      throw new NotFoundError(context);
    }
    return result.data;
  }

  /**
   * Same as unwrap but returns null instead of throwing for missing rows.
   * Use when null is a valid "not found" result (e.g. optional lookups).
   */
  protected unwrapNullable<T>(
    result: { data: T | null; error: unknown },
    context: string
  ): T | null {
    if (result.error) {
      const err = result.error as { code?: string };
      // PGRST116 = "JSON object requested, multiple (or no) rows returned"
      // This is the Supabase .single() "not found" code — return null instead of throwing
      if (err?.code === 'PGRST116') return null;
      throw toWaqarError(result.error, context);
    }
    return result.data;
  }
}
