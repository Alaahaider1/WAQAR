/**
 * Customer repository.
 * Handles public.profiles and address tables.
 */

import { BaseRepository } from './base';
import { NotFoundError, toWaqarError } from '@/src/lib/errors';
import type { Profile, SavedAddress, PaginationParams, PaginatedResult } from '@/src/types/domain';
import type { ProfileRow, ShippingAddressRow, TablesUpdate } from '@/src/types/database';
import type { AddressInput } from '@/src/validations';

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    role: row.role as Profile['role'],
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function mapAddress(row: ShippingAddressRow): SavedAddress {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    addressLine1: row.address_line_1,
    addressLine2: row.address_line_2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    countryCode: row.country_code,
    isDefault: row.is_default,
  };
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export class CustomerRepository extends BaseRepository {

  // ── Profile reads ────────────────────────────────────────────────────────

  async findById(id: string): Promise<Profile> {
    const { data, error } = await this.db
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundError('Customer', id);
    return mapProfile(data);
  }

  async findByEmail(email: string): Promise<Profile | null> {
    const { data, error } = await this.db
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if ((error as { code?: string }).code === 'PGRST116') return null;
      throw toWaqarError(error, 'CustomerRepository.findByEmail');
    }
    return data ? mapProfile(data) : null;
  }

  /** Admin: paginated list of all customers */
  async findAll(
    filters: { search?: string; isActive?: boolean } = {},
    pagination: PaginationParams = { page: 1, pageSize: 20 }
  ): Promise<PaginatedResult<Profile>> {
    const { from, to } = this.toRange(pagination);

    let query = this.db
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('role', 'customer')
      .is('deleted_at', null);

    if (filters.search) {
      query = query.or(
        `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      );
    }
    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw toWaqarError(error, 'CustomerRepository.findAll');
    return this.paginate((data ?? []).map(mapProfile), count ?? 0, pagination);
  }

  // ── Profile writes ───────────────────────────────────────────────────────

  async update(
    id: string,
    input: { fullName?: string; phone?: string; avatarUrl?: string }
  ): Promise<Profile> {
    const updateData: TablesUpdate<'profiles'> = {
      ...(input.fullName !== undefined && { full_name: input.fullName }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.avatarUrl !== undefined && { avatar_url: input.avatarUrl }),
    };

    const { data, error } = await this.db
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw toWaqarError(error, 'CustomerRepository.update');
    return mapProfile(data);
  }

  async deactivate(id: string): Promise<void> {
    const { error } = await this.db
      .from('profiles')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw toWaqarError(error, 'CustomerRepository.deactivate');
  }

  async activate(id: string): Promise<void> {
    const { error } = await this.db
      .from('profiles')
      .update({ is_active: true })
      .eq('id', id);

    if (error) throw toWaqarError(error, 'CustomerRepository.activate');
  }

  /** Soft-delete a customer profile (keeps the row for order history integrity). */
  async softDelete(id: string): Promise<void> {
    const { error } = await this.db
      .from('profiles')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', id);

    if (error) throw toWaqarError(error, 'CustomerRepository.softDelete');
  }

  // ── Shipping addresses ───────────────────────────────────────────────────

  async findShippingAddresses(userId: string): Promise<SavedAddress[]> {
    const { data, error } = await this.db
      .from('shipping_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });

    if (error) throw toWaqarError(error, 'CustomerRepository.findShippingAddresses');
    return (data ?? []).map(mapAddress);
  }

  async createShippingAddress(userId: string, input: AddressInput): Promise<SavedAddress> {
    // If this is marked as default, unset existing default first
    if (input.isDefault) {
      await this.db
        .from('shipping_addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { data, error } = await this.db
      .from('shipping_addresses')
      .insert({
        user_id: userId,
        full_name: input.fullName,
        phone: input.phone ?? null,
        address_line_1: input.addressLine1,
        address_line_2: input.addressLine2 ?? null,
        city: input.city,
        state: input.state ?? null,
        postal_code: input.postalCode ?? null,
        country_code: input.countryCode,
        is_default: input.isDefault ?? false,
      })
      .select()
      .single();

    if (error || !data) throw toWaqarError(error, 'CustomerRepository.createShippingAddress');
    return mapAddress(data);
  }

  async updateShippingAddress(
    id: string,
    userId: string,
    input: Partial<AddressInput>
  ): Promise<SavedAddress> {
    if (input.isDefault) {
      await this.db
        .from('shipping_addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const updateData: TablesUpdate<'shipping_addresses'> = {
      ...(input.fullName !== undefined && { full_name: input.fullName }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.addressLine1 !== undefined && { address_line_1: input.addressLine1 }),
      ...(input.addressLine2 !== undefined && { address_line_2: input.addressLine2 }),
      ...(input.city !== undefined && { city: input.city }),
      ...(input.state !== undefined && { state: input.state }),
      ...(input.postalCode !== undefined && { postal_code: input.postalCode }),
      ...(input.countryCode !== undefined && { country_code: input.countryCode }),
      ...(input.isDefault !== undefined && { is_default: input.isDefault }),
    };

    const { data, error } = await this.db
      .from('shipping_addresses')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) throw toWaqarError(error, 'CustomerRepository.updateShippingAddress');
    return mapAddress(data);
  }

  async deleteShippingAddress(id: string, userId: string): Promise<void> {
    const { error } = await this.db
      .from('shipping_addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw toWaqarError(error, 'CustomerRepository.deleteShippingAddress');
  }
}
