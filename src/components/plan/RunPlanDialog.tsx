/**
 * RunPlanDialog — KALMIO-307 / KALMIO-320 / KALMIO-313
 *
 * Two-mode dialog for running a plan template:
 * - Primary (once): one-off cycle starting from the chosen date.
 *   Optional startDayIndex collapses under "More options".
 * - Secondary (recurring): repeating at a chosen cadence with optional end date.
 *   Also supports startDayIndex (rotated semantic).
 *
 * KALMIO-313: grooming prompt step.
 * On open, if the fridge has items expiring within 7 days, shows an inline
 * non-blocking prompt offering a quick fridge check before plan generation.
 * - Skip → plan generates immediately with current fridge state (no change).
 * - Yes → stores pending run params in sessionStorage, closes dialog, navigates
 *   to /app/grooming. On remount the dialog detects the pending run and fires
 *   the mutation automatically (after grooming updates the fridge).
 *
 * Calls planTemplateService.runPlan(planId, body) which maps to
 * POST /api/plans/{id}/run.
 */
import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
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
import { fridgeService } from '@/services/fridge'
import { countExpiringThisWeek } from '@/lib/grooming'
import type { PlanTemplate, RunPlanBody } from '@/types'

// ── sessionStorage key for pending post-grooming plan run ──────────────────

const PENDING_RUN_KEY = 'kalmio.pendingGroomingRun'

interface PendingRun {
  planId: string
  body: RunPlanBody
}

function getPendingRun(): PendingRun | null {
  try {
    const raw = sessionStorage.getItem(PENDING_RUN_KEY)
    return raw ? (JSON.parse(raw) as PendingRun) : null
  } catch {
    return null
  }
}

function setPendingRun(run: PendingRun) {
  try {
    sessionStorage.setItem(PENDING_RUN_KEY, JSON.stringify(run))
  } catch {
    // storage unavailable — degrade gracefully (user lands on grooming only)
  }
}

function clearPendingRun() {
  try {
    sessionStorage.removeItem(PENDING_RUN_KEY)
  } catch {
    // ignore
  }
}

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
  const navigate = useNavigate()

  // Form state — initialised fresh whenever the dialog mounts/re-opens.
  // We use the `open` prop as a key signal via a ref to reset state.
  const [startDate, setStartDate] = useState(todayIso)
  const [showMoreOptions, setShowMoreOptions] = useState(false)
  const [startDayIndex, setStartDayIndex] = useState(1)
  const [showRecurring, setShowRecurring] = useState(false)
  const [cadenceDays, setCadenceDays] = useState(plan.lengthDays)
  const [endDate, setEndDate] = useState('')

  // Grooming prompt: false = showing the check prompt; true = user dismissed
  const [groomingDismissed, setGroomingDismissed] = useState(false)

  // Track whether we already handled the pending-run on this open cycle
  const pendingRunHandledRef = useRef(false)

  // Fridge data to count expiring items — read from cache (staleTime 30s)
  const { data: fridgeItems = [] } = useQuery({
    queryKey: ['fridge'],
    queryFn: fridgeService.list,
    staleTime: 30_000,
    enabled: open,
  })

  const expiringCount = countExpiringThisWeek(fridgeItems)
  const showGroomingPrompt = !groomingDismissed && expiringCount > 0

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

  // Check for a pending post-grooming run the first time the dialog opens
  // after grooming has completed. We do this in a callback triggered by the
  // Dialog's onOpenChange so no setState is called inside an effect.
  const handleDialogOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen && !pendingRunHandledRef.current) {
        pendingRunHandledRef.current = true
        const pending = getPendingRun()
        if (pending && pending.planId === plan.id) {
          clearPendingRun()
          // Fire the stored run body immediately — grooming is done, fridge updated
          mutation.mutate(pending.body)
          return // skip onOpenChange propagation; mutation.onSuccess closes dialog
        }
      }
      if (!nextOpen) {
        // Reset for next open
        pendingRunHandledRef.current = false
        setGroomingDismissed(false)
        setStartDate(todayIso())
        setShowMoreOptions(false)
        setStartDayIndex(1)
        setShowRecurring(false)
        setCadenceDays(plan.lengthDays)
        setEndDate('')
      }
      onOpenChange(nextOpen)
    },
    [mutation, onOpenChange, plan.id, plan.lengthDays],
  )

  function buildOnceBody(): RunPlanBody {
    return {
      startDate,
      startDayIndex: showMoreOptions && startDayIndex > 1 ? startDayIndex : null,
      recurrence: null,
    }
  }

  function buildRecurringBody(): RunPlanBody {
    return {
      startDate,
      startDayIndex: showMoreOptions && startDayIndex > 1 ? startDayIndex : null,
      recurrence: {
        cadenceDays: cadenceDays || null,
        endDate: endDate || null,
      },
    }
  }

  function handleRunOnce() {
    mutation.mutate(buildOnceBody())
  }

  function handleRunRecurring() {
    mutation.mutate(buildRecurringBody())
  }

  function handleGroomingYes() {
    const body = showRecurring ? buildRecurringBody() : buildOnceBody()
    setPendingRun({ planId: plan.id, body })
    onOpenChange(false)
    navigate('/app/grooming')
  }

  const isPending = mutation.isPending
  const dayOptions = Array.from({ length: plan.lengthDays }, (_, i) => i + 1)

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-sm w-full">
        <DialogHeader>
          <DialogTitle>{t('plan.run.dialogTitle')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* ── Grooming prompt (non-blocking inline step) ─────────────── */}
          {showGroomingPrompt && (
            <div
              role="status"
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex flex-col gap-3"
            >
              <p className="text-sm text-amber-900 font-medium">
                {t('plan.run.grooming.prompt', { count: expiringCount })}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleGroomingYes}
                  className="flex-1"
                >
                  {t('plan.run.grooming.yes')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setGroomingDismissed(true)}
                  className="flex-1 text-amber-700 hover:bg-amber-100"
                >
                  {t('plan.run.grooming.skip')}
                </Button>
              </div>
            </div>
          )}

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
