"use client";

import GoogleButton from "@/components/GoogleButton";
import { supabase } from "@/lib/supabase-client";
import { formatTimestamp, relativeTime } from "@/lib/time";
import { useBookmarkStore } from "@/hooks/use-bookmark-store";
import { useSession } from "@/hooks/use-session";
import { useState } from "react";

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

  const lastSyncedLabel = lastSyncedAt
    ? `${relativeTime(lastSyncedAt)} • ${formatTimestamp(lastSyncedAt)}`
    : "Waiting for first sync";

  const [loadingState, setLoadingState] = useState(false);

  const signIn = async () => {
    setLoadingState(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const redirectTo = "https://sb-app-six.vercel.app/bookmarks";
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
    } finally {
      setLoadingState(false);
    }
  };

  if (!userId) {
    return (
      <section className="rounded-3xl border border-white/5 bg-slate-950/70 p-6 text-center shadow-xl shadow-slate-950/60">
        <p className="text-sm text-slate-300">
          Sign in on the home page to unlock insights about your saved bookmarks.
        </p>
        <GoogleButton onClick={signIn} isLoading={loadingState}>
          <span className="tracking-[0.4em]">Continue with Google</span>
        </GoogleButton>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/60">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Domains</p>
          <h1 className="text-3xl font-semibold text-white">Top domains</h1>
          <p className="text-sm text-slate-300">
            {userEmail ? `Logged in as ${userEmail}` : "Please sign in to unlock insights."}
          </p>
          <p className="text-xs text-slate-500">
            Realtime: {realtimeConnected ? "Ready" : "Initializing"} • Last sync: {lastSyncedLabel}
          </p>
        </div>
      </header>

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
    </section>
  );
}
