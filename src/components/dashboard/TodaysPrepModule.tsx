import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { prepTaskService } from '@/services/dashboard'
import { getRecipeNameFromTranslations } from '@/lib/i18nRecipe'
import { useSyncInvalidation } from '@/hooks/useSyncInvalidation'
import type { PrepTaskCard, PrepType, PrepWindow, DashboardDto } from '@/types'

interface TodaysPrepModuleProps {
  tasks: PrepTaskCard[]
  dashboardDate: string
}

function prepTypeLabel(prepType: PrepType, t: (key: string) => string): string {
  const key = `dashboard.prep.prepTypeLabels.${prepType}`
  return t(key)
}

function windowLabel(window: PrepWindow, t: (key: string) => string): string {
  const key = `dashboard.prep.windowLabels.${window}`
  return t(key)
}

interface PrepTaskRowProps {
  task: PrepTaskCard
  dashboardDate: string
}

function PrepTaskRow({ task, dashboardDate }: PrepTaskRowProps) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language?.startsWith('hu') ? 'hu' : 'en') as 'hu' | 'en'
  const queryClient = useQueryClient()

  const markDone = useMutation({
    mutationFn: () => {
      if (!task.id) return Promise.reject(new Error('no id'))
      return prepTaskService.updateStatus(task.id, 'DONE')
    },
    onMutate: async () => {
      if (!task.id) return undefined
      await queryClient.cancelQueries({ queryKey: ['dashboard', dashboardDate] })
      const snapshot = queryClient.getQueryData<DashboardDto>(['dashboard', dashboardDate])
      // Optimistically mark the task as DONE in the dashboard cache.
      queryClient.setQueryData<DashboardDto>(['dashboard', dashboardDate], (prev) => {
        if (!prev) return prev
        function applyDone(list: PrepTaskCard[]): PrepTaskCard[] {
          return list.map((p) => p.id === task.id ? { ...p, status: 'DONE' } : p)
        }
        return {
          ...prev,
          todaysPrepTasks: applyDone(prev.todaysPrepTasks),
          tomorrowsPrepTasks: applyDone(prev.tomorrowsPrepTasks),
        }
      })
      return { snapshot }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard', dashboardDate] })
      void queryClient.invalidateQueries({ queryKey: ['points'] })
      toast({ title: t('dashboard.prep.markDone'), variant: 'success' })
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(['dashboard', dashboardDate], context.snapshot)
      }
      toast({ title: t('mutation.prepTaskError'), variant: 'destructive' })
    },
  })

  const hasId = !!task.id
  const isDone = task.status === 'DONE'
  const typeLabel = prepTypeLabel(task.prepType, t)
  const wLabel = windowLabel(task.window, t)

  return (
    <div className={[
      'flex items-start gap-3 p-3 rounded-[12px]',
      isDone ? 'bg-[#F0F0EC] opacity-60' : 'bg-[#F9F7F2]',
    ].join(' ')}>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium capitalize">{wLabel}</p>
        <p className={['text-sm font-semibold leading-tight', isDone ? 'line-through text-gray-400' : 'text-[#1A1A1A]'].join(' ')}>
          {getRecipeNameFromTranslations(task.recipeTranslations ?? null, task.recipeName, lang)}
        </p>
        <p className="text-xs text-gray-400">{typeLabel}</p>
        {task.servingsToMake != null && task.servingsToMake > 0 && (
          <p className="text-xs text-gray-500 mt-0.5">
            {t('dashboard.prep.cookServings', { count: Number(task.servingsToMake) })}
            {task.feedsPlannedMealIds && task.feedsPlannedMealIds.length > 1 && (
              <span className="text-gray-400">
                {' '}· {t('dashboard.prep.feedsMeals', { count: task.feedsPlannedMealIds.length })}
              </span>
            )}
          </p>
        )}
        {task.servingsToFreeze != null && Number(task.servingsToFreeze) > 0 && (
          <p className="text-[11px] mt-0.5 text-blue-600 font-medium">
            {t('dashboard.prep.freezeAtPrep', { count: Number(task.servingsToFreeze) })}
          </p>
        )}
        {task.durationMin != null && (
          <p className="text-xs text-gray-400 mt-0.5">
            {t('dashboard.prep.durationMin', { count: task.durationMin })}
          </p>
        )}
      </div>
      <div className="shrink-0">
        {isDone ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100" aria-label={t('dashboard.prep.done')}>
            <Check className="h-4 w-4 text-green-600" aria-hidden />
          </div>
        ) : hasId ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => markDone.mutate()}
            disabled={markDone.isPending}
            aria-label={t('dashboard.prep.markDone')}
          >
            {markDone.isPending ? (
              <Spinner className="h-3.5 w-3.5" />
            ) : (
              <Check className="h-3.5 w-3.5" aria-hidden />
            )}
            <span className="sr-only">{t('dashboard.prep.markDone')}</span>
          </Button>
        ) : (
          <Button size="sm" variant="secondary" disabled>
            {t('common.comingSoon')}
          </Button>
        )}
      </div>
    </div>
  )
}

export function TodaysPrepModule({ tasks, dashboardDate }: TodaysPrepModuleProps) {
  const { t } = useTranslation()

  // Re-align with server state after background-sync drains (KALMIO-378).
  useSyncInvalidation([['dashboard', dashboardDate], ['points']])

  if (tasks.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.prep.todayTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="pt-3 space-y-2">
        {tasks.map((task, idx) => (
          <PrepTaskRow
            key={task.id ?? `${task.recipeId}-${task.window}-${idx}`}
            task={task}
            dashboardDate={dashboardDate}
          />
        ))}
      </CardContent>
    </Card>
  )
}
