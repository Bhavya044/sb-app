"use client";

type StatsPanelProps = {
  bookmarkCount: number;
  latestTitle?: string;
  lastSyncedLabel: string;
  networkStatusLabel: string;
  authenticated: boolean;
  userEmail?: string | null;
};

export default function StatsPanel({
  bookmarkCount,
  latestTitle,
  lastSyncedLabel,
  networkStatusLabel,
  authenticated,
  userEmail,
}: StatsPanelProps) {
  return (
    <header className="rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-slate-950/60">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.45em] text-slate-400">Smart Bookmark App</p>
          <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">
            Purpose-built bookmark vault with Google-only auth and live sync.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Store private links, copy them for sharing, and watch every tab stay in sync thanks to Supabase Realtime.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-400">{networkStatusLabel}</p>
          <p className="text-xs text-slate-500">Last sync: {lastSyncedLabel}</p>
          {authenticated && userEmail ? <p className="text-xs text-slate-500">Logged in as {userEmail}</p> : null}
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">vault size</p>
          <p className="text-2xl font-semibold text-white">{bookmarkCount}</p>
          <p className="text-xs text-slate-500">Bookmarks remain keyed to your Google ID.</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">latest activity</p>
          <p className="text-2xl font-semibold text-white">{latestTitle ?? "Start saving links"}</p>
          <p className="text-xs text-slate-500">{latestTitle ? lastSyncedLabel : "No bookmarks yet"}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">session</p>
          <p className="text-2xl font-semibold text-white">{authenticated ? "Connected" : "Signed out"}</p>
          <p className="text-xs text-slate-500">Google OAuth only • {networkStatusLabel}</p>
        </div>
      </div>
    </header>
  );
}
