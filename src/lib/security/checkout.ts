import { z } from 'zod';

export const PlaceOrderSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().max(30),
  address: z.string().trim().min(5).max(255),
  apt: z.string().max(255),
  city: z.string().trim().min(2).max(100),
  state: z.string().max(100),
  zip: z.string().max(20),
  country: z.string().trim().min(2).max(100),
  paymentMethod: z.enum(['card', 'vodafone', 'etisalat', 'orange', 'wepay', 'instapay', 'cod']),
  items: z.array(z.object({
    id: z.string().uuid(),
    quantity: z.number().int().min(1).max(20),
  })).min(1).max(50),
});

export function priceCheckoutItems(
  requestedItems: z.infer<typeof PlaceOrderSchema>['items'],
  catalogItems: Array<{
    id: string;
    name: string;
    default_variant_id: string | null;
    default_variant_sku: string | null;
    default_variant_size: string | null;
    default_variant_price: number | null;
    primary_image_url: string | null;
  }>,
) {
  const productIds = [...new Set(requestedItems.map((item) => item.id))];
  if (catalogItems.length !== productIds.length || catalogItems.some((item) => item.default_variant_id == null || item.default_variant_price == null)) {
    throw new Error('One or more products are no longer available');
  }
  const items = requestedItems.map((item) => {
    const catalogItem = catalogItems.find((candidate) => candidate.id === item.id)!;
    return {
      id: item.id,
      variantId: catalogItem.default_variant_id!,
      sku: catalogItem.default_variant_sku ?? item.id,
      name: catalogItem.name,
      size: catalogItem.default_variant_size ?? 'Standard',
      image: catalogItem.primary_image_url ?? '',
      price: Number(catalogItem.default_variant_price),
      quantity: item.quantity,
    };
  });
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 150 ? 0 : 12;
  return { items, subtotal, shipping, total: subtotal + shipping };
}
