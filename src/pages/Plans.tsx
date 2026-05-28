/**
 * Plans — plan-template list page (C11 / KALMIO-233).
 *
 * Shows every PlanTemplate owned by or shared with the current user.
 * The seeded default plan is always first and visually pinned.
 *
 * Filter chips: All / Active / Draft / Archived (archived hidden by default).
 * Each card links to /app/plans/:id (PlanDetail — C13).
 * "Új terv" CTA leads to /app/plans/new (wizard — C12).
 *
 * Updated for KALMIO-309: cards expose a primary "Run this plan" CTA that opens
 * RunPlanDialog. Empty templates show "Fill with planner" instead.
 *
 * KALMIO-436: When the page receives ?fresh=1 (redirected from the onboarding
 * shell completion path), the default plan is auto-solved if it has no
 * template meals yet. A "Készítem a tervet…" banner is shown during the solve.
 * The query param is cleared from the URL once the solve completes.
 *
 * KALMIO-445: After the auto-solve completes (fresh=1 landing), RunPlanDialog
 * is automatically opened for the default plan with startDate=today, provided
 * the user has not already dismissed the "firstPlanSchedule" coachmark.
 * Confirming the schedule navigates to /app/today. This fires once per user.
 *
 * Query: ['plan-templates'] → planTemplateService.list()
 * Mutations: copy → invalidate list, archive → invalidate list.
 */
import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { PlanTemplateCard } from '@/components/plan/PlanTemplateCard'
import { RunPlanDialog } from '@/components/plan/RunPlanDialog'
import { planTemplateService } from '@/services/plans'
import { usersService, USERS_ME_QUERY_KEY } from '@/services/users'
import { toast } from '@/components/ui/toast'
import type { PlanTemplate, PlanTemplateStatus } from '@/types'

type ListFilter = 'active' | 'draft' | 'archived' | 'all'

export function Plans() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const [filter, setFilter] = useState<ListFilter>('all')
  const [runPlanTarget, setRunPlanTarget] = useState<PlanTemplate | null>(null)
  // Flag that we should auto-schedule after solve/fresh landing.
  const pendingAutoScheduleRef = useRef(false)

  // ── Server state ──────────────────────────────────────────────────────────

  const {
    data: plans = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['plan-templates'],
    queryFn: () => planTemplateService.list(),
    staleTime: 30_000,
    retry: 1,
  })

  // ── KALMIO-436: Auto-solve on fresh=1 landing ──────────────────────────────
  // When the user arrives from the onboarding shell with ?fresh=1, find the
  // default plan and trigger the solver if it has no template meals yet.
  // We guard with a ref so the mutation fires at most once per page visit even
  // if the component re-renders while the solve is in flight.

  const autoSolveTriggered = useRef(false)

  const solveMutation = useMutation({
    mutationFn: (planId: string) => planTemplateService.solve(planId, 'ALL'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['plan-templates'] })
      // Remove the ?fresh=1 param so a hard refresh doesn't re-trigger the solve.
      navigate('/app/plans', { replace: true })
      // Signal that we should auto-schedule once the refreshed plan list is available.
      pendingAutoScheduleRef.current = true
    },
    onError: () => {
      // Surface the failure to the user instead of dropping the request silently.
      // The most common cause is solver infeasibility (HTTP 422) — typically
      // a dietary + calorie + slot-count combination the catalog can't satisfy.
      // The user is in the post-onboarding fresh=1 landing and would otherwise
      // see an empty draft plan with no explanation. The Hungarian copy tells
      // them what to do next; they can then change a preference and tap
      // "Feltöltés tervezővel" to retry.
      toast({
        title: t('plan.list.solveErrorTitle'),
        description: t('plan.list.solveErrorBody'),
        variant: 'destructive',
        duration: 8000,
      })
      navigate('/app/plans', { replace: true })
    },
  })

  const isFreshLanding = searchParams.get('fresh') === '1'

  useEffect(() => {
    if (
      !isFreshLanding ||
      autoSolveTriggered.current ||
      isLoading ||
      solveMutation.isPending
    ) return

    // Find the default plan with no meals assigned yet.
    const defaultPlan = plans.find(p => p.isDefault)
    if (!defaultPlan) return

    const isEmpty = defaultPlan.templateMeals.length === 0
    if (!isEmpty) {
      // Plan already has meals — redirect without solving; still auto-schedule.
      navigate('/app/plans', { replace: true })
      pendingAutoScheduleRef.current = true
      return
    }

    autoSolveTriggered.current = true
    solveMutation.mutate(defaultPlan.id)
  }, [isFreshLanding, isLoading, plans, solveMutation, navigate])

  const { data: me } = useQuery({
    queryKey: USERS_ME_QUERY_KEY,
    queryFn: usersService.getMe,
    staleTime: 60_000,
  })

  // ── Auto-schedule after first-plan solve ──────────────────────────────────
  // After the auto-solve completes (fresh=1 landing), automatically call
  // runPlan with startDate=today so the user lands on /app with their first
  // day's meals already scheduled.
  // On 422 (schedule already exists) or any other error: show a toast and
  // stay on /app/plans so the user can manually schedule.
  // Guard: fires at most once per page visit via pendingAutoScheduleRef.

  const autoScheduleMutation = useMutation({
    mutationFn: (planId: string) =>
      planTemplateService.runPlan(planId, {
        startDate: new Date().toISOString().slice(0, 10),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['schedules'] })
      void queryClient.invalidateQueries({ queryKey: ['plan-templates'] })
      navigate('/app')
    },
    onError: () => {
      toast({
        title: t('plans.autoScheduleFailed'),
        variant: 'destructive',
        duration: 8000,
      })
      navigate('/app/plans', { replace: true })
    },
  })

  useEffect(() => {
    if (!pendingAutoScheduleRef.current) return
    if (isLoading) return
    if (autoScheduleMutation.isPending) return

    const defaultPlan = plans.find(p => p.isDefault)
    if (!defaultPlan) return

    // Claim the pending flag synchronously so re-renders can't double-fire.
    pendingAutoScheduleRef.current = false
    autoScheduleMutation.mutate(defaultPlan.id)
  // autoScheduleMutation.mutate is stable (TanStack guarantee).
  // Ref changes do not need to be in the dep array.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, plans])

  // ── Mutations ─────────────────────────────────────────────────────────────

  const copyMutation = useMutation({
    mutationFn: (id: string) => planTemplateService.copy(id),
    onSuccess: (copy) => {
      void queryClient.invalidateQueries({ queryKey: ['plan-templates'] })
      toast({ title: t('plan.detail.copySuccess'), variant: 'success' })
      navigate(`/app/plans/${copy.id}`)
    },
    onError: () => {
      toast({ title: t('common.errorGeneric'), variant: 'destructive' })
    },
  })

  const archiveMutation = useMutation({
    mutationFn: (id: string) => planTemplateService.archive(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['plan-templates'] })
    },
  })

  // ── Member name map ───────────────────────────────────────────────────────

  const memberNames: Record<string, string> = {}
  if (me?.id) {
    memberNames[me.id] =
      ([me.firstName, me.lastName].filter(Boolean).join(' ') || me.email) ?? me.id
  }

  // ── Filtering ─────────────────────────────────────────────────────────────

  function matchesFilter(status: PlanTemplateStatus): boolean {
    if (filter === 'all') return status !== 'ARCHIVED'
    if (filter === 'active') return status === 'ACTIVE'
    if (filter === 'draft') return status === 'DRAFT'
    if (filter === 'archived') return status === 'ARCHIVED'
    return true
  }

  // Sort: default plan first (backend flag), then by updatedAt desc
  const sorted = [...plans].sort((a, b) => {
    const aDefault = a.isDefault ? 0 : 1
    const bDefault = b.isDefault ? 0 : 1
    if (aDefault !== bDefault) return aDefault - bDefault
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  const filtered = sorted.filter(p => matchesFilter(p.status))

  // ── Filter chips config ───────────────────────────────────────────────────

  const FILTERS: { key: ListFilter; label: string }[] = [
    { key: 'all', label: t('plan.list.filter.all') },
    { key: 'active', label: t('plan.list.filter.active') },
    { key: 'draft', label: t('plan.list.filter.draft') },
    { key: 'archived', label: t('plan.list.filter.archived') },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 pb-10">
      <Header
        title={t('plan.list.title')}
        actions={
          <Button
            onClick={() => navigate('/app/plans/new')}
            size="sm"
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" aria-hidden />
            {t('plan.list.newPlan')}
          </Button>
        }
      />

      {/* Subtitle / first-time hint */}
      <p className="text-sm text-[#6b7280] mb-4 -mt-2">
        {t('plan.list.subtitle')}
      </p>

      {/* Filter chips */}
      <div
        className="flex gap-2 flex-wrap mb-6"
        role="group"
        aria-label={t('plan.list.filter.label')}
      >
        {FILTERS.map(f => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium transition-colors
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]
              ${filter === f.key
                ? 'bg-[#4f46e5] text-white'
                : 'bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb]'}
            `}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* KALMIO-436: Auto-generation banner — shown while the solver runs post-induction */}
      {solveMutation.isPending && (
        <div
          className="flex flex-col items-center gap-3 py-10 text-center"
          aria-live="polite"
          aria-busy="true"
          data-testid="auto-solve-banner"
        >
          <div className="w-9 h-9 rounded-full border-2 border-[#F28C28] border-t-transparent animate-spin" aria-hidden="true" />
          <p className="text-sm font-semibold text-[#1A1A1A]">
            {t('onboarding.handoff.preparing')}
          </p>
          <p className="text-xs text-[#6B6460] max-w-xs leading-relaxed">
            {t('onboarding.handoff.preparingBody')}
          </p>
        </div>
      )}

      {/* Skeleton / loading */}
      {isLoading && !solveMutation.isPending && (
        <div className="flex justify-center py-10" aria-live="polite" aria-busy="true">
          <Spinner />
        </div>
      )}

      {/* Error state */}
      {isError && !solveMutation.isPending && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-red-600">{t('common.errorGeneric')}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="text-sm text-[#4f46e5] underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5] rounded"
          >
            {t('plan.list.retry')}
          </button>
        </div>
      )}

      {/* Empty state — should never appear (A7 seeds the default plan) */}
      {!isLoading && !isError && !solveMutation.isPending && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-[#6b7280] text-sm">{t('plan.list.empty')}</p>
          <Button onClick={() => navigate('/app/plans/new')} size="sm">
            {t('plan.list.newPlan')}
          </Button>
        </div>
      )}

      {/* Plan list */}
      {!isLoading && !isError && !solveMutation.isPending && filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map(plan => (
            <PlanTemplateCard
              key={plan.id}
              plan={plan}
              memberNames={memberNames}
              isDefault={plan.isDefault}
              onCopy={id => copyMutation.mutate(id)}
              onArchive={id => archiveMutation.mutate(id)}
              onRun={() => setRunPlanTarget(plan)}
            />
          ))}
        </div>
      )}

      {/* RunPlanDialog — opened from card primary CTA (manual scheduling) */}
      {runPlanTarget != null && (
        <RunPlanDialog
          plan={runPlanTarget}
          open={runPlanTarget != null}
          onOpenChange={open => {
            if (!open) setRunPlanTarget(null)
          }}
          onSuccess={() => setRunPlanTarget(null)}
        />
      )}
    </div>
  )
}
