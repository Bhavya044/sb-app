import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim()
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim()

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase client environment variables.')
}

export const supabase = createClient<import('./database.types').Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
    },
  },
)
