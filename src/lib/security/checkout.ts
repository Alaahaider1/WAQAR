import { z } from 'zod';
import { SHIPPING_FEE } from '../shipping.ts';
import { parseSizeMilliliters } from '../../../lib/catalog/sizeLabels.ts';

const CheckoutItemSchema = z.object({
  id: z.string().uuid(),
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
});

export const PlaceOrderSchema = z.object({
  checkoutAttemptId: z.string().uuid(),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().max(254).refine(
    (email) => email === '' || z.string().email().max(254).safeParse(email).success,
    'Invalid email address',
  ),
  phone: z.string().max(30),
  address: z.string().trim().min(5).max(255),
  apt: z.string().max(255),
  city: z.string().trim().min(2).max(100),
  state: z.string().max(100),
  zip: z.string().trim().max(20),
  country: z.string().trim().min(2).max(100),
  paymentMethod: z.enum(['card', 'vodafone', 'etisalat', 'orange', 'wepay', 'instapay', 'cod']),
  couponCode: z.string().trim().max(50).optional().default(''),
  items: z.array(CheckoutItemSchema).min(1).max(50).superRefine((items, context) => {
    const seen = new Set<string>();
    for (const [index, item] of items.entries()) {
      const key = `${item.id}:${item.variantId}`;
      if (seen.has(key)) {
        context.addIssue({ code: 'custom', path: [index, 'variantId'], message: 'Duplicate product size' });
      }
      seen.add(key);
    }
  }),
});

export function isCheckoutPaymentMethodAvailable(
  paymentMethod: z.infer<typeof PlaceOrderSchema>['paymentMethod'],
) {
  return paymentMethod !== 'card';
}

export function priceCheckoutItems(
  requestedItems: z.infer<typeof PlaceOrderSchema>['items'],
  catalogItems: Array<{
    id: string;
    name: string;
    variants: Array<{ id: string; sku: string; size: string; price: number; is_active: boolean; is_default: boolean }>;
    primary_image_url: string | null;
  }>,
) {
  const productIds = [...new Set(requestedItems.map((item) => item.id))];
  if (catalogItems.length !== productIds.length) {
    throw new Error('One or more products are no longer available');
  }
  const items = requestedItems.map((item) => {
    const catalogItem = catalogItems.find((candidate) => candidate.id === item.id)!;
    const activeDefaults = catalogItem.variants.filter((candidate) => candidate.is_active && candidate.is_default);
    const variant = catalogItem.variants.find((candidate) => candidate.id === item.variantId && candidate.is_active);
    if (activeDefaults.length !== 1 || !variant) throw new Error('One or more products are no longer available');
    const defaultVariant = activeDefaults[0];
    if (
      parseSizeMilliliters(defaultVariant.size) === null ||
      parseSizeMilliliters(variant.size) === null ||
      !Number.isFinite(defaultVariant.price) || defaultVariant.price <= 0 ||
      !Number.isFinite(variant.price) || variant.price <= 0
    ) throw new Error('One or more products have an invalid bottle size or price');
    return {
      id: item.id,
      variantId: variant.id,
      sku: variant.sku || item.id,
      name: catalogItem.name,
      size: variant.size,
      image: catalogItem.primary_image_url ?? '',
      price: variant.price,
      quantity: item.quantity,
    };
  });
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = SHIPPING_FEE;
  return { items, subtotal, shipping, total: subtotal + shipping };
}
