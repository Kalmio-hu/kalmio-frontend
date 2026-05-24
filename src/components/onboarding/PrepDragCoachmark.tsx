/* eslint-disable react-refresh/only-export-components */
/**
 * PrepDragCoachmark — KALMIO-326
 *
 * Shows once when:
 *  - The user is on the daily-timeline view (NOT calendar view).
 *  - At least one meal card has an embedded prep AND at least one prep is standalone.
 *  - The user has NOT previously dismissed this coachmark
 *    (checked via users.coachmarksSeen on the server).
 *
 * Dismissed via the "Got it" button → calls POST /api/users/me/coachmarks/prepDrag,
 * then invalidates the ['users', 'me'] query so the coachmarksSeen list refreshes.
 *
 * Tone: competent, calm, no exclamation marks. KALMIO-ADR-007.
 */

import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usersService, USERS_ME_QUERY_KEY } from '@/services/users'

const COACHMARK_KEY = 'prepDrag'

/** Animated arrow SVG pointing downward-left, toward an embedded prep chip. */
function AnimatedArrow() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      aria-hidden
      className="text-teal-600"
      style={{
        animation: 'coachmark-bounce 1.4s ease-in-out infinite',
      }}
    >
      <path
        d="M20 4 C20 4, 8 14, 8 28 M8 28 L4 20 M8 28 L16 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface PrepDragCoachmarkProps {
  /** Must be true for the coachmark to render (caller checks server state). */
  visible: boolean
}

export function PrepDragCoachmark({ visible }: PrepDragCoachmarkProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const buttonRef = useRef<HTMLButtonElement>(null)

  const dismiss = useMutation({
    mutationFn: () => usersService.markCoachmarkSeen(COACHMARK_KEY),
    onSuccess: (updatedUser) => {
      // Optimistically update the cache so the coachmark hides immediately.
      queryClient.setQueryData(USERS_ME_QUERY_KEY, updatedUser)
    },
  })

  // Inject keyframe animation via a <style> tag if not already present.
  useEffect(() => {
    if (document.getElementById('coachmark-keyframes')) return
    const style = document.createElement('style')
    style.id = 'coachmark-keyframes'
    style.textContent = `
      @keyframes coachmark-bounce {
        0%, 100% { transform: translateY(0); }
        50%       { transform: translateY(6px); }
      }
      @keyframes coachmark-fade-in {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `
    document.head.appendChild(style)
  }, [])

  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-3 rounded-xl bg-teal-50 border border-teal-200 px-4 py-3 shadow-sm"
      style={{ animation: 'coachmark-fade-in 0.25s ease-out both' }}
    >
      <AnimatedArrow />

      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-teal-900 leading-snug">
          {t('dashboard.coachmark.prepDrag.body')}
        </p>
      </div>

      <button
        ref={buttonRef}
        type="button"
        onClick={() => dismiss.mutate()}
        disabled={dismiss.isPending}
        className="shrink-0 text-[12px] font-medium text-teal-700 hover:text-teal-900 transition-colors rounded px-2 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-50"
        aria-label={t('dashboard.coachmark.prepDrag.dismiss')}
      >
        {t('dashboard.coachmark.prepDrag.dismiss')}
      </button>
    </div>
  )
}

/**
 * Hook — returns whether the PrepDragCoachmark should be shown.
 *
 * @param coachmarksSeen  List from UserSettings.coachmarksSeen.
 * @param hasEmbeddedPrep Whether at least one meal has an embedded prep chip.
 * @param hasStandalonePrep Whether at least one prep is standalone in today's timeline.
 * @param isCalendarView  True when the user is on the weekly calendar, not the daily view.
 */
export function usePrepDragCoachmarkVisible(
  coachmarksSeen: string[],
  hasEmbeddedPrep: boolean,
  hasStandalonePrep: boolean,
  isCalendarView: boolean,
): boolean {
  if (isCalendarView) return false
  if (coachmarksSeen.includes(COACHMARK_KEY)) return false
  if (!hasEmbeddedPrep || !hasStandalonePrep) return false
  return true
}
