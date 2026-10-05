/**
 * Site settings server actions.
 */

'use server';

import { revalidatePath, unstable_cache, updateTag } from 'next/cache';
import { requireAdmin } from '@/src/lib/auth/guards';
import { createAdminClient } from '@/src/lib/supabase/admin';
import { createServerClient } from '@/src/lib/supabase/server';
import { SiteSettingsRepository } from '@/src/repositories/site-settings.repository';
import { actionSuccess, actionError, toWaqarError, WaqarError } from '@/src/lib/errors';
import type { ActionResult } from '@/src/lib/errors';
import type { SiteSettings } from '@/src/types/domain';

export interface AdminSettingsData {
  settings: Partial<SiteSettings>;
  profile: {
    fullName: string;
    email: string;
    phone: string;
  };
}

// Public settings are shared by every visitor. Keep this query out of the
// request path, and invalidate it immediately when an admin saves changes.
const getCachedPublicSettings = unstable_cache(
  async () => new SiteSettingsRepository(createAdminClient()).findPublic(),
  ['site-settings-public'],
  { tags: ['site-settings-public'], revalidate: 300 }
);

export async function getPublicSettingsAction(): Promise<ActionResult<Partial<SiteSettings>>> {
  try {
    const settings = await getCachedPublicSettings();
    return actionSuccess(settings);
  } catch (error) {
    if (error instanceof WaqarError) return actionError(error);
    return actionError(new WaqarError('Failed to load settings', 'UNKNOWN_ERROR'));
  }
}

export async function updateSiteSettingsAction(
  settings: Record<string, unknown>
): Promise<ActionResult<void>> {
  try {
    const user = await requireAdmin();
    const pixelEnabled = settings.meta_pixel_enabled === true;
    const pixelId = typeof settings.meta_pixel_id === 'string' ? settings.meta_pixel_id.trim() : '';
    if (pixelEnabled && !/^\d+$/.test(pixelId)) {
      throw new WaqarError('A numeric Meta Pixel ID is required when Meta Pixel is enabled', 'VALIDATION_ERROR', 422);
    }
    const db = createAdminClient();
    const repo = new SiteSettingsRepository(db);
    await repo.setMany(settings, user.id);
    updateTag('site-settings-public');
    revalidatePath('/', 'layout');
    revalidatePath('/admin/settings', 'page');
    return actionSuccess(undefined);
  } catch (error) {
    if (error instanceof WaqarError) return actionError(error);
    return actionError(new WaqarError('Failed to update settings', 'UNKNOWN_ERROR'));
  }
}

/** Load the authenticated administrator's profile and the single site-settings store. */
export async function getAdminSettingsAction(): Promise<ActionResult<AdminSettingsData>> {
  try {
    const user = await requireAdmin();
    const db = createAdminClient();
    const [settings, profileResult] = await Promise.all([
      new SiteSettingsRepository(db).findAll(),
      db.from('profiles').select('full_name, email, phone').eq('id', user.id).single(),
    ]);

    if (profileResult.error || !profileResult.data) {
      throw new WaqarError('Failed to load administrator profile', 'UNKNOWN_ERROR');
    }

    return actionSuccess({
      settings,
      profile: {
        fullName: profileResult.data.full_name ?? '',
        email: profileResult.data.email,
        phone: profileResult.data.phone ?? '',
      },
    });
  } catch (error) {
    if (error instanceof WaqarError) return actionError(error);
    return actionError(new WaqarError('Failed to load settings', 'UNKNOWN_ERROR'));
  }
}

/** Persist the editable fields that exist on public.profiles and auth.users. */
export async function updateAdminProfileAction(input: {
  fullName: string;
  email: string;
  phone: string;
}): Promise<ActionResult<void>> {
  try {
    const user = await requireAdmin();
    const email = input.email.trim();
    if (!email) throw new WaqarError('Email address is required', 'VALIDATION_ERROR', 422);

    const serverDb = await createServerClient();
    if (email !== user.email) {
      const { error } = await serverDb.auth.updateUser({ email });
      if (error) throw toWaqarError(error, 'updateAdminProfileAction.email');
    }

    const { error } = await createAdminClient()
      .from('profiles')
      .update({ full_name: input.fullName.trim() || null, phone: input.phone.trim() || null, email })
      .eq('id', user.id);
    if (error) throw toWaqarError(error, 'updateAdminProfileAction.profile');

    revalidatePath('/admin', 'layout');
    revalidatePath('/admin/settings', 'page');
    return actionSuccess(undefined);
  } catch (error) {
    if (error instanceof WaqarError) return actionError(error);
    return actionError(new WaqarError('Failed to update administrator profile', 'UNKNOWN_ERROR'));
  }
}
