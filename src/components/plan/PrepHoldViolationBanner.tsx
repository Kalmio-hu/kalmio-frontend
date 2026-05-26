/**
 * PrepHoldViolationBanner — KALMIO-268 (Prep-H)
 *
 * Renders a compact amber warning card when a meal's batch prep slot violates
 * the recipe's fridge hold window (i.e. the gap between prep and the meal is
 * larger than the recipe can stay fresh).
 *
 * Props:
 *   surface          — 'template' (PlanDetail) or 'schedule' (ScheduleDetail)
 *   planOrScheduleId — plan id (template) or schedule id (schedule)
 *   mealId           — templateMealId (template) or plannedMealId (schedule)
 *
 * Renders nothing when there is no violation for the given meal.
 * Auto-dismisses after a successful split because the re-query returns empty.
 */
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { templatePrepSlotsService } from '@/services/templatePrepSlots'
import { prepTasksService } from '@/services/prepTasks'

// ── Violation DTO shapes ──────────────────────────────────────────────────────

/** Returned by GET /api/plans/{planId}/prep-hold-violations */
export interface TemplatePrepHoldViolation {
  templateMealId: string
  templatePrepSlotId: string
  dayGap: number
  fridgeWindow: number
  recipeId: string
}

/** Returned by GET /api/schedules/{id}/prep-hold-violations */
export interface SchedulePrepHoldViolation {
  plannedMealId: string
  prepTaskId: string
  dayGap: number
  fridgeWindow: number
  recipeId: string
}

// ── Service fetchers ──────────────────────────────────────────────────────────

function fetchTemplateViolations(planId: string): Promise<TemplatePrepHoldViolation[]> {
  return api
    .get<TemplatePrepHoldViolation[]>(`/api/plans/${planId}/prep-hold-violations`)
    .then(r => r.data)
}

function fetchScheduleViolations(scheduleId: string): Promise<SchedulePrepHoldViolation[]> {
  return api
    .get<SchedulePrepHoldViolation[]>(`/api/schedules/${scheduleId}/prep-hold-violations`)
    .then(r => r.data)
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface PrepHoldViolationBannerProps {
  surface: 'template' | 'schedule'
  planOrScheduleId: string
  mealId: string
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PrepHoldViolationBanner({
  surface,
  planOrScheduleId,
  mealId,
}: PrepHoldViolationBannerProps) {
  const { t } = useTranslation()
  const qc = useQueryClient()

  // Namespace for i18n keys — template surface uses plan.prep.violation,
  // schedule surface uses schedules.prep.violation.
  const ns = surface === 'template' ? 'plan.prep.violation' : 'schedules.prep.violation'

  // ── Query — list all violations for this plan or schedule ─────────────────

  const templateQuery = useQuery({
    queryKey: ['prep-hold-violations', 'template', planOrScheduleId] as const,
    queryFn: () => fetchTemplateViolations(planOrScheduleId),
    enabled: surface === 'template',
    staleTime: 30_000,
  })

  const scheduleQuery = useQuery({
    queryKey: ['prep-hold-violations', 'schedule', planOrScheduleId] as const,
    queryFn: () => fetchScheduleViolations(planOrScheduleId),
    enabled: surface === 'schedule',
    staleTime: 30_000,
  })

  const isLoading = surface === 'template' ? templateQuery.isLoading : scheduleQuery.isLoading

  // ── Find the violation for this specific meal ─────────────────────────────

  let violation: { prepSlotOrTaskId: string; dayGap: number; fridgeWindow: number } | null = null

  if (surface === 'template' && templateQuery.data) {
    const found = templateQuery.data.find(v => v.templateMealId === mealId)
    if (found) {
      violation = {
        prepSlotOrTaskId: found.templatePrepSlotId,
        dayGap: found.dayGap,
        fridgeWindow: found.fridgeWindow,
      }
    }
  } else if (surface === 'schedule' && scheduleQuery.data) {
    const found = scheduleQuery.data.find(v => v.plannedMealId === mealId)
    if (found) {
      violation = {
        prepSlotOrTaskId: found.prepTaskId,
        dayGap: found.dayGap,
        fridgeWindow: found.fridgeWindow,
      }
    }
  }

  // ── Split mutation ────────────────────────────────────────────────────────
  // The mutationFn returns void so we don't have to unify the two different
  // return types (TemplatePrepSlot[] vs PrepTaskDto[]).

  const splitMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (surface === 'template') {
        await templatePrepSlotsService.split(violation!.prepSlotOrTaskId)
      } else {
        await prepTasksService.split(violation!.prepSlotOrTaskId)
      }
    },
    onSuccess: () => {
      toast({ title: t(`${ns}.splitSuccess`), variant: 'success' })
      if (surface === 'template') {
        void qc.invalidateQueries({ queryKey: ['template-prep-slots', planOrScheduleId] })
        void qc.invalidateQueries({ queryKey: ['prep-hold-violations', 'template', planOrScheduleId] })
      } else {
        void qc.invalidateQueries({ queryKey: ['prep-tasks', planOrScheduleId] })
        void qc.invalidateQueries({ queryKey: ['prep-hold-violations', 'schedule', planOrScheduleId] })
      }
    },
    onError: () => {
      toast({ title: t('common.errorGeneric'), variant: 'destructive' })
    },
  })

  // Render nothing when still loading or no violation exists for this meal
  if (isLoading || !violation) return null

  const { dayGap: rawDayGap, fridgeWindow } = violation
  // dayGap from the API is the raw calendar gap (meal_day - prep_day).
  // The banner message says "X days more than the fridge window" — that excess
  // is rawDayGap - fridgeWindow, not rawDayGap itself.
  // Example: rawDayGap=4, fridgeWindow=3 → overBy=1 ("1 nappal több").
  const dayGap = rawDayGap - fridgeWindow

  return (
    <div
      role="alert"
      aria-live="polite"
      className="
        flex items-start gap-2.5
        rounded-[10px] border border-amber-200 bg-amber-50
        px-3 py-2.5
        mb-1.5
      "
    >
      {/* Icon */}
      <AlertTriangle
        className="h-4 w-4 shrink-0 text-amber-600 mt-0.5"
        aria-hidden
      />

      {/* Text block */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-amber-900 leading-snug">
          {t(`${ns}.title`)}
        </p>
        <p className="text-xs text-amber-800 mt-0.5 leading-snug">
          {t(`${ns}.body`, { dayGap, fridgeWindow })}
        </p>
      </div>

      {/* Split action */}
      <button
        type="button"
        disabled={splitMutation.isPending}
        onClick={() => splitMutation.mutate()}
        className="
          shrink-0 inline-flex items-center gap-1
          text-[11px] font-semibold text-amber-900
          bg-amber-100 hover:bg-amber-200
          border border-amber-300
          rounded-[6px] px-2 py-1
          transition-colors
          focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500
          disabled:opacity-50 disabled:cursor-not-allowed
        "
        aria-label={t(`${ns}.cta`)}
      >
        {splitMutation.isPending ? (
          <Spinner className="h-3 w-3" />
        ) : null}
        {t(`${ns}.cta`)}
      </button>
    </div>
  )
}
