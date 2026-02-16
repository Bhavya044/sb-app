"use client";

import { useEffect, useRef } from "react";
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
  onVisibleEnd?: () => void;
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
  onVisibleEnd,
}: BookmarkListProps) {
  const lastItemRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    if (!onVisibleEnd || bookmarks.length === 0) {
      return;
    }

    const element = lastItemRef.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onVisibleEnd();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [bookmarks.length, onVisibleEnd]);
  if (loading) {
    return (
      <div className="space-y-3">
        {skeletons.map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-[32px] bg-gradient-to-r from-slate-900/60 to-slate-900/20"
          />
        ))}
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No bookmarks yet — start adding your favorite links to see them appear here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {bookmarks.map((bookmark, index) => (
        <article
          key={bookmark.id}
          ref={index === bookmarks.length - 1 ? lastItemRef : undefined}
          className="border border-white/10 bg-white/5 p-4 shadow-[0_20px_45px_rgba(7,7,11,0.45)] backdrop-blur-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-white sm:text-xl">{bookmark.title}</p>
              <p className="text-sm text-slate-400">{getDomainLabel(bookmark.url)}</p>
            </div>
            <div className="flex gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              <span>{relativeTime(bookmark.created_at)}</span>
              <span>{formatTimestamp(bookmark.created_at)}</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 min-w-0 text-emerald-300 underline-offset-4 hover:underline sm:text-sm"
            >
              <span className="block break-words text-xs sm:text-sm">{bookmark.url}</span>
            </a>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={copyingId === bookmark.id || !clipboardSupported}
                onClick={() => clipboardSupported && onCopy(bookmark.url, bookmark.id)}
                className={clsx(
                  "rounded-full border px-4 py-1 text-xs font-semibold transition",
                  copyingId === bookmark.id
                    ? "border-emerald-300 text-emerald-200"
                    : clipboardSupported
                    ? "border-emerald-300 text-white hover:border-emerald-200"
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
                  "rounded-full border px-4 py-1 text-xs font-semibold transition",
                  deletingId === bookmark.id
                    ? "border-rose-500/60 text-rose-200"
                    : "border-rose-400 text-rose-200 hover:border-rose-300"
                )}
              >
                {deletingId === bookmark.id ? "Deleting" : "Delete"}
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
