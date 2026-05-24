/**
 * Prep utility helpers.
 *
 * Used by DailyTimeline (KALMIO-318, KALMIO-321) for the embedded-prep chip
 * and the batch-prep portion-breakdown text.
 */

import type { PrepTaskCard } from '@/types'

// ── KALMIO-318: prep chip ─────────────────────────────────────────────────

/**
 * Sums the durationMin of every embedded prep in the list.
 * Returns 0 when the list is empty or all durations are null.
 */
export function sumEmbeddedPrepDuration(preps: PrepTaskCard[]): number {
  return preps.reduce((acc, p) => acc + (p.durationMin ?? 0), 0)
}

/**
 * Returns true when every prep in the list has status === 'DONE'.
 * A list with zero preps counts as not-done (chip should not show at all).
 */
export function allEmbeddedPrepsDone(preps: PrepTaskCard[]): boolean {
  if (preps.length === 0) return false
  return preps.every(p => p.status === 'DONE')
}

// ── KALMIO-321: batch prep portion breakdown ──────────────────────────────

/**
 * Identifies whether a prep task is a batch (feeds more than one meal).
 */
export function isBatchPrep(prep: PrepTaskCard): boolean {
  return (prep.feedsPlannedMealIds?.length ?? 0) > 1
}

/**
 * Structured data for the portion breakdown line on the first-consumption meal.
 * The component uses this with t('dashboard.prep.portion.breakdown', {...}).
 *
 * Returns null when the prep is not a batch (single meal).
 */
export interface PortionBreakdownData {
  total: number
  laterCount: number
  laterLabels: string
}

export function getPortionBreakdownData(
  prep: PrepTaskCard,
  firstMealId: string,
  mealDayLabels: Record<string, string>,
): PortionBreakdownData | null {
  const feeds = prep.feedsPlannedMealIds ?? []
  if (feeds.length <= 1) return null

  const total = prep.servingsToMake ?? feeds.length
  const laterMealIds = feeds.filter(id => id !== firstMealId)
  const laterCount = laterMealIds.length
  const laterLabels = laterMealIds
    .map(id => mealDayLabels[id] ?? '?')
    .join(' / ')

  return { total, laterCount, laterLabels }
}
