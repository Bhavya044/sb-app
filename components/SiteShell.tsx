'use client'

import { useSession } from '@/hooks/use-session'
import { supabase } from '@/lib/supabase-client'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

const navItems = [
  { href: '/bookmarks', label: 'Bookmarks' },
  { href: '/insights', label: 'Top domains' },
]

type SiteShellProps = {
  children: React.ReactNode
}

export default function SiteShell({ children }: SiteShellProps) {
  const router = useRouter()
  const session = useSession()
  const userId = session?.user?.id
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [signOutLoading, setSignOutLoading] = useState(false)

  const userDisplayName = session?.user.user_metadata?.full_name ?? session?.user.email ?? 'Guest'

  const handleSignOut = async () => {
    setSignOutLoading(true)
    try {
      await supabase.auth.signOut()
      await router.push('/')
    } finally {
      setSignOutLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-transparent text-white">
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
        <header className="glass-card w-full rounded-3xl border border-white/5 p-6 shadow-xl shadow-slate-950/30">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 shadow-emerald-500/50">
                <span className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-900">
                  SM
                </span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.5em] text-emerald-300">Smart</p>
                <h1 className="text-2xl font-semibold text-white">Bookmark Vault</h1>
              </div>
            </div>
            <div className="text-right text-sm uppercase tracking-[0.35em] text-slate-300 sm:text-left">
              <p className="text-white">Welcome, {userDisplayName}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-white/5 pt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
            <nav className="hidden flex-wrap gap-3 text-[11px] uppercase tracking-[0.4em] sm:flex">
              {navItems.map((item) => {
                const isActive = router.pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-full px-4 py-2 transition ${
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
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="sm:hidden rounded-full border border-white/30 px-4 py-2 text-[11px] uppercase tracking-[0.4em] text-white/80 transition hover:border-white/60"
                  onClick={() => setDrawerOpen(true)}
                >
                  Actions
                </button>
                <button
                  type="button"
                  disabled={signOutLoading}
                  onClick={handleSignOut}
                  className="flex items-center gap-2 rounded-full border border-rose-400/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-rose-200 transition hover:bg-rose-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300 disabled:opacity-60"
                >
                  {signOutLoading && (
                    <span className="h-3 w-3 animate-spin rounded-full border border-rose-200 border-t-transparent" />
                  )}
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </header>

        {drawerOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 py-6 sm:hidden">
            <div className="w-full max-w-sm space-y-5 rounded-3xl bg-white/95 p-5 shadow-2xl shadow-black/40 backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Navigation</p>
                <button
                  type="button"
                  className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-700"
                  onClick={() => setDrawerOpen(false)}
                >
                  Close
                </button>
              </div>
              <nav className="space-y-3 text-sm font-semibold text-slate-800">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-2xl border border-slate-200 px-4 py-2 transition hover:border-emerald-300 hover:text-emerald-600"
                    onClick={() => setDrawerOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {session ? (
                <button
                  type="button"
                  disabled={signOutLoading}
                  onClick={handleSignOut}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/70 bg-rose-500/5 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-rose-500 transition hover:bg-rose-500/10 disabled:opacity-60"
                >
                  {signOutLoading && (
                    <span className="h-3 w-3 animate-spin rounded-full border border-rose-500 border-t-transparent" />
                  )}
                  Sign out
                </button>
              ) : null}
            </div>
          </div>
        )}

        {children}
      </main>
    </div>
  )
}
