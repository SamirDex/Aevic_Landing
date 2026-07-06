-- Rate limiting table for serverless environment
create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  endpoint text not null,
  count integer not null default 1,
  reset_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Index for efficient lookup
create index if not exists idx_rate_limits_lookup on public.rate_limits (ip, endpoint, reset_at);

-- Enable RLS (optional, can be disabled if not needed)
alter table public.rate_limits enable row level security;

-- Allow all operations (since this is for rate limiting, not user data)
create policy "Allow all rate limit operations" on public.rate_limits
  for all
  using (true)
  with check (true);
