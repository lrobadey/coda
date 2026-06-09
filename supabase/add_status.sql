-- Run this in Supabase SQL Editor to enable the Discover queue.

alter table public.opportunities
  add column if not exists status text not null default 'tracked'
  check (status in ('suggested', 'tracked'));
