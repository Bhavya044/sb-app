create table if not exists public.bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  url text not null,
  created_at timestamptz not null default now()
);

alter table public.bookmarks enable row level security;

create policy if not exists "Users can manage own bookmarks"
  on public.bookmarks
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
