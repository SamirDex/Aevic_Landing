-- Admin sessions table for serverless authentication
create table if not exists public.admin_sessions (
  token text primary key,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- Index for efficient cleanup of expired sessions
create index if not exists idx_admin_sessions_expires_at on public.admin_sessions (expires_at);

-- Enable RLS
alter table public.admin_sessions enable row level security;

-- Allow all operations (server-side only, no user data)
create policy "Allow all admin session operations" on public.admin_sessions
  for all
  using (true)
  with check (true);
