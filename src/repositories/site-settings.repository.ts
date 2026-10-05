/**
 * Site settings repository.
 * Key/value store backed by the site_settings table.
 */

import { BaseRepository } from './base';
import { toWaqarError } from '@/src/lib/errors';
import type { SiteSettings } from '@/src/types/domain';

export class SiteSettingsRepository extends BaseRepository {

  /** Fetch all public settings (for storefront — uses anon client) */
  async findPublic(): Promise<Partial<SiteSettings>> {
    const { data, error } = await this.db
      .from('site_settings')
      .select('key, value')
      .eq('is_public', true);

    if (error) throw toWaqarError(error, 'SiteSettingsRepository.findPublic');
    return this.rowsToSettings(data ?? []);
  }

  /** Fetch ALL settings (admin only — must use admin client or be authenticated admin) */
  async findAll(): Promise<Partial<SiteSettings>> {
    const { data, error } = await this.db
      .from('site_settings')
      .select('key, value');

    if (error) throw toWaqarError(error, 'SiteSettingsRepository.findAll');
    return this.rowsToSettings(data ?? []);
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const { data, error } = await this.db
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      if ((error as { code?: string }).code === 'PGRST116') return null;
      throw toWaqarError(error, `SiteSettingsRepository.get(${key})`);
    }
    return (data?.value as T) ?? null;
  }

  async set(key: string, value: unknown, updatedBy?: string): Promise<void> {
    const { error } = await this.db
      .from('site_settings')
      .upsert({
        key,
        value: value as never,
        updated_by: updatedBy ?? null,
      });

    if (error) throw toWaqarError(error, `SiteSettingsRepository.set(${key})`);
  }

  async setMany(settings: Record<string, unknown>, updatedBy?: string): Promise<void> {
    const rows = Object.entries(settings).map(([key, value]) => ({
      key,
      value: value as never,
      updated_by: updatedBy ?? null,
    }));

    const { error } = await this.anyDb.from('site_settings').upsert(rows);
    if (error) throw toWaqarError(error, 'SiteSettingsRepository.setMany');
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private rowsToSettings(rows: Array<{ key: string; value: unknown }>): Partial<SiteSettings> {
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    return {
      storeName: this.str(map, 'store_name'),
      storeEmail: this.str(map, 'store_email'),
      storeCurrency: this.str(map, 'store_currency'),
      storeCurrencySymbol: this.str(map, 'store_currency_symbol'),
      taxRate: this.num(map, 'tax_rate'),
      taxIncluded: this.bool(map, 'tax_included'),
      shippingFreeThreshold: this.num(map, 'shipping_free_threshold'),
      shippingStandardRate: this.num(map, 'shipping_standard_rate'),
      shippingExpressRate: this.num(map, 'shipping_express_rate'),
      shippingStandardDays: this.str(map, 'shipping_standard_days'),
      shippingExpressDays: this.str(map, 'shipping_express_days'),
      shippingProvider: this.str(map, 'shipping_provider'),
      shippingApiKey: this.str(map, 'shipping_api_key'),
      shippingBaseUrl: this.str(map, 'shipping_base_url'),
      shippingEnvironment: this.str(map, 'shipping_environment'),
      shippingEnabled: this.bool(map, 'shipping_enabled'),
      socialInstagram: this.str(map, 'social_instagram'),
      socialTwitter: this.str(map, 'social_twitter'),
      socialFacebook: this.str(map, 'social_facebook'),
      metaPixelEnabled: this.bool(map, 'meta_pixel_enabled'),
      metaPixelId: this.str(map, 'meta_pixel_id'),
      tikTokPixelEnabled: this.bool(map, 'tiktok_pixel_enabled'),
      tikTokPixelId: this.str(map, 'tiktok_pixel_id'),
      maintenanceMode: this.bool(map, 'maintenance_mode'),
      allowReviews: this.bool(map, 'allow_reviews'),
      requirePurchaseForReview: this.bool(map, 'require_purchase_for_review'),
      vodafoneCashNumber: this.str(map, 'vodafone_cash_number'),
      orangeCashNumber: this.str(map, 'orange_cash_number'),
      etisalatCashNumber: this.str(map, 'etisalat_cash_number'),
      wePayNumber: this.str(map, 'we_pay_number'),
      instaPayAccount: this.str(map, 'instapay_account'),
      bankAccountName: this.str(map, 'bank_account_name'),
      bankAccountNumber: this.str(map, 'bank_account_number'),
      bankName: this.str(map, 'bank_name'),
    };
  }

  private str(map: Record<string, unknown>, key: string): string | undefined {
    const val = map[key];
    if (val === undefined || val === null) return undefined;
    return typeof val === 'string' ? val : String(val);
  }

  private num(map: Record<string, unknown>, key: string): number | undefined {
    const val = map[key];
    if (val === undefined || val === null) return undefined;
    return typeof val === 'number' ? val : Number(val);
  }

  private bool(map: Record<string, unknown>, key: string): boolean | undefined {
    const val = map[key];
    if (val === undefined || val === null) return undefined;
    return typeof val === 'boolean' ? val : val === 'true' || val === 1;
  }
}
