/**
 * PlanCreate — 3-step plan template creation wizard (meal-planning-v2).
 *
 * Step 1: Members — chip selector, self pre-selected.
 * Step 2: Shape   — length_days quick-picks (1/7/14) + custom (1-28),
 *                   meal_slots_covered (all 6 meal types, at least one required).
 * Step 3: Name + Source — edit-in-place name, radio source choice
 *                         ("Tervező töltse fel" / "Üresen kezdem").
 *
 * On submit: POST /api/plans (CreatePlanTemplateRequest).
 * On "Auto-fill": additionally calls POST /api/plans/{id}/snapshot/refresh,
 *                 then navigates to /app/plans/{id}.
 * On "Start empty": navigates directly to /app/plans/{id}.
 *
 * No conflict check — templates are calendar-free.
 */
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Pencil, Check } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { MemberChipSelector, type SelectableMember } from '@/components/plan/MemberChipSelector'
import { familyService } from '@/services/family'
import { usersService } from '@/services/users'
import { planTemplateService } from '@/services/plans'
import { useAuthStore } from '@/store/auth'
import { generateTemplateName } from './planUtils'
import type { MealType, CreatePlanTemplateRequest } from '@/types'

const FAMILY_ID_KEY = 'kalmio_family_id'

type WizardStep = 1 | 2 | 3

/** All meal types supported in plan templates. */
const MEAL_TYPES: MealType[] = [
  'BREAKFAST',
  'MORNING_SNACK',
  'LUNCH',
  'AFTERNOON_SNACK',
  'DINNER',
  'SNACK',
]

/** Quick-pick day counts per AC. */
const DURATION_PRESETS = [1, 7, 14]

type PlanSource = 'AUTO' | 'EMPTY'

export function PlanCreate() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const qc = useQueryClient()
  const currentUserId = useAuthStore((s) => s.session?.user.id ?? '')
  const familyId = localStorage.getItem(FAMILY_ID_KEY)

  // Allow callers to land with a pre-selected member set.
  const initialMemberIds =
    (location.state as { initialMemberIds?: string[] } | null)?.initialMemberIds ?? [currentUserId]

  const [step, setStep] = useState<WizardStep>(1)

  // Step 1
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(initialMemberIds)

  // Step 2
  const [lengthDays, setLengthDays] = useState(7)
  const [mealSlots, setMealSlots] = useState<MealType[]>(['LUNCH', 'DINNER'])

  // Step 3
  const [editingName, setEditingName] = useState(false)
  const [planName, setPlanName] = useState('')
  const [source, setSource] = useState<PlanSource>('AUTO')

  // Load family for member list
  const { data: family } = useQuery({
    queryKey: ['family', familyId],
    queryFn: () => familyService.getFamily(familyId!),
    enabled: !!familyId,
    staleTime: 60_000,
  })

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: usersService.getMe,
    staleTime: 60_000,
  })

  const myDisplayName = me
    ? ([me.firstName, me.lastName].filter(Boolean).join(' ') || me.email)
    : t('family.memberRow.you')

  const selectableMembers: SelectableMember[] = family
    ? family.members.map((m) => ({
        id: m.userId,
        displayName:
          m.userId === currentUserId
            ? myDisplayName
            : (m.displayName ?? m.userId.slice(0, 8)),
        isCurrentUser: m.userId === currentUserId,
      }))
    : [{ id: currentUserId, displayName: myDisplayName, isCurrentUser: true }]

  const memberDisplayNames = selectedMemberIds.map((id) => {
    const m = selectableMembers.find((sm) => sm.id === id)
    return m?.displayName ?? id
  })

  const autoName = generateTemplateName(memberDisplayNames, t)
  const displayName = planName || autoName

  function toggleMealSlot(mt: MealType) {
    setMealSlots((prev) =>
      prev.includes(mt) ? prev.filter((s) => s !== mt) : [...prev, mt]
    )
  }

  // Snapshot mutation — called after create when source === 'AUTO'
  const snapshotMut = useMutation({
    mutationFn: (planId: string) => planTemplateService.refreshSnapshot(planId),
  })

  const createMut = useMutation({
    mutationFn: (req: CreatePlanTemplateRequest) => planTemplateService.create(req),
    onSuccess: async (plan) => {
      qc.invalidateQueries({ queryKey: ['plan-templates'] })
      if (source === 'AUTO') {
        try {
          await snapshotMut.mutateAsync(plan.id)
        } catch {
          // Snapshot refresh failure is non-fatal — the plan exists and the
          // solver can still run with stale prefs.
        }
      }
      toast({ title: t('plan.wizard.created') })
      navigate(`/app/plans/${plan.id}`)
    },
    onError: () => {
      toast({ title: t('common.errorGeneric'), variant: 'destructive' })
    },
  })

  function submit() {
    const req: CreatePlanTemplateRequest = {
      name: planName || autoName,
      memberIds: selectedMemberIds,
      mealSlotsCovered: mealSlots,
      lengthDays,
    }
    createMut.mutate(req)
  }

  function canAdvance(): boolean {
    if (step === 1) return selectedMemberIds.length > 0
    if (step === 2) return lengthDays >= 1 && lengthDays <= 28 && mealSlots.length > 0
    if (step === 3) return true
    return false
  }

  const isPending = createMut.isPending || snapshotMut.isPending

  const stepLabels = [
    t('plan.wizard.step1Label'),
    t('plan.wizard.step2Label'),
    t('plan.wizard.step3Label'),
  ]

  return (
    <div className="max-w-lg mx-auto px-4 pb-10">
      <Header
        title={t('plan.wizard.title')}
        actions={
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm text-[#6b7280] hover:text-[#1A1A1A] flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('common.back')}
          </button>
        }
      />

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8" role="list" aria-label={t('plan.wizard.stepsLabel')}>
        {stepLabels.map((label, i) => {
          const n = (i + 1) as WizardStep
          const done = step > n
          const active = step === n
          return (
            <div key={n} className="flex items-center gap-2 flex-1 last:flex-none" role="listitem">
              <div className="flex items-center gap-1.5">
                <span
                  aria-current={active ? 'step' : undefined}
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                    ${done ? 'bg-emerald-500 text-white' : active ? 'bg-[#4f46e5] text-white' : 'bg-[#e5e7eb] text-[#9ca3af]'}
                  `}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : n}
                </span>
                <span className={`text-xs hidden sm:block ${active ? 'text-[#1A1A1A] font-medium' : 'text-[#9ca3af]'}`}>
                  {label}
                </span>
              </div>
              {i < 2 && <div className="flex-1 h-px bg-[#e5e4e7]" aria-hidden />}
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl border border-[#e5e4e7] shadow-sm p-5 mb-6">

        {/* Step 1: Members */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-headline font-bold text-[#1A1A1A]">{t('plan.wizard.step1Title')}</h2>
            <p className="text-sm text-[#6b7280]">{t('plan.wizard.step1Hint')}</p>
            <MemberChipSelector
              members={selectableMembers}
              selected={selectedMemberIds}
              onChange={setSelectedMemberIds}
            />
            {selectedMemberIds.length === 0 && (
              <p className="text-xs text-red-600" role="alert">{t('plan.wizard.atLeastOneMember')}</p>
            )}
          </div>
        )}

        {/* Step 2: Shape (length + meal slots) */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="font-headline font-bold text-[#1A1A1A] mb-1">{t('plan.wizard.step2Title')}</h2>
              <p className="text-sm text-[#6b7280]">{t('plan.wizard.step2Hint')}</p>
            </div>

            {/* Length quick-picks */}
            <div className="flex flex-col gap-2">
              <Label>{t('plan.wizard.duration')}</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {DURATION_PRESETS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={lengthDays === d}
                    onClick={() => setLengthDays(d)}
                    className={`
                      px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]
                      ${lengthDays === d
                        ? 'bg-[#4f46e5] text-white border-transparent'
                        : 'bg-white text-[#1A1A1A] border-[#e5e4e7] hover:border-[#4f46e5]'}
                    `}
                  >
                    {t('plan.wizard.durationDays', { count: d })}
                  </button>
                ))}
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={1}
                    max={28}
                    value={lengthDays}
                    onChange={(e) => setLengthDays(Math.max(1, Math.min(28, Number(e.target.value))))}
                    className="w-16 text-center"
                    aria-label={t('plan.wizard.durationCustom')}
                  />
                  <span className="text-sm text-[#6b7280]">{t('plan.wizard.days')}</span>
                </div>
              </div>
            </div>

            {/* Meal slot checkboxes */}
            <div className="flex flex-col gap-2">
              <Label>{t('plan.wizard.mealSlotsLabel')}</Label>
              <p className="text-sm text-[#6b7280]">{t('plan.wizard.step3Hint')}</p>
              <div className="flex flex-col gap-2" role="group" aria-label={t('plan.wizard.mealSlotsLabel')}>
                {MEAL_TYPES.map((mt) => {
                  const checked = mealSlots.includes(mt)
                  return (
                    <label
                      key={mt}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors
                        ${checked ? 'border-[#4f46e5] bg-[#eef2ff]' : 'border-[#e5e4e7] bg-white hover:border-[#4f46e5]/50'}
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMealSlot(mt)}
                        className="w-4 h-4 accent-[#4f46e5] rounded shrink-0"
                      />
                      <span className="text-sm font-medium text-[#1A1A1A]">
                        {t(`plan.mealTypes.${mt}`, mt)}
                      </span>
                    </label>
                  )
                })}
              </div>
              {mealSlots.length === 0 && (
                <p className="text-xs text-red-600" role="alert">{t('plan.wizard.atLeastOneMealSlot')}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Name + Source */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <h2 className="font-headline font-bold text-[#1A1A1A]">{t('plan.wizard.step3Title')}</h2>

            {/* Plan name edit-in-place */}
            <div className="flex flex-col gap-1.5">
              <Label>{t('plan.wizard.planName')}</Label>
              {editingName ? (
                <div className="flex gap-2">
                  <Input
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder={autoName}
                    autoFocus
                    maxLength={200}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingName(false)}
                  >
                    {t('common.save')}
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!planName) setPlanName(autoName)
                    setEditingName(true)
                  }}
                  className="flex items-center gap-2 text-sm text-[#1A1A1A] hover:text-[#4f46e5] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5] rounded"
                >
                  <span>{displayName || t('plan.wizard.autoNamePlaceholder')}</span>
                  <Pencil className="w-3.5 h-3.5 text-[#9ca3af]" aria-hidden />
                </button>
              )}
              <p className="text-xs text-[#9ca3af]">{t('plan.wizard.nameHint')}</p>
            </div>

            {/* Source choice */}
            <div className="flex flex-col gap-2">
              <Label>{t('plan.wizard.sourceLabel')}</Label>
              <div className="flex flex-col gap-2" role="radiogroup" aria-label={t('plan.wizard.sourceLabel')}>
                {([
                  { value: 'AUTO' as PlanSource, labelKey: 'plan.wizard.sourceAuto', hintKey: 'plan.wizard.sourceAutoHint' },
                  { value: 'EMPTY' as PlanSource, labelKey: 'plan.wizard.sourceEmpty', hintKey: 'plan.wizard.sourceEmptyHint' },
                ] satisfies { value: PlanSource; labelKey: string; hintKey: string }[]).map(({ value, labelKey, hintKey }) => (
                  <label
                    key={value}
                    className={`
                      flex items-start gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors
                      ${source === value ? 'border-[#4f46e5] bg-[#eef2ff]' : 'border-[#e5e4e7] bg-white hover:border-[#4f46e5]/50'}
                    `}
                  >
                    <input
                      type="radio"
                      name="plan-source"
                      value={value}
                      checked={source === value}
                      onChange={() => setSource(value)}
                      className="w-4 h-4 accent-[#4f46e5] shrink-0 mt-0.5"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-[#1A1A1A]">{t(labelKey)}</span>
                      <span className="text-xs text-[#6b7280]">{t(hintKey)}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Review summary */}
            <div className="rounded-xl bg-[#f9fafb] border border-[#e5e4e7] px-4 py-3 flex flex-col gap-1.5">
              <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide">{t('plan.wizard.summaryLabel')}</p>
              <p className="text-sm text-[#1A1A1A]">
                <span className="font-medium">{t('plan.wizard.summaryName')}</span>{' '}
                {displayName}
              </p>
              <p className="text-sm text-[#1A1A1A]">
                <span className="font-medium">{t('plan.wizard.summaryLength')}</span>{' '}
                {t('plan.wizard.durationDays', { count: lengthDays })}
              </p>
              <p className="text-sm text-[#1A1A1A]">
                <span className="font-medium">{t('plan.wizard.summarySlots')}</span>{' '}
                {mealSlots.map((mt) => t(`plan.mealTypes.${mt}`, mt)).join(', ')}
              </p>
              <p className="text-sm text-[#1A1A1A]">
                <span className="font-medium">{t('plan.wizard.summaryMembers')}</span>{' '}
                {memberDisplayNames.join(', ')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="md"
          onClick={() => (step === 1 ? navigate(-1) : setStep((step - 1) as WizardStep))}
          disabled={isPending}
        >
          <ChevronLeft className="w-4 h-4" />
          {step === 1 ? t('common.cancel') : t('common.back')}
        </Button>

        {step < 3 ? (
          <Button
            variant="primary"
            size="md"
            onClick={() => setStep((step + 1) as WizardStep)}
            disabled={!canAdvance()}
          >
            {t('plan.wizard.next')}
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={submit}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Spinner className="w-4 h-4" />
                {t('plan.wizard.creating')}
              </>
            ) : (
              t('plan.wizard.create')
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
