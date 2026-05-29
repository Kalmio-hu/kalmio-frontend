/**
 * SnapshotStalenessBanner
 *
 * Shows an amber banner on the Plan detail page whenever the plan's frozen
 * preferences_snapshot diverges from the current user's live goals or meal
 * preferences. Triggered when:
 *   - Calorie/macro targets changed since the plan was last solved
 *   - Preferred meal types added or removed (different slots would be filled)
 *
 * Clicking "Terv frissítése" triggers a snapshot refresh followed by a full
 * re-solve (mode=ALL) so the plan reflects the updated preferences.
 *
 * Props:
 *   plan                    — the plan template (source of preferencesSnapshot)
 *   liveTargets             — current user's goal-computed targets from /api/users/me/targets
 *   liveSelectedMealTypes   — current user's preferred meal types from UserSettings
 *   currentUserId           — the logged-in user's UUID (to look up the right snapshot key)
 *   isPending               — true while the refresh+solve sequence is in flight
 *   onRefreshAndSolve       — callback to trigger snapshot refresh then full re-solve
 *
 * i18n namespace: plan.detail.snapshotStale.*
 */
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { targetsFromLive, type MemberSnapshot } from '@/lib/planMacros'
import type { PlanTemplate, TargetSetResponse } from '@/types'

// ── Staleness thresholds ────────────────────────────────────────────────────
const KCAL_THRESHOLD = 50     // kcal
const PROTEIN_THRESHOLD = 5   // g
const FAT_THRESHOLD = 3       // g
const CARBS_THRESHOLD = 5     // g

/** Compare two meal-type arrays as sets — order-insensitive. */
function mealTypeSetsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const setA = new Set(a)
  return b.every(v => setA.has(v))
}

function isSnapshotStale(
  snapshot: MemberSnapshot | null,
  live: MemberSnapshot | null,
  liveSelectedMealTypes: string[] | undefined,
): boolean {
  // ── Macro targets ──────────────────────────────────────────────────────
  if (live) {
    if (!snapshot) return live.target_kcal != null

    const snapKcal = typeof snapshot.target_kcal === 'number' ? snapshot.target_kcal : null
    const liveKcal = typeof live.target_kcal === 'number' ? live.target_kcal : null
    if (liveKcal != null) {
      if (snapKcal == null) return true
      if (Math.abs(snapKcal - liveKcal) > KCAL_THRESHOLD) return true
    }

    const snapProtein = typeof snapshot.target_protein_g === 'number' ? snapshot.target_protein_g : null
    const liveProtein = typeof live.target_protein_g === 'number' ? live.target_protein_g : null
    if (liveProtein != null) {
      if (snapProtein == null) return true
      if (Math.abs(snapProtein - liveProtein) > PROTEIN_THRESHOLD) return true
    }

    const snapFat = typeof snapshot.target_fat_g === 'number' ? snapshot.target_fat_g : null
    const liveFat = typeof live.target_fat_g === 'number' ? live.target_fat_g : null
    if (liveFat != null) {
      if (snapFat == null) return true
      if (Math.abs(snapFat - liveFat) > FAT_THRESHOLD) return true
    }

    const snapCarbs = typeof snapshot.target_carbs_g === 'number' ? snapshot.target_carbs_g : null
    const liveCarbs = typeof live.target_carbs_g === 'number' ? live.target_carbs_g : null
    if (liveCarbs != null) {
      if (snapCarbs == null) return true
      if (Math.abs(snapCarbs - liveCarbs) > CARBS_THRESHOLD) return true
    }
  }

  // ── Preferred meal types ───────────────────────────────────────────────
  // Only fire when the user has configured live preferences (non-empty list).
  // Empty live list = "never set" = no opinion, so don't nag.
  if (liveSelectedMealTypes && liveSelectedMealTypes.length > 0) {
    const snapMealTypes = Array.isArray(snapshot?.preferred_meal_types)
      ? (snapshot!.preferred_meal_types as string[])
      : []
    if (!mealTypeSetsEqual(snapMealTypes, liveSelectedMealTypes)) return true
  }

  return false
}

interface SnapshotStalenessBannerProps {
  plan: PlanTemplate
  liveTargets: TargetSetResponse | null | undefined
  /** From UserSettings.mealPlanPreferences.selectedMealTypes */
  liveSelectedMealTypes: string[] | undefined
  currentUserId: string
  isPending: boolean
  onRefreshAndSolve: () => void
}

export function SnapshotStalenessBanner({
  plan,
  liveTargets,
  liveSelectedMealTypes,
  currentUserId,
  isPending,
  onRefreshAndSolve,
}: SnapshotStalenessBannerProps) {
  const { t } = useTranslation()

  const rawSnapshot = (plan.preferencesSnapshot ?? {}) as Record<string, MemberSnapshot>
  const memberSnapshot: MemberSnapshot | null = rawSnapshot[currentUserId] ?? null
  const liveSnapshot: MemberSnapshot | null = targetsFromLive(liveTargets ?? null)

  if (!isSnapshotStale(memberSnapshot, liveSnapshot, liveSelectedMealTypes)) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="
        flex items-center gap-3 px-4 py-3 mb-5
        rounded-[12px] border border-amber-300 bg-amber-50
        text-sm text-amber-900
      "
    >
      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" aria-hidden />
      <span className="flex-1">{t('plan.detail.snapshotStale.banner')}</span>
      <Button
        size="sm"
        variant="secondary"
        onClick={onRefreshAndSolve}
        disabled={isPending}
        className="shrink-0"
      >
        {isPending ? (
          <>
            <Spinner className="h-4 w-4 mr-1.5" />
            {t('plan.detail.snapshotStale.refreshing')}
          </>
        ) : (
          t('plan.detail.snapshotStale.cta')
        )}
      </Button>
    </div>
  )
}
