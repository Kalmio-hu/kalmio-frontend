import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { notificationService, NOTIFICATION_PREFS_QUERY_KEY } from '@/services/notificationService'

/**
 * KALMIO-316: Service worker notification action handler.
 *
 * The Web Push notification carries two action buttons ("snooze" and "quiet-today").
 * When the user taps one, the service worker receives a `notificationclick` event and
 * calls `postMessage` to relay the action to the app context.
 *
 * This component listens for those messages and forwards the API call to the backend.
 * Mounted once at app-level (inside ProtectedRoute) — renders nothing.
 *
 * Message shape from service worker:
 *   { type: 'NOTIFICATION_ACTION', action: 'snooze', slotId: '<uuid>' }
 *   { type: 'NOTIFICATION_ACTION', action: 'quiet-today' }
 */
export function SnoozeActionHandler() {
  const qc = useQueryClient()

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handler = async (event: MessageEvent) => {
      const data = event.data as { type?: string; action?: string; slotId?: string }
      if (data?.type !== 'NOTIFICATION_ACTION') return

      try {
        if (data.action === 'snooze' && data.slotId) {
          await notificationService.snooze(data.slotId)
          qc.invalidateQueries({ queryKey: NOTIFICATION_PREFS_QUERY_KEY })
        } else if (data.action === 'quiet-today') {
          await notificationService.quietToday()
          qc.invalidateQueries({ queryKey: NOTIFICATION_PREFS_QUERY_KEY })
        }
      } catch (err) {
        console.warn('[SnoozeActionHandler] failed to relay notification action:', err)
      }
    }

    navigator.serviceWorker.addEventListener('message', handler)
    return () => navigator.serviceWorker.removeEventListener('message', handler)
  }, [qc])

  return null
}
