import test from 'node:test';
import assert from 'node:assert/strict';
import { PlaceOrderSchema, priceCheckoutItems } from '../src/lib/security/checkout.ts';
import { BostaShippingService } from '../src/services/shipping.service.ts';

const productId = 'a1b2c3d4-e5f6-4789-8123-456789abcdef';
const variantId = 'b1b2c3d4-e5f6-4789-8123-456789abcdef';
const request = {
  firstName: 'A', lastName: 'Customer', email: 'customer@example.com', phone: '',
  address: 'Main Street 123', apt: '', city: 'Cairo', state: '', zip: '', country: 'Egypt',
  paymentMethod: 'cod', items: [{ id: productId, quantity: 2, price: 0, name: 'Forged', image: 'javascript:alert(1)' }],
};

test('checkout derives names, images, SKU and price from the server catalog', () => {
  const parsed = PlaceOrderSchema.parse(request);
  const priced = priceCheckoutItems(parsed.items, [{
    id: productId, name: 'WAQAR Perfume', default_variant_id: variantId,
    default_variant_sku: 'WQ-50', default_variant_size: '50ml',
    default_variant_price: 200, primary_image_url: 'https://res.cloudinary.com/example/image/upload/perfume.jpg',
  }]);

  assert.equal(priced.items[0].price, 200);
  assert.equal(priced.items[0].name, 'WAQAR Perfume');
  assert.equal(priced.items[0].variantId, variantId);
  assert.equal(priced.items[0].sku, 'WQ-50');
  assert.equal(priced.subtotal, 400);
  assert.equal(priced.shipping, 0);
  assert.equal(priced.total, 400);
});

test('checkout rejects unavailable products and invalid quantities', () => {
  const parsed = PlaceOrderSchema.parse(request);
  assert.throws(() => priceCheckoutItems(parsed.items, []), /no longer available/);
  assert.equal(PlaceOrderSchema.safeParse({ ...request, items: [{ id: productId, quantity: -1 }] }).success, false);
});

test('shipping client rejects non-Bosta and private destinations', () => {
  assert.throws(() => new BostaShippingService('http://127.0.0.1:8080', 'key'));
  assert.throws(() => new BostaShippingService('https://169.254.169.254/latest/meta-data', 'key'));
  assert.throws(() => new BostaShippingService('https://bosta.co.attacker.example', 'key'));
  assert.doesNotThrow(() => new BostaShippingService('https://app.bosta.co', 'key'));
});
