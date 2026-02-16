"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import type { Bookmark, BookmarkCreate } from "@/lib/bookmark.types";

type UseBookmarkStoreResult = {
  bookmarks: Bookmark[];
  loading: boolean;
  error: string | null;
  realtimeConnected: boolean;
  lastSyncedAt: string | null;
  refresh: () => Promise<void>;
  insertBookmark: (bookmark: BookmarkCreate) => Promise<void>;
  deleteBookmark: (bookmarkId: string) => Promise<void>;
};

export function useBookmarkStore(userId?: string | null): UseBookmarkStoreResult {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    if (!userId) {
      setBookmarks([]);
      setLoading(false);
      setError(null);
      setLastSyncedAt(null);
      return;
    }

    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("bookmarks")
      .select("id, title, url, created_at")
      .match({ user_id: userId })
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setBookmarks([]);
    } else {
      setBookmarks((data ?? []) as Bookmark[]);
      setError(null);
    }

    setLastSyncedAt(new Date().toISOString());
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  useEffect(() => {
    if (!userId) {
      setRealtimeConnected(false);
      return;
    }

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

  const insertBookmark = useCallback(
    async (bookmark: BookmarkCreate) => {
      if (!userId) {
        throw new Error("User must be signed in to add bookmarks.");
      }

      const payload = { user_id: userId, ...bookmark };
      const { error: insertError } = await supabase.from("bookmarks").insert(payload as any);
      if (insertError) throw insertError;
      setLastSyncedAt(new Date().toISOString());
    },
    [userId]
  );

  const deleteBookmark = useCallback(
    async (bookmarkId: string) => {
      if (!userId) {
        throw new Error("User must be signed in to delete bookmarks.");
      }

      const { error: deleteError } = await supabase.from("bookmarks").delete().match({ id: bookmarkId, user_id: userId });
      if (deleteError) throw deleteError;
      setLastSyncedAt(new Date().toISOString());
    },
    [userId]
  );

  const refresh = useCallback(async () => {
    await fetchBookmarks();
  }, [fetchBookmarks]);

  return {
    bookmarks,
    loading,
    error,
    realtimeConnected,
    lastSyncedAt,
    refresh,
    insertBookmark,
    deleteBookmark,
  };
}
