import { useState, useEffect, useRef, useCallback } from 'react'

export interface OnlineStatus {
  /** True when the browser reports network connectivity. */
  online: boolean
  /** True for ~3 s after transitioning back online — use to show a brief "reconnected" badge. */
  justReconnected: boolean
  /**
   * Whole number of minutes elapsed since we were last confirmed online.
   * Resets to 0 each time the online event fires.
   * Updated once per minute while offline via an interval.
   */
  minutesSinceOnline: number
  /**
   * Monotonically incremented each time the connection drops.
   * Use as a React key to reset per-episode state (e.g. dismissed banner) in child components.
   */
  offlineEpisode: number
}

const RECONNECTED_FLASH_MS = 3_000

export function useOnlineStatus(): OnlineStatus {
  const [online, setOnline] = useState(navigator.onLine)
  const [justReconnected, setJustReconnected] = useState(false)
  const [offlineEpisode, setOfflineEpisode] = useState(0)
  const [minutesSinceOnline, setMinutesSinceOnline] = useState(0)

  // Initialised lazily in the first effect run to avoid calling Date.now() during render.
  const lastOnlineRef = useRef<number | null>(null)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearFlashTimer = useCallback(() => {
    if (flashTimer.current !== null) {
      clearTimeout(flashTimer.current)
      flashTimer.current = null
    }
  }, [])

  const clearTickTimer = useCallback(() => {
    if (tickTimer.current !== null) {
      clearInterval(tickTimer.current)
      tickTimer.current = null
    }
  }, [])

  useEffect(() => {
    // Capture the mount time as the "last known online" baseline.
    lastOnlineRef.current = Date.now()

    const handleOnline = () => {
      setOnline(true)
      lastOnlineRef.current = Date.now()
      setMinutesSinceOnline(0)
      setJustReconnected(true)
      clearFlashTimer()
      clearTickTimer()
      flashTimer.current = setTimeout(() => {
        setJustReconnected(false)
        flashTimer.current = null
      }, RECONNECTED_FLASH_MS)
    }

    const handleOffline = () => {
      setOnline(false)
      setOfflineEpisode((n) => n + 1)
      setMinutesSinceOnline(0)
      clearFlashTimer()
      setJustReconnected(false)
      // Tick every minute to refresh "X minutes ago" display.
      tickTimer.current = setInterval(() => {
        const base = lastOnlineRef.current ?? 0
        const elapsed = Math.floor((Date.now() - base) / 60_000)
        setMinutesSinceOnline(elapsed)
      }, 60_000)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearFlashTimer()
      clearTickTimer()
    }
  }, [clearFlashTimer, clearTickTimer])

  return { online, justReconnected, minutesSinceOnline, offlineEpisode }
}
