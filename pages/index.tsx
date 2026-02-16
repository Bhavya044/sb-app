'use client'

import { useSession } from '@/hooks/use-session'
import { supabase } from '@/lib/supabase-client'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function LoginPage() {
  const session = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.replace('/bookmarks')
    }
  }, [session, router])

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: typeof window === 'undefined' ? undefined : window.location.origin },
    })
  }

  return (
    <section className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-slate-950/60">
        <h1 className="text-center text-2xl font-semibold text-white">Smart Bookmark App</h1>
        <p className="text-center text-sm text-slate-400">
          Sign in with Google to access your private bookmarks.
        </p>
        <button
          type="button"
          className="w-full rounded-2xl border border-emerald-400/70 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300"
          onClick={signIn}
        >
          Continue with Google
        </button>
      </div>
    </section>
  )
}
