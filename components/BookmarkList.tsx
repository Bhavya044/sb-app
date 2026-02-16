"use client";

import { clsx } from "clsx";
import type { Bookmark } from "@/lib/bookmark.types";
import { formatTimestamp, relativeTime } from "@/lib/time";

type BookmarkListProps = {
  bookmarks: Bookmark[];
  loading: boolean;
  onDelete: (id: string) => void;
  onCopy: (url: string, id: string) => void;
  deletingId: string | null;
  copyingId: string | null;
  clipboardSupported: boolean;
};

const skeletons = Array.from({ length: 3 });

const getDomainLabel = (value: string) => {
  try {
    return new URL(value).hostname.replace(/^www\\./, "");
  } catch {
    return value;
  }
};

export default function BookmarkList({
  bookmarks,
  loading,
  onDelete,
  onCopy,
  deletingId,
  copyingId,
  clipboardSupported,
}: BookmarkListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {skeletons.map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-900/60" />
        ))}
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return <p className="text-sm text-slate-400">No bookmarks yet – add one to get started.</p>;
  }

  return (
    <ul className="space-y-3">
      {bookmarks.map((bookmark) => (
        <li key={bookmark.id} className="flex items-start justify-between gap-4 rounded-2xl border border-white/5 bg-slate-950/60 p-4 shadow-inner shadow-slate-950/50">
          <div className="space-y-1">
            <p className="text-base font-semibold text-white sm:text-lg">{bookmark.title}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.35em] text-emerald-300">
              <span className="rounded-full border border-emerald-500/40 px-2 py-0.5 text-[10px]">{getDomainLabel(bookmark.url)}</span>
              <span className="text-slate-500">{formatTimestamp(bookmark.created_at)}</span>
            </div>
            <a href={bookmark.url} target="_blank" rel="noreferrer" className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300">
              {bookmark.url}
            </a>
            <p className="text-[10px] uppercase tracking-[0.4em] text-slate-500">{relativeTime(bookmark.created_at)}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              disabled={copyingId === bookmark.id || !clipboardSupported}
              onClick={() => clipboardSupported && onCopy(bookmark.url, bookmark.id)}
              className={clsx(
                "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] transition",
                copyingId === bookmark.id
                  ? "border-emerald-400 text-emerald-200"
                  : clipboardSupported
                  ? "border-emerald-400 text-emerald-200 hover:border-emerald-300"
                  : "border-slate-700 text-slate-500"
              )}
            >
              {copyingId === bookmark.id ? "Copying" : "Copy link"}
            </button>
            <button
              type="button"
              disabled={deletingId === bookmark.id}
              onClick={() => onDelete(bookmark.id)}
              className={clsx(
                "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] transition",
                deletingId === bookmark.id ? "border-rose-500/60 text-rose-200" : "border-rose-400 text-rose-400 hover:border-rose-300"
              )}
            >
              {deletingId === bookmark.id ? "Deleting" : "Delete"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
