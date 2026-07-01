-- Supabase SQL Editor-də işə salın (bir dəfə).
--
-- Əgər teams cədvəli əvvəllər yaradılıbsa və email unique idi, bir dəfə işə salın:
-- alter table public.teams drop constraint if exists teams_email_key;

create table if not exists public.teams (
  id bigint generated always as identity primary key,
  team_name text not null,
  captain_name text not null,
  captain_contact text not null,
  email text not null,
  password_hash text not null,
  player1_ign text not null,
  player2_ign text not null,
  player3_ign text not null,
  player4_ign text not null,
  player5_ign text,
  logo_url text,
  tier text not null default 'entry',
  status text not null default 'pending',
  room_id text,
  room_password text,
  match_results jsonb not null default '[]'::jsonb,
  reset_token text,
  reset_token_expiry bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.tournament_state (
  id text primary key default 'default',
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.tournament_state (id, state)
values ('default', '{}'::jsonb)
on conflict (id) do nothing;

alter table public.teams enable row level security;
alter table public.tournament_state enable row level security;

-- Teams table RLS policies
drop policy if exists "teams_public_insert" on public.teams;
drop policy if exists "teams_public_select" on public.teams;
drop policy if exists "teams_public_select_safe" on public.teams;
drop policy if exists "teams_public_update" on public.teams;
drop policy if exists "teams_public_delete" on public.teams;
drop policy if exists "teams_service_insert" on public.teams;
drop policy if exists "teams_service_update" on public.teams;
drop policy if exists "teams_service_delete" on public.teams;

-- Anon/authenticated istifadəçilər yalnız public field-ləri olan komandaları görə bilər
-- Server-side filtrasiya (teamsApiCore.ts pickPublicTeam) əsl gizlətməni edir
create policy "teams_anon_select" on teams
  for select to anon
  using (true);

-- Yalnız service_role insert/update/delete edə bilər
create policy "teams_service_insert" on teams
  for insert to service_role with check (true);

create policy "teams_service_update" on teams
  for update to service_role using (true);

create policy "teams_service_delete" on teams
  for delete to service_role using (true);

drop policy if exists "tournament_public_all" on public.tournament_state;
create policy "tournament_public_read"
  on public.tournament_state for select to anon, authenticated using (true);
-- Write operations service_role (Netlify function) tərəfindən edilir

-- Şəkillər (standings, sharecard, loqolar)
insert into storage.buckets (id, name, public)
values ('aevic-media', 'aevic-media', true)
on conflict (id) do update set public = true;

drop policy if exists "aevic_media_public_read" on storage.objects;
create policy "aevic_media_public_read"
  on storage.objects for select to public
  using (bucket_id = 'aevic-media');

drop policy if exists "aevic_media_public_write" on storage.objects;
create policy "aevic_media_public_write"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'aevic-media');

drop policy if exists "aevic_media_public_update" on storage.objects;
create policy "aevic_media_public_update"
  on storage.objects for update to anon, authenticated
  using (bucket_id = 'aevic-media');

drop policy if exists "aevic_media_public_delete" on storage.objects;
create policy "aevic_media_public_delete"
  on storage.objects for delete to anon, authenticated
  using (bucket_id = 'aevic-media');

-- Migration: mövcud cədvələ reset_token sütununu əlavə et (əgər yoxdursa)
alter table public.teams add column if not exists reset_token text;
alter table public.teams add column if not exists reset_token_expiry bigint;
