-- Customer-selectable sizes are resolved inside the existing atomic checkout RPC.
-- No table, column, or storefront-view changes are required.
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
  v_duplicate_count integer;
  v_subtotal numeric;
  v_shipping numeric(10, 2);
  v_total numeric;
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

  if p_items is null or jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'Invalid checkout items' using errcode = '22023';
  end if;

  if jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 50 then
    raise exception 'Invalid checkout items' using errcode = '22023';
  end if;

  -- Validate item structure and UUID/quantity text before any casts are attempted.
  if exists (
    select 1
      from jsonb_array_elements(p_items) as e(value)
     where jsonb_typeof(e.value) is distinct from 'object'
        or not (e.value ?& array['id', 'variant_id', 'quantity'])
        or jsonb_typeof(e.value -> 'id') is distinct from 'string'
        or jsonb_typeof(e.value -> 'variant_id') is distinct from 'string'
        or jsonb_typeof(e.value -> 'quantity') is distinct from 'number'
        or (e.value ->> 'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        or (e.value ->> 'variant_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        or (e.value ->> 'quantity') !~ '^[0-9]{1,2}$'
  ) then
    raise exception 'Invalid checkout items' using errcode = '22023';
  end if;

  -- Duplicate product/variant lines are unsupported; the cart combines them.
  select count(*)::integer
    into v_duplicate_count
    from (
      select r.id, r.variant_id
        from jsonb_array_elements(p_items) as e(value)
        cross join lateral jsonb_to_record(e.value) as r(id uuid, variant_id uuid)
       group by r.id, r.variant_id
      having count(*) > 1
    ) duplicates;

  if v_duplicate_count > 0 then
    raise exception 'Duplicate product variants are not allowed' using errcode = '22023';
  end if;

  -- Parse supported size labels. Ordinary bottles accept "30", "30ml", or
  -- "30 ML". Repository bundle descriptions identify 2/3/5 separate bottles
  -- (for example, "2 × 30ml"), so these labels are interpreted as aggregate
  -- liquid volume for positive-size validation. All other formats are rejected.
  -- Parsed amounts must be between 1e-18 and 1e17 ml, bounding arithmetic
  -- before prices and totals are checked against the numeric(10,2) columns.
  begin
    -- Apply the same EGP two-decimal rounding rule to subtotal and item snapshots.
    select
      count(*)::integer,
      count(v.id)::integer,
      count(*) filter (
        where p.id is not null
          and default_info.active_default_count = 1
          and d.id is not null
          and v.id is not null
          and d.price > 0
          and sizes.default_ml between 0.000000000000000001 and 100000000000000000
          and sizes.selected_ml between 0.000000000000000001 and 100000000000000000
          and r.quantity between 1 and 20
          and v.price > 0
          and round(v.price, 2) > 0
          and round(v.price, 2) <= 99999999.99
      )::integer,
      coalesce(
        sum(round(v.price, 2) * r.quantity),
        0
      ),
      coalesce(
        jsonb_agg(jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'variant_id', v.id,
          'sku', coalesce(v.sku, p.id::text),
          'size', v.size,
          'image', p.primary_image_url,
          'unit_price', round(v.price, 2),
          'quantity', r.quantity
        ) order by e.ordinality)
          filter (where p.id is not null and d.id is not null and v.id is not null),
        '[]'::jsonb
      )
      into v_requested_count, v_available_count, v_valid_count, v_subtotal, v_resolved_items
      from jsonb_array_elements(p_items) with ordinality as e(value, ordinality)
      cross join lateral jsonb_to_record(e.value) as r(id uuid, variant_id uuid, quantity integer)
      left join public.storefront_products p
        on p.id = r.id
      left join lateral (
        select
          count(*) filter (where pv.is_default and pv.is_active)::integer as active_default_count,
          case when count(*) filter (where pv.is_default and pv.is_active) = 1
            then (array_agg(pv.id) filter (where pv.is_default and pv.is_active))[1]
            else null
          end as default_variant_id
        from public.product_variants pv
        where pv.product_id = p.id
      ) default_info on true
      left join public.product_variants d
        on d.id = default_info.default_variant_id
       and d.product_id = p.id
       and d.is_default
       and d.is_active
      left join public.product_variants v
        on v.id = r.variant_id
       and v.product_id = p.id
       and v.is_active
      left join lateral (
        select
          case
            when parsed.default_simple is not null
              then (parsed.default_simple)[1]::numeric
            when parsed.default_bundle is not null
              then (parsed.default_bundle)[1]::numeric * (parsed.default_bundle)[3]::numeric
            else null
          end as default_ml,
          case
            when parsed.selected_simple is not null
              then (parsed.selected_simple)[1]::numeric
            when parsed.selected_bundle is not null
              then (parsed.selected_bundle)[1]::numeric * (parsed.selected_bundle)[3]::numeric
            else null
          end as selected_ml
        from (
          select
            regexp_match(
              lower(trim(d.size)),
              '^([0-9]+([.][0-9]+)?)[[:space:]]*(ml)?$'
            ) as default_simple,
            regexp_match(
              lower(trim(d.size)),
              '^([0-9]+([.][0-9]+)?)[[:space:]]*[x×][[:space:]]*([0-9]+([.][0-9]+)?)[[:space:]]*ml$'
            ) as default_bundle,
            regexp_match(
              lower(trim(v.size)),
              '^([0-9]+([.][0-9]+)?)[[:space:]]*(ml)?$'
            ) as selected_simple,
            regexp_match(
              lower(trim(v.size)),
              '^([0-9]+([.][0-9]+)?)[[:space:]]*[x×][[:space:]]*([0-9]+([.][0-9]+)?)[[:space:]]*ml$'
            ) as selected_bundle
        ) parsed
      ) sizes on true;
  exception
    when data_exception then
      raise exception 'Invalid checkout item data' using errcode = '22023';
  end;

  if v_requested_count = 0
     or v_available_count <> v_requested_count
     or v_valid_count <> v_requested_count then
    raise exception 'One or more products or sizes are invalid or unavailable' using errcode = '22023';
  end if;

  v_shipping := 80;
  if v_subtotal < 0 or v_subtotal > 99999919.99 then
    raise exception 'Checkout total is outside the supported range' using errcode = '22023';
  end if;
  v_total := v_subtotal + v_shipping;
  if v_total > 99999999.99 then
    raise exception 'Checkout total is outside the supported range' using errcode = '22023';
  end if;

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
    raise exception 'One or more products or sizes are invalid or unavailable' using errcode = '22023';
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
