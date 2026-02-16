"use client";

import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
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

const realtimeEvents = ["INSERT", "UPDATE", "DELETE"] as const;

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
        setHasMore(payload.length === pageSize);
      }

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

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    const initRealtime = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled || !data.session) {
        queueMicrotask(() => setRealtimeConnected(false));
        return;
      }

      const topic = `user:${userId}:bookmarks`;
      channel = supabase.channel(topic, { config: { broadcast: { self: true } } });

      realtimeEvents.forEach((event) => {
        channel?.on("broadcast", { event }, async () => {
          setLastSyncedAt(new Date().toISOString());
          try {
            await refresh();
          } catch (broadcastError) {
            setError((broadcastError as Error).message);
          }
        });
      });

      channel.subscribe((status) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          queueMicrotask(() => setRealtimeConnected(true));
        } else if (
          status === REALTIME_SUBSCRIBE_STATES.CLOSED ||
          status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR ||
          status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT
        ) {
          queueMicrotask(() => setRealtimeConnected(false));
        }
      });
    };

    initRealtime();

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
      queueMicrotask(() => setRealtimeConnected(false));
    };
  }, [refresh, userId]);

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

      const { error: deleteError } = await supabase
        .from("bookmarks")
        .delete()
        .match({ id: bookmarkId, user_id: userId });
      if (deleteError) throw deleteError;
      setLastSyncedAt(new Date().toISOString());
    },
    [userId]
  );

  const store = useMemo(
    () => ({
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
    }),
    [
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
    ]
  );

  return store;
}
