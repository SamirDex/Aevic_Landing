-- Team name uniqueness constraint (case-insensitive)
-- Supabase SQL Editor-də işə salın

-- Case-insensitive unique index üçün funksiya yarat
create or replace function public.lower_team_name(team_name text)
returns text
language sql
immutable
as $$
  select lower(team_name);
$$;

-- Unique index əlavə et
create unique index if not exists teams_team_name_unique_idx 
on public.teams (lower_team_name(team_name));
