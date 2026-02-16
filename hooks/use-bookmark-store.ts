"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import type { Bookmark, BookmarkCreate } from "@/lib/bookmark.types";

type UseBookmarkStoreResult = {
  bookmarks: Bookmark[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  realtimeConnected: boolean;
  lastSyncedAt: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  insertBookmark: (bookmark: BookmarkCreate) => Promise<void>;
  deleteBookmark: (bookmarkId: string) => Promise<void>;
};

export function useBookmarkStore(userId?: string | null, pageSize = 3): UseBookmarkStoreResult {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const fetchBookmarks = useCallback(
    async ({ page: targetPage = 0, append = false }: { page?: number; append?: boolean } = {}) => {
      if (!userId) {
        setBookmarks([]);
        setLoading(false);
        setLoadingMore(false);
        setError(null);
        setLastSyncedAt(null);
        setPage(0);
        setHasMore(false);
        return;
      }

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const start = targetPage * pageSize;
      const end = start + pageSize - 1;
      const { data, error: fetchError } = await supabase
        .from("bookmarks")
        .select("id, title, url, created_at")
        .match({ user_id: userId })
        .order("created_at", { ascending: false })
        .range(start, end);

      if (fetchError) {
        setError(fetchError.message);
        if (!append) {
          setBookmarks([]);
        }
      } else {
        const payload = (data ?? []) as Bookmark[];
        if (append) {
          setBookmarks((current) => {
            const existingIds = new Set(current.map((item) => item.id));
            const newEntries = payload.filter((item) => !existingIds.has(item.id));
            return [...current, ...newEntries];
          });
        } else {
          setBookmarks(payload);
        }
        setError(null);
      }

      setHasMore((data ?? []).length === pageSize);
      setPage(targetPage);
      setLastSyncedAt(new Date().toISOString());
      setLoading(false);
      setLoadingMore(false);
    },
    [pageSize, userId]
  );

  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) {
        fetchBookmarks();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [fetchBookmarks]);

  const refresh = useCallback(async () => {
    await fetchBookmarks({ page: 0, append: false });
  }, [fetchBookmarks]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    await fetchBookmarks({ page: page + 1, append: true });
  }, [fetchBookmarks, hasMore, loading, loadingMore, page]);

  useEffect(() => {
    if (!userId) {
      queueMicrotask(() => setRealtimeConnected(false));
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
        async () => {
          setLastSyncedAt(new Date().toISOString());
          await refresh();
        }
      )
      .subscribe();

    queueMicrotask(() => setRealtimeConnected(true));

    return () => {
      supabase.removeChannel(channel);
      queueMicrotask(() => setRealtimeConnected(false));
    };
  }, [userId, refresh]);

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

  return {
    bookmarks,
    loading,
    loadingMore,
    hasMore,
    error,
    realtimeConnected,
    lastSyncedAt,
    refresh,
    loadMore,
    insertBookmark,
    deleteBookmark,
  };
}
