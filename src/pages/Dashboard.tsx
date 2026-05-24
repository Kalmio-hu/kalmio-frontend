import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Header } from '@/components/layout/Header'
import { CalendarStrip } from '@/components/dashboard/CalendarStrip'
import { DailyTimeline } from '@/components/dashboard/DailyTimeline'
import { WeeklySummaryModule } from '@/components/dashboard/WeeklySummaryModule'
import { ActivationCard } from '@/components/dashboard/ActivationCard'
import { ReplanDiffCard } from '@/components/dashboard/ReplanDiffCard'
import { TodaysMealsModule } from '@/components/dashboard/TodaysMealsModule'
import { TodaysPrepModule } from '@/components/dashboard/TodaysPrepModule'
import { TomorrowPrepModule } from '@/components/dashboard/TomorrowPrepModule'
import { PlanGlanceModule } from '@/components/dashboard/PlanGlanceModule'
import { MacrosModule } from '@/components/dashboard/MacrosModule'
import { PointsModule } from '@/components/dashboard/PointsModule'
import { DiofaWidget } from '@/components/diofa/DiofaWidget'
import { MoistureHistoryStrip } from '@/components/diofa/MoistureHistoryStrip'
import { DashboardViewToggle, type DashboardView } from '@/components/dashboard/DashboardViewToggle'
import { CalendarView } from '@/components/dashboard/CalendarView'
import { planService } from '@/services/plans'
import { plannedMealsService } from '@/services/plannedMeals'
import { dashboardService } from '@/services/dashboard'
import { prepTasksService } from '@/services/prepTasks'
import { usersService, USERS_ME_QUERY_KEY } from '@/services/users'
import { momentumService } from '@/services/momentum'
import { usePointsToast } from '@/hooks/usePointsToast'
import type { CalendarDayDto, MoistureBand } from '@/types'
import type { DiofaStage, DiofaMoisture } from '@/components/diofa/DiofaWidget'
import { TeachOnReturnHint } from '@/components/dashboard/TeachOnReturnHint'
import { useEngagementGap } from '@/hooks/useEngagementGap'
import { useAuthStore } from '@/store/auth'
import { todayIsoLocal, addDaysIsoLocal } from '@/lib/utils'
import { PermissionPromptDialog } from '@/components/notification/PermissionPromptDialog'
import { notificationService } from '@/services/notificationService'

// ── View preference persistence ─────────────────────────────────────────────

const VIEW_PREF_KEY = 'kalmio_dashboard_view'

function readViewPref(urlView: string | null): DashboardView {
  // URL param wins (e.g. redirect from /app/calendar)
  if (urlView === 'calendar') return 'calendar'
  if (urlView === 'daily') return 'daily'
  // Then localStorage preference
  try {
    const stored = localStorage.getItem(VIEW_PREF_KEY)
    if (stored === 'calendar' || stored === 'daily') return stored
  } catch {
    // localStorage unavailable — client-only preference, silently ignore.
  }
  return 'daily'
}

function writeViewPref(view: DashboardView) {
  try {
    localStorage.setItem(VIEW_PREF_KEY, view)
  } catch {
    // localStorage unavailable — silently ignore.
  }
}

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
  const today = todayIsoLocal()
  const [selectedDate, setSelectedDate] = useState<string>(today)
  const [selectedDayData, setSelectedDayData] = useState<CalendarDayDto | undefined>()
  const [replanDismissed, setReplanDismissed] = useState(false)
  const userId = useAuthStore((s) => s.user?.id ?? '')

  // View toggle — reads from URL ?view= on first render, falls back to localStorage.
  // After consumption, strip ?view= from the URL so a later refresh respects the
  // localStorage preference (the user's last toggle wins).
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [view, setViewState] = useState<DashboardView>(() =>
    readViewPref(searchParams.get('view')),
  )

  useEffect(() => {
    if (searchParams.get('view') != null) {
      navigate('/app/dashboard', { replace: true })
    }
    // Only on mount; subsequent toggles update state and localStorage, not the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleViewChange(next: DashboardView) {
    setViewState(next)
    writeViewPref(next)
  }

  usePointsToast()

  // Computes the engagement gap bucket once on mount; also writes today's date
  // to localStorage so future sessions can compute their own gap.
  const engagementGapBucket = useEngagementGap()

  const { data: activePlan } = useQuery({
    queryKey: ['plan', 'active'],
    queryFn: planService.getActive,
    staleTime: 60_000,
  })

  const hasActivePlan = activePlan != null

  // DashboardDto — single endpoint for meals, prep tasks, plan glance, flags.
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard', today],
    queryFn: () => dashboardService.get(today),
    staleTime: 30_000,
    enabled: hasActivePlan,
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
    queryKey: USERS_ME_QUERY_KEY,
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

  // KALMIO-315: 7-day prep task window for the notification permission prompt.
  // Checks whether the user has any upcoming prep slots in the next 7 days so the
  // prompt is shown at the right moment (AC: "active plan with prep slots in the next
  // 7 days"). Enabled only when there is an active plan and a userId is known.
  const sevenDayEnd = addDaysIsoLocal(new Date(), 6) // today + 6 = 7 days inclusive
  const { data: upcomingPrepTasks } = useQuery({
    queryKey: ['prep-tasks', 'range', today, sevenDayEnd],
    queryFn: () => prepTasksService.listInRange(today, sevenDayEnd),
    staleTime: 60_000,
    enabled: hasActivePlan && !!userId,
  })
  const hasUpcomingPrepSlots = (upcomingPrepTasks?.length ?? 0) > 0

  // Derive dashboard data for active-plan modules.
  const todaysMeals = dashboardData?.todaysMeals ?? []
  const offPlanMeals = dashboardData?.offPlanMeals ?? []
  const todaysPrepTasks = dashboardData?.todaysPrepTasks ?? []
  const tomorrowsPrepTasks = dashboardData?.tomorrowsPrepTasks ?? []
  const planGlance = dashboardData?.planGlance ?? null

  // ReplanDiffCard: shown when the backend flags a pending diff and user hasn't dismissed.
  const hasReplanDiff = dashboardData?.activeFlags?.hasReplanDiff ?? false
  const showReplanDiff = hasActivePlan && hasReplanDiff && !replanDismissed

  return (
    <div className="flex flex-col">
      <Header title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />

      {/* View toggle — Daily | Calendar */}
      <div className="px-4 pt-3 pb-1">
        <DashboardViewToggle view={view} onChange={handleViewChange} />
      </div>

      {/* ── Calendar view ───────────────────────────────────────────────────── */}
      {view === 'calendar' && <CalendarView />}

      {/* ── Daily view ──────────────────────────────────────────────────────── */}
      {view === 'daily' && (
        <>
          {/* Body data hint — collapsible, shown when body data is entirely missing */}
          {bodyDataIncomplete && <BodyDataHintCard userId={userId} />}

          {/* KALMIO-315: Notification permission prompt — shown only once when user
              has an active plan with at least one prep slot in the next 7 days. */}
          {userId && (
            <PermissionPromptDialog
              userId={userId}
              shouldOffer={hasActivePlan && hasUpcomingPrepSlots}
              onGranted={async (sub) => {
                try {
                  const raw = sub.toJSON()
                  await notificationService.registerSubscription({
                    endpoint: raw.endpoint ?? '',
                    p256dh: (raw.keys as Record<string, string> | undefined)?.p256dh ?? '',
                    auth: (raw.keys as Record<string, string> | undefined)?.auth ?? '',
                  })
                } catch (err) {
                  console.warn('[Dashboard] push subscription registration failed:', err)
                }
              }}
            />
          )}

          {/* ── Empty-plan state (PRD §4.1) ─────────────────────────────────── */}
          {!hasActivePlan && (
            <div className="px-4 pt-4 pb-2">
              <ActivationCard />
            </div>
          )}

          {/* CalendarStrip — always shown; drives date selection for DailyTimeline */}
          <CalendarStrip
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onDayData={setSelectedDayData}
          />

          {hasActivePlan ? (
        /* ── Active-plan dashboard composition (PRD §4.4) ─────────────────── */
        <div className="flex flex-col gap-3 px-4 pt-3 pb-6">

          {/* 1. Replan diff — conditional, above the timeline (PRD §4.5) */}
          {showReplanDiff && activePlan && (
            <ReplanDiffCard
              planId={activePlan.id}
              onAccept={() => setReplanDismissed(true)}
              onDecline={() => setReplanDismissed(true)}
            />
          )}

          {/* 2. Today's meals */}
          <TodaysMealsModule
            meals={todaysMeals}
            offPlanMeals={offPlanMeals}
            activePlan={activePlan}
            isLoading={dashboardLoading}
          />

          {/* 3. Today's prep tasks */}
          <TodaysPrepModule
            tasks={todaysPrepTasks}
            dashboardDate={today}
          />

          {/* 4. Tomorrow's prep tasks */}
          <TomorrowPrepModule tasks={tomorrowsPrepTasks} />

          {/* 5. Plan glance */}
          <PlanGlanceModule glance={planGlance} />

          {/* 6. Macros + Points — side-by-side on ≥768px, stacked on mobile */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <MacrosModule date={selectedDate} />
            <PointsModule />
          </div>

          {/* 7. Weekly summary */}
          <WeeklySummaryModule />

          {/* 8. DailyTimeline — secondary detail view for non-today date selection */}
          {selectedDate !== today && (
            <DailyTimeline
              date={selectedDate}
              hasShoppingDay={selectedDayData?.hasShoppingDay ?? false}
              activePlanId={activePlan?.id ?? null}
              plannedMeals={undefined}
            />
          )}

          {/* 9. Diófa — demoted to bottom of page, framed as status section */}
          <section aria-label={t('diofa.statusSection')}>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              {t('diofa.statusSection')}
            </p>
            <div className="space-y-2">
              <TeachOnReturnHint bucket={engagementGapBucket} />
              <DiofaWidget stage={diofaStage} moisture={diofaMoisture} />
              <MoistureHistoryStrip />
            </div>
          </section>
        </div>
      ) : (
        /* ── No active plan — show DailyTimeline as secondary + Diófa ──────── */
        <div className="flex flex-col gap-3 px-4 pt-3 pb-6">
          <DailyTimeline
            date={selectedDate}
            hasShoppingDay={selectedDayData?.hasShoppingDay ?? false}
            activePlanId={null}
            plannedMeals={selectedDate === today ? todayPlannedMeals : undefined}
          />

          {/* Macros still useful even without a plan */}
          <MacrosModule date={selectedDate} />

          {/* Weekly summary */}
          <WeeklySummaryModule />

          {/* Diófa — demoted section */}
          <section aria-label={t('diofa.statusSection')}>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              {t('diofa.statusSection')}
            </p>
            <div className="space-y-2">
              <TeachOnReturnHint bucket={engagementGapBucket} />
              <DiofaWidget stage={diofaStage} moisture={diofaMoisture} />
              <MoistureHistoryStrip />
            </div>
          </section>
        </div>
      )}
        </>
      )}
    </div>
  )
}
