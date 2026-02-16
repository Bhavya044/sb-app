"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { clsx } from "clsx";
import { supabase } from "@/lib/supabase-client";
import type { Database } from "@/lib/database.types";

type Bookmark = Database["public"]["Tables"]["bookmarks"]["Row"];
type ToastVariant = "success" | "error";
type ToastState = { variant: ToastVariant; message: string };

const TOAST_DURATION = 3200;

const timestampLabel = (value: string) =>
  new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

const relativeTimestamp = (value: string) => {
  const delta = Date.now() - new Date(value).getTime();
  if (delta < 60_000) {
    return "moments ago";
  }
  if (delta < 3_600_000) {
    return `${Math.round(delta / 60_000)} minute${Math.round(delta / 60_000) === 1 ? "" : "s"} ago`;
  }
  if (delta < 86_400_000) {
    return `${Math.round(delta / 3_600_000)} hour${Math.round(delta / 3_600_000) === 1 ? "" : "s"} ago`;
  }
  return `${Math.round(delta / 86_400_000)} day${Math.round(delta / 86_400_000) === 1 ? "" : "s"} ago`;
};

const getDomainLabel = (value: string) => {
  try {
    const domain = new URL(value).hostname.replace(/^www\./, "");
    return domain;
  } catch {
    return value;
  }
};

const isValidBookmarkUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (!/^https?:\/\//i.test(trimmed)) return false;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const emptySkeleton = Array.from({ length: 3 });

type BookmarkItemProps = {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
  onCopy: () => void;
  deleting: boolean;
  copying: boolean;
  clipboardAvailable: boolean;
};

function BookmarkItem({ bookmark, onDelete, onCopy, deleting, copying, clipboardAvailable }: BookmarkItemProps) {
  const domain = getDomainLabel(bookmark.url);

  return (
    <li className="flex items-start justify-between gap-4 rounded-2xl border border-white/5 bg-slate-950/60 p-4 text-sm shadow-inner shadow-slate-950/50">
      <div className="space-y-1">
        <p className="text-base font-semibold text-white sm:text-lg">{bookmark.title}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.4em] text-emerald-300">
          <span className="rounded-full border border-emerald-500/40 px-2 py-0.5 text-[10px]">{domain}</span>
          <span className="text-slate-500">{timestampLabel(bookmark.created_at)}</span>
        </div>
        <a
          href={bookmark.url}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300"
        >
          {bookmark.url}
        </a>
      </div>
      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          disabled={copying || !clipboardAvailable}
          onClick={clipboardAvailable ? onCopy : undefined}
          className={clsx(
            "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] transition",
            copying
              ? "border-emerald-400 text-emerald-200"
              : clipboardAvailable
              ? "border-emerald-400 text-emerald-200 hover:border-emerald-300"
              : "border-slate-700 text-slate-500"
          )}
        >
          {copying ? "Copying" : "Copy link"}
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={() => onDelete(bookmark.id)}
          className={clsx(
            "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] transition",
            deleting
              ? "border-rose-500/60 text-rose-200"
              : "border-rose-400 text-rose-400 hover:border-rose-300"
          )}
        >
          {deleting ? "Deleting" : "Delete"}
        </button>
      </div>
    </li>
  );
}

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState({ title: "", url: "" });
  const [error, setError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [clipboardSupported, setClipboardSupported] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const userId = session?.user?.id;
  const userEmail = session?.user?.email;

  const bookmarkCount = bookmarks.length;
  const latestBookmark = bookmarks[0];
  const lastSyncedLabel = lastSyncedAt
    ? `${relativeTimestamp(lastSyncedAt)} • ${timestampLabel(lastSyncedAt)}`
    : "Waiting for first sync";

  const isFormValid = Boolean(formState.title.trim() && formState.url.trim() && isValidBookmarkUrl(formState.url));
  const networkStatusLabel = realtimeConnected ? "Realtime ready" : "Realtime warming up";

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setClipboardSupported(Boolean(navigator.clipboard?.writeText));
    }
  }, []);

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
      setLastSyncedAt(null);
      setLoading(false);
      setRealtimeConnected(false);
      return;
    }

    setLoading(true);

    const loadBookmarks = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("bookmarks")
          .select("id, title, url, created_at")
          .match({ user_id: userId })
          .order("created_at", { ascending: false });

        if (fetchError) {
          setError(fetchError.message);
          return;
        }

        setBookmarks((data ?? []) as Bookmark[]);
        setLastSyncedAt(new Date().toISOString());
        setError(null);
      } catch (fetchError) {
        setError((fetchError as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();
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
              setLastSyncedAt(new Date().toISOString());
              return [payload.new as Bookmark, ...current.filter((item) => item.id !== payload.new.id)];
            }

            if (payload.eventType === "UPDATE" && payload.new) {
              setLastSyncedAt(new Date().toISOString());
              return current.map((bookmark) => (bookmark.id === payload.new.id ? (payload.new as Bookmark) : bookmark));
            }

            if (payload.eventType === "DELETE" && payload.old) {
              setLastSyncedAt(new Date().toISOString());
              return current.filter((bookmark) => bookmark.id !== payload.old.id);
            }

            return current;
          });
        }
      )
      .subscribe();

    setRealtimeConnected(true);

    return () => {
      supabase.removeChannel(channel);
      setRealtimeConnected(false);
    };
  }, [userId]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), TOAST_DURATION);
    return () => clearTimeout(timeout);
  }, [toast]);

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

    if (!isValidBookmarkUrl(formState.url)) {
      setError("Please include the https:// or http:// prefix.");
      return;
    }

    setError(null);
    setMutatingId("adding");

    try {
      const newBookmark = {
        user_id: userId,
        title: formState.title.trim(),
        url: formState.url.trim(),
      };

      const { error: insertError } = await supabase.from("bookmarks").insert(newBookmark as any);
      if (insertError) throw insertError;

      setFormState({ title: "", url: "" });
      setToast({ variant: "success", message: "Saved to your private vault." });
      setLastSyncedAt(new Date().toISOString());
    } catch (insertError) {
      const message = (insertError as Error).message;
      setError(message);
      setToast({ variant: "error", message: "Could not save right now." });
    } finally {
      setMutatingId(null);
    }
  };

  const handleDelete = async (bookmarkId: string) => {
    setMutatingId(bookmarkId);

    try {
      const { error: deleteError } = await supabase.from("bookmarks").delete().match({ id: bookmarkId });
      if (deleteError) throw deleteError;

      setToast({ variant: "success", message: "Bookmark deleted." });
      setLastSyncedAt(new Date().toISOString());
    } catch (deleteError) {
      setError((deleteError as Error).message);
      setToast({ variant: "error", message: "Unable to delete right now." });
    } finally {
      setMutatingId(null);
    }
  };

  const handleCopyLink = async (url: string, id: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
    setCopyingId(id);

    try {
      await navigator.clipboard.writeText(url);
      setToast({ variant: "success", message: "Bookmark URL copied." });
    } catch (copyError) {
      setToast({ variant: "error", message: "Clipboard unavailable." });
    } finally {
      setCopyingId(null);
    }
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

  return (
    <section className="space-y-8">
      <header className="rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-slate-950/60">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
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
            {isAuthenticated && userEmail ? (
              <p className="text-xs text-slate-500">Logged in as {userEmail}</p>
            ) : null}
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
            <p className="text-2xl font-semibold text-white">
              {latestBookmark ? latestBookmark.title : "Start saving links"}
            </p>
            <p className="text-xs text-slate-500">{latestBookmark ? timestampLabel(latestBookmark.created_at) : "No bookmarks yet"}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">session</p>
            <p className="text-2xl font-semibold text-white">{isAuthenticated ? "Connected" : "Signed out"}</p>
            <p className="text-xs text-slate-500">Google OAuth only • {networkStatusLabel}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <section className="space-y-4 rounded-3xl border border-white/5 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/50">
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

          {error ? (
            <p role="alert" className="text-xs text-rose-400">
              {error}
            </p>
          ) : null}

          <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
            <form className="space-y-3" onSubmit={handleAdd}>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500" htmlFor="title">
                  Title
                </label>
                <input
                  id="title"
                  placeholder="Describe the page"
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
                  placeholder="https://example.com"
                  value={formState.url}
                  onChange={(event) => updateField("url", event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-white/5 bg-transparent px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                />
                {!isValidBookmarkUrl(formState.url) && formState.url ? (
                  <p className="mt-1 text-[10px] uppercase tracking-[0.4em] text-emerald-300">
                    Include http:// or https:// so we can render the preview safely.
                  </p>
                ) : null}
              </div>
              <button
                type="submit"
                className={clsx(
                  "flex w-full items-center justify-center rounded-2xl py-2 text-sm font-semibold text-white transition",
                  isAuthenticated && isFormValid
                    ? "bg-emerald-500/90 hover:bg-emerald-400"
                    : "bg-slate-700/90 text-slate-300"
                )}
                disabled={!isAuthenticated || mutatingId === "adding" || !isFormValid}
              >
                {mutatingId === "adding" ? "Saving…" : "Add bookmark"}
              </button>
            </form>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {emptySkeleton.map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-900/60" />
                ))}
              </div>
            ) : bookmarks.length === 0 ? (
              <p className="text-sm text-slate-400">No bookmarks yet – add one to get started.</p>
            ) : (
              <ul className="space-y-3">
                {bookmarks.map((bookmark) => (
                  <BookmarkItem
                    key={bookmark.id}
                    bookmark={bookmark}
                    onDelete={handleDelete}
                    onCopy={() => handleCopyLink(bookmark.url, bookmark.id)}
                    deleting={mutatingId === bookmark.id}
                    copying={copyingId === bookmark.id}
                    clipboardAvailable={clipboardSupported}
                  />
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
              Google Auth handles sign-in, Supabase RLS keeps every row private, and a realtime channel pushes inserts/deletes to every tab.
            </p>
          </div>
          <div className="space-y-2 rounded-2xl border border-white/5 bg-slate-950/60 p-4 text-xs text-slate-300">
            <p className="font-semibold text-white">Operational stats</p>
            <ul className="space-y-1">
              <li>• {bookmarkCount} private bookmark{bookmarkCount === 1 ? "" : "s"} stored.</li>
              <li>• {lastSyncedLabel}</li>
              <li>• Real-time updates: {realtimeConnected ? "enabled" : "initializing"}.</li>
            </ul>
          </div>
          <div className="space-y-2 rounded-2xl border border-white/5 bg-slate-950/70 p-4 text-xs text-slate-300">
            <p className="font-semibold text-white">Quick setup</p>
            <ul className="space-y-2">
              <li>1. Create Supabase project + enable Google provider.</li>
              <li>2. Create <code className="rounded bg-slate-800 px-1 py-0.5 text-[11px]">bookmarks</code> table (user_id, title, url, created_at).</li>
              <li>3. Add environment variables (see README).</li>
              <li>4. Deploy to Vercel and use the same env vars.</li>
            </ul>
          </div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-slate-500">Data never leaves Supabase unless you intentionally expose it.</p>
        </aside>
      </div>

      {toast ? (
        <div
          role="status"
          className={clsx(
            "fixed bottom-6 right-6 z-50 max-w-xs rounded-2xl border px-4 py-3 text-sm shadow-2xl shadow-slate-950/60",
            toast.variant === "success"
              ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-200"
              : "border-rose-400/50 bg-rose-500/10 text-rose-200"
          )}
        >
          {toast.message}
        </div>
      ) : null}
    </section>
  );
}
