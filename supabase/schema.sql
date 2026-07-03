create table if not exists public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null default 'admin',
  language text default 'en',
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  payment_source text default 'stripe',

  stripe_session_id text unique,
  stripe_payment_intent text,
  stripe_customer_id text,
  payment_link text,

  clover_payment_id text unique,
  clover_order_id text,
  clover_merchant_id text,
  clover_tender text,

  customer_name text,
  customer_email text,
  customer_phone text,

  amount_total numeric default 0,
  currency text default 'usd',
  payment_status text,
  refund_status text default 'none',
  payment_method text,
  payment_method_brand text,
  payment_method_last4 text,

  billing_address jsonb,
  shipping_address jsonb,
  description text,
  receipt_url text,
  admin_notes text,
  raw jsonb,
  created_at timestamptz default now()
);

alter table public.admins enable row level security;
alter table public.payments enable row level security;

create unique index if not exists payments_stripe_session_id_key on public.payments (stripe_session_id);
create unique index if not exists payments_clover_payment_id_key on public.payments (clover_payment_id);


create table if not exists public.payment_links (
  id uuid default gen_random_uuid() primary key,
  stripe_payment_link_id text unique,
  url text not null,
  title text,
  description text,
  amount numeric,
  minimum_amount numeric,
  maximum_amount numeric,
  customer_chooses_amount boolean default false,
  collect_name boolean default true,
  collect_shipping boolean default true,
  collect_billing boolean default true,
  require_phone boolean default true,
  allow_promotion_codes boolean default true,
  redirect_after_payment boolean default true,
  redirect_url text,
  status text default 'pending',
  paid_count integer default 0,
  total_paid numeric default 0,
  last_paid_at timestamptz,
  archived boolean default false,
  created_by text,
  raw jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists payment_links_stripe_payment_link_id_key
on public.payment_links (stripe_payment_link_id);

create table if not exists public.gift_cards (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  amount numeric not null,
  currency text default 'usd',
  recipient_name text,
  note text,
  never_expires boolean default true,
  status text default 'active',
  active boolean default true,
  stripe_coupon_id text,
  stripe_promotion_code_id text,
  redeemed_at timestamptz,
  redeemed_amount numeric default 0,
  raw jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists gift_cards_code_key on public.gift_cards (code);
create unique index if not exists gift_cards_stripe_promotion_code_id_key on public.gift_cards (stripe_promotion_code_id);
