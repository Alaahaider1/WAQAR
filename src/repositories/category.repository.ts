/**
 * Category repository.
 */

import { BaseRepository } from './base';
import { NotFoundError, toWaqarError } from '@/src/lib/errors';
import type { Category } from '@/src/types/domain';
import type { CategoryRow, TablesUpdate } from '@/src/types/database';
import type { CategoryInput } from '@/src/validations';

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    position: row.position,
    isActive: row.is_active,
    isFeatured: row.is_featured,
  };
}

export class CategoryRepository extends BaseRepository {

  async findAll(includeInactive = false): Promise<Category[]> {
    let query = this.db.from('categories').select('*');
    if (!includeInactive) query = query.eq('is_active', true);
    const { data, error } = await query.order('position');
    if (error) throw toWaqarError(error, 'CategoryRepository.findAll');
    return (data ?? []).map(mapCategory);
  }

  async findFeatured(): Promise<Category[]> {
  const { data, error } = await this.db
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('position');

  if (error) throw toWaqarError(error, 'CategoryRepository.findFeatured');
  return (data ?? []).map(mapCategory);
}

  async findBySlug(slug: string): Promise<Category> {
    const { data, error } = await this.db
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) throw new NotFoundError('Category', slug);
    return mapCategory(data);
  }

  async findById(id: string): Promise<Category> {
    const { data, error } = await this.db
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundError('Category', id);
    return mapCategory(data);
  }

  async create(input: CategoryInput): Promise<Category> {
    const { data, error } = await this.anyDb
      .from('categories')
      .insert({
        name: input.name,
        slug: input.slug ?? undefined,
        description: input.description ?? null,
        image_url: input.imageUrl ?? null,
        position: input.position ?? 0,
        is_active: input.isActive ?? true,
        is_featured: input.isFeatured ?? false,
      })
      .select()
      .single();

    if (error || !data) throw toWaqarError(error, 'CategoryRepository.create');
    return mapCategory(data);
  }

  async update(id: string, input: Partial<CategoryInput>): Promise<Category> {
    const updateData: TablesUpdate<'categories'> = {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.imageUrl !== undefined && { image_url: input.imageUrl }),
      ...(input.position !== undefined && { position: input.position }),
      ...(input.isActive !== undefined && { is_active: input.isActive }),
      ...(input.isFeatured !== undefined && { is_featured: input.isFeatured }),
    };

    const { data, error } = await this.db
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw toWaqarError(error, 'CategoryRepository.update');
    return mapCategory(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.anyDb.from('categories').delete().eq('id', id);
    if (error) throw toWaqarError(error, 'CategoryRepository.delete');
  }
}
