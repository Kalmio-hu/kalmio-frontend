import { useEffect } from 'react'

/**
 * Keeps the screen on while the player is open (same pattern as the cook
 * mode). Browsers without the Wake Lock API silently no-op.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    type WakeLockSentinel = { release: () => Promise<void> }
    const nav = navigator as Navigator & { wakeLock?: { request: (kind: 'screen') => Promise<WakeLockSentinel> } }
    if (!nav.wakeLock) return

    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const acquire = async () => {
      try {
        const s = await nav.wakeLock!.request('screen')
        if (cancelled) {
          await s.release().catch(() => undefined)
          return
        }
        sentinel = s
      } catch {
        // denied or unsupported
      }
    }
    void acquire()

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void acquire()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      if (sentinel) void sentinel.release().catch(() => undefined)
    }
  }, [active])
}
