import { requireAdmin } from '@/src/lib/auth/guards';
import { createAdminClient } from '@/src/lib/supabase/admin';
import { UgcVideoRepository } from '@/src/repositories/ugc-video.repository';
import { UgcVideosClient } from './UgcVideosClient';

export default async function AdminUgcVideosPage() {
  await requireAdmin();
  const videos = await new UgcVideoRepository(createAdminClient()).findAll();
  return <UgcVideosClient initialVideos={videos} />;
}
