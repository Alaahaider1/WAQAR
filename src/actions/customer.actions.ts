/**
 * Customer server actions — admin management.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/src/lib/auth/guards';
import { createAdminClient } from '@/src/lib/supabase/admin';
import { CustomerRepository } from '@/src/repositories/customer.repository';
import { actionSuccess, actionError, WaqarError } from '@/src/lib/errors';
import type { ActionResult } from '@/src/lib/errors';

function revalidateCustomers() {
  revalidatePath('/admin/customers', 'page');
}

export async function activateCustomerAction(id: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const db = createAdminClient();
    await new CustomerRepository(db).activate(id);
    revalidateCustomers();
    return actionSuccess(undefined);
  } catch (error) {
    if (error instanceof WaqarError) return actionError(error);
    return actionError(new WaqarError('Failed to activate customer', 'UNKNOWN_ERROR'));
  }
}

export async function deactivateCustomerAction(id: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const db = createAdminClient();
    await new CustomerRepository(db).deactivate(id);
    revalidateCustomers();
    return actionSuccess(undefined);
  } catch (error) {
    if (error instanceof WaqarError) return actionError(error);
    return actionError(new WaqarError('Failed to deactivate customer', 'UNKNOWN_ERROR'));
  }
}

export async function deleteCustomerAction(id: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const db = createAdminClient();
    await new CustomerRepository(db).softDelete(id);
    revalidateCustomers();
    return actionSuccess(undefined);
  } catch (error) {
    if (error instanceof WaqarError) return actionError(error);
    return actionError(new WaqarError('Failed to delete customer', 'UNKNOWN_ERROR'));
  }
}

export async function updateCustomerAction(
  id: string,
  data: { fullName?: string; phone?: string }
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const db = createAdminClient();
    await new CustomerRepository(db).update(id, data);
    revalidateCustomers();
    return actionSuccess(undefined);
  } catch (error) {
    if (error instanceof WaqarError) return actionError(error);
    return actionError(new WaqarError('Failed to update customer', 'UNKNOWN_ERROR'));
  }
}
