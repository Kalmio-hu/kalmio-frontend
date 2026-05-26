import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { clearPasskeyToken } from '@/lib/passkeySession'
import { queryClient } from '@/lib/queryClient'

export type AppRole = 'USER' | 'ADMIN'

/** Whether the active impersonation was started from the admin panel or the family settings page. */
export type ImpersonationContext = 'admin' | 'family'

interface AuthState {
  user: User | null
  session: Session | null
  initialized: boolean
  appRole: AppRole | null
  isAdmin: boolean
  impersonationToken: string | null
  impersonatedEmail: string | null
  /** Context that originated the impersonation — determines where "Return to your view" navigates. */
  impersonationContext: ImpersonationContext | null
  setSession: (session: Session | null) => void
  updateSession: (session: Session | null) => void
  setAppRole: (role: AppRole | null) => void
  signOut: () => Promise<void>
  startImpersonation: (token: string, email: string, context?: ImpersonationContext) => void
  stopImpersonation: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  initialized: false,
  appRole: null,
  isAdmin: false,
  impersonationToken: null,
  impersonatedEmail: null,
  impersonationContext: null,
  setSession: (session) =>
    set({ session, user: session?.user ?? null, initialized: true }),
  updateSession: (session) =>
    set({ session, user: session?.user ?? null }),
  setAppRole: (role) =>
    set({ appRole: role, isAdmin: role === 'ADMIN' }),
  signOut: async () => {
    clearPasskeyToken()
    await supabase.auth.signOut()
    set({
      session: null,
      user: null,
      appRole: null,
      isAdmin: false,
      impersonationToken: null,
      impersonatedEmail: null,
      impersonationContext: null,
    })
    // Wipe in-memory React Query cache and persisted SW API caches so the
    // next user on this device cannot read the previous user's data.
    // The SW listens for CLEAR_API_CACHE in sw.ts and deletes every
    // kalmio-api-* cache; the runtime cache otherwise survives up to 24h.
    queryClient.clear()
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.controller?.postMessage({ type: 'CLEAR_API_CACHE' })
    }
  },
  startImpersonation: (token, email, context = 'admin') =>
    set({ impersonationToken: token, impersonatedEmail: email, impersonationContext: context }),
  stopImpersonation: () =>
    set({ impersonationToken: null, impersonatedEmail: null, impersonationContext: null }),
}))

/**
 * Returns a Promise that resolves once the auth store has finished its
 * initial session hydration (i.e. `initialized` is true).
 *
 * Resolves immediately if the store is already initialized.
 * Falls back after `timeoutMs` (default 5 000 ms) so callers are never
 * permanently blocked when Supabase is slow or unreachable.
 */
export function waitForAuthInit(timeoutMs = 5_000): Promise<void> {
  if (useAuthStore.getState().initialized) return Promise.resolve()

  return new Promise((resolve) => {
    const timer = setTimeout(resolve, timeoutMs)

    const unsubscribe = useAuthStore.subscribe((state) => {
      if (state.initialized) {
        clearTimeout(timer)
        unsubscribe()
        resolve()
      }
    })
  })
}
