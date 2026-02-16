'use client'

import GoogleButton from '@/components/GoogleButton'
import { useSession } from '@/hooks/use-session'
import { supabase } from '@/lib/supabase-client'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function LoginPage() {
  const session = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session) {
      router.replace('/bookmarks')
    }
  }, [session, router])

  const signIn = async () => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 250))
      const redirectTo = "https://sb-app-six.vercel.app/bookmarks"
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-slate-950/60">
        <h1 className="text-center text-2xl font-semibold text-white">Smart Bookmark App</h1>
        <p className="text-center text-sm text-slate-400">
          Sign in with Google to access your private bookmarks.
        </p>
        <GoogleButton onClick={signIn} isLoading={loading}>
          <span className="tracking-[0.4em]">Continue with Google</span>
        </GoogleButton>
      </div>
    </section>
  )
}
