-- Text sign-ups from my.erendirasboutique.com/sms.
-- Same Supabase project as the shipping portal, which only texts numbers
-- in this table that haven't opted out. Safe to run again.
create table if not exists sms_subscribers (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,          -- +1XXXXXXXXXX
  name text,
  opted_in_at timestamptz not null default now(),
  opted_out_at timestamptz,
  source text,
  consent_text text,                   -- the exact words they agreed to
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);
alter table sms_subscribers enable row level security;
