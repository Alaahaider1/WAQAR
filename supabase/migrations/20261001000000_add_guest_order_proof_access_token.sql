-- Give each guest checkout a high entropy capability token for payment proof
-- access. Existing orders receive independent tokens during this migration.
alter table public.orders
  add column if not exists proof_access_token text not null default gen_random_uuid()::text;

create unique index if not exists idx_orders_proof_access_token
  on public.orders (proof_access_token);
