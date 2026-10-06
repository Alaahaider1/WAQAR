/**
 * Order server actions.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin, requireAuth } from '@/src/lib/auth/guards';
import { createAdminClient } from '@/src/lib/supabase/admin';
import { createServerClient } from '@/src/lib/supabase/server';
import { OrderRepository } from '@/src/repositories/order.repository';
import { SiteSettingsRepository } from '@/src/repositories/site-settings.repository';
import { BostaShippingService } from '@/src/services/shipping.service';
import { validate, UpdateOrderStatusSchema } from '@/src/validations';
import { actionSuccess, actionError, WaqarError, NotFoundError, toWaqarError } from '@/src/lib/errors';
import type { ActionResult } from '@/src/lib/errors';
import type { Order } from '@/src/types/domain';
import { isCheckoutPaymentMethodAvailable, PlaceOrderSchema } from '@/src/lib/security/checkout';
import { CHECKOUT_ATTEMPT_REUSED_MESSAGE } from '@/src/lib/security/checkout-attempt';
import { createCheckoutPayloadFingerprint } from '@/src/lib/security/checkout-fingerprint';

interface PlaceOrderResult {
  orderId: string;
  orderNumber: string;
  proofAccessToken: string;
  total: number;
  paymentMethod: string;
}

// ---------------------------------------------------------------------------
// Place order (checkout)
// ---------------------------------------------------------------------------

export async function placeOrderAction(
  rawData: unknown
): Promise<ActionResult<PlaceOrderResult>> {
  try {
    const input = validate(PlaceOrderSchema, rawData);
    if (!isCheckoutPaymentMethodAvailable(input.paymentMethod)) {
      throw new WaqarError('Card payments are not available yet.', 'PAYMENT_METHOD_UNAVAILABLE', 422);
    }
    const payloadFingerprint = createCheckoutPayloadFingerprint(input);
    const db = createAdminClient();
    const { data: orderRows, error: orderError } = await db.rpc('place_guest_checkout_order', {
      p_checkout_attempt_id: input.checkoutAttemptId,
      p_first_name: input.firstName,
      p_last_name: input.lastName,
      p_phone: input.phone,
      p_address: input.address,
      p_apt: input.apt,
      p_city: input.city,
      p_state: input.state,
      p_zip: input.zip,
      p_country: input.country,
      p_payment_method: input.paymentMethod,
      p_items: input.items,
      p_payload_fingerprint: payloadFingerprint,
    });

    if (orderError) {
      if (orderError.code === '0A000') {
        throw new WaqarError('Card payments are not available yet.', 'PAYMENT_METHOD_UNAVAILABLE', 422);
      }
      if (orderError.code === 'P0001') {
        throw new WaqarError(CHECKOUT_ATTEMPT_REUSED_MESSAGE, 'CHECKOUT_ATTEMPT_REUSED', 409);
      }
      if (orderError.code === '22023') {
        throw new WaqarError('One or more products are no longer available. Please review your cart.', 'INVALID_CART', 422);
      }
      console.error('[checkout] place_guest_checkout_order RPC failed', {
        code: orderError.code,
        message: orderError.message,
        details: orderError.details,
        hint: orderError.hint,
      });
      throw new WaqarError('Order initialization failed', 'ORDER_DATABASE_FAILED');
    }

    const orderData = orderRows?.[0];
    if (!orderData) throw new WaqarError('Order initialization returned no order', 'ORDER_DATABASE_FAILED');

    return actionSuccess({
      orderId: orderData.order_id,
      orderNumber: orderData.order_number,
      proofAccessToken: orderData.proof_access_token,
      total: Number(orderData.total),
      paymentMethod: orderData.payment_method,
    });
  } catch (error) {
    if (error instanceof WaqarError && error.statusCode < 500 && error.code !== 'ORDER_DATABASE_FAILED') {
      return actionError(error);
    }

    console.error('[checkout] placeOrderAction failed', {
      code: error instanceof WaqarError ? error.code : 'UNEXPECTED_ERROR',
      error: error instanceof WaqarError ? error.message : error,
    });
    return actionError(new WaqarError('We could not place your order. Please try again.', 'ORDER_CREATE_FAILED'));
  }
}

// ---------------------------------------------------------------------------
// Update order status (admin)
// ---------------------------------------------------------------------------

export async function uploadPaymentProofAction(
  formData: FormData
): Promise<ActionResult<{ orderNumber: string; proofUrl: string; status: string }>> {
  try {
    const orderNumber = String(formData.get('orderNumber') ?? '').trim();
    const proofAccessToken = String(formData.get('proofAccessToken') ?? '').trim();
    const file = formData.get('proofFile');

    if (!orderNumber || !/^[0-9a-f-]{36}$/i.test(proofAccessToken)) {
      throw new WaqarError('Order access details are invalid', 'INVALID_ORDER_ACCESS', 403);
    }

    if (!(file instanceof File) || !file.size) {
      throw new WaqarError('Please select a payment proof image', 'MISSING_PROOF_FILE');
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      throw new WaqarError('Upload a JPG, PNG, or WebP image', 'INVALID_PROOF_FILE');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new WaqarError('Proof image must be 5MB or smaller', 'PROOF_FILE_TOO_LARGE');
    }

    const db = createAdminClient();

    const { data: orderData, error: orderError } = await db
      .from('orders')
      .select('id')
      .eq('order_number', orderNumber)
      .eq('proof_access_token', proofAccessToken)
      .maybeSingle();

    if (orderError) {
      throw toWaqarError(orderError, 'uploadPaymentProofAction:findOrder');
    }

    if (!orderData) {
      throw new NotFoundError('Order', orderNumber);
    }

    const { data: paymentData, error: paymentLookupError } = await db
      .from('payments')
      .select('id, provider_response')
      .eq('order_id', orderData.id)
      .maybeSingle();

    if (paymentLookupError) {
      throw toWaqarError(paymentLookupError, 'uploadPaymentProofAction:findPayment');
    }

    const existingResponse = paymentData?.provider_response && typeof paymentData.provider_response === 'object'
      ? paymentData.provider_response as Record<string, unknown>
      : {};

    const currentProofStatus = typeof existingResponse.proofStatus === 'string'
      ? existingResponse.proofStatus
      : null;
    if (currentProofStatus === 'pending' || currentProofStatus === 'approved') {
      throw new WaqarError('This payment proof is already under review or has been approved', 'PROOF_UPLOAD_LOCKED');
    }

    const proofUrl = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString('base64')}`;

    const proofPayload = {
      ...existingResponse,
      proofStatus: 'pending',
      proofUrl,
      proofFileName: file.name,
      proofUploadedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      reviewNotes: null,
    };

    const { error: paymentUpdateError } = await db
      .from('payments')
      .update({
        status: 'pending',
        provider_response: proofPayload,
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', orderData.id);

    if (paymentUpdateError) {
      throw toWaqarError(paymentUpdateError, 'uploadPaymentProofAction:updatePayment');
    }

    const { error: orderUpdateError } = await db
      .from('orders')
      .update({
        payment_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderData.id);

    if (orderUpdateError) {
      throw toWaqarError(orderUpdateError, 'uploadPaymentProofAction:updateOrder');
    }

    revalidatePath('/checkout/payment-instructions', 'page');
    revalidatePath('/admin/orders', 'page');

    return actionSuccess({
      orderNumber,
      proofUrl,
      status: 'pending',
    });
  } catch (error) {
    if (error instanceof WaqarError) return actionError(error);
    return actionError(new WaqarError('Failed to upload your payment proof', 'UPLOAD_PROOF_FAILED'));
  }
}

export async function uploadPaymentProofFormAction(formData: FormData): Promise<void> {
  await uploadPaymentProofAction(formData);
}

export async function reviewManualPaymentProofAction(
  formData: FormData
): Promise<ActionResult<{ orderId: string; decision: string }>> {
  try {
    await requireAdmin();

    const orderId = String(formData.get('orderId') ?? '').trim();
    const decision = String(formData.get('decision') ?? '').trim();
    const notes = String(formData.get('notes') ?? '').trim();

    if (!orderId) {
      throw new WaqarError('Order ID is required', 'MISSING_ORDER_ID');
    }

    if (!['approved', 'rejected'].includes(decision)) {
      throw new WaqarError('Invalid approval decision', 'INVALID_PAYMENT_REVIEW');
    }

    const db = createAdminClient();

    const { data: paymentData, error: paymentLookupError } = await db
      .from('payments')
      .select('id, provider_response')
      .eq('order_id', orderId)
      .maybeSingle();

    if (paymentLookupError) {
      throw toWaqarError(paymentLookupError, 'reviewManualPaymentProofAction:findPayment');
    }

    const existingResponse = paymentData?.provider_response && typeof paymentData.provider_response === 'object'
      ? paymentData.provider_response as Record<string, unknown>
      : {};

    const paymentStatus = decision === 'approved' ? 'succeeded' : 'failed';
    const orderPaymentStatus = decision === 'approved' ? 'paid' : 'failed';
    const proofPayload = {
      ...existingResponse,
      proofStatus: decision,
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'admin',
      reviewNotes: notes || null,
    };

    const { error: paymentUpdateError } = await db
      .from('payments')
      .update({
        status: paymentStatus,
        provider_response: proofPayload,
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', orderId);

    if (paymentUpdateError) {
      throw toWaqarError(paymentUpdateError, 'reviewManualPaymentProofAction:updatePayment');
    }

    const { error: orderUpdateError } = await db
      .from('orders')
      .update({
        payment_status: orderPaymentStatus,
        ...(decision === 'approved' ? { status: 'processing' } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (orderUpdateError) {
      throw toWaqarError(orderUpdateError, 'reviewManualPaymentProofAction:updateOrder');
    }

    revalidatePath('/admin/orders', 'page');
    revalidatePath('/checkout/payment-instructions', 'page');

    return actionSuccess({ orderId, decision });
  } catch (error) {
    if (error instanceof WaqarError) return actionError(error);
    return actionError(new WaqarError('Failed to review the payment proof', 'REVIEW_PROOF_FAILED'));
  }
}

export async function reviewManualPaymentProofFormAction(formData: FormData): Promise<void> {
  await reviewManualPaymentProofAction(formData);
}

export async function deleteOrderAction(orderId: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    if (!orderId) {
      throw new WaqarError('Order ID is required', 'MISSING_ORDER_ID');
    }

    const db = createAdminClient();
    const { error: couponUsageError } = await db
      .from('coupon_usages')
      .delete()
      .eq('order_id', orderId);

    if (couponUsageError) {
      throw toWaqarError(couponUsageError, 'deleteOrderAction:deleteCouponUsage');
    }

    // The payment record includes the payment-proof reference, so deleting it
    // removes the proof together with the order.
    const { error: paymentError } = await db
      .from('payments')
      .delete()
      .eq('order_id', orderId);

    if (paymentError) {
      throw toWaqarError(paymentError, 'deleteOrderAction:deletePayment');
    }

    const { error: orderError } = await db
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (orderError) {
      throw toWaqarError(orderError, 'deleteOrderAction:deleteOrder');
    }

    revalidatePath('/admin/orders', 'page');
    return actionSuccess(undefined);
  } catch (error) {
    if (error instanceof WaqarError) return actionError(error);
    return actionError(new WaqarError('Failed to delete order', 'DELETE_ORDER_FAILED'));
  }
}

async function getShippingService() {
  const settings = await new SiteSettingsRepository(createAdminClient()).findAll();
  if (!settings.shippingEnabled || settings.shippingProvider !== 'bosta' || !settings.shippingApiKey || !settings.shippingBaseUrl) throw new WaqarError('Configure and enable Bosta shipping in Admin Settings first', 'SHIPPING_NOT_CONFIGURED');
  return new BostaShippingService(settings.shippingBaseUrl, settings.shippingApiKey);
}

export async function createShipmentAction(orderId: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const db = createAdminClient();
    const order = await new OrderRepository(db).findById(orderId);
    const shipment = await (await getShippingService()).createShipment({ orderNumber: order.orderNumber, total: order.total, address: order.shippingAddress, items: order.items });
    const { error } = await db.from('orders').update({ shipping_provider: 'bosta', shipment_id: shipment.shipmentId, shipping_status: shipment.status, tracking_number: shipment.trackingNumber, tracking_url: shipment.trackingUrl } as never).eq('id', orderId);
    if (error) throw toWaqarError(error, 'createShipmentAction');
    revalidatePath('/admin/orders'); revalidatePath(`/admin/orders/${order.orderNumber}`); return actionSuccess(undefined);
  } catch (error) { return actionError(error instanceof WaqarError ? error : new WaqarError(error instanceof Error ? error.message : 'Failed to create shipment', 'SHIPMENT_CREATE_FAILED')); }
}

export async function refreshShipmentStatusAction(orderId: string, shipmentId: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin(); const shipment = await (await getShippingService()).refreshShipment(shipmentId); const db = createAdminClient();
    const { error } = await db.from('orders').update({ shipping_status: shipment.status, tracking_number: shipment.trackingNumber, tracking_url: shipment.trackingUrl } as never).eq('id', orderId);
    if (error) throw toWaqarError(error, 'refreshShipmentStatusAction'); revalidatePath('/admin/orders'); return actionSuccess(undefined);
  } catch (error) { return actionError(error instanceof WaqarError ? error : new WaqarError(error instanceof Error ? error.message : 'Failed to refresh shipment', 'SHIPMENT_REFRESH_FAILED')); }
}

export async function updateOrderStatusAction(
  rawData: unknown
): Promise<ActionResult<Order>> {
  try {
    await requireAdmin();
    const input = validate(UpdateOrderStatusSchema, rawData);
    const db = createAdminClient();
    const repo = new OrderRepository(db);
    const order = await repo.updateStatus(input);
    revalidatePath('/admin/orders', 'page');
    revalidatePath(`/admin/orders/${order.id}`, 'page');
    return actionSuccess(order);
  } catch (error) {
    if (error instanceof WaqarError) return actionError(error);
    return actionError(new WaqarError('Failed to update order status', 'UNKNOWN_ERROR'));
  }
}

// ---------------------------------------------------------------------------
// Cancel order (customer — own order only)
// ---------------------------------------------------------------------------

export async function cancelOrderAction(orderId: string): Promise<ActionResult<Order>> {
  try {
    const user = await requireAuth();
    const db = await createServerClient();
    const repo = new OrderRepository(db);

    // Fetch to verify ownership
    const order = await repo.findById(orderId);
    if (order.userId !== user.id) {
      const { ForbiddenError } = await import('@/src/lib/errors');
      throw new ForbiddenError();
    }

    if (!['pending', 'processing'].includes(order.status)) {
      const { BusinessError } = await import('@/src/lib/errors');
      throw new BusinessError(
        'This order cannot be cancelled at its current stage',
        'ORDER_CANNOT_CANCEL'
      );
    }

    const { validate: v, UpdateOrderStatusSchema: schema } = await import('@/src/validations');
    const updated = await repo.updateStatus(
      v(schema, { orderId, status: 'cancelled' })
    );

    revalidatePath('/account/orders', 'page');
    return actionSuccess(updated);
  } catch (error) {
    if (error instanceof WaqarError) return actionError(error);
    return actionError(new WaqarError('Failed to cancel order', 'UNKNOWN_ERROR'));
  }
}
