import { createHash } from 'node:crypto';
import type { z } from 'zod';
import type { PlaceOrderSchema } from './checkout';

type ValidatedCheckout = z.infer<typeof PlaceOrderSchema>;

export function createCheckoutPayloadFingerprint(input: ValidatedCheckout) {
  const normalizedPayload = {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    address: input.address,
    apt: input.apt,
    city: input.city,
    state: input.state,
    zip: input.zip,
    country: input.country,
    paymentMethod: input.paymentMethod,
    couponCode: input.couponCode.trim().toUpperCase(),
    items: input.items
      .map(({ id, variantId, quantity }) => ({ id, variantId, quantity }))
      .sort((a, b) => a.id.localeCompare(b.id) || a.variantId.localeCompare(b.variantId)),
  };

  return createHash('sha256').update(JSON.stringify(normalizedPayload)).digest('hex');
}
