const MANAGED_UGC_PATH = /^uploads\/\d{4}-\d{2}-\d{2}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(mp4|webm|mov)$/i;

export function isManagedUgcStoragePath(path: string): boolean {
  return MANAGED_UGC_PATH.test(path);
}

/** Accept only public URLs for files created in this app's UGC bucket. */
export function ugcStoragePathFromPublicUrl(videoUrl: string, supabaseUrl: string): string | null {
  try {
    const url = new URL(videoUrl);
    const projectUrl = new URL(supabaseUrl);
    const marker = '/storage/v1/object/public/ugc-videos/';
    if (url.origin !== projectUrl.origin || url.search || url.hash || url.username || url.password) return null;

    if (!url.pathname.startsWith(marker)) return null;
    const path = decodeURIComponent(url.pathname.slice(marker.length));
    return isManagedUgcStoragePath(path) ? path : null;
  } catch {
    return null;
  }
}
