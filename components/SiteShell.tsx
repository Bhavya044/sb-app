`use client`

import { useBookmarkStore } from '@/hooks/use-bookmark-store'
import { useSession } from '@/hooks/use-session'
import { supabase } from '@/lib/supabase-client'
import { formatTimestamp, relativeTime } from '@/lib/time'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/insights', label: 'Domains' },
]

type SiteShellProps = {
  children: React.ReactNode
}

export default function SiteShell({ children }: SiteShellProps) {
  const router = useRouter()
  const session = useSession()
  const { pathname } = router
  const userId = session?.user?.id
  const { realtimeConnected, lastSyncedAt } = useBookmarkStore(userId)

  const userDisplayName = session?.user.user_metadata?.full_name ?? session?.user.email ?? 'Guest'
  const lastSyncedLabel = lastSyncedAt
    ? `${relativeTime(lastSyncedAt)} • ${formatTimestamp(lastSyncedAt)}`
    : 'Waiting for first sync'
  const networkStatusLabel = realtimeConnected ? 'Realtime ready' : 'Realtime warming up'

  const [signOutLoading, setSignOutLoading] = useState(false)

  const handleSignOut = async () => {
    setSignOutLoading(true)
    try {
      await supabase.auth.signOut()
      router.push('/')
    } finally {
      setSignOutLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
        <header className="glass-card relative overflow-hidden rounded-3xl border border-white/5 px-6 py-5 shadow-xl shadow-slate-900/30">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 shadow-emerald-400/70" />
              <div>
                <p className="text-[9px] uppercase tracking-[0.6em] text-emerald-300">Smart</p>
                <p className="text-xl font-semibold text-white">Bookmark Vault</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.35em] text-slate-300 sm:text-sm">
              <span className="text-white/80">
                {session ? `Welcome, ${userDisplayName}` : 'Guest'}
              </span>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-[11px] uppercase tracking-[0.4em] text-slate-200 sm:gap-6">
            <nav className="flex flex-wrap items-center gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-full px-4 py-1 text-[11px] font-semibold transition ${
                      isActive
                        ? 'bg-emerald-400 text-slate-900'
                        : 'border border-white/20 text-white/70 hover:border-white/40 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            {session ? (
              <button
                type="button"
                disabled={signOutLoading}
                className="flex items-center gap-2 rounded-full border border-rose-200/70 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-rose-200 transition hover:bg-rose-200/10 disabled:opacity-60"
                onClick={handleSignOut}
              >
                {signOutLoading && (
                  <span className="h-3 w-3 animate-spin rounded-full border border-rose-200 border-t-transparent" />
                )}
                Sign out
              </button>
            ) : null}
          </div>
        </header>
        {children}
      </main>
    </div>
  )
}
