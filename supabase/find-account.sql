-- "Find my account" (my.erendirasboutique.com/find-account)
-- Run once in the SHIPPING Supabase project (the one with shipping_customers),
-- SQL Editor → paste → Run. Safe to run more than once.

-- Every lookup try, so guessing can be limited. Keys are hashed (no names or IPs).
create table if not exists portal_lookup_attempts (
  id bigserial primary key,
  key text not null,
  ok boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_portal_lookup_attempts_key on portal_lookup_attempts (key, created_at desc);

-- Successful lookups, so an address change soon after can be flagged.
create table if not exists portal_lookups (
  id bigserial primary key,
  customer_id uuid not null references shipping_customers(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists idx_portal_lookups_customer on portal_lookups (customer_id, created_at desc);

-- Address changes made within 30 days of a lookup (also emailed to the shop).
create table if not exists portal_address_alerts (
  id bigserial primary key,
  customer_id uuid not null references shipping_customers(id) on delete cascade,
  old_address text,
  new_address text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists idx_portal_address_alerts_open on portal_address_alerts (created_at desc) where resolved_at is null;

-- Only the server (service role) uses these tables.
alter table portal_lookup_attempts enable row level security;
alter table portal_lookups enable row level security;
alter table portal_address_alerts enable row level security;
