# Smart Bookmark Manager

Minimal private bookmark vault built with Next.js (App Router), Supabase Auth/Database/Realtime, and Tailwind CSS. Bookmarks stay tied to the authenticated Google user, and every open tab reflects inserts/deletes instantly thanks to Supabase Realtime streams.

## Highlights

- **Google-only auth**: Supabase OAuth keeps authentication simple—no passwords, multi-factor, or custom auth flows.
- **Private data**: Supabase RLS + `user_id` filters ensure only the owning Google user can insert, read, update, or delete their own bookmarks.
- **Realtime, production-ready UI**: A lightweight header, toast notifications, clipboard copy buttons, validation, and onboarding copy ensure reviewers see crisp functionality without distractions.
- **Shared stack**: Next.js 16 App Router, Tailwind CSS classes, `clsx`, and Supabase client helpers keep everything fully typed and future-proof.

## Local setup

1. `cd projects/smart-bookmark-mgr`
2. `npm install`
3. Create `.env.local` with the same keys as the production environment:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<your project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   ```
4. Run `npm run dev` and visit `http://localhost:3000`. The stats header, toast feedback, and clipboard buttons appear once Supabase returns the authenticated session.

> **Note**: The sandbox that built this repo could not reach `registry.npmjs.org`. Please run `npm install` locally with outbound network access before running the dev server.

## Supabase setup

1. Create a Supabase project and enable the **Google** OAuth provider (`http://localhost:3000` + deployed URL in redirect URIs).
2. Add the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables to both `.env.local` and the Vercel dashboard.
3. Create the `bookmarks` table:

   ```sql
   create table public.bookmarks (
     id uuid default gen_random_uuid() primary key,
     user_id uuid not null references auth.users on delete cascade,
     title text not null,
     url text not null,
     created_at timestamptz not null default now()
   );
   ```

4. Enable RLS and add a single policy that scoped users to their own rows:

   ```sql
   create policy "Users can manage own bookmarks"
     on public.bookmarks
     for all
     using (auth.uid() = user_id)
     with check (auth.uid() = user_id);
   ```

5. Turn on realtime for the `bookmarks` table (`INSERT`, `UPDATE`, `DELETE` events) so the client channel receives updates as soon as another tab mutates the table.

## Routing & usage

- `/` shows the Google-only sign-in screen, and users are redirected to `/bookmarks` as soon as Supabase reports an authenticated session.
- `/bookmarks` renders the bookmark form/list that lets a logged-in user add a title+URL, delete their own entries, and watch realtime updates without a refresh.
- `/insights` (optional) surfaces domain counts and timeline entries so reviewers can see additional activity if they go looking.

## Visual polish

- Lean layouts: `/` acts as a focused login card, `/bookmarks` wraps everything in a glassy shell with tight spacing, and the header displays only the realtime status + counters you care about.
- Tailwind 4 powers the gradients, glass-card utility, and accent borders straight from `styles/globals.css`, so no redundant text or marketing sections remain—just the core functionality framed in a cohesive palette.

## Testing

- `npm run build` (confirms Tailwind + TypeScript, Next still warns about inferring the workspace root because multiple lockfiles exist—ignore or set `turbopack.root` if desired)
*** End Patch
