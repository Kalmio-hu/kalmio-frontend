import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

/**
 * Inner banner rendered with a key derived from `offlineEpisode`.
 * Mounting a fresh instance on each offline episode automatically resets
 * the local `dismissed` state without needing a useEffect setState call.
 */
function OfflineBannerInner({
  minutesSinceOnline,
}: {
  minutesSinceOnline: number
}) {
  const { t } = useTranslation()
  const [dismissed, setDismissed] = useState(false)

  const timeAgoLabel =
    minutesSinceOnline < 1
      ? t('offline.justNow')
      : minutesSinceOnline === 1
        ? t('offline.oneMinuteAgo')
        : t('offline.minutesAgo', { count: minutesSinceOnline })

  if (dismissed) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-2 bg-neutral-800 px-4 py-2 text-sm text-white"
    >
      <span>
        {t('offline.bannerOffline')}
        {' '}
        <span className="opacity-70">{t('offline.lastUpdated', { time: timeAgoLabel })}</span>
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t('offline.dismiss')}
        className="ml-4 shrink-0 rounded px-2 py-0.5 text-xs opacity-70 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
      >
        {t('offline.dismiss')}
      </button>
    </div>
  )
}

/**
 * Persistent top-of-viewport banner shown whenever the browser is offline.
 *
 * Behaviour:
 * - Appears immediately when going offline; persists until connectivity is restored.
 * - Dismissible per-session: once the user closes it, it stays hidden for the current
 *   offline episode. If the connection drops again after a reconnect, it reappears.
 * - Briefly shows a "reconnected" confirmation for 3 s when coming back online.
 * - Positioned fixed at the top so it does not push page layout; z-index 50.
 *
 * Voice: calm, discreet. No exclamation marks. Matches Kalmio billionaire's-assistant tone.
 */
export function OfflineBanner() {
  const { t } = useTranslation()
  const { online, justReconnected, minutesSinceOnline, offlineEpisode } = useOnlineStatus()

  if (justReconnected) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-green-700 px-4 py-2 text-sm text-white"
      >
        {t('offline.bannerReconnected')}
      </div>
    )
  }

  if (online) return null

  // Key on offlineEpisode so OfflineBannerInner mounts fresh each time we go offline,
  // resetting its internal dismissed state automatically.
  return (
    <OfflineBannerInner
      key={offlineEpisode}
      minutesSinceOnline={minutesSinceOnline}
    />
  )
}
