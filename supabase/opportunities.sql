-- Run this in Supabase SQL Editor before using the dashboard CRUD UI.

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  org text,
  deadline date,
  stage text not null default 'found' check (stage in ('found', 'interested', 'in_progress', 'submitted', 'response')),
  source_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.opportunities enable row level security;

drop policy if exists "Users can read own opportunities" on public.opportunities;
drop policy if exists "Users can insert own opportunities" on public.opportunities;
drop policy if exists "Users can update own opportunities" on public.opportunities;
drop policy if exists "Users can delete own opportunities" on public.opportunities;

create policy "Users can read own opportunities"
on public.opportunities
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own opportunities"
on public.opportunities
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own opportunities"
on public.opportunities
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own opportunities"
on public.opportunities
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_opportunities_updated_at on public.opportunities;
create trigger set_opportunities_updated_at
before update on public.opportunities
for each row
execute function public.set_updated_at();
