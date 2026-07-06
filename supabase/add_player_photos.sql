-- Oyunçu şəkilləri sütunları əlavə et
-- Supabase SQL Editor-də işə salın

alter table public.teams add column if not exists player1_photo_url text;
alter table public.teams add column if not exists player2_photo_url text;
alter table public.teams add column if not exists player3_photo_url text;
alter table public.teams add column if not exists player4_photo_url text;
alter table public.teams add column if not exists player5_photo_url text;
