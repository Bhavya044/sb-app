"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { clsx } from "clsx";
import { supabase } from "@/lib/supabase-client";
import type { Database } from "@/lib/database.types";

type Bookmark = Database["public"]["Tables"]["bookmarks"]["Row"];

const timestampLabel = (value: string) => new Date(value).toLocaleString();

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState({ title: "", url: "" });
  const [error, setError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const userId = session?.user?.id;
  const userEmail = session?.user?.email;

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    const { data: listener } = supabase.auth.onAuthStateChange((_event, updatedSession) => {
      setSession(updatedSession);
    });

    init();

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setBookmarks([]);
      return;
    }

    const currentUserId = userId;

    setLoading(true);

    const fetchBookmarks = async () => {
      const { data, error: fetchError } = await supabase
        .from("bookmarks")
        .select("id, title, url, created_at")
        .match({ user_id: currentUserId })
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        const serverBookmarks = (data ?? []) as unknown as Bookmark[];
        setBookmarks(serverBookmarks);
      }
    };

    fetchBookmarks().finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`bookmarks-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setBookmarks((current) => {
            if (payload.eventType === "INSERT" && payload.new) {
              return [payload.new as Bookmark, ...current.filter((item) => item.id !== payload.new.id)];
            }

            if (payload.eventType === "UPDATE" && payload.new) {
              return current.map((bookmark) => (bookmark.id === payload.new.id ? (payload.new as Bookmark) : bookmark));
            }

            if (payload.eventType === "DELETE" && payload.old) {
              return current.filter((bookmark) => bookmark.id !== payload.old.id);
            }

            return current;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const updateField = (field: "title" | "url", value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) return;
    if (!formState.url.trim() || !formState.title.trim()) {
      setError("Both title and URL are required.");
      return;
    }

    setError(null);
    try {
      setMutatingId("adding");
      const newBookmark: Database["public"]["Tables"]["bookmarks"]["Insert"] = {
        user_id: userId,
        title: formState.title.trim(),
        url: formState.url.trim(),
      };

      await supabase.from("bookmarks").insert(newBookmark as any);
      setFormState({ title: "", url: "" });
    } catch (insertError) {
      setError((insertError as Error).message);
    } finally {
      setMutatingId(null);
    }
  };

  const handleDelete = async (bookmarkId: string) => {
    setMutatingId(bookmarkId);
    await supabase.from("bookmarks").delete().match({ id: bookmarkId });
    setMutatingId(null);
  };

  const isAuthenticated = Boolean(userId);

  const signIn = async () => {
    try {
      setAuthLoading(true);
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: typeof window === "undefined" ? undefined : window.location.origin },
      });
    } catch (signInError) {
      setError((signInError as Error).message);
    } finally {
      setAuthLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const bookmarkCount = bookmarks.length;
  const watermark = useMemo(() => (bookmarkCount ? `${bookmarkCount} saved` : "No bookmarks yet"), [bookmarkCount]);

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl shadow-slate-950/70">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.45em] text-slate-400">Smart Bookmark App</p>
            <h1 className="text-3xl font-semibold text-white md:text-4xl">Pick, save, and sync your favourite links.</h1>
            <p className="mt-2 max-w-2xl text-slate-300">
              We use Supabase (Postgres + Realtime) and Google-only authentication so that you can focus on the ideas behind the
              links, not passwords.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-400">{watermark}</p>
            {isAuthenticated && userEmail ? <p className="text-xs text-slate-500">Logged in as {userEmail}</p> : null}
          </div>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr,320px]">
        <section className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl shadow-slate-950/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.5em] text-slate-400">Bookmarks</p>
              <h2 className="text-xl font-semibold text-white">Your private list</h2>
            </div>
            {isAuthenticated ? (
              <button
                type="button"
                className="rounded-full border border-slate-700 px-4 py-1 text-sm font-medium text-slate-200 transition hover:border-slate-500"
                onClick={signOut}
              >
                Sign out
              </button>
            ) : (
              <button
                type="button"
                className="rounded-full border border-emerald-400/70 bg-emerald-500/10 px-4 py-1 text-sm font-medium text-emerald-300 transition hover:border-emerald-300"
                onClick={signIn}
                disabled={authLoading}
              >
                {authLoading ? "Opening Google" : "Continue with Google"}
              </button>
            )}
          </div>

          {error ? <p className="text-xs text-rose-400">{error}</p> : null}

          <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
            <form className="space-y-3" onSubmit={handleAdd}>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500" htmlFor="title">
                  Title
                </label>
                <input
                  id="title"
                  placeholder="What is the link about?"
                  value={formState.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-white/5 bg-transparent px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500" htmlFor="url">
                  URL
                </label>
                <input
                  id="url"
                  placeholder="https://..."
                  value={formState.url}
                  onChange={(event) => updateField("url", event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-white/5 bg-transparent px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className={clsx(
                  "w-full rounded-2xl py-2 text-sm font-semibold text-white transition",
                  isAuthenticated ? "bg-emerald-500/90 hover:bg-emerald-400" : "bg-slate-700/90 text-slate-300"
                )}
                disabled={!isAuthenticated || mutatingId === "adding"}
              >
                {mutatingId === "adding" ? "Saving…" : "Add bookmark"}
              </button>
            </form>
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">Loading bookmarks…</p>
            ) : bookmarks.length === 0 ? (
              <p className="text-sm text-slate-500">No bookmarks yet. Add one!</p>
            ) : (
              <ul className="space-y-3">
                {bookmarks.map((bookmark) => (
                  <li
                    key={bookmark.id}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-white/5 bg-slate-950/50 p-4 text-sm"
                  >
                    <div className="space-y-1">
                      <p className="text-white break-words">{bookmark.title}</p>
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300"
                      >
                        {bookmark.url}
                      </a>
                      <p className="text-[10px] uppercase tracking-[0.45em] text-slate-500">
                        {timestampLabel(bookmark.created_at)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(bookmark.id)}
                      className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-400"
                      disabled={mutatingId === bookmark.id}
                    >
                      {mutatingId === bookmark.id ? "Deleting" : "Delete"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="space-y-4 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-6 shadow-2xl shadow-slate-950/40">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.5em] text-slate-400">Flow</p>
            <h3 className="text-lg font-semibold text-white">What happens behind the scenes?</h3>
            <p className="text-sm text-slate-300">
              Google Auth handles sign-in, Supabase RLS keeps every row private, and the realtime channel pushes inserts/deletes to every tab.
            </p>
          </div>
          <div className="space-y-2 rounded-2xl border border-white/5 bg-slate-950/60 p-4 text-xs text-slate-300">
            <p className="font-semibold text-white">Quick setup</p>
            <ul className="space-y-2">
              <li>1. Create Supabase project + enable Google provider.</li>
              <li>2. Create <code className="rounded bg-slate-800 px-1 py-0.5 text-[11px]">bookmarks</code> table (user_id, title, url, created_at).</li>
              <li>3. Add environment variables (see README).</li>
              <li>4. Deploy to Vercel with the same env vars.</li>
            </ul>
          </div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-slate-500">
            Data never leaves Supabase unless you intentionally expose it.
          </p>
        </aside>
      </div>
    </section>
  );
}
