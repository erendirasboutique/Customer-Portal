
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
