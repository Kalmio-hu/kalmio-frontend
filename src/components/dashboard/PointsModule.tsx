import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { usePoints } from '@/hooks/usePoints'

function nextHintKey(earnedTypes: Set<string>, hasActivePlan: boolean): string {
  // KALMIO-406 — backend doesn't always fire FIRST_PLAN on first solve/schedule
  // creation, so trust the runtime signal too: if the user already has a plan
  // on the calendar, never nag them to create one.
  if (!earnedTypes.has('FIRST_PLAN') && !hasActivePlan) return 'points.nextHint.firstPlan'
  if (!earnedTypes.has('FIRST_GROOMING')) return 'points.nextHint.firstGrooming'
  if (!earnedTypes.has('FIRST_PREP_DONE')) return 'points.nextHint.firstPrepDone'
  return 'points.nextHint.keepGoing'
}

interface PointsModuleProps {
  /** True when the user already has at least one ACTIVE schedule covering today. */
  hasActivePlan?: boolean
}

export function PointsModule({ hasActivePlan = false }: PointsModuleProps = {}) {
  const { t } = useTranslation()
  const { data } = usePoints()

  const total = data?.total ?? 0
  const earnedTypes = new Set(data?.earnedFirstAchievements ?? [])

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-headline font-bold text-[#1A1A1A]">
            {t('points.total', { count: total })}
          </span>
          <div
            aria-hidden
            className="text-xs font-mono font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full tabular-nums"
          >
            {total} pt
          </div>
        </div>
        <p className="mt-1.5 text-xs text-gray-500">
          {t(nextHintKey(earnedTypes, hasActivePlan))}
        </p>
      </CardContent>
    </Card>
  )
}
