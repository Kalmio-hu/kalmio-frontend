/**
 * useSyncInvalidation — KALMIO-378
 *
 * Listens for two signals and invalidates a caller-supplied set of query keys
 * so the UI re-aligns with server state after background-sync drains:
 *
 *   1. The browser `online` event — fired when the device reconnects. We
 *      invalidate immediately so the optimistic cache is refreshed from the
 *      network on the next active mount.
 *
 *   2. `SYNC_QUEUE_UPDATE` messages from the service worker with `count === 0`
 *      — fired by the SW (KALMIO-377 / src/sw.ts) after it has successfully
 *      replayed all queued requests. This is more precise than the `online`
 *      event because it confirms the backend has received the mutations before
 *      we refetch.
 *
 * Usage:
 *   useSyncInvalidation([['dashboard', today], ['macros', today]])
 *
 * Design notes:
 *   - Query keys are compared by JSON-serialised value so callers can pass
 *     inline arrays without causing effect churn.
 *   - The hook is side-effect only — it returns nothing.
 *   - Safe to call multiple times in the same component tree.
 */
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

type QueryKey = readonly unknown[]

export function useSyncInvalidation(queryKeys: QueryKey[]): void {
  const queryClient = useQueryClient()
  // Serialise keys for stable effect dependency — avoids re-registering
  // listeners on every render when the caller passes inline arrays.
  const serialised = JSON.stringify(queryKeys)

  useEffect(() => {
    // Re-parse from the serialised snapshot so we use the value that was
    // current when the effect ran, not a stale closure over queryKeys.
    const keys: QueryKey[] = JSON.parse(serialised) as QueryKey[]

    function invalidateAll(): void {
      for (const key of keys) {
        void queryClient.invalidateQueries({ queryKey: key })
      }
    }

    // 1. Browser online event
    window.addEventListener('online', invalidateAll)

    // 2. SW queue-drained message (SYNC_QUEUE_UPDATE with count === 0)
    function handleSwMessage(event: MessageEvent): void {
      const data = event.data as { type?: string; count?: number } | null
      if (data?.type === 'SYNC_QUEUE_UPDATE' && data.count === 0) {
        invalidateAll()
      }
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage)
    }

    return () => {
      window.removeEventListener('online', invalidateAll)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage)
      }
    }
  // queryClient is stable; serialised tracks key changes without referencing mutable refs.
  }, [queryClient, serialised])
}
