/**
 * usePremiumTaster — KALMIO-173 / E10.5
 *
 * Determines whether the premium taster reveal banner should be shown, and
 * which stage-specific copy variant to use.
 *
 * Strategy:
 *   - The stage is fetched from GET /api/users/me/stage (already in usersService).
 *   - If the current stage is SUHANG, FIATAL, or TERMO, a taster grant was
 *     automatically issued by the backend (KALMIO-170).
 *   - We show the banner exactly once per stage using a localStorage flag keyed
 *     by stage name (e.g. `kalmio:premiumTasterShown:SUHANG`).
 *   - Dismiss writes the flag and suppresses re-render within the session.
 *
 * Usage:
 *   const { shouldShow, tasterStage, dismiss } = usePremiumTaster()
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usersService, USERS_STAGE_QUERY_KEY } from '@/services/users'
import { hasPremiumTasterBeenShown, markPremiumTasterShown } from '@/lib/firstPlanReveal'
import type { UserStageValue } from '@/types'

/** The three stage values that trigger a premium taster grant (KALMIO-170). */
const TASTER_STAGES: UserStageValue[] = ['SUHANG', 'FIATAL', 'TERMO']

export interface UsePremiumTasterReturn {
  /** True when the banner should be rendered. */
  shouldShow: boolean
  /**
   * The stage that triggered this taster, if applicable.
   * Undefined when shouldShow is false.
   */
  tasterStage: Extract<UserStageValue, 'SUHANG' | 'FIATAL' | 'TERMO'> | undefined
  /** Call when the user dismisses the banner. Writes localStorage flag. */
  dismiss: () => void
}

export function usePremiumTaster(): UsePremiumTasterReturn {
  const [dismissed, setDismissed] = useState(false)

  const { data: stageData } = useQuery({
    queryKey: USERS_STAGE_QUERY_KEY,
    queryFn: usersService.getMyStage,
    staleTime: 30_000,
    retry: 1,
  })

  const currentStage = stageData?.currentStage

  // Determine if the current stage qualifies for a taster and has not been shown.
  const isTasterStage = currentStage != null && (TASTER_STAGES as UserStageValue[]).includes(currentStage)
  const alreadyShown = currentStage != null ? hasPremiumTasterBeenShown(currentStage) : true

  const shouldShow = isTasterStage && !alreadyShown && !dismissed

  const tasterStage = shouldShow
    ? (currentStage as Extract<UserStageValue, 'SUHANG' | 'FIATAL' | 'TERMO'>)
    : undefined

  function dismiss() {
    if (currentStage) {
      markPremiumTasterShown(currentStage)
    }
    setDismissed(true)
  }

  return { shouldShow, tasterStage, dismiss }
}
