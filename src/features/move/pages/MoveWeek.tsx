/**
 * "Hét" — the weekly plan (PRD §7.2, §8.1). Seven days, session chips, rest
 * days as part of the plan, drag to move (409 → reason, snap back),
 * "Másikat kérek", "Ma nem megy", the target line with the reserve rule,
 * previous / next week, and "Újratervezés" that yields a diff, never an apply.
 */
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { MovePageFrame } from '../components/MovePageFrame'
import { WeekGrid } from '../components/WeekGrid'
import { ReplanDiffCard } from '../components/ReplanDiffCard'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { useMoveT } from '../lib/register'
import { buildWeekView } from '../lib/weekView'
import { todayIso } from '../lib/dates'
import type { MoveReplanDiffDto } from '../types'

export function MoveWeek() {
  const { t } = useMoveT()
  const qc = useQueryClient()
  const [params, setParams] = useSearchParams()
  const start = params.get('start') ?? undefined
  const q = useQuery({ queryKey: moveKeys.week(start), queryFn: () => moveService.getWeek(start), staleTime: 30_000 })
  const modalities = useQuery({ queryKey: moveKeys.modalities, queryFn: moveService.getModalities, staleTime: 10 * 60_000 })
  const [diff, setDiff] = useState<MoveReplanDiffDto | null>(null)

  const regenerate = useMutation({
    mutationFn: () => moveService.regenerateWeek(),
    onSuccess: (res) => {
      if (res.diff) setDiff(res.diff)
      else toast({ title: t('week.regenerateNoChange'), variant: 'success' })
      void qc.invalidateQueries({ queryKey: moveKeys.replan })
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  const view = q.data ? buildWeekView(q.data, todayIso()) : null
  const goTo = (weekStart: string | null) => {
    const next = new URLSearchParams(params)
    if (weekStart) next.set('start', weekStart)
    else next.delete('start')
    setParams(next)
  }

  return (
    <MovePageFrame
      title={t('week.title')}
      subtitle={t('week.subtitle')}
      isLoading={q.isPending}
      isError={q.isError}
      onRetry={() => void q.refetch()}
      actions={
        view && (
          <nav aria-label={t('week.title')} className="flex items-center gap-1">
            <Button variant="ghost" size="md" onClick={() => goTo(view.previousStart)} aria-label={t('week.prev')} className="min-h-12 min-w-12 px-2">
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </Button>
            {!view.isCurrentWeek && (
              <Button variant="secondary" size="md" onClick={() => goTo(null)} className="min-h-12">
                {t('week.thisWeek')}
              </Button>
            )}
            <Button variant="ghost" size="md" onClick={() => goTo(view.nextStart)} aria-label={t('week.next')} className="min-h-12 min-w-12 px-2">
              <ChevronRight className="h-5 w-5" aria-hidden />
            </Button>
          </nav>
        )
      }
    >
      {view && (
        <div className="space-y-4">
          <section className="move-block bg-white rounded-[16px] border border-[#e5e4e7] shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-headline text-xl font-bold text-[#1A1A1A]">
                {t('week.targetLine', { done: view.target.done, planned: view.target.planned })}
                {view.target.activeWeek && <span className="ml-2 text-sm font-semibold text-[#2A9D8F]">· {t('week.activeWeek')}</span>}
              </p>
              <p className="text-sm text-gray-600">{t('week.reserveRule')}</p>
            </div>
            <div className="text-right">
              <Button variant="secondary" onClick={() => regenerate.mutate()} disabled={regenerate.isPending} className="min-h-12">
                <RefreshCw className="h-4 w-4" aria-hidden />
                {t('week.regenerate')}
              </Button>
              <p className="mt-1 text-xs text-gray-500 max-w-xs">{t('week.regenerateHint')}</p>
            </div>
          </section>

          {diff && <ReplanDiffCard diff={diff} onResolved={() => setDiff(null)} />}

          {view.target.planned === 0 && view.days.every((d) => d.restDay) && <p className="text-sm text-gray-500">{t('week.empty')}</p>}

          <WeekGrid view={view} modalities={modalities.data ?? []} weekStart={start} />
        </div>
      )}
    </MovePageFrame>
  )
}
