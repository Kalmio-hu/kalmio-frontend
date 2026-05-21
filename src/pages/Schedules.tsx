/**
 * Schedules — list of recurring schedules for the current user.
 *
 * Route: /app/schedules
 *
 * Each schedule card shows name, status, cadence, start date,
 * last-materialised date, plan count.
 * Per-row actions: pause / resume / end / edit / materialize.
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Plus, Pause, Play, Square, Pencil, Zap } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toast'
import { schedulesService } from '@/services/schedules'
import type { Schedule, ScheduleStatus } from '@/types'

function statusBadge(status: ScheduleStatus) {
  if (status === 'ACTIVE') return 'green'
  if (status === 'PAUSED') return 'amber'
  return 'gray'
}

// ── Materialize dialog ────────────────────────────────────────────────────

interface MaterializeDialogProps {
  schedule: Schedule
  open: boolean
  onOpenChange: (v: boolean) => void
}

function MaterializeDialog({ schedule, open, onOpenChange }: MaterializeDialogProps) {
  const { t } = useTranslation()
  const qc = useQueryClient()

  // Default throughDate = today + cadenceDays
  const defaultThrough = (() => {
    const d = new Date()
    d.setDate(d.getDate() + schedule.cadenceDays)
    return d.toISOString().split('T')[0]
  })()

  const [throughDate, setThroughDate] = useState(defaultThrough)

  const { mutate: doMaterialize, isPending } = useMutation({
    mutationFn: () => schedulesService.materialize(schedule.id, throughDate),
    onSuccess: () => {
      toast({ title: t('schedules.actions.materializeSuccess') })
      void qc.invalidateQueries({ queryKey: ['schedules'] })
      void qc.invalidateQueries({ queryKey: ['planned-meals'] })
      onOpenChange(false)
    },
    onError: () => {
      toast({ title: t('schedules.actions.actionError'), variant: 'destructive' })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('schedules.actions.materialize')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="through-date">{t('schedules.detail.materializeThroughLabel')}</Label>
            <Input
              id="through-date"
              type="date"
              value={throughDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setThroughDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => doMaterialize()}
              disabled={isPending || !throughDate}
              type="button"
            >
              {isPending ? t('schedules.wizard.submitting') : t('schedules.actions.materializeSubmit')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Schedule card ─────────────────────────────────────────────────────────

interface ScheduleCardProps {
  schedule: Schedule
}

function cadenceLabel(cadenceDays: number, t: ReturnType<typeof useTranslation>['t']): string {
  if (cadenceDays === 7) return t('schedules.cadence.weekly')
  if (cadenceDays === 14) return t('schedules.cadence.biweekly')
  return t('schedules.cadence.custom', { count: cadenceDays })
}

function ScheduleCard({ schedule }: ScheduleCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [materializeOpen, setMaterializeOpen] = useState(false)

  const { mutate: doPause, isPending: isPausing } = useMutation({
    mutationFn: () => schedulesService.pause(schedule.id),
    onSuccess: () => {
      toast({ title: t('schedules.actions.pauseSuccess') })
      void qc.invalidateQueries({ queryKey: ['schedules'] })
    },
    onError: () => toast({ title: t('schedules.actions.actionError'), variant: 'destructive' }),
  })

  const { mutate: doResume, isPending: isResuming } = useMutation({
    mutationFn: () => schedulesService.resume(schedule.id),
    onSuccess: () => {
      toast({ title: t('schedules.actions.resumeSuccess') })
      void qc.invalidateQueries({ queryKey: ['schedules'] })
    },
    onError: () => toast({ title: t('schedules.actions.actionError'), variant: 'destructive' }),
  })

  const { mutate: doEnd, isPending: isEnding } = useMutation({
    mutationFn: () => schedulesService.delete(schedule.id),
    onSuccess: () => {
      toast({ title: t('schedules.actions.endSuccess') })
      void qc.invalidateQueries({ queryKey: ['schedules'] })
    },
    onError: () => toast({ title: t('schedules.actions.actionError'), variant: 'destructive' }),
  })

  const isActive = schedule.status === 'ACTIVE'
  const isPaused = schedule.status === 'PAUSED'
  const isEnded = schedule.status === 'ENDED'
  const isBusy = isPausing || isResuming || isEnding

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-[#1A1A1A] truncate leading-tight">{schedule.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {cadenceLabel(schedule.cadenceDays, t)} &middot;{' '}
              {t('schedules.card.plans_other', { count: schedule.planIds.length })}
            </p>
          </div>
          <Badge variant={statusBadge(schedule.status)}>
            {t(`schedules.status.${schedule.status}`)}
          </Badge>
        </div>

        {/* Dates */}
        <div className="text-xs text-gray-500 space-y-0.5">
          <p>
            {t('schedules.wizard.startDate')}:{' '}
            <span className="text-[#1A1A1A] font-medium">{schedule.startDate}</span>
            {schedule.endDate ? (
              <> &ndash; <span className="text-[#1A1A1A] font-medium">{schedule.endDate}</span></>
            ) : null}
          </p>
          <p>
            {schedule.lastMaterializedDate
              ? t('schedules.card.lastMaterialized', { date: schedule.lastMaterializedDate })
              : t('schedules.card.neverMaterialized')}
          </p>
          {(() => {
            const base = schedule.lastMaterializedDate ?? schedule.startDate
            const d = new Date(base)
            d.setDate(d.getDate() + schedule.cadenceDays)
            const nextWindow = d.toISOString().split('T')[0]
            return (
              <p>
                {t('schedules.card.nextWindow')}:{' '}
                <span className="text-[#1A1A1A] font-medium">{nextWindow}</span>
              </p>
            )
          })()}
        </div>

        {/* Actions */}
        {!isEnded && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-50">
            <button
              onClick={() => navigate(`/app/schedules/${schedule.id}`)}
              disabled={isBusy}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-[#1A1A1A] transition-colors disabled:opacity-50"
              type="button"
              aria-label={t('schedules.actions.edit')}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              {t('schedules.actions.edit')}
            </button>

            {isActive && (
              <button
                onClick={() => doPause()}
                disabled={isBusy}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-[#1A1A1A] transition-colors disabled:opacity-50"
                type="button"
              >
                <Pause className="h-3.5 w-3.5" aria-hidden />
                {isPausing ? '…' : t('schedules.actions.pause')}
              </button>
            )}

            {isPaused && (
              <button
                onClick={() => doResume()}
                disabled={isBusy}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-[#1A1A1A] transition-colors disabled:opacity-50"
                type="button"
              >
                <Play className="h-3.5 w-3.5" aria-hidden />
                {isResuming ? '…' : t('schedules.actions.resume')}
              </button>
            )}

            <button
              onClick={() => setMaterializeOpen(true)}
              disabled={isBusy}
              className="flex items-center gap-1.5 text-xs font-medium text-[#4f46e5] hover:text-[#3730a3] transition-colors disabled:opacity-50"
              type="button"
            >
              <Zap className="h-3.5 w-3.5" aria-hidden />
              {t('schedules.actions.materialize')}
            </button>

            <button
              onClick={() => {
                if (window.confirm(t('schedules.actions.deleteConfirm'))) {
                  doEnd()
                }
              }}
              disabled={isBusy}
              className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 transition-colors disabled:opacity-50 ml-auto"
              type="button"
            >
              <Square className="h-3.5 w-3.5" aria-hidden />
              {isEnding ? '…' : t('schedules.actions.end')}
            </button>
          </div>
        )}
      </div>

      <MaterializeDialog
        schedule={schedule}
        open={materializeOpen}
        onOpenChange={setMaterializeOpen}
      />
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export function Schedules() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: schedules = [], isLoading, isError } = useQuery({
    queryKey: ['schedules'],
    queryFn: schedulesService.list,
    staleTime: 30_000,
  })

  return (
    <div className="max-w-2xl mx-auto px-4 pb-10">
      <Header
        title={t('schedules.pageTitle')}
        subtitle={t('schedules.pageSubtitle')}
        actions={
          <Button
            onClick={() => navigate('/app/schedules/new')}
            size="sm"
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" aria-hidden />
            {t('schedules.newScheduleCta')}
          </Button>
        }
      />

      {isLoading && (
        <div className="flex justify-center py-10" aria-live="polite" aria-busy="true">
          <Spinner />
        </div>
      )}

      {isError && (
        <p className="text-sm text-red-600 py-4">{t('common.errorGeneric')}</p>
      )}

      {!isLoading && !isError && schedules.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-[#6b7280] text-sm">{t('schedules.noSchedules')}</p>
          <p className="text-[#9ca3af] text-xs">{t('schedules.noSchedulesHint')}</p>
          <Button onClick={() => navigate('/app/schedules/new')} size="sm">
            {t('schedules.newScheduleCta')}
          </Button>
        </div>
      )}

      {!isLoading && !isError && schedules.length > 0 && (
        <div className="flex flex-col gap-3">
          {schedules.map(s => (
            <ScheduleCard key={s.id} schedule={s} />
          ))}
        </div>
      )}
    </div>
  )
}
