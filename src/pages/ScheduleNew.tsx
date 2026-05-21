/**
 * ScheduleNew — 3-step wizard for creating a schedule.
 *
 * Route: /app/schedules/new
 *
 * Step 1: Plan(s) selection (multi-select with order, rotation)
 * Step 2: Cadence + start date + optional end date + recurrence type
 * Step 3: Name + summary + confirm
 *
 * On success → navigate to /app/schedules/{id}
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronUp, ChevronDown, X, Plus } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { schedulesService } from '@/services/schedules'
import { planTemplateService } from '@/services/plans'
import type { PlanTemplate } from '@/types'

// ── Step indicators ────────────────────────────────────────────────────────

type Step = 1 | 2 | 3

interface StepBarProps {
  step: Step
  labels: [string, string, string]
}

function StepBar({ step, labels }: StepBarProps) {
  return (
    <div className="flex items-center gap-0 mb-6" role="list" aria-label="Wizard steps">
      {([1, 2, 3] as Step[]).map((n, idx) => (
        <div key={n} className="flex items-center flex-1 min-w-0" role="listitem">
          <div
            className={`
              shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
              ${step === n ? 'bg-[#4f46e5] text-white' : step > n ? 'bg-[#4f46e5]/30 text-[#4f46e5]' : 'bg-gray-100 text-gray-400'}
            `}
            aria-current={step === n ? 'step' : undefined}
          >
            {n}
          </div>
          <span className={`ml-1.5 text-xs font-medium truncate ${step === n ? 'text-[#1A1A1A]' : 'text-gray-400'}`}>
            {labels[idx]}
          </span>
          {n < 3 && <div className="flex-1 mx-2 h-px bg-gray-200 shrink-0" />}
        </div>
      ))}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function nextMonday(): string {
  const d = new Date()
  const day = d.getDay()          // 0=Sun … 6=Sat
  const daysUntilMonday = day === 0 ? 1 : 8 - day
  d.setDate(d.getDate() + daysUntilMonday)
  return d.toISOString().split('T')[0]
}

type RecurrenceMode = 'once' | 'continuous' | 'n-times'

// ── Main component ────────────────────────────────────────────────────────

export function ScheduleNew() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [step, setStep] = useState<Step>(1)

  // Step 1: ordered plan IDs
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([])

  // Step 2
  const [startDate, setStartDate] = useState(nextMonday)
  const [endDate, setEndDate] = useState('')
  const [cadenceDays, setCadenceDays] = useState<number | null>(null)
  const [recurrenceMode, setRecurrenceMode] = useState<RecurrenceMode>('continuous')
  const [occurrences, setOccurrences] = useState(4)

  // Step 3
  const [scheduleName, setScheduleName] = useState('')

  // Plans from API
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['plan-templates'],
    queryFn: planTemplateService.list,
    staleTime: 30_000,
  })

  // Auto-derive cadence from selected plans' lengthDays
  const derivedCadence = selectedPlanIds.reduce((sum, id) => {
    const plan = plans.find(p => p.id === id)
    return sum + (plan?.lengthDays ?? 7)
  }, 0)

  const effectiveCadence = cadenceDays ?? (derivedCadence > 0 ? derivedCadence : 7)

  // Derive a default schedule name (only used when scheduleName is still empty)
  const derivedDefaultName = (() => {
    if (selectedPlanIds.length === 1) {
      return plans.find(p => p.id === selectedPlanIds[0])?.name ?? ''
    }
    if (selectedPlanIds.length > 1) {
      return t('schedules.wizard.scheduleNamePlaceholder')
    }
    return ''
  })()

  // Use user-typed name if provided, otherwise fall back to derived default
  const effectiveScheduleName = scheduleName || derivedDefaultName

  // Compute endDate when recurrence mode is n-times
  const computedEndDate = (() => {
    if (recurrenceMode === 'once') {
      const d = new Date(startDate)
      d.setDate(d.getDate() + effectiveCadence - 1)
      return d.toISOString().split('T')[0]
    }
    if (recurrenceMode === 'n-times') {
      const d = new Date(startDate)
      d.setDate(d.getDate() + effectiveCadence * occurrences - 1)
      return d.toISOString().split('T')[0]
    }
    return endDate || null
  })()

  const { mutate: doCreate, isPending } = useMutation({
    mutationFn: () => schedulesService.create({
      name: effectiveScheduleName.trim() || t('schedules.wizard.scheduleNamePlaceholder'),
      planIds: selectedPlanIds,
      cadenceDays: cadenceDays ?? undefined,
      startDate,
      endDate: computedEndDate ?? undefined,
    }),
    onSuccess: (created) => {
      void qc.invalidateQueries({ queryKey: ['schedules'] })
      navigate(`/app/schedules/${created.id}`)
    },
    onError: () => {
      toast({ title: t('schedules.wizard.submitError'), variant: 'destructive' })
    },
  })

  // ── Plan picker helpers ────────────────────────────────────────────────

  const availablePlans = plans.filter(p => p.status !== 'ARCHIVED')

  function addPlan(planId: string) {
    if (!selectedPlanIds.includes(planId)) {
      setSelectedPlanIds(prev => [...prev, planId])
      setCadenceDays(null) // reset so it re-derives
    }
  }

  function removePlan(planId: string) {
    setSelectedPlanIds(prev => prev.filter(id => id !== planId))
    setCadenceDays(null)
  }

  function movePlan(index: number, direction: -1 | 1) {
    const newArr = [...selectedPlanIds]
    const target = index + direction
    if (target < 0 || target >= newArr.length) return
    ;[newArr[index], newArr[target]] = [newArr[target], newArr[index]]
    setSelectedPlanIds(newArr)
  }

  const unselectedPlans = availablePlans.filter(p => !selectedPlanIds.includes(p.id))

  // ── Validation ─────────────────────────────────────────────────────────

  function canAdvanceStep1() {
    return selectedPlanIds.length > 0
  }

  function canAdvanceStep2() {
    return !!startDate
  }

  function canSubmit() {
    return !!effectiveScheduleName.trim() && selectedPlanIds.length > 0 && !!startDate
  }

  // ── Rendering ──────────────────────────────────────────────────────────

  const stepLabels: [string, string, string] = [
    t('schedules.wizard.stepPlans'),
    t('schedules.wizard.stepCadence'),
    t('schedules.wizard.stepConfirm'),
  ]

  function planName(id: string) {
    return plans.find(p => p.id === id)?.name ?? id
  }

  return (
    <div className="max-w-lg mx-auto px-4 pb-10">
      <Header
        title={t('schedules.wizard.title')}
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

      <StepBar step={step} labels={stepLabels} />

      {/* ── STEP 1: Plan selection ──────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <p className="text-sm font-medium text-[#1A1A1A]">{t('schedules.wizard.planPickerLabel')}</p>

          {plansLoading && (
            <div className="flex justify-center py-6"><Spinner /></div>
          )}

          {/* Ordered selected plans */}
          {selectedPlanIds.length > 0 && (
            <ul className="space-y-2" aria-label="Selected plans">
              {selectedPlanIds.map((id, idx) => (
                <li
                  key={id}
                  className="flex items-center gap-2 bg-[#f8f7ff] border border-[#4f46e5]/20 rounded-xl px-3 py-2.5"
                >
                  <span className="text-[10px] font-bold text-[#4f46e5] tabular-nums w-5 shrink-0 text-center">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-sm text-[#1A1A1A] truncate font-medium">{planName(id)}</span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => movePlan(idx, -1)}
                      disabled={idx === 0}
                      aria-label={`${planName(id)} feljebb`}
                      className="p-1 rounded hover:bg-[#4f46e5]/10 disabled:opacity-30 transition-colors"
                    >
                      <ChevronUp className="h-3.5 w-3.5 text-[#4f46e5]" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => movePlan(idx, 1)}
                      disabled={idx === selectedPlanIds.length - 1}
                      aria-label={`${planName(id)} lejjebb`}
                      className="p-1 rounded hover:bg-[#4f46e5]/10 disabled:opacity-30 transition-colors"
                    >
                      <ChevronDown className="h-3.5 w-3.5 text-[#4f46e5]" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => removePlan(id)}
                      aria-label={t('schedules.wizard.removePlan')}
                      className="p-1 rounded hover:bg-red-50 transition-colors"
                    >
                      <X className="h-3.5 w-3.5 text-red-500" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {selectedPlanIds.length > 1 && (
            <p className="text-xs text-gray-500">{t('schedules.wizard.rotationHint')}</p>
          )}

          {/* Unselected plans to pick from */}
          {!plansLoading && unselectedPlans.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                {selectedPlanIds.length > 0
                  ? t('schedules.wizard.addAnotherPlan')
                  : t('schedules.wizard.planPickerPlaceholder')}
              </p>
              <ul className="space-y-1.5" aria-label="Available plans">
                {unselectedPlans.map((plan: PlanTemplate) => (
                  <li key={plan.id}>
                    <button
                      type="button"
                      onClick={() => addPlan(plan.id)}
                      className="w-full flex items-center gap-2 text-left px-3 py-2.5 rounded-xl border border-gray-100 bg-white hover:border-[#4f46e5]/40 hover:bg-[#f8f7ff] transition-colors"
                    >
                      <Plus className="h-4 w-4 text-[#4f46e5] shrink-0" aria-hidden />
                      <span className="text-sm text-[#1A1A1A] font-medium truncate">{plan.name}</span>
                      <span className="ml-auto text-xs text-gray-400 shrink-0">
                        {plan.lengthDays} nap
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!plansLoading && availablePlans.length === 0 && (
            <p className="text-sm text-gray-500 py-4 text-center">{t('plan.noPlans')}</p>
          )}

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => setStep(2)}
              disabled={!canAdvanceStep1()}
              type="button"
            >
              {t('schedules.wizard.next')}
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Timing ─────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Recurrence type */}
          <fieldset>
            <legend className="text-sm font-medium text-[#1A1A1A] mb-2">
              {t('schedules.wizard.recurrence')}
            </legend>
            <div className="flex flex-col gap-2">
              {(['once', 'continuous', 'n-times'] as RecurrenceMode[]).map(mode => (
                <label key={mode} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="recurrence"
                    value={mode}
                    checked={recurrenceMode === mode}
                    onChange={() => setRecurrenceMode(mode)}
                    className="accent-[#4f46e5]"
                  />
                  <span className="text-sm text-[#1A1A1A]">
                    {mode === 'once' && t('schedules.wizard.recurrenceOnce')}
                    {mode === 'continuous' && t('schedules.wizard.recurrenceContinuous')}
                    {mode === 'n-times' && t('schedules.wizard.recurrenceN')}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {recurrenceMode === 'n-times' && (
            <div>
              <Label htmlFor="occurrences">{t('schedules.wizard.occurrences')}</Label>
              <Input
                id="occurrences"
                type="number"
                min={1}
                max={52}
                value={occurrences}
                onChange={e => setOccurrences(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="mt-1 w-32"
              />
            </div>
          )}

          {/* Start date */}
          <div>
            <Label htmlFor="start-date">{t('schedules.wizard.startDate')}</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setStartDate(e.target.value)}
              className="mt-1"
              required
            />
            <p className="text-xs text-gray-400 mt-1">{t('schedules.wizard.startDateHint')}</p>
          </div>

          {/* End date — only for continuous mode */}
          {recurrenceMode === 'continuous' && (
            <div>
              <Label htmlFor="end-date">{t('schedules.wizard.endDate')}</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-400 mt-1">{t('schedules.wizard.endDateHint')}</p>
            </div>
          )}

          {/* Cadence */}
          <div>
            <Label htmlFor="cadence-days">{t('schedules.wizard.cadenceDays')}</Label>
            <Input
              id="cadence-days"
              type="number"
              min={1}
              max={365}
              value={cadenceDays ?? effectiveCadence}
              onChange={e => {
                const v = parseInt(e.target.value, 10)
                setCadenceDays(isNaN(v) || v < 1 ? null : v)
              }}
              className="mt-1 w-32"
            />
            <p className="text-xs text-gray-400 mt-1">
              {cadenceDays === null && derivedCadence > 0
                ? t('schedules.wizard.cadenceAutoHint', { days: derivedCadence })
                : t('schedules.wizard.cadenceHint')}
            </p>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(1)} type="button">
              {t('schedules.wizard.back')}
            </Button>
            <Button onClick={() => setStep(3)} disabled={!canAdvanceStep2()} type="button">
              {t('schedules.wizard.next')}
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Name + confirm ──────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <Label htmlFor="schedule-name">{t('schedules.wizard.scheduleName')}</Label>
            <Input
              id="schedule-name"
              type="text"
              value={effectiveScheduleName}
              placeholder={t('schedules.wizard.scheduleNamePlaceholder')}
              onChange={e => setScheduleName(e.target.value)}
              maxLength={120}
              className="mt-1"
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1">{t('schedules.wizard.scheduleNameHint')}</p>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
            <p className="font-semibold text-[#1A1A1A]">
              {t('schedules.wizard.summaryPlans_other', { count: selectedPlanIds.length })}
            </p>
            <ul className="list-inside list-disc text-gray-600 space-y-0.5">
              {selectedPlanIds.map((id, idx) => (
                <li key={id} className="text-sm">
                  <span className="text-[10px] text-[#4f46e5] font-bold mr-1">{idx + 1}.</span>
                  {planName(id)}
                </li>
              ))}
            </ul>
            <p className="text-gray-500">
              {t('schedules.wizard.summaryCadence', { days: effectiveCadence })}
            </p>
            <p className="text-gray-500">
              {t('schedules.wizard.summaryStart', { date: startDate })}
            </p>
            {computedEndDate && (
              <p className="text-gray-500">
                {t('schedules.wizard.endDate')}: {computedEndDate}
              </p>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(2)} type="button">
              {t('schedules.wizard.back')}
            </Button>
            <Button
              onClick={() => doCreate()}
              disabled={!canSubmit() || isPending}
              type="button"
            >
              {isPending ? t('schedules.wizard.submitting') : t('schedules.wizard.submit')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
