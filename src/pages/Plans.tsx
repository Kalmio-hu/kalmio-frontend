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
 * Query: ['plan-templates'] → planTemplateService.list()
 * Mutations: copy → invalidate list, archive → invalidate list.
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { PlanTemplateCard } from '@/components/plan/PlanTemplateCard'
import { planTemplateService } from '@/services/plans'
import { usersService } from '@/services/users'
import { toast } from '@/components/ui/toast'
import type { PlanTemplateStatus } from '@/types'

type ListFilter = 'active' | 'draft' | 'archived' | 'all'

export function Plans() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [filter, setFilter] = useState<ListFilter>('all')

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

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: usersService.getMe,
    staleTime: 60_000,
  })

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

      {/* Skeleton / loading */}
      {isLoading && (
        <div className="flex justify-center py-10" aria-live="polite" aria-busy="true">
          <Spinner />
        </div>
      )}

      {/* Error state */}
      {isError && (
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
      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-[#6b7280] text-sm">{t('plan.list.empty')}</p>
          <Button onClick={() => navigate('/app/plans/new')} size="sm">
            {t('plan.list.newPlan')}
          </Button>
        </div>
      )}

      {/* Plan list */}
      {!isLoading && !isError && filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map(plan => (
            <PlanTemplateCard
              key={plan.id}
              plan={plan}
              memberNames={memberNames}
              isDefault={plan.isDefault}
              onCopy={id => copyMutation.mutate(id)}
              onArchive={id => archiveMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
