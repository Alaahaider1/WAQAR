-- Guest checkout is idempotent by attempt UUID. Order, items, and payment are
-- committed together; failures roll back the entire function transaction.
alter table public.orders
  add column if not exists checkout_attempt_id uuid,
  add column if not exists checkout_payload_fingerprint text;

create unique index if not exists idx_orders_checkout_attempt_id
  on public.orders (checkout_attempt_id)
  where checkout_attempt_id is not null;

-- Return columns and arguments changed to carry the payload fingerprint and
-- stored method. PostgreSQL requires dropping the previous signature first.
drop function if exists public.place_guest_checkout_order(
  uuid, text, text, text, text, text, text, text, text, text, text, jsonb
);

create or replace function public.place_guest_checkout_order(
  p_checkout_attempt_id uuid,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_address text,
  p_apt text,
  p_city text,
  p_state text,
  p_zip text,
  p_country text,
  p_payment_method text,
  p_items jsonb,
  p_payload_fingerprint text
)
returns table (
  order_id uuid,
  order_number text,
  proof_access_token text,
  total numeric,
  payment_method text
)
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
  v_requested_count integer;
  v_available_count integer;
  v_valid_count integer;
  v_inserted_count integer;
  v_subtotal numeric(10, 2);
  v_shipping numeric(10, 2);
  v_total numeric(10, 2);
  v_provider text;
  v_payment_method text;
  v_resolved_items jsonb;
  v_address jsonb;
begin
  if p_checkout_attempt_id is null then
    raise exception 'Invalid checkout attempt' using errcode = '22023';
  end if;

  if p_payment_method = 'card' then
    raise exception 'Card payments are not available yet.' using errcode = '0A000';
  end if;

  if p_payload_fingerprint is null or p_payload_fingerprint !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid checkout payload' using errcode = '22023';
  end if;

  select o.*
    into v_order
    from public.orders o
   where o.checkout_attempt_id = p_checkout_attempt_id;

  if found then
    select pay.provider
      into v_provider
      from public.payments pay
     where pay.order_id = v_order.id
     order by pay.created_at, pay.id
     limit 1;

    if v_order.checkout_payload_fingerprint is distinct from p_payload_fingerprint then
      raise exception 'Checkout attempt was already used with different details' using errcode = 'P0001';
    end if;
    v_payment_method := case v_provider
      when 'vodafone_cash' then 'vodafone'
      when 'etisalat_cash' then 'etisalat'
      when 'orange_cash' then 'orange'
      when 'we_pay' then 'wepay'
      when 'instapay' then 'instapay'
      when 'cash_on_delivery' then 'cod'
      else null
    end;
    if v_payment_method is null then
      raise exception 'Stored checkout payment method is unavailable' using errcode = '22023';
    end if;
    return query select v_order.id, v_order.order_number, v_order.proof_access_token, v_order.total, v_payment_method;
    return;
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Invalid checkout items' using errcode = '22023';
  end if;

  -- Resolve each requested product and its authoritative variant data once.
  -- All later amounts and order_items use this immutable in-transaction JSON snapshot.
  select
    count(*)::integer,
    count(p.id)::integer,
    count(*) filter (
      where p.id is not null
        and p.default_variant_id is not null
        and p.default_variant_price is not null
        and r.quantity between 1 and 20
    )::integer,
    coalesce(sum(p.default_variant_price * r.quantity), 0)::numeric(10, 2),
    coalesce(jsonb_agg(jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'variant_id', p.default_variant_id,
      'sku', coalesce(p.default_variant_sku, p.id::text),
      'size', coalesce(p.default_variant_size, 'Standard'),
      'image', p.primary_image_url,
      'unit_price', p.default_variant_price,
      'quantity', r.quantity
    ) order by e.ordinality) filter (where p.id is not null), '[]'::jsonb)
    into v_requested_count, v_available_count, v_valid_count, v_subtotal, v_resolved_items
    from jsonb_array_elements(p_items) with ordinality as e(value, ordinality)
    cross join lateral jsonb_to_record(e.value) as r(id uuid, quantity integer)
    left join public.storefront_products p on p.id = r.id;

  if v_requested_count = 0
     or v_available_count <> v_requested_count
     or v_valid_count <> v_requested_count then
    raise exception 'One or more products are no longer available' using errcode = '22023';
  end if;

  v_shipping := case when v_subtotal >= 150 then 0 else 12 end;
  v_total := v_subtotal + v_shipping;
  v_address := jsonb_build_object(
    'fullName', concat_ws(' ', nullif(trim(p_first_name), ''), nullif(trim(p_last_name), '')),
    'phone', nullif(p_phone, ''),
    'addressLine1', p_address,
    'addressLine2', nullif(p_apt, ''),
    'city', p_city,
    'state', nullif(p_state, ''),
    'postalCode', p_zip,
    'countryCode', p_country
  );

  v_provider := case p_payment_method
    when 'vodafone' then 'vodafone_cash'
    when 'etisalat' then 'etisalat_cash'
    when 'orange' then 'orange_cash'
    when 'wepay' then 'we_pay'
    when 'instapay' then 'instapay'
    when 'cod' then 'cash_on_delivery'
    else null
  end;
  if v_provider is null then
    raise exception 'Invalid payment method' using errcode = '22023';
  end if;
  v_payment_method := p_payment_method;

  insert into public.orders (
    user_id, status, payment_status, subtotal, discount_amount,
    shipping_amount, tax_amount, total, currency, coupon_id, coupon_code,
    shipping_address, billing_address, shipping_method, customer_notes,
    admin_notes, ip_address, user_agent, checkout_attempt_id,
    checkout_payload_fingerprint
  ) values (
    null, 'pending', 'pending', v_subtotal, 0,
    v_shipping, 0, v_total, 'EGP', null, null,
    v_address, v_address, 'standard', null,
    null, null, null, p_checkout_attempt_id, p_payload_fingerprint
  )
  on conflict (checkout_attempt_id) where checkout_attempt_id is not null do nothing
  returning * into v_order;

  if not found then
    select o.*
      into v_order
      from public.orders o
     where o.checkout_attempt_id = p_checkout_attempt_id;
    select pay.provider
      into v_provider
      from public.payments pay
     where pay.order_id = v_order.id
     order by pay.created_at, pay.id
     limit 1;
    if v_order.checkout_payload_fingerprint is distinct from p_payload_fingerprint then
      raise exception 'Checkout attempt was already used with different details' using errcode = 'P0001';
    end if;
    v_payment_method := case v_provider
      when 'vodafone_cash' then 'vodafone'
      when 'etisalat_cash' then 'etisalat'
      when 'orange_cash' then 'orange'
      when 'we_pay' then 'wepay'
      when 'instapay' then 'instapay'
      when 'cash_on_delivery' then 'cod'
      else null
    end;
    if v_payment_method is null then
      raise exception 'Stored checkout payment method is unavailable' using errcode = '22023';
    end if;
    return query select v_order.id, v_order.order_number, v_order.proof_access_token, v_order.total, v_payment_method;
    return;
  end if;

  insert into public.order_items (
    order_id, product_id, variant_id, product_name, variant_sku,
    variant_size, image_url, unit_price, quantity, total_price
  )
  select
    v_order.id, p.id, p.variant_id, p.name, p.sku,
    p.size, p.image, p.unit_price, p.quantity, p.unit_price * p.quantity
  from jsonb_to_recordset(v_resolved_items) as p(
    id uuid, name text, variant_id uuid, sku text, size text,
    image text, unit_price numeric, quantity integer
  );

  get diagnostics v_inserted_count = row_count;
  if v_inserted_count <> v_requested_count then
    raise exception 'One or more products are no longer available' using errcode = '22023';
  end if;

  insert into public.payments (
    order_id, provider, status, amount, currency,
    provider_reference, provider_response, failure_reason, paid_at
  ) values (
    v_order.id, v_provider, 'pending', v_total, 'EGP',
    null, null, null, null
  );

  return query select v_order.id, v_order.order_number, v_order.proof_access_token, v_order.total, v_payment_method;
end;
$$;

revoke all on function public.place_guest_checkout_order(
  uuid, text, text, text, text, text, text, text, text, text, text, jsonb, text
) from public, anon, authenticated;
grant execute on function public.place_guest_checkout_order(
  uuid, text, text, text, text, text, text, text, text, text, text, jsonb, text
) to service_role;
