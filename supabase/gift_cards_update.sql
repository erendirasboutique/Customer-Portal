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
notify pgrst, 'reload schema';
