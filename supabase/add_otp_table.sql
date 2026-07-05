-- OTP cədvəli (serverless mühit üçün)
-- Supabase SQL Editor-də işə salın

create table if not exists public.otp_codes (
  id bigint generated always as identity primary key,
  email text not null,
  code text not null,
  expires_at bigint not null,
  registration_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Index for faster lookups by email
create index if not exists otp_codes_email_idx on public.otp_codes(email);

-- Index for cleanup of expired entries
create index if not exists otp_codes_expires_at_idx on public.otp_codes(expires_at);

-- RLS policies
alter table public.otp_codes enable row level security;

drop policy if exists "otp_codes_service_insert" on public.otp_codes;
drop policy if exists "otp_codes_service_select" on public.otp_codes;
drop policy if exists "otp_codes_service_update" on public.otp_codes;
drop policy if exists "otp_codes_service_delete" on public.otp_codes;

create policy "otp_codes_service_insert" on otp_codes
  for insert to service_role with check (true);

create policy "otp_codes_service_select" on otp_codes
  for select to service_role using (true);

create policy "otp_codes_service_update" on otp_codes
  for update to service_role using (true);

create policy "otp_codes_service_delete" on otp_codes
  for delete to service_role using (true);
