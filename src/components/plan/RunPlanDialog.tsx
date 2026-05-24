/**
 * RunPlanDialog — KALMIO-307 / KALMIO-320
 *
 * Two-mode dialog for running a plan template:
 * - Primary (once): one-off cycle starting from the chosen date.
 *   Optional startDayIndex collapses under "More options".
 * - Secondary (recurring): repeating at a chosen cadence with optional end date.
 *   Also supports startDayIndex (rotated semantic).
 *
 * Calls planTemplateService.runPlan(planId, body) which maps to
 * POST /api/plans/{id}/run.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { planTemplateService } from '@/services/plans'
import type { PlanTemplate, RunPlanBody } from '@/types'

// ── Props ─────────────────────────────────────────────────────────────────

interface RunPlanDialogProps {
  plan: PlanTemplate
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── Component ─────────────────────────────────────────────────────────────

export function RunPlanDialog({
  plan,
  open,
  onOpenChange,
  onSuccess,
}: RunPlanDialogProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  // Form state
  const [startDate, setStartDate] = useState(todayIso)
  const [showMoreOptions, setShowMoreOptions] = useState(false)
  const [startDayIndex, setStartDayIndex] = useState(1)
  const [showRecurring, setShowRecurring] = useState(false)
  const [cadenceDays, setCadenceDays] = useState(plan.lengthDays)
  const [endDate, setEndDate] = useState('')

  const mutation = useMutation({
    mutationFn: (body: RunPlanBody) =>
      planTemplateService.runPlan(plan.id, body),
    onSuccess: (_data, variables) => {
      const isOnce = !variables.recurrence
      toast({
        title: isOnce
          ? t('plan.run.successOnce')
          : t('plan.run.successRecurring'),
        variant: 'success',
      })
      void queryClient.invalidateQueries({ queryKey: ['schedules'] })
      void queryClient.invalidateQueries({ queryKey: ['plan-templates'] })
      onOpenChange(false)
      onSuccess?.()
    },
    onError: () => {
      toast({ title: t('plan.run.error'), variant: 'destructive' })
    },
  })

  function handleRunOnce() {
    const body: RunPlanBody = {
      startDate,
      startDayIndex: showMoreOptions && startDayIndex > 1 ? startDayIndex : null,
      recurrence: null,
    }
    mutation.mutate(body)
  }

  function handleRunRecurring() {
    const body: RunPlanBody = {
      startDate,
      startDayIndex: showMoreOptions && startDayIndex > 1 ? startDayIndex : null,
      recurrence: {
        cadenceDays: cadenceDays || null,
        endDate: endDate || null,
      },
    }
    mutation.mutate(body)
  }

  const isPending = mutation.isPending
  const dayOptions = Array.from({ length: plan.lengthDays }, (_, i) => i + 1)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-full">
        <DialogHeader>
          <DialogTitle>{t('plan.run.dialogTitle')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Start date */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="run-start-date"
              className="text-sm font-medium text-[#374151]"
            >
              {t('plan.run.startDateLabel')}
            </label>
            <input
              id="run-start-date"
              type="date"
              value={startDate}
              min={todayIso()}
              onChange={e => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-[#d1d5db] px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
            />
          </div>

          {/* More options toggle */}
          <button
            type="button"
            onClick={() => setShowMoreOptions(v => !v)}
            className="text-sm text-[#4f46e5] underline text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5] rounded"
          >
            {showMoreOptions ? t('plan.run.fewerOptions') : t('plan.run.moreOptions')}
          </button>

          {/* Start day index (collapsed by default) */}
          {showMoreOptions && (
            <div className="flex flex-col gap-1">
              <label
                htmlFor="run-start-day"
                className="text-sm font-medium text-[#374151]"
              >
                {t('plan.run.startDayIndexLabel')}
              </label>
              <select
                id="run-start-day"
                value={startDayIndex}
                onChange={e => setStartDayIndex(Number(e.target.value))}
                className="w-full rounded-lg border border-[#d1d5db] px-3 py-2 text-sm bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
              >
                {dayOptions.map(d => (
                  <option key={d} value={d}>
                    {t('plan.run.dayLabel', { day: d })}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Recurring panel toggle */}
          <button
            type="button"
            onClick={() => setShowRecurring(v => !v)}
            className="text-sm text-[#6b7280] underline text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5] rounded"
          >
            {t('plan.run.recurringToggle')}
          </button>

          {/* Recurring settings */}
          {showRecurring && (
            <div className="flex flex-col gap-3 rounded-lg bg-[#f9fafb] border border-[#e5e7eb] p-3">
              <p className="text-sm font-semibold text-[#374151]">
                {t('plan.run.recurringPanelTitle')}
              </p>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="run-cadence"
                  className="text-sm font-medium text-[#374151]"
                >
                  {t('plan.run.cadenceLabel')}
                </label>
                <input
                  id="run-cadence"
                  type="number"
                  min={1}
                  max={365}
                  value={cadenceDays}
                  onChange={e => setCadenceDays(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#d1d5db] px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="run-end-date"
                  className="text-sm font-medium text-[#374151]"
                >
                  {t('plan.run.endDateLabel')}
                </label>
                <input
                  id="run-end-date"
                  type="date"
                  value={endDate}
                  min={startDate}
                  placeholder={t('plan.run.endDatePlaceholder')}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-[#d1d5db] px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2 pt-1">
            {/* Primary once CTA */}
            {!showRecurring && (
              <Button
                onClick={handleRunOnce}
                disabled={isPending || !startDate}
                className="w-full"
              >
                {isPending
                  ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner className="w-4 h-4" />
                      {t('plan.run.submitting')}
                    </span>
                  )
                  : t('plan.run.runOnce')}
              </Button>
            )}

            {/* Recurring CTA (shown when panel is open) */}
            {showRecurring && (
              <Button
                onClick={handleRunRecurring}
                disabled={isPending || !startDate || !cadenceDays}
                className="w-full"
              >
                {isPending
                  ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner className="w-4 h-4" />
                      {t('plan.run.submitting')}
                    </span>
                  )
                  : t('plan.run.runRecurring')}
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="w-full text-[#6b7280]"
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
