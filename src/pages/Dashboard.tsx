import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Header } from '@/components/layout/Header'
import { CalendarStrip } from '@/components/dashboard/CalendarStrip'
import { DailyTimeline } from '@/components/dashboard/DailyTimeline'
import { WeeklySummaryModule } from '@/components/dashboard/WeeklySummaryModule'
import { DiofaWidget } from '@/components/diofa/DiofaWidget'
import { MoistureHistoryStrip } from '@/components/diofa/MoistureHistoryStrip'
import { planService } from '@/services/plans'
import { plannedMealsService } from '@/services/plannedMeals'
import { usersService } from '@/services/users'
import { momentumService } from '@/services/momentum'
import { usePointsToast } from '@/hooks/usePointsToast'
import type { CalendarDayDto, MoistureBand } from '@/types'
import type { DiofaStage, DiofaMoisture } from '@/components/diofa/DiofaWidget'
import { TeachOnReturnHint } from '@/components/dashboard/TeachOnReturnHint'
import { useEngagementGap } from '@/hooks/useEngagementGap'
import { useAuthStore } from '@/store/auth'

// Maps the 4-value MoistureBand from the backend to the 3-value DiofaMoisture used by the widget.
function toWidgetMoisture(band: MoistureBand): DiofaMoisture {
  if (band === 'SATURATED') return 'WET'
  if (band === 'MOIST') return 'OK'
  return 'DRY' // DRY | DRYING
}

// ---------------------------------------------------------------------------
// BodyDataHintCard — KALMIO-241
// Collapsible banner nudging the user to complete body data on their profile.
// Shown only when both weightKg and heightCm are null (genuinely incomplete).
// Dismissed per-device via localStorage; resets if data is later deleted.
// ---------------------------------------------------------------------------

const BODY_DATA_HINT_DISMISSED_KEY = 'kalmio_body_data_hint_dismissed'

function BodyDataHintCard({ userId }: { userId: string }) {
  const { t } = useTranslation()
  const storageKey = `${BODY_DATA_HINT_DISMISSED_KEY}_${userId}`

  // Read dismissed state lazily — client-only UI preference, not product data.
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(storageKey) === '1'
    } catch {
      return false
    }
  })

  function dismiss() {
    try {
      localStorage.setItem(storageKey, '1')
    } catch {
      // localStorage unavailable — silently ignore.
    }
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <div
      className="mx-4 mt-3 rounded-xl border border-[#F28C28]/40 bg-[#FEF3E7] px-4 py-3"
      role="note"
      aria-label={t('onboarding.bodyDataHint.title')}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#1A1A1A]">
            {t('onboarding.bodyDataHint.title')}
          </p>
          <p className="text-xs text-[#6B6460] leading-relaxed mt-0.5">
            {t('onboarding.bodyDataHint.body')}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 mt-0.5 text-[#6B6460] hover:text-[#1A1A1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-1 rounded"
          aria-label={t('common.close')}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
            <path d="M4.28 3.22a.75.75 0 0 0-1.06 1.06L6.94 8l-3.72 3.72a.75.75 0 1 0 1.06 1.06L8 9.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L9.06 8l3.72-3.72a.75.75 0 0 0-1.06-1.06L8 6.94 4.28 3.22z"/>
          </svg>
        </button>
      </div>
      <Link
        to="/app/profile?section=body-data"
        className="mt-2 inline-block text-xs font-semibold text-[#F28C28] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-1 rounded"
      >
        {t('onboarding.bodyDataHint.cta')}
      </Link>
    </div>
  )
}

export function Dashboard() {
  const { t } = useTranslation()
  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState<string>(today)
  const [selectedDayData, setSelectedDayData] = useState<CalendarDayDto | undefined>()
  const userId = useAuthStore((s) => s.user?.id ?? '')

  usePointsToast()

  // Computes the engagement gap bucket once on mount; also writes today's date
  // to localStorage so future sessions can compute their own gap.
  const engagementGapBucket = useEngagementGap()

  const { data: activePlan } = useQuery({
    queryKey: ['plan', 'active'],
    queryFn: planService.getActive,
    staleTime: 60_000,
  })

  // Today's meals from the materialized planned_meal table (meal-planning-v2).
  // Used by DailyTimeline to render the new source of truth for today's meal slots.
  const { data: todayPlannedMeals = [] } = useQuery({
    queryKey: ['planned-meals', today, today],
    queryFn: () => plannedMealsService.listInRange(today, today),
    staleTime: 30_000,
  })

  const { data: dashboardState } = useQuery({
    queryKey: ['users', 'me', 'dashboard-state'],
    queryFn: usersService.getMyDashboardState,
    staleTime: 30_000,
    retry: false,
  })

  // Fetch user to check body-data completeness for the hint card (KALMIO-241).
  // Reuses the ['users', 'me'] key — no extra network request if already warm.
  const { data: user } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: usersService.getMe,
    staleTime: 30_000,
    enabled: !!userId,
  })

  const bodyDataIncomplete = !!user && user.weightKg == null && user.heightCm == null

  // Fetch recent moisture history to derive the widget's current moisture band.
  const { data: moistureHistory } = useQuery({
    queryKey: ['momentum', 'history', 1],
    queryFn: () => momentumService.getHistory(1),
    staleTime: 30_000,
    retry: false,
  })

  const diofaStage = (dashboardState?.stage as DiofaStage | undefined) ?? 'MAG'
  const todayBand = moistureHistory?.[moistureHistory.length - 1]?.band
  const diofaMoisture: DiofaMoisture = todayBand ? toWidgetMoisture(todayBand) : 'OK'

  return (
    <div className="flex flex-col">
      <Header title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
      {/* Body data hint — collapsible, shown when body data is entirely missing */}
      {bodyDataIncomplete && <BodyDataHintCard userId={userId} />}
      <CalendarStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onDayData={setSelectedDayData}
      />
      <DailyTimeline
        date={selectedDate}
        hasShoppingDay={selectedDayData?.hasShoppingDay ?? false}
        activePlanId={activePlan?.id ?? null}
        plannedMeals={selectedDate === today ? todayPlannedMeals : undefined}
      />
      <section aria-label={t('diofa.sectionLabel')} className="px-4 pb-4 space-y-3">
        <TeachOnReturnHint bucket={engagementGapBucket} />
        <DiofaWidget stage={diofaStage} moisture={diofaMoisture} />
        <MoistureHistoryStrip />
      </section>
      <div className="px-4 pb-6">
        <WeeklySummaryModule />
      </div>
    </div>
  )
}
