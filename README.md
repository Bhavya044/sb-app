# Smart Bookmark Manager

Minimal private bookmark vault built with Next.js (App Router), Supabase Auth/Database/Realtime, and Tailwind CSS. Bookmarks stay tied to the authenticated Google user, and every open tab reflects inserts/deletes instantly thanks to Supabase Realtime.

## Highlights

- **Google-only auth**: Supabase OAuth ensures signing in with Google and no passwords.
- **Private data**: Row Level Security (RLS) keeps every bookmark scoped to `user_id`.
- **Realtime sync**: A Supabase channel pushes inserts/deletes so tabs stay in sync without refresh.
- **Modern stack**: Next.js 16 App Router, Tailwind CSS, and `clsx` for expressive UI.

## Local setup

1. `cd projects/smart-bookmark-mgr`
2. `npm install`
3. Create `.env.local` (or use `.env.example`) with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=<your supabase url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your public anon key>
   ```
4. Run `npm run dev` and visit `http://localhost:3000`.

> **Note**: The sandbox that built this project could not reach `registry.npmjs.org`, so `npm install` was not executed automatically. Please run it locally where outbound networking is available.

## Supabase setup

1. Create a project on Supabase and enable the **Google** OAuth provider (add redirect URI `http://localhost:3000` for dev and your Vercel URL for prod).
2. Add two public environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) to both your local `.env.local` and the Vercel dashboard.
3. Create a `bookmarks` table:

   ```sql
   create table public.bookmarks (
     id uuid default gen_random_uuid() primary key,
     user_id uuid not null references auth.users on delete cascade,
     title text not null,
     url text not null,
     created_at timestamptz not null default now()
   );
   ```

4. Enable RLS and add one policy that allows authenticated users to manage their own rows:

   ```sql
   create policy "Users can manage own bookmarks"
     on public.bookmarks
     for all
     using (auth.uid() = user_id)
     with check (auth.uid() = user_id);
   ```

5. Turn on Realtime for the `bookmarks` table (`INSERT`, `UPDATE`, `DELETE` events) so the client channel receives updates.

## Deployment

1. Push the repo to GitHub (`public` repo as requested).
2. Connect the repository to Vercel and set the same `NEXT_PUBLIC_SUPABASE_*` env vars there.
3. On Vercel, ensure the **App Router** is the build target (the default for Next.js 16+).
4. Deploy and share the live URL.

## How the challenge requirements map

- **Google-only login**: `supabase.auth.signInWithOAuth({ provider: "google" })`.
- **Add/delete bookmarks**: Form handlers insert/delete rows via Supabase.
- **Per-user data**: Queries filter on `user_id`, and RLS policy enforces ownership.
- **Realtime updates**: `supabase.channel(...).on("postgres_changes")` pushes changes per user.
- **Deployment**: App is ready for Vercel; just point the deployment env vars to your Supabase project.

## Problems I ran into

- **Network restrictions prevented automated `npm install`**: The environment could not resolve `registry.npmjs.org`, so I captured the `package.json`/`package-lock.json` and noted in the README that you must run `npm install` once you clone the repo with internet access.
- **Realtime page hydration**: Supabase channels require a filter on `user_id` or every user would see others' bookmarks. The fix was to create a channel scoped to the authenticated ID (`supabase.channel(`bookmarks-${userId}`).on(... filter user_id=eq.${userId})`), keeping the UI both private and performant.

## What to verify

- Sign in with Google, add or delete bookmarks, and open another tab to confirm realtime sync.
- Check that bookmarks do not appear when signed out or when signed in as a different Google account.
*** End Patch
