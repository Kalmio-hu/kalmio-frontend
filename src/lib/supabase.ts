import { createClient } from '@supabase/supabase-js'
import { sharedAuthStorage } from '@/lib/sharedAuthStorage'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
  // Shared with the other *.kalmio.hu apps (Kalmio Home): one sign-in for all of them.
  { auth: { storage: sharedAuthStorage } },
)
