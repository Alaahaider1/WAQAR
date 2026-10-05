import { BaseRepository } from './base';
import { NotFoundError, toWaqarError } from '@/src/lib/errors';
import type { AdminUgcVideo, PublicUgcVideo, UgcVideo } from '@/src/types/domain';
import type { UgcVideoRow } from '@/src/types/database';
import type { UgcVideoInput } from '@/src/validations';

function mapVideo(row: UgcVideoRow): UgcVideo {
  return {
    id: row.id, videoUrl: row.video_url, storagePath: row.storage_path,
    customerName: row.customer_name, caption: row.caption, position: row.position,
    isVisible: row.is_visible, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export class UgcVideoRepository extends BaseRepository {
  async findVisible(): Promise<PublicUgcVideo[]> {
    // RLS filters hidden rows. Keep the browser payload to storefront fields only.
    const { data, error } = await this.db.from('ugc_videos')
      .select('video_url, customer_name, caption, position, is_visible')
      .eq('is_visible', true)
      .order('position').order('video_url');
    // During a staged deployment the app can reach this code before the
    // corresponding migration reaches PostgREST's schema cache. Treat only
    // that known empty-collection condition as no videos; surface all other
    // database failures normally.
    if (error && (error as { code?: string }).code === 'PGRST205') return [];
    if (error) throw toWaqarError(error, 'UgcVideoRepository.findVisible');
    return (data ?? []).map(row => ({
      videoUrl: row.video_url,
      customerName: row.customer_name,
      caption: row.caption,
    }));
  }

  async findAll(): Promise<AdminUgcVideo[]> {
    const { data, error } = await this.db.from('ugc_videos')
      .select('id, video_url, customer_name, caption, position, is_visible')
      .order('position').order('created_at');
    if (error) throw toWaqarError(error, 'UgcVideoRepository.findAll');
    return (data ?? []).map(row => ({
      id: row.id,
      videoUrl: row.video_url,
      customerName: row.customer_name,
      caption: row.caption,
      position: row.position,
      isVisible: row.is_visible,
    }));
  }

  async findById(id: string): Promise<UgcVideo> {
    const { data, error } = await this.db.from('ugc_videos').select('*').eq('id', id).single();
    if (error || !data) throw new NotFoundError('UGC video', id);
    return mapVideo(data);
  }

  async create(input: UgcVideoInput, storagePath: string): Promise<UgcVideo> {
    const { data, error } = await this.anyDb.from('ugc_videos').insert({
      video_url: input.videoUrl, storage_path: storagePath,
      customer_name: input.customerName || null, caption: input.caption || null,
      position: input.position, is_visible: input.isVisible,
    }).select().single();
    if (error || !data) throw toWaqarError(error, 'UgcVideoRepository.create');
    return mapVideo(data);
  }

  async update(id: string, input: Partial<UgcVideoInput>, storagePath: string): Promise<UgcVideo> {
    const { data, error } = await this.anyDb.from('ugc_videos').update({
      ...(input.videoUrl !== undefined && { video_url: input.videoUrl }),
      storage_path: storagePath,
      ...(input.customerName !== undefined && { customer_name: input.customerName || null }),
      ...(input.caption !== undefined && { caption: input.caption || null }),
      ...(input.position !== undefined && { position: input.position }),
      ...(input.isVisible !== undefined && { is_visible: input.isVisible }),
    }).eq('id', id).select().single();
    if (error || !data) throw toWaqarError(error, 'UgcVideoRepository.update');
    return mapVideo(data);
  }

  async delete(id: string): Promise<UgcVideo> {
    const video = await this.findById(id);
    const { error } = await this.anyDb.from('ugc_videos').delete().eq('id', id);
    if (error) throw toWaqarError(error, 'UgcVideoRepository.delete');
    return video;
  }
}
