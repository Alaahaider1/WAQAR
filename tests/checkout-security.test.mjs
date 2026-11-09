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
import { parseSizeMilliliters } from '../lib/catalog/sizeLabels.ts';

const productId = 'a1b2c3d4-e5f6-4789-8123-456789abcdef';
const variantId = 'b1b2c3d4-e5f6-4789-8123-456789abcdef';
const request = {
  checkoutAttemptId: 'c1b2c3d4-e5f6-4789-8123-456789abcdef',
  firstName: 'A', lastName: 'Customer', email: 'customer@example.com', phone: '',
  address: 'Main Street 123', apt: '', city: 'Cairo', state: '', zip: '', country: 'Egypt',
  paymentMethod: 'cod', items: [{ id: productId, variantId, quantity: 2, price: 0, name: 'Forged', image: 'javascript:alert(1)' }],
};

test('checkout prices the selected active size from the server catalog', () => {
  const parsed = PlaceOrderSchema.parse(request);
  const priced = priceCheckoutItems(parsed.items, [{
    id: productId, name: 'WAQAR Perfume',
    variants: [
      { id: 'd1b2c3d4-e5f6-4789-8123-456789abcdef', sku: 'WQ-30', size: '30ml', price: 140, is_active: true, is_default: false },
      { id: variantId, sku: 'WQ-50', size: '50ml', price: 200, is_active: true, is_default: true },
    ],
    primary_image_url: 'https://res.cloudinary.com/example/image/upload/perfume.jpg',
  }]);

  assert.equal(priced.items[0].price, 200);
  assert.equal(priced.items[0].name, 'WAQAR Perfume');
  assert.equal(priced.items[0].variantId, variantId);
  assert.equal(priced.items[0].sku, 'WQ-50');
  assert.equal(priced.subtotal, 400);
  assert.equal(priced.shipping, 80);
  assert.equal(priced.total, 480);
  assert.throws(() => priceCheckoutItems(parsed.items, [{
    id: productId, name: 'WAQAR Perfume',
    variants: [{ id: variantId, sku: 'WQ-50', size: '50ml', price: 200, is_active: false, is_default: true }],
    primary_image_url: null,
  }]), /no longer available/);
});

test('server checkout always charges EGP 80 regardless of subtotal', () => {
  const parsed = PlaceOrderSchema.parse(request);
  const forgedShipping = PlaceOrderSchema.parse({ ...request, shipping: 0, shippingFee: 0 });
  assert.equal('shipping' in forgedShipping, false);
  for (const [price, expectedTotal] of [[55, 135], [150, 230], [5000, 5080]]) {
    const priced = priceCheckoutItems([{ id: productId, variantId, quantity: 1 }], [{
      id: productId, name: 'WAQAR Perfume',
      variants: [{ id: variantId, sku: 'WQ-50', size: '50ml', price, is_active: true, is_default: true }], primary_image_url: null,
    }]);
    assert.equal(priced.shipping, 80);
    assert.equal(priced.total, expectedTotal);
  }
  assert.equal(parsed.items[0].quantity, 2);
});

test('checkout uses the selected variant catalog price without deriving it from the default', () => {
  const priced = priceCheckoutItems([{ id: productId, variantId, quantity: 1 }], [{
    id: productId,
    name: 'WAQAR Perfume',
    variants: [
      { id: 'd1b2c3d4-e5f6-4789-8123-456789abcdef', sku: 'WQ-50', size: '50 ML', price: 400, is_active: true, is_default: true },
      { id: variantId, sku: 'WQ-100', size: '100 ML', price: 735.25, is_active: true, is_default: false },
    ],
    primary_image_url: null,
  }]);
  assert.equal(priced.items[0].price, 735.25);
  assert.equal(priced.subtotal, 735.25);
  assert.equal(priced.total, 815.25);
});

test('checkout rejects unavailable products and invalid quantities', () => {
  const parsed = PlaceOrderSchema.parse(request);
  assert.throws(() => priceCheckoutItems(parsed.items, []), /no longer available/);
  assert.equal(PlaceOrderSchema.safeParse({ ...request, items: [{ id: productId, variantId, quantity: -1 }] }).success, false);
  assert.equal(PlaceOrderSchema.safeParse({ ...request, checkoutAttemptId: 'invalid' }).success, false);
});

test('size parser accepts supported bottle and evidenced bundle labels, rejects invalid values', () => {
  for (const [label, expected] of [['30ml', 30], ['30 ML', 30], ['30', 30], ['100ml', 100], ['2 x 30ml', 60], ['3 \u00d7 30ml', 90]]) {
    assert.equal(parseSizeMilliliters(label), expected);
  }
  for (const label of ['', '0ml', '-30ml', '30oz', '30 milliliters', '30 ml extra', '2x30', '2x0ml', 'Infinity ml']) {
    assert.equal(parseSizeMilliliters(label), null, label);
  }
});

test('checkout rejects duplicate product and variant entries', () => {
  const duplicated = { ...request, items: [request.items[0], request.items[0]] };
  assert.equal(PlaceOrderSchema.safeParse(duplicated).success, false);
});

test('server pricing uses exact selected variant price and rejects malformed size or unavailable variants', () => {
  for (const size of ['0ml', '-10ml', '10oz', 'gift set']) {
    assert.throws(() => priceCheckoutItems(
      [{ id: productId, variantId, quantity: 1 }],
      [{ id: productId, name: 'Test', variants: [
        { id: variantId, sku: 'BASE', size, price: 400, is_active: true, is_default: true },
      ], primary_image_url: null }],
    ), /invalid bottle size or price/);
  }

  assert.throws(() => priceCheckoutItems(
    [{ id: productId, variantId, quantity: 1 }],
    [{ id: productId, name: 'Test', variants: [
      { id: variantId, sku: 'BASE', size: '50ml', price: 400, is_active: false, is_default: true },
    ], primary_image_url: null }],
  ), /no longer available/);
  assert.throws(() => priceCheckoutItems(
    [{ id: productId, variantId, quantity: 1 }],
    [{ id: productId, name: 'Test', variants: [
      { id: 'd1b2c3d4-e5f6-4789-8123-456789abcdef', sku: 'OTHER', size: '50ml', price: 400, is_active: true, is_default: true },
    ], primary_image_url: null }],
  ), /no longer available/);
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
    items: [{ id: productId, variantId, quantity: 2, price: 999999, name: 'untrusted' }],
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
  assert.notEqual(
    createCheckoutPayloadFingerprint(first),
    createCheckoutPayloadFingerprint(PlaceOrderSchema.parse({
      ...request,
      items: [{ id: productId, variantId: 'd1b2c3d4-e5f6-4789-8123-456789abcdef', quantity: 2 }],
    })),
  );
});

test('atomic checkout SQL fingerprints retries and reuses one catalog resolution', async () => {
  const sql = await readFile(new URL('../supabase/migrations/20261018000000_fixed_shipping_fee.sql', import.meta.url), 'utf8');
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
  assert.match(sql, /v_shipping := 80/);
  assert.match(sql, /new\.shipping_amount := 80/);
  assert.match(sql, /new\.total := new\.subtotal - coalesce\(new\.discount_amount, 0\) \+ 80/);
  assert.match(sql, /delete from public\.site_settings where key in[\s\S]*shipping_express_rate/);
  assert.doesNotMatch(sql, /v_subtotal\s*>=\s*150|shipping[^;]*:=\s*0/i);
});

test('selectable-size migration uses selected stored price and validates variants and payloads', async () => {
  const sql = await readFile(new URL('../supabase/migrations/20261107000000_customer_selectable_product_sizes.sql', import.meta.url), 'utf8');
  assert.match(sql, /create or replace function public\.place_guest_checkout_order\([\s\S]*?p_payload_fingerprint text\s*\)/);
  assert.match(sql, /returns table \([\s\S]*?payment_method text\s*\)/);
  assert.match(sql, /count\(\*\) filter \(where pv\.is_default and pv\.is_active\)::integer as active_default_count/);
  assert.match(sql, /default_info\.active_default_count = 1/);
  assert.match(sql, /v\.id = r\.variant_id[\s\S]*?v\.product_id = p\.id[\s\S]*?v\.is_active/);
  assert.match(sql, /set search_path = public, pg_temp/);
  assert.doesNotMatch(sql, /security\s+(?:definer|invoker)/i);
  assert.match(sql, /round\(v\.price, 2\)/);
  assert.doesNotMatch(sql, /selected_ml\s*\/\s*sizes\.default_ml|d\.price\s*\*/);
  assert.match(sql, /sum\(round\(v\.price, 2\) \* r\.quantity\)/);
  assert.match(sql, /'unit_price', round\(v\.price, 2\)/);
  assert.match(sql, /parsed\.selected_bundle\)\[1\]::numeric \* \(parsed\.selected_bundle\)\[3\]::numeric/);
  assert.match(sql, /having count\(\*\) > 1/);
  assert.match(sql, /r\.quantity between 1 and 20/);
  assert.match(sql, /jsonb_array_length\(p_items\) > 50/);
  assert.match(sql, /checkout_payload_fingerprint is distinct from p_payload_fingerprint/);
  assert.match(sql, /on conflict \(checkout_attempt_id\).*?do nothing/s);
  assert.equal((sql.match(/insert into public\.(?:orders|order_items|payments)/g) ?? []).length, 3);
  assert.match(sql, /insert into public\.order_items[\s\S]*?variant_size[\s\S]*?unit_price/);
  assert.match(sql, /revoke all on function[\s\S]*?from public, anon, authenticated/);
  assert.match(sql, /grant execute on function[\s\S]*?to service_role/);
  assert.doesNotMatch(sql, /create or replace view|create table|alter table/i);
});

test('checkout request keeps the selected variant through the action and does not restrict non-default variants', async () => {
  const [client, action, card] = await Promise.all([
    readFile(new URL('../app/checkout/CheckoutClient.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/actions/order.actions.ts', import.meta.url), 'utf8'),
    readFile(new URL('../components/products/ProductCard.tsx', import.meta.url), 'utf8'),
  ]);
  assert.match(client, /variantId: item\.variant!\.id/);
  assert.doesNotMatch(client, /cannot confirm a non-default bottle size/);
  assert.match(action, /map\(\(\{ id, variantId, quantity \}\) => \(\{ id, variant_id: variantId, quantity \}\)\)/);
  assert.match(card, /addItem\(product\)/);
});

test('selected variant ID survives cart hydration, quantity changes, RPC snapshot, and admin display', async () => {
  const [product, cart, checkout, action, migration, orderRepository, orderPage] = await Promise.all([
    readFile(new URL('../app/products/[id]/ProductDetailClient.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../lib/store/cartStore.ts', import.meta.url), 'utf8'),
    readFile(new URL('../app/checkout/CheckoutClient.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/actions/order.actions.ts', import.meta.url), 'utf8'),
    readFile(new URL('../supabase/migrations/20261107000000_customer_selectable_product_sizes.sql', import.meta.url), 'utf8'),
    readFile(new URL('../src/repositories/order.repository.ts', import.meta.url), 'utf8'),
    readFile(new URL('../app/admin/orders/[id]/page.tsx', import.meta.url), 'utf8'),
  ]);

  assert.match(product, /setSelectedVariantId\(variant\.id\)/);
  assert.match(product, /addItem\(product, selectedVariant, qty\)/);
  assert.match(cart, /variantId: variant\.id/);
  assert.match(cart, /legacyItem\.variantId/);
  assert.match(cart, /getCartItemKey\(item\) === itemKey \? \{ \.\.\.item, quantity:/);
  assert.match(cart, /partialize: \(state\): PersistedCartState => \(\{ items: state\.items \}\)/);
  assert.match(checkout, /variantId: item\.variant!\.id/);
  assert.match(action, /variant_id: variantId/);
  assert.match(migration, /v\.id = r\.variant_id/);
  assert.match(migration, /'variant_id', v\.id/);
  assert.match(migration, /'size', v\.size/);
  assert.match(migration, /'unit_price', round\(v\.price, 2\)/);
  assert.match(orderRepository, /variantId: row\.variant_id/);
  assert.match(orderRepository, /variantSize: String\(row\.variant_size/);
  assert.match(orderRepository, /unitPrice: Number\(row\.unit_price/);
  assert.match(orderPage, /item\.variantSize/);
  assert.match(orderPage, /formatPrice\(item\.unitPrice\)/);
});

test('product detail renders a selectable size chip for one or many active variants', async () => {
  const product = await readFile(new URL('../app/products/[id]/ProductDetailClient.tsx', import.meta.url), 'utf8');
  assert.match(product, /productVariants\.length > 0 && \(/);
  assert.match(product, /productVariants\.find\(\(variant\) => variant\.isDefault\)/);
  assert.match(product, /aria-pressed=\{selected\}/);
  assert.match(product, /setSelectedVariantId\(variant\.id\)/);
  assert.match(product, /selectedVariant\.price/);
  assert.match(product, /formatPrice\(selectedPrice\)/);
  assert.doesNotMatch(product, /product\.subtitle\}\{productVariants\.length <= 1/);
});

test('admin variant editing retains existing records and independently stores each configured price', async () => {
  const [form, mapping, repository] = await Promise.all([
    readFile(new URL('../components/admin/ProductForm.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../lib/catalog/adminForm.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/repositories/product.repository.ts', import.meta.url), 'utf8'),
  ]);
  assert.match(form, /variant\.id \? "Existing variant/);
  assert.match(form, /variant\.price <= 0/);
  assert.match(form, /parseSizeMilliliters\(variant\.size\)/);
  assert.match(mapping, /price: variant\.price/);
  assert.match(mapping, /compareAtPrice: variant\.isDefault \? compareAt : variant\.compareAtPrice/);
  assert.match(mapping, /concentration: variant\.concentration/);
  assert.match(mapping, /position: variant\.position/);
  assert.match(mapping, /id: variant\.id/);
  assert.match(repository, /update\(values\)[\s\S]*?\.eq\('id', variant\.id\)\.eq\('product_id', id\)/);
  assert.match(repository, /update\(\{ is_active: false, is_default: false \}\)/);
  assert.doesNotMatch(repository, /from\('product_variants'\)\.delete\(/);
});

test('shipping fee shown in cart and checkout comes from the fixed shared constant', async () => {
  const [cart, checkout, product, constant] = await Promise.all([
    readFile(new URL('../app/cart/CartClient.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/checkout/CheckoutClient.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/products/[id]/ProductDetailClient.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/shipping.ts', import.meta.url), 'utf8'),
  ]);
  assert.match(constant, /SHIPPING_FEE = 80/);
  assert.match(cart, /const shipping = SHIPPING_FEE/);
  assert.match(checkout, /const shipping = SHIPPING_FEE/);
  assert.match(product, /Shipping costs EGP 80/);
  assert.doesNotMatch(cart + checkout + product, /Free shipping|shipping === 0|subtotal >= 150/i);
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
    default_variant_id: variantId,
    default_variant_sku: 'WQ-50',
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
  assert.deepEqual(storefrontProduct.variants.map(({ id, size, price, isDefault }) => ({ id, size, price, isDefault })), [
    { id: variantId, size: '50ml', price: 200, isDefault: true },
  ]);
  assert.equal(PlaceOrderSchema.safeParse({
    ...request,
    items: [{ id: storefrontProduct.databaseId, variantId, quantity: 1 }],
  }).success, true);
  assert.equal(PlaceOrderSchema.safeParse({
    ...request,
    items: [{ id: storefrontProduct.id, variantId, quantity: 1 }],
  }).success, false);
});

test('shipping client rejects non-Bosta and private destinations', () => {
  assert.throws(() => new BostaShippingService('http://127.0.0.1:8080', 'key'));
  assert.throws(() => new BostaShippingService('https://169.254.169.254/latest/meta-data', 'key'));
  assert.throws(() => new BostaShippingService('https://bosta.co.attacker.example', 'key'));
  assert.doesNotThrow(() => new BostaShippingService('https://app.bosta.co', 'key'));
});
