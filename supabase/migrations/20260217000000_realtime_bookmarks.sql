-- Enable RLS and publish realtime changes for bookmarks

-- Make sure the table has RLS enabled so we can scope broadcasts per user
alter table if exists public.bookmarks enable row level security;

-- Index to speed up the per-user filter used everywhere
create index if not exists idx_bookmarks_user_id on public.bookmarks(user_id);

-- Policies to lock the table to the authenticated owner
drop policy if exists "bookmarks_select_own" on public.bookmarks;
drop policy if exists "bookmarks_insert_own" on public.bookmarks;
drop policy if exists "bookmarks_update_own" on public.bookmarks;
drop policy if exists "bookmarks_delete_own" on public.bookmarks;
create policy "bookmarks_select_own" on public.bookmarks
  for select to authenticated
  using (auth.uid() = user_id);

create policy "bookmarks_insert_own" on public.bookmarks
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "bookmarks_update_own" on public.bookmarks
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "bookmarks_delete_own" on public.bookmarks
  for delete to authenticated
  using (auth.uid() = user_id);

-- Realtime trigger function that broadcasts per user topic
create or replace function public.bookmarks_broadcast_changes()
returns trigger
language plpgsql
security definer
as $$
begin
  perform realtime.broadcast_changes(
    'user:' || coalesce(NEW.user_id, OLD.user_id)::text || ':bookmarks',
    tg_op,
    tg_op,
    tg_table_name,
    tg_table_schema,
    NEW,
    OLD
  );
  return null;
end;
$$;

drop trigger if exists bookmarks_broadcast_trigger on public.bookmarks;
create trigger bookmarks_broadcast_trigger
  after insert or update or delete on public.bookmarks
  for each row
  execute function public.bookmarks_broadcast_changes();
