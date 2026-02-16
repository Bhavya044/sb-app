"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import type { BookmarkCreate } from "@/lib/bookmark.types";
import { formatTimestamp, relativeTime } from "@/lib/time";
import BookmarkForm from "@/components/BookmarkForm";
import BookmarkList from "@/components/BookmarkList";
import StatsPanel from "@/components/StatsPanel";
import Toast from "@/components/Toast";
import { useBookmarkStore } from "@/hooks/use-bookmark-store";
import { useSession } from "@/hooks/use-session";

type ToastVariant = "success" | "error";
type ToastState = { variant: ToastVariant; message: string };

const isValidBookmarkUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const pattern = /^https?:\/\//i;
  if (!pattern.test(trimmed)) return false;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export default function HomePage() {
  const session = useSession();
  const userId = session?.user?.id;
  const userEmail = session?.user?.email;
  const {
    bookmarks,
    loading,
    error: storeError,
    realtimeConnected,
    lastSyncedAt,
    insertBookmark,
    deleteBookmark,
  } = useBookmarkStore(userId);

  const [formState, setFormState] = useState({ title: "", url: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [clipboardSupported, setClipboardSupported] = useState(false);

  const isFormValid =
    Boolean(formState.title.trim() && formState.url.trim()) && isValidBookmarkUrl(formState.url);
  const lastSyncedLabel = lastSyncedAt
    ? `${relativeTime(lastSyncedAt)} • ${formatTimestamp(lastSyncedAt)}`
    : "Waiting for first sync";
  const networkStatusLabel = realtimeConnected ? "Realtime ready" : "Realtime warming up";
  const latestBookmark = bookmarks[0];
  const showUrlHint = Boolean(formState.url && !isValidBookmarkUrl(formState.url));
  const errorMessage = formError ?? storeError;

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setClipboardSupported(Boolean(navigator.clipboard?.writeText));
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const updateField = (field: "title" | "url", value: string) =>
    setFormState((prev) => ({ ...prev, [field]: value }));

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) {
      setFormError("Please sign in with Google to save bookmarks.");
      return;
    }

    if (!formState.title.trim() || !formState.url.trim()) {
      setFormError("Both title and URL are required.");
      return;
    }

    if (!isValidBookmarkUrl(formState.url)) {
      setFormError("Please include the https:// or http:// prefix.");
      return;
    }

    setFormError(null);
    setMutatingId("adding");

    const payload: BookmarkCreate = {
      title: formState.title.trim(),
      url: formState.url.trim(),
    };

    try {
      await insertBookmark(payload);
      setFormState({ title: "", url: "" });
      setToast({ variant: "success", message: "Saved to your private vault." });
    } catch (insertError) {
      setFormError((insertError as Error).message);
      setToast({ variant: "error", message: "Could not save right now." });
    } finally {
      setMutatingId(null);
    }
  };

  const handleDelete = async (bookmarkId: string) => {
    setMutatingId(bookmarkId);
    try {
      await deleteBookmark(bookmarkId);
      setToast({ variant: "success", message: "Bookmark deleted." });
    } catch (deleteError) {
      setFormError((deleteError as Error).message);
      setToast({ variant: "error", message: "Unable to delete right now." });
    } finally {
      setMutatingId(null);
    }
  };

  const handleCopy = async (url: string, id: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
    setCopyingId(id);
    try {
      await navigator.clipboard.writeText(url);
      setToast({ variant: "success", message: "Bookmark URL copied." });
    } catch {
      setToast({ variant: "error", message: "Clipboard unavailable." });
    } finally {
      setCopyingId(null);
    }
  };

  const signIn = async () => {
    try {
      setAuthLoading(true);
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: typeof window === "undefined" ? undefined : window.location.origin },
      });
    } catch (signInError) {
      setFormError((signInError as Error).message);
    } finally {
      setAuthLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isAuthenticated = Boolean(userId);

  return (
    <section className="space-y-8">
      <StatsPanel
        bookmarkCount={bookmarks.length}
        latestTitle={latestBookmark?.title}
        lastSyncedLabel={lastSyncedLabel}
        networkStatusLabel={networkStatusLabel}
        authenticated={isAuthenticated}
        userEmail={userEmail}
      />

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

          {errorMessage ? (
            <p role="alert" className="text-xs text-rose-400">
              {errorMessage}
            </p>
          ) : null}

          <BookmarkForm
            title={formState.title}
            url={formState.url}
            onChange={updateField}
            onSubmit={handleAdd}
            isValid={isFormValid}
            isSubmitting={mutatingId === "adding"}
            disabled={!isAuthenticated}
            showUrlHint={showUrlHint}
          />

          <BookmarkList
            bookmarks={bookmarks}
            loading={loading}
            onDelete={handleDelete}
            onCopy={handleCopy}
            deletingId={mutatingId}
            copyingId={copyingId}
            clipboardSupported={clipboardSupported}
          />
        </section>

        <aside className="space-y-4 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-6 shadow-2xl shadow-slate-950/40">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.5em] text-slate-400">Flow</p>
            <h3 className="text-lg font-semibold text-white">What happens behind the scenes?</h3>
            <p className="text-sm text-slate-300">
              Google Auth + OAuth 2.0 handles sign-in, Supabase RLS keeps every row private, and a realtime channel pushes inserts/deletes to every tab.
            </p>
          </div>
          <div className="space-y-2 rounded-2xl border border-white/5 bg-slate-950/60 p-4 text-xs text-slate-300">
            <p className="font-semibold text-white">Operational stats</p>
            <ul className="space-y-1">
              <li>• {bookmarks.length} private bookmark{bookmarks.length === 1 ? "" : "s"} stored.</li>
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

      {toast ? <Toast message={toast.message} variant={toast.variant} /> : null}
    </section>
  );
}
