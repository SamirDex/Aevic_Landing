-- Rejection reason sütunu əlavə et
-- Supabase SQL Editor-də işə salın

alter table public.teams add column if not exists rejection_reason text;
