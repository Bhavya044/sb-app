"use client";

import type { RefObject } from "react";
import BookmarkCard from "@/components/BookmarkCard";
import type { Bookmark } from "@/lib/bookmark.types";

type BookmarkListProps = {
  bookmarks: Bookmark[];
  loading: boolean;
  onDelete: (id: string) => void;
  onCopy: (url: string, id: string) => void;
  deletingId: string | null;
  copyingId: string | null;
  clipboardSupported: boolean;
  endOfListRef?: RefObject<HTMLDivElement | null>;
};

const skeletons = Array.from({ length: 3 });

export default function BookmarkList({
  bookmarks,
  loading,
  onDelete,
  onCopy,
  deletingId,
  copyingId,
  clipboardSupported,
  endOfListRef,
}: BookmarkListProps) {
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
      <p className="text-sm text-slate-400">
        Save a bookmark and it will appear here in a jiffy.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {bookmarks.map((bookmark) => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          onCopy={onCopy}
          onDelete={onDelete}
          deletingId={deletingId}
          copyingId={copyingId}
          clipboardSupported={clipboardSupported}
        />
      ))}
      <div ref={endOfListRef} aria-hidden="true" className="h-px" />
    </div>
  );
}
