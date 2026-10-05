/**
 * Order repository.
 */

import { BaseRepository } from './base';
import { NotFoundError, toWaqarError } from '@/src/lib/errors';
import type {
  Order, OrderSummary, OrderItem, Address,
  OrderFilters, PaginationParams, PaginatedResult,
} from '@/src/types/domain';
import type { TablesUpdate } from '@/src/types/database';
import type { UpdateOrderStatusInput } from '@/src/validations';

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function mapAddress(raw: Record<string, unknown>): Address {
  return {
    fullName: String(raw.fullName ?? raw.full_name ?? ''),
    phone: raw.phone != null ? String(raw.phone) : null,
    addressLine1: String(raw.addressLine1 ?? raw.address_line_1 ?? ''),
    addressLine2: raw.addressLine2 != null || raw.address_line_2 != null
      ? String(raw.addressLine2 ?? raw.address_line_2)
      : null,
    city: String(raw.city ?? ''),
    state: raw.state != null ? String(raw.state) : null,
    postalCode: raw.postalCode != null || raw.postal_code != null
      ? String(raw.postalCode ?? raw.postal_code)
      : null,
    countryCode: String(raw.countryCode ?? raw.country_code ?? ''),
  };
}

function mapOrderItem(row: Record<string, unknown>): OrderItem {
  return {
    id: String(row.id ?? ''),
    variantId: row.variant_id != null ? String(row.variant_id) : null,
    productId: row.product_id != null ? String(row.product_id) : null,
    productName: String(row.product_name ?? ''),
    variantSku: String(row.variant_sku ?? ''),
    variantSize: String(row.variant_size ?? ''),
    imageUrl: row.image_url != null ? String(row.image_url) : null,
    unitPrice: Number(row.unit_price ?? 0),
    quantity: Number(row.quantity ?? 0),
    totalPrice: Number(row.total_price ?? 0),
  };
}

function mapOrder(row: Record<string, unknown>): Order {
  const shippingAddress = row.shipping_address && typeof row.shipping_address === 'object'
    ? (row.shipping_address as Record<string, unknown>)
    : {};
  const billingAddress = row.billing_address && typeof row.billing_address === 'object'
    ? (row.billing_address as Record<string, unknown>)
    : null;
  const orderItems = Array.isArray(row.order_items) ? row.order_items : [];

  return {
    id: String(row.id ?? ''),
    orderNumber: String(row.order_number ?? ''),
    userId: row.user_id != null ? String(row.user_id) : null,
    status: row.status as Order['status'],
    paymentStatus: row.payment_status as Order['paymentStatus'],
    subtotal: Number(row.subtotal ?? 0),
    discountAmount: Number(row.discount_amount ?? 0),
    shippingAmount: Number(row.shipping_amount ?? 0),
    taxAmount: Number(row.tax_amount ?? 0),
    total: Number(row.total ?? 0),
    currency: String(row.currency ?? 'EGP'),
    couponCode: row.coupon_code != null ? String(row.coupon_code) : null,
    shippingAddress: mapAddress(shippingAddress),
    billingAddress: billingAddress ? mapAddress(billingAddress) : null,
    shippingMethod: row.shipping_method != null ? String(row.shipping_method) : null,
    trackingNumber: row.tracking_number != null ? String(row.tracking_number) : null,
    trackingUrl: row.tracking_url != null ? String(row.tracking_url) : null,
    shippingProvider: row.shipping_provider != null ? String(row.shipping_provider) : null,
    shipmentId: row.shipment_id != null ? String(row.shipment_id) : null,
    shippingStatus: row.shipping_status != null ? String(row.shipping_status) : null,
    estimatedDelivery: row.estimated_delivery != null ? String(row.estimated_delivery) : null,
    customerNotes: row.customer_notes != null ? String(row.customer_notes) : null,
    items: orderItems.map((item) => mapOrderItem(item as Record<string, unknown>)),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

function mapOrderSummary(row: Record<string, unknown>): OrderSummary {
  return {
    id: String(row.id ?? ''),
    orderNumber: String(row.order_number ?? ''),
    status: row.status as OrderSummary['status'],
    paymentStatus: row.payment_status as OrderSummary['paymentStatus'],
    total: Number(row.total ?? 0),
    currency: String(row.currency ?? 'EGP'),
    itemCount: Number(row.item_count ?? 0),
    customerName: row.customer_name != null ? String(row.customer_name) : null,
    customerEmail: row.customer_email != null ? String(row.customer_email) : null,
    paymentProvider: row.payment_provider != null ? (String(row.payment_provider) as OrderSummary['paymentProvider']) : null,
    createdAt: String(row.created_at ?? ''),
  };
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export class OrderRepository extends BaseRepository {

  async findAll(
    filters: OrderFilters = {},
    pagination: PaginationParams = { page: 1, pageSize: 20 }
  ): Promise<PaginatedResult<OrderSummary>> {
    const { from, to } = this.toRange(pagination);

    let query = this.db
      .from('admin_order_summary')
      .select('*', { count: 'exact' });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.paymentStatus) query = query.eq('payment_status', filters.paymentStatus);
    if (filters.userId) query = query.eq('customer_id', filters.userId);
    if (filters.search) {
      query = query.or(
        `order_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%`
      );
    }
    if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
    if (filters.dateTo) query = query.lte('created_at', filters.dateTo);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw toWaqarError(error, 'OrderRepository.findAll');
    return this.paginate((data ?? []).map(mapOrderSummary), count ?? 0, pagination);
  }

  async findById(id: string): Promise<Order> {
    const { data, error } = await this.db
      .from('orders')
      .select(`*, order_items(*)`)
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundError('Order', id);
    return mapOrder(data);
  }

  async findByOrderNumber(orderNumber: string): Promise<Order> {
    const { data, error } = await this.db
      .from('orders')
      .select(`*, order_items(*)`)
      .eq('order_number', orderNumber)
      .single();

    if (error || !data) throw new NotFoundError('Order', orderNumber);
    return mapOrder(data);
  }

  async findByUserId(
    userId: string,
    pagination: PaginationParams = { page: 1, pageSize: 10 }
  ): Promise<PaginatedResult<OrderSummary>> {
    return this.findAll({ userId }, pagination);
  }

  async updateStatus(input: UpdateOrderStatusInput): Promise<Order> {
    const updateData: TablesUpdate<'orders'> = {
      status: input.status,
      ...(input.trackingNumber && { tracking_number: input.trackingNumber }),
      ...(input.trackingUrl && { tracking_url: input.trackingUrl }),
      ...(input.status === 'shipped' && { shipped_at: new Date().toISOString() }),
      ...(input.status === 'delivered' && { delivered_at: new Date().toISOString() }),
    };

    const { error } = await this.db
      .from('orders')
      .update(updateData)
      .eq('id', input.orderId);

    if (error) throw toWaqarError(error, 'OrderRepository.updateStatus');
    return this.findById(input.orderId);
  }

  async findStatusHistory(orderId: string): Promise<Array<{ fromStatus: string | null; toStatus: string; changedBy: string | null; notes: string | null; createdAt: string }>> {
    const { data, error } = await this.db
      .from('order_status_history')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) throw toWaqarError(error, 'OrderRepository.findStatusHistory');
    return (data ?? []).map((row) => ({
      fromStatus: row.from_status,
      toStatus: row.to_status,
      changedBy: row.changed_by,
      notes: row.notes,
      createdAt: row.created_at,
    }));
  }
}
