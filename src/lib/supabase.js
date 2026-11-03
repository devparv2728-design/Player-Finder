import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

export const isDemoMode =
  !supabaseUrl ||
  supabaseUrl.includes('placeholder.supabase.co') ||
  supabaseAnonKey === 'placeholder-key' ||
  supabaseAnonKey === 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
