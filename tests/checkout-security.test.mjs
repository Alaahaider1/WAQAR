import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { isCheckoutPaymentMethodAvailable, PlaceOrderSchema, priceCheckoutItems } from '../src/lib/security/checkout.ts';
import { createCheckoutPayloadFingerprint } from '../src/lib/security/checkout-fingerprint.ts';
import {
  CHECKOUT_ATTEMPT_STORAGE_KEY,
  getOrCreateCheckoutAttemptId,
  replaceCheckoutAttemptId,
} from '../src/lib/security/checkout-attempt.ts';
import { rowToStorefrontProduct } from '../lib/catalog/mapProduct.ts';
import { BostaShippingService } from '../src/services/shipping.service.ts';

const productId = 'a1b2c3d4-e5f6-4789-8123-456789abcdef';
const variantId = 'b1b2c3d4-e5f6-4789-8123-456789abcdef';
const request = {
  checkoutAttemptId: 'c1b2c3d4-e5f6-4789-8123-456789abcdef',
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
  assert.equal(PlaceOrderSchema.safeParse({ ...request, checkoutAttemptId: 'invalid' }).success, false);
});

test('checkout email is optional but validates non-empty addresses', () => {
  assert.equal(PlaceOrderSchema.safeParse({ ...request, email: '' }).success, true);
  assert.equal(PlaceOrderSchema.safeParse({ ...request, email: '   ' }).success, true);
  assert.equal(PlaceOrderSchema.safeParse({ ...request, email: 'not-an-email' }).success, false);
  assert.equal(PlaceOrderSchema.safeParse({ ...request, email: 'ahmed@example.com' }).success, true);
});

test('checkout postal code is optional and keeps its maximum-length validation', () => {
  assert.equal(PlaceOrderSchema.safeParse({ ...request, zip: '' }).success, true);
  assert.equal(PlaceOrderSchema.safeParse({ ...request, zip: '   ' }).success, true);
  assert.equal(PlaceOrderSchema.safeParse({ ...request, zip: '12345' }).success, true);
  assert.equal(PlaceOrderSchema.safeParse({ ...request, zip: '123456789012345678901' }).success, false);
});

test('card remains a recognized method but is unavailable in the current checkout', () => {
  const cardRequest = PlaceOrderSchema.parse({ ...request, paymentMethod: 'card' });
  assert.equal(cardRequest.paymentMethod, 'card');
  assert.equal(isCheckoutPaymentMethodAvailable(cardRequest.paymentMethod), false);
  assert.equal(isCheckoutPaymentMethodAvailable('cod'), true);
});

test('card rejection runs before database access or the order RPC', async () => {
  const action = await readFile(new URL('../src/actions/order.actions.ts', import.meta.url), 'utf8');
  const cardGuard = action.indexOf("if (!isCheckoutPaymentMethodAvailable(input.paymentMethod))");
  assert.notEqual(cardGuard, -1);
  assert.ok(cardGuard < action.indexOf('const db = createAdminClient();', cardGuard));
  assert.ok(cardGuard < action.indexOf("db.rpc('place_guest_checkout_order'", cardGuard));
});

test('checkout attempt UUID persists across remounts and rotates for a new attempt', () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  const firstId = getOrCreateCheckoutAttemptId(storage, () => 'c1b2c3d4-e5f6-4789-8123-456789abcdef');
  const afterReload = getOrCreateCheckoutAttemptId(storage, () => 'd1b2c3d4-e5f6-4789-8123-456789abcdef');
  assert.equal(afterReload, firstId);
  const nextAttempt = replaceCheckoutAttemptId(storage, () => 'd1b2c3d4-e5f6-4789-8123-456789abcdef');
  assert.notEqual(nextAttempt, firstId);
  assert.equal(values.get(CHECKOUT_ATTEMPT_STORAGE_KEY), nextAttempt);
});

test('server payload fingerprint uses normalized validated fields and excludes client prices', () => {
  const first = PlaceOrderSchema.parse(request);
  const second = PlaceOrderSchema.parse({
    ...request,
    items: [{ id: productId, quantity: 2, price: 999999, name: 'untrusted' }],
  });
  assert.equal(createCheckoutPayloadFingerprint(first), createCheckoutPayloadFingerprint(second));
  assert.equal(createCheckoutPayloadFingerprint(first), createCheckoutPayloadFingerprint(PlaceOrderSchema.parse(request)));
  assert.notEqual(
    createCheckoutPayloadFingerprint(first),
    createCheckoutPayloadFingerprint(PlaceOrderSchema.parse({ ...request, address: 'Different address' })),
  );
  assert.notEqual(
    createCheckoutPayloadFingerprint(first),
    createCheckoutPayloadFingerprint(PlaceOrderSchema.parse({ ...request, paymentMethod: 'vodafone' })),
  );
});

test('atomic checkout SQL fingerprints retries and reuses one catalog resolution', async () => {
  const sql = await readFile(new URL('../supabase/migrations/20261006000000_atomic_guest_checkout.sql', import.meta.url), 'utf8');
  assert.equal((sql.match(/public\.storefront_products/g) ?? []).length, 1);
  assert.match(sql, /checkout_payload_fingerprint is distinct from p_payload_fingerprint/);
  assert.match(sql, /on conflict \(checkout_attempt_id\).*?do nothing/s);
  assert.match(sql, /if not found then[\s\S]*?checkout_payload_fingerprint is distinct from p_payload_fingerprint/);
  assert.match(sql, /create unique index if not exists idx_orders_checkout_attempt_id/);
  assert.match(sql, /jsonb_to_recordset\(v_resolved_items\)/);
  assert.match(sql, /insert into public\.order_items[\s\S]*?p\.unit_price \* p\.quantity/);
  assert.match(sql, /insert into public\.payments[\s\S]*?v_total/);
  assert.match(sql, /insert into public\.orders[\s\S]*?v_subtotal[\s\S]*?v_shipping[\s\S]*?v_total/);
  assert.match(sql, /return query select v_order\.id, v_order\.order_number, v_order\.proof_access_token, v_order\.total, v_payment_method/);
  assert.equal((sql.match(/insert into public\.(?:orders|order_items|payments)/g) ?? []).length, 3);
  assert.doesNotMatch(sql, /\b(?:commit|rollback)\b/i);
  assert.match(sql, /revoke all on function[\s\S]*?from public, anon, authenticated/);
  assert.match(sql, /grant execute on function[\s\S]*?to service_role/);
});

test('storefront products keep the URL slug separate from the database UUID used by checkout', () => {
  const storefrontProduct = rowToStorefrontProduct({
    id: productId,
    slug: 'waqar-signature',
    name: 'WAQAR Signature',
    subtitle: 'Eau de Parfum',
    category_slug: 'summer',
    default_variant_price: 200,
    base_price: 200,
    compare_at_price: null,
    default_variant_size: '50ml',
    primary_image_url: null,
    description: '',
    is_best_seller: false,
    is_new: false,
    is_featured: false,
    rating: 0,
    review_count: 0,
    available_quantity: 1,
    allow_backorder: false,
  });

  assert.equal(storefrontProduct.id, 'waqar-signature');
  assert.equal(storefrontProduct.databaseId, productId);
  assert.equal(PlaceOrderSchema.safeParse({
    ...request,
    items: [{ id: storefrontProduct.databaseId, quantity: 1 }],
  }).success, true);
  assert.equal(PlaceOrderSchema.safeParse({
    ...request,
    items: [{ id: storefrontProduct.id, quantity: 1 }],
  }).success, false);
});

test('shipping client rejects non-Bosta and private destinations', () => {
  assert.throws(() => new BostaShippingService('http://127.0.0.1:8080', 'key'));
  assert.throws(() => new BostaShippingService('https://169.254.169.254/latest/meta-data', 'key'));
  assert.throws(() => new BostaShippingService('https://bosta.co.attacker.example', 'key'));
  assert.doesNotThrow(() => new BostaShippingService('https://app.bosta.co', 'key'));
});
