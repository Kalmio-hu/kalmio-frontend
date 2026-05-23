/**
 * ScheduleDetail — view and edit a single schedule.
 *
 * Route: /app/schedules/:id
 *
 * Displays schedule metadata (read-only panel) with an edit form
 * overlay, a materialize-forward button, and status actions
 * (pause / resume / end).
 *
 * Also lists the plans in rotation order with links to PlanDetail.
 */
import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Pencil, Pause, Play, Square, Zap, Check, X } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from '@/components/ui/toast'
import { schedulesService } from '@/services/schedules'
import { planTemplateService } from '@/services/plans'
import { todayIsoLocal, dateToIsoLocal } from '@/lib/utils'
import { prepTasksService } from '@/services/prepTasks'
import { api } from '@/lib/api'
import { PrepLane } from '@/components/schedule/PrepLane'
import { PrepHoldViolationBanner } from '@/components/plan/PrepHoldViolationBanner'
import type { PrepTaskDto } from '@/services/prepTasks'
import type { ScheduleStatus } from '@/types'

function statusBadge(status: ScheduleStatus) {
  if (status === 'ACTIVE') return 'green'
  if (status === 'PAUSED') return 'amber'
  return 'gray'
}

// ── Materialize dialog ────────────────────────────────────────────────────

interface MaterializeDialogProps {
  scheduleId: string
  cadenceDays: number
  open: boolean
  onOpenChange: (v: boolean) => void
}

function MaterializeDialog({ scheduleId, cadenceDays, open, onOpenChange }: MaterializeDialogProps) {
  const { t } = useTranslation()
  const qc = useQueryClient()

  const defaultThrough = (() => {
    const d = new Date()
    d.setDate(d.getDate() + cadenceDays)
    return dateToIsoLocal(d)
  })()

  const [throughDate, setThroughDate] = useState(defaultThrough)

  const { mutate: doMaterialize, isPending } = useMutation({
    mutationFn: () => schedulesService.materialize(scheduleId, throughDate),
    onSuccess: () => {
      toast({ title: t('schedules.actions.materializeSuccess') })
      void qc.invalidateQueries({ queryKey: ['schedules'] })
      void qc.invalidateQueries({ queryKey: ['schedule', scheduleId] })
      void qc.invalidateQueries({ queryKey: ['planned-meals'] })
      void qc.invalidateQueries({ queryKey: ['prep-tasks', scheduleId] })
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
            <Label htmlFor="through-date-detail">{t('schedules.detail.materializeThroughLabel')}</Label>
            <Input
              id="through-date-detail"
              type="date"
              value={throughDate}
              min={todayIsoLocal()}
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

// ── Edit form ─────────────────────────────────────────────────────────────

interface EditFormProps {
  scheduleId: string
  initialName: string
  initialCadenceDays: number
  initialStartDate: string
  initialEndDate: string | null
  onCancel: () => void
  onSaved: () => void
}

function EditForm({
  scheduleId,
  initialName,
  initialCadenceDays,
  initialStartDate,
  initialEndDate,
  onCancel,
  onSaved,
}: EditFormProps) {
  const { t } = useTranslation()
  const qc = useQueryClient()

  const [name, setName] = useState(initialName)
  const [cadenceDays, setCadenceDays] = useState(initialCadenceDays)
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate ?? '')

  const { mutate: doSave, isPending } = useMutation({
    mutationFn: () =>
      schedulesService.update(scheduleId, {
        name: name.trim() || initialName,
        cadenceDays,
        startDate,
        endDate: endDate || null,
      }),
    onSuccess: () => {
      toast({ title: t('schedules.detail.saveSuccess') })
      void qc.invalidateQueries({ queryKey: ['schedule', scheduleId] })
      void qc.invalidateQueries({ queryKey: ['schedules'] })
      onSaved()
    },
    onError: () => {
      toast({ title: t('schedules.detail.saveError'), variant: 'destructive' })
    },
  })

  return (
    <div className="space-y-4 bg-gray-50 rounded-2xl p-4">
      <div>
        <Label htmlFor="edit-name">{t('schedules.wizard.scheduleName')}</Label>
        <Input
          id="edit-name"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={120}
          className="mt-1"
          autoFocus
        />
      </div>
      <div>
        <Label htmlFor="edit-cadence">{t('schedules.wizard.cadenceDays')}</Label>
        <Input
          id="edit-cadence"
          type="number"
          min={1}
          max={365}
          value={cadenceDays}
          onChange={e => setCadenceDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
          className="mt-1 w-32"
        />
      </div>
      <div>
        <Label htmlFor="edit-start">{t('schedules.wizard.startDate')}</Label>
        <Input
          id="edit-start"
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="edit-end">{t('schedules.wizard.endDate')}</Label>
        <Input
          id="edit-end"
          type="date"
          value={endDate}
          min={startDate}
          onChange={e => setEndDate(e.target.value)}
          className="mt-1"
        />
        <p className="text-xs text-gray-400 mt-1">{t('schedules.wizard.endDateHint')}</p>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel} type="button">
          <X className="h-4 w-4 mr-1" aria-hidden />
          {t('common.cancel')}
        </Button>
        <Button onClick={() => doSave()} disabled={isPending} type="button">
          <Check className="h-4 w-4 mr-1" aria-hidden />
          {isPending ? t('schedules.detail.saving') : t('common.save')}
        </Button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export function ScheduleDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [materializeOpen, setMaterializeOpen] = useState(false)
  const [endConfirmOpen, setEndConfirmOpen] = useState(false)

  const { data: schedule, isLoading, isError } = useQuery({
    queryKey: ['schedule', id],
    queryFn: () => schedulesService.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  })

  const { data: plans = [] } = useQuery({
    queryKey: ['plan-templates'],
    queryFn: planTemplateService.list,
    staleTime: 30_000,
  })

  // ── Prep-hold violations for this schedule (KALMIO-268 / Prep-H) ────────────
  const { data: prepHoldViolations = [] } = useQuery({
    queryKey: ['prep-hold-violations', 'schedule', id] as const,
    queryFn: () =>
      api
        .get<Array<{ plannedMealId: string; prepTaskId: string; dayGap: number; fridgeWindow: number; recipeId: string }>>(
          `/api/schedules/${id}/prep-hold-violations`,
        )
        .then(r => r.data),
    enabled: !!id && !!schedule,
    staleTime: 30_000,
  })

  // ── Per-plan prep task fetch ───────────────────────────────────────────────
  // Fetch prep tasks for each plan in the schedule in parallel via useQueries.
  // We wait for the schedule to load before enabling these (planIds is empty until then).
  const planIds = schedule?.planIds ?? []
  const prepTaskResults = useQueries({
    queries: planIds.map(planId => ({
      queryKey: ['prep-tasks', id, planId] as const,
      queryFn: () => prepTasksService.listForPlan(planId),
      enabled: !!id && !!schedule,
      staleTime: 30_000,
    })),
  })

  // Flatten results from all plans into a single sorted list
  const allPrepTasks: PrepTaskDto[] = prepTaskResults
    .flatMap(r => r.data ?? [])
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))

  const { mutate: doPause, isPending: isPausing } = useMutation({
    mutationFn: () => schedulesService.pause(id!),
    onSuccess: () => {
      toast({ title: t('schedules.actions.pauseSuccess') })
      void qc.invalidateQueries({ queryKey: ['schedule', id] })
      void qc.invalidateQueries({ queryKey: ['schedules'] })
    },
    onError: () => toast({ title: t('schedules.actions.actionError'), variant: 'destructive' }),
  })

  const { mutate: doResume, isPending: isResuming } = useMutation({
    mutationFn: () => schedulesService.resume(id!),
    onSuccess: () => {
      toast({ title: t('schedules.actions.resumeSuccess') })
      void qc.invalidateQueries({ queryKey: ['schedule', id] })
      void qc.invalidateQueries({ queryKey: ['schedules'] })
    },
    onError: () => toast({ title: t('schedules.actions.actionError'), variant: 'destructive' }),
  })

  const { mutate: doEnd, isPending: isEnding } = useMutation({
    mutationFn: () => schedulesService.delete(id!),
    onSuccess: () => {
      toast({ title: t('schedules.actions.endSuccess') })
      void qc.invalidateQueries({ queryKey: ['schedules'] })
      navigate('/app/schedules')
    },
    onError: () => toast({ title: t('schedules.actions.actionError'), variant: 'destructive' }),
  })

  const isBusy = isPausing || isResuming || isEnding

  if (isLoading) {
    return (
      <div className="flex justify-center py-20" aria-live="polite" aria-busy="true">
        <Spinner />
      </div>
    )
  }

  if (isError || !schedule) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10">
        <p className="text-sm text-red-600">{t('common.errorGeneric')}</p>
      </div>
    )
  }

  function planName(planId: string) {
    return plans.find(p => p.id === planId)?.name ?? planId
  }

  const isEnded = schedule.status === 'ENDED'
  const isActive = schedule.status === 'ACTIVE'
  const isPaused = schedule.status === 'PAUSED'

  return (
    <>
      <div className="max-w-lg mx-auto px-4 pb-10">
        <Header
          title={schedule.name}
          actions={
            <button
              onClick={() => navigate('/app/schedules')}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#1A1A1A] transition-colors"
              type="button"
              aria-label={t('common.back')}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              {t('common.back')}
            </button>
          }
        />

        {/* Status + action bar */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Badge variant={statusBadge(schedule.status)}>
            {t(`schedules.status.${schedule.status}`)}
          </Badge>
          {!isEnded && (
            <>
              <button
                onClick={() => setEditOpen(prev => !prev)}
                disabled={isBusy}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#1A1A1A] transition-colors disabled:opacity-50"
                type="button"
              >
                <Pencil className="h-4 w-4" aria-hidden />
                {t('schedules.actions.edit')}
              </button>

              {isActive && (
                <button
                  onClick={() => doPause()}
                  disabled={isBusy}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#1A1A1A] transition-colors disabled:opacity-50"
                  type="button"
                >
                  <Pause className="h-4 w-4" aria-hidden />
                  {isPausing ? '…' : t('schedules.actions.pause')}
                </button>
              )}

              {isPaused && (
                <button
                  onClick={() => doResume()}
                  disabled={isBusy}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#1A1A1A] transition-colors disabled:opacity-50"
                  type="button"
                >
                  <Play className="h-4 w-4" aria-hidden />
                  {isResuming ? '…' : t('schedules.actions.resume')}
                </button>
              )}

              <button
                onClick={() => setEndConfirmOpen(true)}
                disabled={isBusy}
                className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 transition-colors disabled:opacity-50 ml-auto"
                type="button"
              >
                <Square className="h-4 w-4" aria-hidden />
                {isEnding ? '…' : t('schedules.actions.end')}
              </button>
            </>
          )}
        </div>

        {/* Edit form */}
        {editOpen && (
          <div className="mb-6">
            <EditForm
              scheduleId={schedule.id}
              initialName={schedule.name}
              initialCadenceDays={schedule.cadenceDays}
              initialStartDate={schedule.startDate}
              initialEndDate={schedule.endDate}
              onCancel={() => setEditOpen(false)}
              onSaved={() => setEditOpen(false)}
            />
          </div>
        )}

        {/* Metadata card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">
                {t('schedules.wizard.startDate')}
              </p>
              <p className="font-medium text-[#1A1A1A]">{schedule.startDate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">
                {t('schedules.wizard.endDate')}
              </p>
              <p className="font-medium text-[#1A1A1A]">
                {schedule.endDate ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">
                {t('schedules.cadence.label')}
              </p>
              <p className="font-medium text-[#1A1A1A]">{schedule.cadenceDays} nap</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">
                {t('schedules.card.lastMaterialized', { date: '' }).replace(': ', '')}
              </p>
              <p className="font-medium text-[#1A1A1A]">
                {schedule.lastMaterializedDate ?? '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Plans in rotation order */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">
            {t('schedules.detail.planIds')}
          </p>
          {schedule.planIds.length === 0 && (
            <p className="text-sm text-gray-500">{t('plan.noPlans')}</p>
          )}
          <ol className="space-y-2">
            {schedule.planIds.map((planId, idx) => (
              <li key={planId} className="flex items-center gap-2.5">
                <span className="text-[10px] font-bold text-[#4f46e5] tabular-nums w-5 text-center shrink-0">
                  {idx + 1}
                </span>
                <Link
                  to={`/app/plans/${planId}`}
                  className="flex-1 text-sm text-[#4f46e5] hover:text-[#3730a3] font-medium truncate underline-offset-2 hover:underline"
                >
                  {planName(planId)}
                </Link>
              </li>
            ))}
          </ol>
        </div>

        {/* Per-day prep lane */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">
            {t('schedules.prep.laneLabel')}
          </p>

          {/* Prep-hold violation banners — one per violating planned meal (KALMIO-268).
              Rendered above the lane so the user sees them before the task chips. */}
          {prepHoldViolations.length > 0 && (
            <div className="space-y-1 mb-3">
              {prepHoldViolations.map(v => (
                <PrepHoldViolationBanner
                  key={v.plannedMealId}
                  surface="schedule"
                  planOrScheduleId={id!}
                  mealId={v.plannedMealId}
                />
              ))}
            </div>
          )}

          {prepTaskResults.some(r => r.isLoading) ? (
            <div className="flex justify-center py-4" aria-live="polite" aria-busy="true">
              <Spinner />
            </div>
          ) : (
            <PrepLane
              tasks={allPrepTasks}
              scheduleId={id!}
              onMutated={() => {
                // Invalidate all per-plan prep-task caches when any mutation fires
                planIds.forEach(planId => {
                  void qc.invalidateQueries({ queryKey: ['prep-tasks', id, planId] })
                })
              }}
            />
          )}
        </div>

        {/* Materialize forward */}
        {!isEnded && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">
              {t('schedules.detail.materializeSection')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMaterializeOpen(true)}
              disabled={isBusy}
              className="flex items-center gap-1.5"
              type="button"
            >
              <Zap className="h-4 w-4 text-[#4f46e5]" aria-hidden />
              {t('schedules.actions.materialize')}
            </Button>
          </div>
        )}
      </div>

      <MaterializeDialog
        scheduleId={schedule.id}
        cadenceDays={schedule.cadenceDays}
        open={materializeOpen}
        onOpenChange={setMaterializeOpen}
      />

      <ConfirmDialog
        open={endConfirmOpen}
        onOpenChange={setEndConfirmOpen}
        title={t('confirm.delete.schedule.title')}
        description={t('confirm.delete.schedule.body')}
        destructiveLabel={t('confirm.delete.schedule.confirm')}
        cancelLabel={t('confirm.delete.schedule.cancel')}
        onConfirm={() => doEnd()}
        isPending={isEnding}
      />
    </>
  )
}
