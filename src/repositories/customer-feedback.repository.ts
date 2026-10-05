import { BaseRepository } from './base';
import { NotFoundError, toWaqarError } from '@/src/lib/errors';
import type { CustomerFeedbackImage } from '@/src/types/domain';
import type { CustomerFeedbackImageRow } from '@/src/types/database';

function mapImage(row: CustomerFeedbackImageRow): CustomerFeedbackImage {
  return {
    id: row.id, imageUrl: row.image_url, storagePath: row.storage_path,
    position: row.position, isVisible: row.is_visible,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export class CustomerFeedbackRepository extends BaseRepository {
  async findVisible(): Promise<CustomerFeedbackImage[]> {
    const { data, error } = await this.db.from('customer_feedback_images').select('*').eq('is_visible', true).order('position').order('created_at');
    if (error && (error as { code?: string }).code === 'PGRST205') return [];
    if (error) throw toWaqarError(error, 'CustomerFeedbackRepository.findVisible');
    return (data ?? []).map(mapImage);
  }

  async findAll(): Promise<CustomerFeedbackImage[]> {
    const { data, error } = await this.db.from('customer_feedback_images').select('*').order('position').order('created_at');
    if (error) throw toWaqarError(error, 'CustomerFeedbackRepository.findAll');
    return (data ?? []).map(mapImage);
  }

  async findById(id: string): Promise<CustomerFeedbackImage> {
    const { data, error } = await this.db.from('customer_feedback_images').select('*').eq('id', id).single();
    if (error || !data) throw new NotFoundError('Customer feedback image', id);
    return mapImage(data);
  }

  async create(input: { imageUrl: string; storagePath: string; position?: number; isVisible?: boolean }): Promise<CustomerFeedbackImage> {
    const { data, error } = await this.anyDb.from('customer_feedback_images').insert({
      image_url: input.imageUrl, storage_path: input.storagePath,
      position: input.position ?? 0, is_visible: input.isVisible ?? true,
    }).select().single();
    if (error || !data) throw toWaqarError(error, 'CustomerFeedbackRepository.create');
    return mapImage(data);
  }

  async update(id: string, input: { position?: number; isVisible?: boolean }): Promise<CustomerFeedbackImage> {
    const { data, error } = await this.anyDb.from('customer_feedback_images').update({
      ...(input.position !== undefined && { position: input.position }),
      ...(input.isVisible !== undefined && { is_visible: input.isVisible }),
    }).eq('id', id).select().single();
    if (error || !data) throw toWaqarError(error, 'CustomerFeedbackRepository.update');
    return mapImage(data);
  }

  async delete(id: string): Promise<CustomerFeedbackImage> {
    const image = await this.findById(id);
    const { error } = await this.anyDb.from('customer_feedback_images').delete().eq('id', id);
    if (error) throw toWaqarError(error, 'CustomerFeedbackRepository.delete');
    return image;
  }
}
