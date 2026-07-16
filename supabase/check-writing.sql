-- CHECK WRITING ADD-ON
-- Run this entire file in Supabase SQL Editor.
-- This stores check records and numbering, but NOT your routing/account number.

create extension if not exists pgcrypto;

create table if not exists public.check_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bank_name text not null,
  last_check_number bigint not null default 1000 check (last_check_number >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checks (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.check_accounts(id) on delete restrict,
  check_number bigint not null,
  payee text not null check (char_length(payee) between 1 and 160),
  amount_cents bigint not null check (amount_cents > 0),
  amount_words text not null,
  check_date date not null default current_date,
  mailing_address text,
  memo text,
  internal_notes text,
  related_type text check (
    related_type is null or related_type in (
      'payment', 'refund', 'order', 'vendor', 'expense', 'other'
    )
  ),
  related_id text,
  status text not null default 'draft' check (
    status in ('draft', 'approved', 'printed', 'mailed', 'cleared', 'void')
  ),
  printed_at timestamptz,
  mailed_at timestamptz,
  cleared_at timestamptz,
  voided_at timestamptz,
  void_reason text,
  created_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, check_number)
);

create table if not exists public.check_events (
  id uuid primary key default gen_random_uuid(),
  check_id uuid not null references public.checks(id) on delete cascade,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  performed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists checks_status_idx on public.checks(status);
create index if not exists checks_date_idx on public.checks(check_date desc);
create index if not exists checks_number_idx on public.checks(check_number desc);
create index if not exists check_events_check_idx on public.check_events(check_id, created_at desc);

alter table public.check_accounts enable row level security;
alter table public.checks enable row level security;
alter table public.check_events enable row level security;

-- This assumes only trusted administrators can sign into the billing portal.
-- The API also checks CHECKS_ADMIN_EMAILS.
drop policy if exists "Authenticated users can read check accounts" on public.check_accounts;
create policy "Authenticated users can read check accounts"
on public.check_accounts for select
to authenticated
using (true);

drop policy if exists "Authenticated users can read checks" on public.checks;
create policy "Authenticated users can read checks"
on public.checks for select
to authenticated
using (true);

drop policy if exists "Authenticated users can update checks" on public.checks;
create policy "Authenticated users can update checks"
on public.checks for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can read check events" on public.check_events;
create policy "Authenticated users can read check events"
on public.check_events for select
to authenticated
using (true);

drop policy if exists "Authenticated users can add check events" on public.check_events;
create policy "Authenticated users can add check events"
on public.check_events for insert
to authenticated
with check (performed_by = auth.uid());

create or replace function public.create_business_check(
  p_account_id uuid,
  p_payee text,
  p_amount_cents bigint,
  p_amount_words text,
  p_check_date date,
  p_memo text default null,
  p_mailing_address text default null,
  p_internal_notes text default null,
  p_related_type text default null,
  p_related_id text default null
)
returns public.checks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next_number bigint;
  v_check public.checks;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_amount_cents <= 0 then
    raise exception 'Check amount must be greater than zero';
  end if;

  update public.check_accounts
  set
    last_check_number = last_check_number + 1,
    updated_at = now()
  where id = p_account_id
    and is_active = true
  returning last_check_number into v_next_number;

  if v_next_number is null then
    raise exception 'Active check account not found';
  end if;

  insert into public.checks (
    account_id,
    check_number,
    payee,
    amount_cents,
    amount_words,
    check_date,
    mailing_address,
    memo,
    internal_notes,
    related_type,
    related_id,
    created_by
  )
  values (
    p_account_id,
    v_next_number,
    trim(p_payee),
    p_amount_cents,
    p_amount_words,
    p_check_date,
    nullif(trim(p_mailing_address), ''),
    nullif(trim(p_memo), ''),
    nullif(trim(p_internal_notes), ''),
    p_related_type,
    nullif(trim(p_related_id), ''),
    auth.uid()
  )
  returning * into v_check;

  insert into public.check_events (
    check_id,
    event_type,
    performed_by
  )
  values (
    v_check.id,
    'created',
    auth.uid()
  );

  return v_check;
end;
$$;

revoke all on function public.create_business_check(
  uuid, text, bigint, text, date, text, text, text, text, text
) from public;

grant execute on function public.create_business_check(
  uuid, text, bigint, text, date, text, text, text, text, text
) to authenticated;

-- CHANGE these values before running the insert.
-- last_check_number must be the number immediately BEFORE the first check you want the portal to issue.
insert into public.check_accounts (name, bank_name, last_check_number)
select 'Primary Business Checking', 'YOUR BANK NAME', 1000
where not exists (select 1 from public.check_accounts);
