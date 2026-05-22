/**
 * PrepLane — per-day prep task lane for ScheduleDetail.
 *
 * Renders materialized prep_tasks grouped by scheduledDate.
 * Each task is a compressed chip (recipe name + window + servings).
 * Clicking a chip opens a Dialog with status actions and a date-move form.
 *
 * DONE chips are struck-through and dimmed, matching TodaysPrepModule.
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Clock, Check, X, CalendarDays, Scissors } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { prepTaskService } from '@/services/dashboard'
import { prepTasksService } from '@/services/prepTasks'
import type { PrepTaskDto } from '@/services/prepTasks'

// ── Window label helper ────────────────────────────────────────────────────

function windowLabel(window: string, t: (key: string) => string): string {
  return t(`dashboard.prep.windowLabels.${window}`)
}

// ── Chip component ─────────────────────────────────────────────────────────

interface PrepChipProps {
  task: PrepTaskDto
  scheduleId: string
  onMutated: () => void
}

function PrepChip({ task, scheduleId, onMutated }: PrepChipProps) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [moveDate, setMoveDate] = useState(task.scheduledDate)
  const [moveTime, setMoveTime] = useState(task.scheduledTime ?? '')

  const isDone = task.status === 'DONE'
  const isSkipped = task.status === 'SKIPPED'
  const isDimmed = isDone || isSkipped

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['prep-tasks', scheduleId] })
    onMutated()
  }

  const markStatus = useMutation({
    mutationFn: (status: string) => prepTaskService.updateStatus(task.id, status),
    onSuccess: (_data, status) => {
      const key = status === 'DONE'
        ? 'schedules.prep.actions.done'
        : 'schedules.prep.actions.skip'
      toast({ title: t(key), variant: 'success' })
      invalidate()
      setOpen(false)
    },
    onError: () => {
      toast({ title: t('common.errorGeneric'), variant: 'destructive' })
    },
  })

  const moveSchedule = useMutation({
    mutationFn: () =>
      prepTasksService.patchSchedule(task.id, {
        scheduledDate: moveDate,
        scheduledTime: moveTime || null,
      }),
    onSuccess: () => {
      toast({ title: t('schedules.prep.actions.moved'), variant: 'success' })
      invalidate()
      setOpen(false)
    },
    onError: () => {
      toast({ title: t('common.errorGeneric'), variant: 'destructive' })
    },
  })

  const wLabel = windowLabel(task.scheduledWindow, t)

  return (
    <>
      {/* Chip button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          'w-full flex items-center gap-2 px-3 py-2 rounded-[10px] text-left transition-colors',
          isDimmed
            ? 'bg-[#F0F0EC] opacity-60 cursor-pointer'
            : 'bg-[#F9F7F2] hover:bg-[#F0EDE6] cursor-pointer',
        ].join(' ')}
        aria-label={`${task.recipeName ?? ''} — ${wLabel}`}
      >
        {/* Window icon indicator */}
        <Clock className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />

        {/* Recipe name */}
        <span
          className={[
            'flex-1 min-w-0 text-sm font-medium truncate',
            isDone ? 'line-through text-gray-400' : isSkipped ? 'text-gray-400' : 'text-[#1A1A1A]',
          ].join(' ')}
        >
          {task.recipeName ?? '—'}
        </span>

        {/* Window label */}
        <span className="text-[11px] text-gray-400 shrink-0 capitalize">{wLabel}</span>

        {/* Servings badge */}
        {task.servingsToMake != null && Number(task.servingsToMake) > 0 && (
          <span className="text-[11px] text-gray-500 shrink-0 tabular-nums">
            {t('dashboard.prep.cookServings', { count: Number(task.servingsToMake) })}
          </span>
        )}

        {/* Done checkmark */}
        {isDone && (
          <div
            className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 shrink-0"
            aria-label={t('dashboard.prep.done')}
          >
            <Check className="h-3 w-3 text-green-600" aria-hidden />
          </div>
        )}
      </button>

      {/* Detail dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="truncate">{task.recipeName ?? '—'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Metadata row */}
            <div className="flex gap-4 text-sm text-gray-500">
              <span className="capitalize">{wLabel}</span>
              {task.servingsToMake != null && Number(task.servingsToMake) > 0 && (
                <span>{t('dashboard.prep.cookServings', { count: Number(task.servingsToMake) })}</span>
              )}
              {task.servingsToFreeze != null && Number(task.servingsToFreeze) > 0 && (
                <span className="text-blue-600 font-medium">
                  {t('dashboard.prep.freezeAtPrep', { count: Number(task.servingsToFreeze) })}
                </span>
              )}
              {task.durationMin != null && (
                <span>{t('dashboard.prep.durationMin', { count: task.durationMin })}</span>
              )}
            </div>

            {/* Status actions */}
            {!isDone && !isSkipped && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => markStatus.mutate('DONE')}
                  disabled={markStatus.isPending}
                  className="flex items-center gap-1.5"
                  type="button"
                >
                  {markStatus.isPending && markStatus.variables === 'DONE' ? (
                    <Spinner className="h-3.5 w-3.5" />
                  ) : (
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {t('schedules.prep.actions.done')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markStatus.mutate('SKIPPED')}
                  disabled={markStatus.isPending}
                  className="flex items-center gap-1.5"
                  type="button"
                >
                  {markStatus.isPending && markStatus.variables === 'SKIPPED' ? (
                    <Spinner className="h-3.5 w-3.5" />
                  ) : (
                    <X className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {t('schedules.prep.actions.skip')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled
                  className="flex items-center gap-1.5 opacity-40"
                  type="button"
                  title={t('schedules.prep.actions.splitHint')}
                >
                  <Scissors className="h-3.5 w-3.5" aria-hidden />
                  {t('schedules.prep.actions.split')}
                </Button>
              </div>
            )}

            {/* Move to new date */}
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                {t('schedules.prep.moveLabel')}
              </p>
              <div className="flex gap-2 flex-wrap">
                <div>
                  <Label htmlFor={`move-date-${task.id}`} className="sr-only">
                    {t('schedules.wizard.startDate')}
                  </Label>
                  <Input
                    id={`move-date-${task.id}`}
                    type="date"
                    value={moveDate}
                    onChange={e => setMoveDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div>
                  <Label htmlFor={`move-time-${task.id}`} className="sr-only">
                    {t('schedules.prep.timeLabel')}
                  </Label>
                  <Input
                    id={`move-time-${task.id}`}
                    type="time"
                    value={moveTime}
                    onChange={e => setMoveTime(e.target.value)}
                    className="w-32"
                    placeholder="—"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => moveSchedule.mutate()}
                  disabled={moveSchedule.isPending || !moveDate}
                  className="flex items-center gap-1.5"
                  type="button"
                >
                  {moveSchedule.isPending ? <Spinner className="h-3.5 w-3.5" /> : null}
                  {t('common.save')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── PrepLane ───────────────────────────────────────────────────────────────

interface PrepLaneProps {
  /** All prep tasks across all plans in the schedule, already fetched. */
  tasks: PrepTaskDto[]
  scheduleId: string
  /** Called after any mutation so the parent can re-render if needed. */
  onMutated?: () => void
}

/**
 * Groups tasks by scheduledDate and renders a dated section per day.
 * Dates are displayed in ascending order.
 */
export function PrepLane({ tasks, scheduleId, onMutated = () => undefined }: PrepLaneProps) {
  const { t } = useTranslation()

  // Group tasks by scheduledDate
  const byDate = tasks.reduce<Record<string, PrepTaskDto[]>>((acc, task) => {
    const date = task.scheduledDate
    if (!acc[date]) acc[date] = []
    acc[date].push(task)
    return acc
  }, {})

  const sortedDates = Object.keys(byDate).sort()

  if (tasks.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-2">{t('schedules.prep.empty')}</p>
    )
  }

  return (
    <div className="space-y-4">
      {sortedDates.map(date => {
        const dayTasks = byDate[date]
        // Format date as "Péntek, máj. 23" style — use browser locale
        const label = new Date(date + 'T00:00:00').toLocaleDateString('hu-HU', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
        return (
          <div key={date}>
            <p className="text-xs text-gray-400 font-medium mb-1.5">{label}</p>
            <div className="space-y-1">
              {dayTasks.map(task => (
                <PrepChip
                  key={task.id}
                  task={task}
                  scheduleId={scheduleId}
                  onMutated={onMutated}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
