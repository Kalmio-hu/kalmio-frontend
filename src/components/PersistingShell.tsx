/**
 * PersistingShell.tsx
 *
 * Wraps the application in PersistQueryClientProvider and handles user-scoped
 * cache invalidation (KALMIO-362, Track A — offline-PWA epic KALMIO-360).
 *
 * Responsibilities:
 *   - Rebuild persist options (IDB bucket) when the authenticated userId
 *     changes so accounts never share a cache bucket.
 *   - Purge the previous user's IDB bucket on sign-out or account switch.
 *   - Clear the in-memory QueryClient cache on user change so stale data from
 *     the previous user is never visible.
 *   - Key-remount PersistQueryClientProvider on userId change so it hydrates
 *     from the correct IDB bucket.
 */

import { useEffect, useRef } from 'react'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClient, buildPersistOptions, clearPersistedCache } from '@/lib/queryClient'
import { useAuthStore } from '@/store/auth'

interface PersistingShellProps {
  children: React.ReactNode
}

export function PersistingShell({ children }: PersistingShellProps) {
  const session = useAuthStore((s) => s.session)
  const userId = session?.user?.id ?? null

  // Track the previous userId so we can purge the old bucket.
  const prevUserIdRef = useRef<string | null>(userId)

  useEffect(() => {
    const prev = prevUserIdRef.current
    if (prev !== userId) {
      // Purge the old bucket — either sign-out (userId becomes null) or
      // an account switch (userId changes to a different value).
      clearPersistedCache(prev)
      // Clear the in-memory cache so stale data from the previous user
      // is not visible for even a single render cycle.
      queryClient.clear()
      prevUserIdRef.current = userId
    }
  }, [userId])

  // Key the provider on the userId so it remounts (and re-hydrates from the
  // correct IDB bucket) whenever the account changes.
  const persistOptions = buildPersistOptions(userId)
  const providerKey = userId ?? 'anon'

  return (
    <PersistQueryClientProvider
      key={providerKey}
      client={queryClient}
      persistOptions={persistOptions}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
