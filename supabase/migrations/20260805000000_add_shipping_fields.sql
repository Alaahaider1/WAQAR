alter table public.orders
  add column if not exists shipping_provider text,
  add column if not exists shipment_id text,
  add column if not exists shipping_status text;

create index if not exists idx_orders_shipping_status on public.orders(shipping_status);

create or replace view public.admin_order_summary
  with (security_invoker = true)
as
select o.id, o.order_number, o.status, o.payment_status, o.subtotal,
  o.discount_amount, o.shipping_amount, o.tax_amount, o.total, o.currency,
  o.coupon_code, o.shipping_method, o.tracking_number,
  o.created_at, o.shipped_at, o.delivered_at,
  p.id as customer_id, p.full_name as customer_name, p.email as customer_email,
  (select count(*) from public.order_items oi where oi.order_id = o.id) as item_count,
  pay.provider as payment_provider,
  o.shipping_provider, o.shipment_id, o.shipping_status
from public.orders o
left join public.profiles p on p.id = o.user_id
left join public.payments pay on pay.order_id = o.id and pay.status = 'succeeded';
