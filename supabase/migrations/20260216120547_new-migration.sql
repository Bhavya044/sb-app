-- Migration: create bookmarks table

-- Ensure pgcrypto is available for UUID generation
create extension if not exists "pgcrypto";

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  title text not null,
  description text,
  category text,
  tags text[] default '{}',
  metadata jsonb default '{}',
  is_favorite boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookmarks_user_id_idx on public.bookmarks (user_id);
create index if not exists bookmarks_url_idx on public.bookmarks (lower(url));

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger bookmarks_updated_at
  before update on public.bookmarks
  for each row
  execute function public.set_updated_at();
