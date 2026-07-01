-- Mövcud Supabase bazasında email üzrə tək komanda məhdudiyyətini silir.
-- SQL Editor-də bir dəfə işə salın.

alter table public.teams drop constraint if exists teams_email_key;
