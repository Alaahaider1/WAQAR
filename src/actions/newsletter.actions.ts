/**
 * Newsletter and Contact server actions.
 * These accept anonymous submissions.
 */

'use server';

import { createAdminClient } from '@/src/lib/supabase/admin';
import { validate, NewsletterSubscribeSchema, ContactMessageSchema } from '@/src/validations';
import { actionSuccess, actionError, WaqarError, ConflictError } from '@/src/lib/errors';
import type { ActionResult } from '@/src/lib/errors';
import { getCurrentUser } from '@/src/lib/auth/guards';
import { headers } from 'next/headers';

async function getClientIp(): Promise<string | null> {
  const headersList = await headers();
  return (
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    null
  );
}

// ---------------------------------------------------------------------------
// Newsletter subscribe
// ---------------------------------------------------------------------------

export async function subscribeNewsletterAction(
  rawData: unknown
): Promise<ActionResult<void>> {
  try {
    const input = validate(NewsletterSubscribeSchema, rawData);
    const ip = await getClientIp();
    const db = createAdminClient();

    // Check if already subscribed
    const { data: existing } = await db
      .from('newsletter_subscribers')
      .select('id, status')
      .eq('email', input.email)
      .single();

    if (existing) {
      if (existing.status === 'active') {
        throw new ConflictError('This email address is already subscribed');
      }
      // Re-subscribe if previously unsubscribed
      await db
        .from('newsletter_subscribers')
        .update({ status: 'active', unsubscribed_at: null })
        .eq('id', existing.id);
      return actionSuccess(undefined);
    }

    const { error } = await db.from('newsletter_subscribers').insert({
      email: input.email,
      source: input.source ?? null,
      ip_address: ip ?? null,
    });

    if (error) throw new WaqarError('Subscription failed', 'SUBSCRIPTION_ERROR');
    return actionSuccess(undefined);
  } catch (error) {
    if (error instanceof WaqarError) return actionError(error);
    return actionError(new WaqarError('Subscription failed. Please try again.', 'UNKNOWN_ERROR'));
  }
}

// ---------------------------------------------------------------------------
// Submit contact message
// ---------------------------------------------------------------------------

export async function submitContactMessageAction(
  rawData: unknown
): Promise<ActionResult<void>> {
  try {
    const input = validate(ContactMessageSchema, rawData);
    const ip = await getClientIp();
    const user = await getCurrentUser();
    const db = createAdminClient();

    const { error } = await db.from('contact_messages').insert({
      user_id: user?.id ?? null,
      name: input.name,
      email: input.email,
      subject: input.subject ?? null,
      message: input.message,
      ip_address: ip ?? null,
    });

    if (error) throw new WaqarError('Failed to send message', 'MESSAGE_ERROR');
    return actionSuccess(undefined);
  } catch (error) {
    if (error instanceof WaqarError) return actionError(error);
    return actionError(new WaqarError('Failed to send message. Please try again.', 'UNKNOWN_ERROR'));
  }
}
