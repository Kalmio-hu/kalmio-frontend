/**
 * syncQueue.tsx — KALMIO-377
 *
 * Client-side bridge between the Workbox BackgroundSync queue (running in the
 * service worker) and the React UI.
 *
 * The SW posts `{ type: 'SYNC_QUEUE_UPDATE', count: number }` messages after
 * each sync attempt. This module provides:
 *
 *   1. `useSyncQueueCount()` — a React hook that returns the current number of
 *      queued offline mutations. Updates live as the SW drains the queue.
 *
 *   2. `SyncQueueBanner` — a small presentational component that renders the
 *      "X actions queued, will sync when online" strip. Import it wherever the
 *      `OfflineBanner` is rendered so the two can share vertical space.
 *
 * Architecture notes:
 *   - The count is tracked in a module-level variable so that multiple
 *     `useSyncQueueCount()` subscribers share a single SW listener.
 *   - Subscribers are notified via a custom event dispatched on `window`.
 *   - No Zustand, no localStorage — this is ephemeral UI-only state.
 */

import { useState, useEffect, useRef, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

// ── Internal state ─────────────────────────────────────────────────────────────

/** Current number of requests still in the BackgroundSync queue. */
let _queueCount = 0

/** Custom event name used to propagate count changes to hooks. */
const QUEUE_COUNT_EVENT = 'kalmio:sync-queue-count'

function _setQueueCount(count: number): void {
  if (_queueCount === count) return
  _queueCount = count
  window.dispatchEvent(new CustomEvent(QUEUE_COUNT_EVENT, { detail: { count } }))
}

// ── SW message listener ────────────────────────────────────────────────────────

/**
 * Registers a `message` listener on `navigator.serviceWorker` exactly once.
 * Safe to call multiple times — the listener is only added once.
 */
let _listenerRegistered = false

function _ensureListener(): void {
  if (_listenerRegistered) return
  if (!('serviceWorker' in navigator)) return

  navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
    const data = event.data as { type?: string; count?: number } | null
    if (data?.type === 'SYNC_QUEUE_UPDATE' && typeof data.count === 'number') {
      _setQueueCount(data.count)
    }
  })

  _listenerRegistered = true
}

// ── React hook ─────────────────────────────────────────────────────────────────

/**
 * Returns the number of offline mutations currently queued in the Workbox
 * BackgroundSync queue. Value is 0 while online and no items are pending.
 *
 * The count decrements automatically as the SW replays requests on reconnect.
 */
// eslint-disable-next-line react-refresh/only-export-components -- intentional co-location with SyncQueueBanner
export function useSyncQueueCount(): number {
  _ensureListener()

  const [count, setCount] = useState<number>(_queueCount)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ count: number }>).detail
      setCount(detail.count)
    }
    window.addEventListener(QUEUE_COUNT_EVENT, handler)
    return () => window.removeEventListener(QUEUE_COUNT_EVENT, handler)
  }, [])

  return count
}

// ── Presentational component ───────────────────────────────────────────────────

/**
 * Renders a slim strip showing "X actions queued, will sync when online."
 * - While count > 0: shows the queued-actions message; count ticks down live.
 * - When count drops from > 0 to 0: briefly shows the "Synced" confirmation
 *   for 3 seconds, then disappears.
 *
 * Placement: render alongside `OfflineBanner` (e.g. in `AppLayout`) so the two
 * banners stack naturally. The banner sits at z-40 so it renders below the
 * OfflineBanner (z-50) when both are visible.
 *
 * Tone: factual, no exclamation marks, no emoji. Matches billionaire's-assistant
 * register.
 */
export function SyncQueueBanner(): ReactElement | null {
  const count = useSyncQueueCount()
  const { t } = useTranslation()
  const [showSynced, setShowSynced] = useState(false)
  // Track previous count to detect the queue-drained transition.
  const prevCountRef = useRef(count)

  useEffect(() => {
    const prev = prevCountRef.current
    prevCountRef.current = count

    if (prev > 0 && count === 0) {
      // Queue just drained — briefly confirm to the user.
      let cancelled = false
      setShowSynced(true)
      const timer = setTimeout(() => {
        if (!cancelled) setShowSynced(false)
      }, 3000)
      return () => {
        cancelled = true
        clearTimeout(timer)
      }
    }
    return undefined
  }, [count])

  if (count === 0 && !showSynced) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center gap-2 bg-amber-700 px-4 py-2 text-sm text-white"
    >
      {showSynced && count === 0
        ? t('offline.queuedActionsSynced')
        : t('offline.queuedActions', { count })}
    </div>
  )
}
