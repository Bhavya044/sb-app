'use client'

import BookmarkForm from '@/components/BookmarkForm'
import BookmarkList from '@/components/BookmarkList'
import Toast from '@/components/Toast'
import { useBookmarkStore } from '@/hooks/use-bookmark-store'
import { useSession } from '@/hooks/use-session'
import type { BookmarkCreate } from '@/lib/bookmark.types'
import { formatTimestamp, relativeTime } from '@/lib/time'
import { useRouter } from 'next/router'
import type { FormEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

type ToastVariant = 'success' | 'error'
type ToastState = { variant: ToastVariant; message: string }

const isValidBookmarkUrl = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return false
  const pattern = /^https?:\/\//i
  if (!pattern.test(trimmed)) return false

  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export default function BookmarksPage() {
  const router = useRouter()
  const session = useSession()
  const userId = session?.user?.id
  const {
    bookmarks,
    loading,
    loadingMore,
    hasMore,
    error: storeError,
    realtimeConnected,
    lastSyncedAt,
    refresh,
    loadMore,
    insertBookmark,
    deleteBookmark,
  } = useBookmarkStore(userId)

  const [formState, setFormState] = useState({ title: '', url: '' })
  const [formError, setFormError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [mutatingId, setMutatingId] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [copyingId, setCopyingId] = useState<string | null>(null)
  const [clipboardSupported, setClipboardSupported] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setClipboardSupported(Boolean(navigator.clipboard?.writeText))
    }
  }, [])

  useEffect(() => {
    if (session === undefined) return
    if (!session) {
      router.replace('/')
    }
  }, [session, router])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(timer)
  }, [toast])

  const handleVisibleEnd = useCallback(() => {
    if (hasMore && !loading && !loadingMore) {
      loadMore()
    }
  }, [hasMore, loading, loadingMore, loadMore])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || loading || loadingMore || !hasMore) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleVisibleEnd()
        }
      },
      { rootMargin: '150px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [handleVisibleEnd, hasMore, loading, loadingMore])

  const isFormValid =
    Boolean(formState.title.trim() && formState.url.trim()) && isValidBookmarkUrl(formState.url)
  const lastSyncedLabel = lastSyncedAt
    ? `${relativeTime(lastSyncedAt)} • ${formatTimestamp(lastSyncedAt)}`
    : 'Waiting for first sync'
  const networkStatusLabel = realtimeConnected ? 'Realtime ready' : 'Realtime warming up'
  const urlValidationMessage =
    formState.url && !isValidBookmarkUrl(formState.url)
      ? `URL "${formState.url}" needs http:// or https:// so we can render the preview safely.`
      : null
  const errorMessage = formError ?? storeError
  const latestBookmark = bookmarks[0]

  const updateField = (field: 'title' | 'url', value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!userId) {
      setFormError('Please sign in first.')
      return
    }

    if (!formState.title.trim() || !formState.url.trim()) {
      setFormError('Both title and URL are required.')
      return
    }

    if (!isValidBookmarkUrl(formState.url)) {
      setFormError(urlValidationMessage ?? 'Include http:// or https:// in the URL.')
      return
    }

    setFormError(null)
    setMutatingId('adding')
    const payload: BookmarkCreate = {
      title: formState.title.trim(),
      url: formState.url.trim(),
    }

    try {
      await insertBookmark(payload)
      setFormState({ title: '', url: '' })
      await refresh()
      setShowForm(false)
      setToast({ variant: 'success', message: 'Saved.' })
    } catch (insertError) {
      setFormError((insertError as Error).message)
      setToast({ variant: 'error', message: 'Could not save.' })
    } finally {
      setMutatingId(null)
    }
  }

  const handleDelete = async (bookmarkId: string) => {
    setMutatingId(bookmarkId)
    try {
      await deleteBookmark(bookmarkId)
      await refresh()
      setToast({ variant: 'success', message: 'Deleted.' })
    } catch (deleteError) {
      setFormError((deleteError as Error).message)
      setToast({ variant: 'error', message: 'Delete failed.' })
    } finally {
      setMutatingId(null)
    }
  }

  const handleCopy = async (url: string, id: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return
    setCopyingId(id)
    try {
      await navigator.clipboard.writeText(url)
      setToast({ variant: 'success', message: 'Copied.' })
    } catch {
      setToast({ variant: 'error', message: 'Clipboard unavailable.' })
    } finally {
      setCopyingId(null)
    }
  }

  if (!session) {
    return null
  }

  return (
    <section className="space-y-6">
      <header className="glass-card rounded-3xl border border-white/5 p-6 shadow-xl shadow-slate-950/30">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Bookmarks</p>
            <h1 className="text-3xl font-semibold text-white">My bookmarks</h1>
            <p className="text-sm text-slate-400">Private links, synced instantly.</p>
          </div>
          <div className="text-right text-[11px] uppercase tracking-[0.4em] text-slate-400 sm:text-left">
            <p className="text-white">{networkStatusLabel}</p>
            <p className="text-slate-400">Last sync: {lastSyncedLabel}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
          <span className="rounded-full border border-white/10 px-3 py-1 text-slate-200">
            {bookmarks.length} saved link{bookmarks.length === 1 ? '' : 's'}
          </span>
          {latestBookmark ? (
            <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-200">
              Latest: {latestBookmark.title}
            </span>
          ) : null}
        </div>
      </header>

      <div className="glass-card rounded-3xl border border-white/5 px-6 py-6 shadow-xl shadow-slate-950/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Add a bookmark</h2>
          <button
            type="button"
            className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${showForm ? 'border border-emerald-400 bg-emerald-500/20 text-emerald-200 shadow-inner' : 'border border-amber-400 bg-amber-500/20 text-amber-200 shadow-sm shadow-amber-200'}`}
            onClick={() => setShowForm((prev) => !prev)}
          >
            {showForm ? 'Close form' : 'Create bookmark'}
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Fill in the details and tap save. URLs need http:// or https://.
        </p>

        {showForm && (
          <div className="mt-4 space-y-4">
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
              isSubmitting={mutatingId === 'adding'}
              disabled={!userId}
              urlHelperText={showForm ? urlValidationMessage : null}
            />
          </div>
        )}
      </div>

      <section className="glass-card rounded-3xl border border-white/5 px-6 py-6 shadow-xl shadow-slate-950/30">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-6">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-400">
            Bookmarks list
          </p>
        </div>
        <div className="mt-5 space-y-4">
          <BookmarkList
            bookmarks={bookmarks}
            loading={loading}
            onDelete={handleDelete}
            onCopy={handleCopy}
            deletingId={mutatingId}
            copyingId={copyingId}
            clipboardSupported={clipboardSupported}
            endOfListRef={sentinelRef}
          />
          {loadingMore ? (
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Loading more bookmarks…
            </p>
          ) : null}
          {!hasMore && !loading ? (
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              That’s the end of your list — nothing more to fetch.
            </p>
          ) : null}
        </div>
      </section>

      {toast ? <Toast message={toast.message} variant={toast.variant} /> : null}
    </section>
  )
}
