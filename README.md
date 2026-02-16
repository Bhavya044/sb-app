# Smart Bookmark Manager

A focused bookmark vault built with Next.js, Supabase (Auth + Database + Realtime), and expressive Tailwind UI. Sign in with Google and everything you save is scoped to your Supabase user and reflected instantly across tabs thanks to realtime streams and a responsive infinite scroll list.

## Highlights
- **Google-only auth** keeps onboarding trivial: the login page routes to `/bookmarks` as soon as Supabase reports a session, and the CTA has explicit loading states so you always know something is happening.
- **Realtime, per-user sync**: triggers broadcast on a `user:{user_id}:bookmarks` topic, and the client subscribes to insert/update/delete events so two tabs never fall out of sync.
- **Bookmarks list with infinite scroll**: the store loads three records at a time, tracks whether more pages exist, and the list watches a sentinel element so the next batch only loads when you actually scroll.
- **Polished navigation**: the header shows the “Welcome, …” text beside the logo, the nav actions live below the heading, and mobile screens get a drawer (without a persistent menu icon on desktop). Sign-out lives in the nav with a red button + spinner.
- **Shared styling**: `styles/globals.css` keeps the gradient background, glass-card utility, cursor behavior, and accent palette consistent; `vercel.json` rewrites the root to `/bookmarks` for smooth deploys.

## Setup steps
1. Clone the repo, run `npm install`, and create `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` that match your Supabase project.
2. Run `npm run dev` and visit `http://localhost:3000`; the GTM-like `GoogleButton`, form validation hints, and toast feedback should all appear without refresh.
3. Use the Supabase dashboard (or CLI) to push the migrations in `supabase/migrations/20260217000000_realtime_bookmarks.sql`, which enable RLS, add the realtime trigger, and broadcast on the user topic.

## Troubleshooting & what was solved
- **Realtime updates disappeared**: the bookmarks table wasn’t broadcasting. Running the new migration adds the trigger/trigger function that calls `realtime.broadcast_changes` per user topic, so the client’s `supabase.channel("user:<id>:bookmarks")` subscription receives the UPDATE/INSERT/DELETE events.
- **Infinite scroll never kicked in**: before the store tracked `hasMore` and the layout watched a sentinel (a hidden `<div>` at the end of the list), we fetched every page as soon as the component mounted. Now the list only loads the next page when the sentinel intersects the viewport, and `hasMore` flips to `false` whenever a page returns fewer than three rows.
- **CSP warnings in DevTools referencing `content.js`**: Chrome/Edge extensions may inject scripts and trigger `CSP` violations on `http://localhost:3000`. The app itself doesn’t run those scripts; ignore the warning or whitelist the extension for localhost, and make sure your production CSP matches the assets you actually host.
- **Sign-out/loading states**: the nav now shows a red “Sign out” button with spinner, and the “Continue with Google” CTA globally reuses `components/GoogleButton` so the spinner and disabled state never get duplicated.

## Supabase references
- Table SQL: `supabase/schema/bookmarks.sql` defines the columns and the initial RLS policy.
- Real-time SQL: run `supabase/migrations/20260217000000_realtime_bookmarks.sql` (or paste it into the SQL editor) to enable broadcasts, add explicit `SELECT/INSERT/UPDATE/DELETE` policies, and keep the `user:{user_id}:bookmarks` topic live for every authenticated session.

