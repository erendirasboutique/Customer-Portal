
create table if not exists public.gift_cards (
  id uuid default gen_random_uuid() primary key,
  stripe_coupon_id text,
  stripe_promotion_code_id text,
  code text unique not null,
  amount numeric not null,
  customer_name text,
  customer_email text,
  message text,
  status text default 'active',
  gift_card_url text,
  pdf_url text,
  redeemed_count integer default 0,
  total_redeemed numeric default 0,
  last_redeemed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.gift_cards
add column if not exists stripe_coupon_id text,
add column if not exists stripe_promotion_code_id text,
add column if not exists code text,
add column if not exists amount numeric,
add column if not exists customer_name text,
add column if not exists customer_email text,
add column if not exists message text,
add column if not exists status text default 'active',
add column if not exists gift_card_url text,
add column if not exists pdf_url text,
add column if not exists redeemed_count integer default 0,
add column if not exists total_redeemed numeric default 0,
add column if not exists last_redeemed_at timestamptz,
add column if not exists updated_at timestamptz default now();

create unique index if not exists gift_cards_code_key on public.gift_cards (code);

notify pgrst, 'reload schema';
