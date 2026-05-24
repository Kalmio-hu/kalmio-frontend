import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { capture } from '@/lib/analytics'

/**
 * localStorage key that stores whether the user has already been asked.
 * Prefixed with user ID so different accounts on the same device see the prompt.
 */
const ASKED_KEY_PREFIX = 'kalmio_notif_asked_'

function hasBeenAsked(userId: string): boolean {
  try {
    return localStorage.getItem(`${ASKED_KEY_PREFIX}${userId}`) === '1'
  } catch {
    return false
  }
}

function markAsked(userId: string): void {
  try {
    localStorage.setItem(`${ASKED_KEY_PREFIX}${userId}`, '1')
  } catch {
    // localStorage unavailable — degrade gracefully; won't show again this session.
  }
}

interface Props {
  userId: string
  /**
   * Pass true when the user is viewing the Dashboard daily view AND has an active
   * plan with at least one prep slot in the next 7 days. The dialog is only shown
   * when this is true and the browser hasn't been asked yet.
   */
  shouldOffer: boolean
  /**
   * Called after the user grants permission so the caller can register the push
   * subscription.
   */
  onGranted?: (subscription: PushSubscription) => void
}

/**
 * Timed notification permission prompt (KALMIO-315).
 *
 * Not shown on first app open or signup. Shown only once, when both:
 *   (a) the user has an active plan with prep slots in the next 7 days, AND
 *   (b) the user is viewing the daily / dashboard view.
 *
 * A single dismiss (or any browser decision) records the "asked" state
 * in localStorage. The user can re-enable in Settings via the browser
 * notification settings (we cannot re-trigger the browser prompt after denial).
 *
 * Voice: competent, warm, no exclamation marks.
 */
export function PermissionPromptDialog({ userId, shouldOffer, onGranted }: Props) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    if (!shouldOffer) return
    if (!('Notification' in window)) return
    if (Notification.permission !== 'default') return
    if (hasBeenAsked(userId)) return

    // Show on next tick to avoid rendering during the hydration cycle.
    const timer = setTimeout(() => setVisible(true), 300)
    return () => clearTimeout(timer)
  }, [shouldOffer, userId])

  if (!visible) return null

  async function handleAllow() {
    setRequesting(true)
    markAsked(userId)

    try {
      const permission = await Notification.requestPermission()

      if (permission === 'granted') {
        capture('notification_permission_granted', { source: 'PERMISSION_PROMPT' })

        // Register service worker push subscription if available.
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          try {
            const registration = await navigator.serviceWorker.ready
            const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
            if (vapidKey) {
              const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: vapidKey,
              })
              onGranted?.(sub)
            }
          } catch (err) {
            // Push subscription failure is non-fatal — permission is still granted.
            console.warn('[notification] push subscription failed after permission grant:', err)
          }
        }
      } else if (permission === 'denied') {
        capture('notification_permission_denied', { source: 'PERMISSION_PROMPT' })
      } else {
        // 'default' — user closed the browser dialog without deciding.
        capture('notification_permission_dismissed', { source: 'PERMISSION_PROMPT' })
      }
    } finally {
      setRequesting(false)
      setVisible(false)
    }
  }

  function handleDismiss() {
    markAsked(userId)
    capture('notification_permission_dismissed', { source: 'PERMISSION_PROMPT' })
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={t('notifications.permission.ariaLabel')}
      className="mx-4 mt-3 rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        {/* Status icon — functional, not decorative */}
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F28C28]/10 text-[#F28C28]"
        >
          <Bell size={16} />
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1A1A1A] leading-snug">
            {t('notifications.permission.title')}
          </p>
          <p className="mt-0.5 text-xs text-[#6B6460] leading-relaxed">
            {t('notifications.permission.body')}
          </p>

          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={requesting}
              onClick={handleAllow}
              className="bg-midnight-black hover:bg-midnight-black/90 text-white rounded-xl text-xs px-4"
            >
              {t('notifications.permission.allow')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={requesting}
              onClick={handleDismiss}
              className="text-[#6B6460] hover:text-[#1A1A1A] rounded-xl text-xs px-3 gap-1"
            >
              <BellOff size={13} aria-hidden="true" />
              {t('notifications.permission.dismiss')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
