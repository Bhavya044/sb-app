# Smart Bookmark Manager

Minimal private bookmark vault built with Next.js (App Router), Supabase Auth/Database/Realtime, and Tailwind CSS. Bookmarks stay tied to the authenticated Google user, and every open tab reflects inserts/deletes instantly thanks to Supabase Realtime streams.

## Highlights

- **Google-only auth**: Supabase OAuth keeps authentication simple—no passwords, multi-factor, or custom auth flows.
- **Private data**: Supabase RLS + `user_id` filters ensure only the owning Google user can insert, read, update, or delete their own bookmarks.
- **Realtime, production-ready UI**: A stats header, toast notifications, clipboard copy buttons, input validation, and ambient gradients turn the micro-challenge into a ready-to-ship experience.
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

## Deployment

1. Push to GitHub (public repo as requested).
2. Connect the repository to Vercel and set the same `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars.
3. On Vercel, keep the default App Router build target and deploy.
4. Share the live URL plus the public repo link in the submission form so the team can log in with their own Google account.

## Production-readiness

- **Detailed stats**: A header panel surfaces bookmark count, the most recent entry, and session state so the user can verify the vault quickly.
- **Toast + clipboard support**: Every save/delete/copy emits a transient toast, and each bookmark row exposes a `Copy link` button (with clipboard detection and disabling when unsupported).
- **Validation + error paths**: The form rejects photo URLs without http(s), surfaces inline errors, and logs fetch/insert/delete errors in the UI.
- **Realtime + sync telemetry**: Supabase realtime subscriptions keep tabs in sync, and the sidebar displays the last sync time plus realtime readiness.

## Testing

- `npm run build` (verifies Tailwind + TypeScript, ensures there are no runtime type regressions)

## Problems I ran into

- **External networking** was blocked in the sandbox, so the repo captures `package.json` / `package-lock.json` but you must run `npm install` locally before launching.
- **Supabase Realtime guard rails** required filtering every channel subscription by `user_id`, otherwise different users would see each other's bookmarks. The channel is scoped to `bookmarks-${userId}` and every query filters by `user_id`.

## What to verify

- Sign in with Google, add/delete bookmarks, and confirm the stats update + toast appears.
- Open a second tab to ensure realtime inserts/deletes arrive instantly.
- Copy a bookmark link to verify clipboard support and confirm items remain private between different Google accounts.
*** End Patch
