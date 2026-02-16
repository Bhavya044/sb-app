"use client";

import { clsx } from "clsx";
import type { Bookmark } from "@/lib/bookmark.types";
import { formatTimestamp, relativeTime } from "@/lib/time";

type BookmarkCardProps = {
  bookmark: Bookmark;
  onCopy: (url: string, id: string) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  copyingId: string | null;
  clipboardSupported: boolean;
};

const getDomainLabel = (value: string) => {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
};

export default function BookmarkCard({
  bookmark,
  onCopy,
  onDelete,
  deletingId,
  copyingId,
  clipboardSupported,
}: BookmarkCardProps) {
  return (
    <article className="group flex flex-col gap-4 rounded-[28px] border border-white/5 bg-white/5 p-5 shadow-[0_25px_55px_rgba(3,3,10,0.55)] backdrop-blur-md transition hover:border-emerald-300/70 hover:shadow-[0_25px_60px_rgba(34,197,94,0.35)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-semibold text-white sm:text-xl">{bookmark.title}</p>
          <p className="truncate text-sm text-slate-400">{getDomainLabel(bookmark.url)}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">
          <span>{relativeTime(bookmark.created_at)}</span>
          <span>{formatTimestamp(bookmark.created_at)}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noreferrer"
          className="flex-1 min-w-0 text-sm text-emerald-300 underline-offset-4 transition hover:text-emerald-200 sm:text-base"
        >
          <span className="block break-words text-xs uppercase tracking-[0.3em] text-slate-400 sm:text-sm">{bookmark.url}</span>
        </a>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={copyingId === bookmark.id || !clipboardSupported}
            onClick={() => clipboardSupported && onCopy(bookmark.url, bookmark.id)}
            className={clsx("rounded-full border px-4 py-1 text-xs font-semibold transition", {
              "border-emerald-300 text-emerald-200": copyingId === bookmark.id,
              "border-emerald-300 text-white hover:border-emerald-200": clipboardSupported && copyingId !== bookmark.id,
              "border-slate-700 text-slate-500": !clipboardSupported,
            })}
          >
            {copyingId === bookmark.id ? "Copying" : "Copy"}
          </button>
          <button
            type="button"
            disabled={deletingId === bookmark.id}
            onClick={() => onDelete(bookmark.id)}
            className={clsx("rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] transition", {
              "border-rose-500/70 text-rose-200": deletingId === bookmark.id,
              "border-rose-400 text-rose-200 hover:border-rose-300": deletingId !== bookmark.id,
            })}
          >
            {deletingId === bookmark.id ? "Deleting" : "Delete"}
          </button>
        </div>
      </div>
    </article>
  );
}
