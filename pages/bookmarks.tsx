"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabase-client";
import type { BookmarkCreate } from "@/lib/bookmark.types";
import BookmarkForm from "@/components/BookmarkForm";
import BookmarkList from "@/components/BookmarkList";
import Toast from "@/components/Toast";
import { useBookmarkStore } from "@/hooks/use-bookmark-store";
import { useSession } from "@/hooks/use-session";
import { formatTimestamp, relativeTime } from "@/lib/time";

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

export default function BookmarksPage() {
  const router = useRouter();
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

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setClipboardSupported(Boolean(navigator.clipboard?.writeText));
    }
  }, []);

  useEffect(() => {
    if (session === undefined) return;
    if (!session) {
      router.replace("/");
    }
  }, [session, router]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const isFormValid =
    Boolean(formState.title.trim() && formState.url.trim()) && isValidBookmarkUrl(formState.url);
  const lastSyncedLabel = lastSyncedAt
    ? `${relativeTime(lastSyncedAt)} • ${formatTimestamp(lastSyncedAt)}`
    : "Waiting for first sync";
  const networkStatusLabel = realtimeConnected ? "Realtime ready" : "Realtime warming up";
  const showUrlHint = Boolean(formState.url && !isValidBookmarkUrl(formState.url));
  const errorMessage = formError ?? storeError;

  const updateField = (field: "title" | "url", value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) {
      setFormError("Please sign in first.");
      return;
    }

    if (!formState.title.trim() || !formState.url.trim()) {
      setFormError("Both title and URL are required.");
      return;
    }

    if (!isValidBookmarkUrl(formState.url)) {
      setFormError("Include http:// or https:// in the URL.");
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
      setToast({ variant: "success", message: "Saved." });
    } catch (insertError) {
      setFormError((insertError as Error).message);
      setToast({ variant: "error", message: "Could not save." });
    } finally {
      setMutatingId(null);
    }
  };

  const handleDelete = async (bookmarkId: string) => {
    setMutatingId(bookmarkId);
    try {
      await deleteBookmark(bookmarkId);
      setToast({ variant: "success", message: "Deleted." });
    } catch (deleteError) {
      setFormError((deleteError as Error).message);
      setToast({ variant: "error", message: "Delete failed." });
    } finally {
      setMutatingId(null);
    }
  };

  const handleCopy = async (url: string, id: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
    setCopyingId(id);
    try {
      await navigator.clipboard.writeText(url);
      setToast({ variant: "success", message: "Copied." });
    } catch {
      setToast({ variant: "error", message: "Clipboard unavailable." });
    } finally {
      setCopyingId(null);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return null;
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/60">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-white">Bookmarks</h1>
          <div className="text-right text-[10px] uppercase tracking-[0.4em] text-slate-500">
            <p>{networkStatusLabel}</p>
            <p>Last sync: {lastSyncedLabel}</p>
            {userEmail ? <p className="text-xs text-slate-400">{userEmail}</p> : null}
          </div>
        </div>
      </header>

      <section className="space-y-4 rounded-3xl border border-white/5 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/50">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Your private list</h2>
          <button
            type="button"
            className="rounded-full border border-slate-700 px-4 py-1 text-sm font-medium text-slate-200 transition hover:border-slate-500"
            onClick={signOut}
          >
            Sign out
          </button>
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
          disabled={!userId}
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

      {toast ? <Toast message={toast.message} variant={toast.variant} /> : null}
    </section>
  );
}
