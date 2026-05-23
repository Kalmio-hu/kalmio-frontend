/**
 * useCsemeteWelcomeMoment — KALMIO-172
 *
 * Determines whether the Csemete welcome overlay should be displayed.
 *
 * Rules:
 *   - Current stage must be CSEMETE (MAG → CSEMETE transition has occurred).
 *   - The overlay must not have been shown before (`kalmio:csemeteWelcomeShown`
 *     absent from localStorage).
 *   - The first-plan reveal must already have been shown (KALMIO-157) — we never
 *     stack both overlays simultaneously. If `firstPlanRevealShown` is absent we
 *     defer: the FirstPlanReveal runs first, and on the next mount this hook fires.
 *   - Session-level dismissed state is tracked in `dismissed` so the overlay does
 *     not reappear if the component re-mounts within the same session.
 *
 * Usage:
 *   const { shouldShow, dismiss } = useCsemeteWelcomeMoment()
 *   if (shouldShow) return <CsemeteWelcomeMoment onDismiss={dismiss} />
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usersService, USERS_STAGE_QUERY_KEY } from '@/services/users'
import {
  hasCsemeteWelcomeBeenShown,
  markCsemeteWelcomeShown,
  hasRevealBeenShown,
} from '@/lib/firstPlanReveal'

interface UseCsemeteWelcomeMomentReturn {
  /** True when the overlay should be rendered. */
  shouldShow: boolean
  /** Call this when the user dismisses the overlay. Writes to localStorage. */
  dismiss: () => void
}

export function useCsemeteWelcomeMoment(): UseCsemeteWelcomeMomentReturn {
  const [dismissed, setDismissed] = useState(false)

  const { data: stageData } = useQuery({
    queryKey: USERS_STAGE_QUERY_KEY,
    queryFn: usersService.getMyStage,
    staleTime: 30_000,
    retry: 1,
  })

  // Show only when:
  //   1. Stage is CSEMETE.
  //   2. The Csemete welcome has never been shown (localStorage guard).
  //   3. The first-plan reveal has already been shown — so we never stack overlays.
  //   4. Not dismissed in this session.
  const shouldShow =
    stageData?.currentStage === 'CSEMETE' &&
    !hasCsemeteWelcomeBeenShown() &&
    hasRevealBeenShown() &&
    !dismissed

  function dismiss() {
    markCsemeteWelcomeShown()
    setDismissed(true)
  }

  return { shouldShow, dismiss }
}
