"use client";

import { supabase } from "@/lib/supabase-client";
import { formatTimestamp, relativeTime } from "@/lib/time";
import { useBookmarkStore } from "@/hooks/use-bookmark-store";
import { useSession } from "@/hooks/use-session";

export default function InsightsPage() {
  const session = useSession();
  const userId = session?.user?.id;
  const userEmail = session?.user?.email;
  const { bookmarks, loading, realtimeConnected, lastSyncedAt } = useBookmarkStore(userId);

  const topDomains = Object.entries(
    bookmarks.reduce<Record<string, number>>((acc, bookmark) => {
      try {
        const hostname = new URL(bookmark.url).hostname.replace(/^www\\./, "");
        acc[hostname] = (acc[hostname] ?? 0) + 1;
      } catch {
        acc.Other = (acc.Other ?? 0) + 1;
      }
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const timeline = bookmarks.slice(0, 5);
  const lastSyncedLabel = lastSyncedAt
    ? `${relativeTime(lastSyncedAt)} • ${formatTimestamp(lastSyncedAt)}`
    : "Waiting for first sync";

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: typeof window === "undefined" ? undefined : window.location.origin },
    });
  };

  if (!userId) {
    return (
      <section className="rounded-3xl border border-white/5 bg-slate-950/70 p-6 text-center shadow-xl shadow-slate-950/60">
        <p className="text-sm text-slate-300">
          Sign in on the home page to unlock insights about your saved bookmarks.
        </p>
        <button
          type="button"
          className="mt-4 rounded-2xl border border-emerald-400/70 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300"
          onClick={signIn}
        >
          Continue with Google
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/60">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Insights</p>
          <h1 className="text-3xl font-semibold text-white">Understand bookmarking habits</h1>
          <p className="text-sm text-slate-300">
            {userEmail ? `Logged in as ${userEmail}` : "Please sign in to unlock insights."}
          </p>
          <p className="text-xs text-slate-500">
            Realtime: {realtimeConnected ? "Ready" : "Initializing"} • Last sync: {lastSyncedLabel}
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <div className="space-y-6 rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-xl shadow-slate-950/40">
          <div>
            <h2 className="text-lg font-semibold text-white">Top domains</h2>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Most visited sources</p>
          </div>
          {loading ? (
            <div className="space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-900/60" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-900/60" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-900/60" />
            </div>
          ) : topDomains.length === 0 ? (
            <p className="text-sm text-slate-400">Save a bookmark to see domain stats.</p>
          ) : (
            <ol className="space-y-2">
              {topDomains.map(([domain, count]) => (
                <li key={domain} className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/50 px-4 py-2 text-sm text-slate-200">
                  <span className="font-semibold text-white">{domain}</span>
                  <span className="text-xs uppercase tracking-[0.35em] text-emerald-300">{count} link{count === 1 ? "" : "s"}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <aside className="space-y-4 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-6 shadow-2xl shadow-slate-950/40 text-xs text-slate-300">
          <p className="font-semibold text-white">Insights are live</p>
          <p>Realtime updates keep this page in sync with your other tabs.</p>
          <ul className="space-y-1">
            <li>• {bookmarks.length} private bookmark{bookmarks.length === 1 ? "" : "s"} stored.</li>
            <li>• Last sync: {lastSyncedLabel}</li>
            <li>• Real-time: {realtimeConnected ? "enabled" : "in progress"}</li>
          </ul>
        </aside>
      </div>

      <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-xl shadow-slate-950/40">
        <div>
          <h2 className="text-lg font-semibold text-white">Recent activity</h2>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Last five saves</p>
        </div>
        {timeline.length === 0 ? (
          <p className="text-sm text-slate-400">Start saving bookmarks to populate the timeline.</p>
        ) : (
          <ul className="space-y-3">
            {timeline.map((bookmark) => (
              <li key={bookmark.id} className="space-y-1 rounded-2xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm text-slate-200">
                <p className="font-semibold text-white">{bookmark.title}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">{bookmark.url}</p>
                <p className="text-[10px] uppercase tracking-[0.4em] text-slate-500">
                  Saved {relativeTime(bookmark.created_at)} • {formatTimestamp(bookmark.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
