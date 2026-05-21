import { useState, useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { UserPlus, ChevronDown, ChevronUp } from 'lucide-react'
import axios from 'axios'
import { capture } from '@/lib/analytics'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { planService } from '@/services/plans'
import { usersService } from '@/services/users'
import { familyService } from '@/services/family'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'
import { ForbiddenIngredientsPicker } from '@/components/ForbiddenIngredientsPicker'
import type { MealType, ConstraintWeights } from '@/types'

const FAMILY_ID_KEY = 'kalmio_family_id'

// ── TDEE suggestion banner ────────────────────────────────────────────────────

interface TdeeSuggestionBannerProps {
  suggestedKcal: number | null
  suggestedProtein: number | null
  onApply: () => void
  applying: boolean
}

function TdeeSuggestionBanner({ suggestedKcal, suggestedProtein, onApply, applying }: TdeeSuggestionBannerProps) {
  const { t } = useTranslation()

  if (suggestedKcal == null && suggestedProtein == null) return null

  return (
    <div className="rounded-xl border border-[#4F7942]/30 bg-[#F3F8F2] px-4 py-4 space-y-2">
      <p className="text-xs font-semibold text-[#4F7942] uppercase tracking-wider">
        {t('settings.suggestion.title')}
      </p>
      {suggestedKcal != null && (
        <p className="text-sm text-[#1A1A1A]">
          {t('settings.suggestion.kcal', { n: Math.round(suggestedKcal) })}
        </p>
      )}
      {suggestedProtein != null && (
        <p className="text-sm text-[#1A1A1A]">
          {t('settings.suggestion.protein', { n: Math.round(suggestedProtein) })}
        </p>
      )}
      <p className="text-[10px] text-gray-500">{t('settings.suggestion.hint')}</p>
      <button
        type="button"
        disabled={applying}
        onClick={onApply}
        className="mt-1 rounded-lg bg-[#4F7942] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#4F7942]/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7942]/50 disabled:opacity-60"
      >
        {applying ? <Spinner className="h-3 w-3 inline-block" /> : t('settings.suggestion.accept')}
      </button>
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ShoppingCadence = 7 | 14
type WeightKey = keyof ConstraintWeights

interface PlanPreferencesFormProps {
  onSuccess?: () => void
  /** When true the form is being used to regenerate an existing plan. */
  isRegeneration?: boolean
}

// ── Weight distribution helper ────────────────────────────────────────────────

function distributeWeights(
  key: WeightKey,
  newValue: number,
  current: ConstraintWeights,
  activeKeys: WeightKey[],
): ConstraintWeights {
  const others = activeKeys.filter(k => k !== key)
  if (others.length === 0) return current
  const sumOthers = others.reduce((s, k) => s + current[k], 0)
  const remaining = 100 - newValue
  const next = { ...current, [key]: newValue }
  if (sumOthers === 0) {
    const share = Math.floor(remaining / others.length)
    others.forEach((k, i) => {
      next[k] = i === others.length - 1 ? remaining - share * (others.length - 1) : share
    })
  } else {
    let allocated = 0
    others.forEach((k, i) => {
      if (i === others.length - 1) { next[k] = Math.max(0, remaining - allocated) }
      else { const v = Math.max(0, Math.round((current[k] / sumOthers) * remaining)); next[k] = v; allocated += v }
    })
  }
  return next
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PlanPreferencesForm({ onSuccess, isRegeneration = false }: PlanPreferencesFormProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const currentUserId = useAuthStore((s) => s.session?.user.id ?? '')

  // ── User settings (for personal meal preferences) ─────────────────────────
  const { data: user } = useQuery({
    queryKey: ['user-settings'],
    queryFn: usersService.getMe,
    staleTime: 5 * 60 * 1000,
  })

  // ── Family (for the household chip selector) ──────────────────────────────
  const familyId = typeof window !== 'undefined' ? localStorage.getItem(FAMILY_ID_KEY) : null
  const { data: family } = useQuery({
    queryKey: ['family', familyId],
    queryFn: () => familyService.getFamily(familyId!),
    enabled: !!familyId,
    staleTime: 60_000,
  })

  // Start with every family member included; toggling a chip excludes them.
  const [excludedMemberIds, setExcludedMemberIds] = useState<Set<string>>(new Set())
  function toggleMember(userId: string) {
    if (userId === currentUserId) return // current user is always included
    setExcludedMemberIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const familyMembers = family?.members ?? []
  const includedMemberIds = familyMembers
    .map((m) => m.userId)
    .filter((id) => !excludedMemberIds.has(id))
  const hasMultipleIncluded = includedMemberIds.length > 1

  // ── Plan-level state ──────────────────────────────────────────────────────
  const [budgetMax, setBudgetMax] = useState('')
  const [prepTimeMax, setPrepTimeMax] = useState('')
  const [maxRepetitions, setMaxRepetitions] = useState(2)
  const [cadence, setCadence] = useState<ShoppingCadence>(7)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const prefillApplied = useRef(false)
  const [carbsTargetG, setCarbsTargetG] = useState('')
  const [fatTargetG, setFatTargetG] = useState('')
  const [forbiddenIngredientIds, setForbiddenIngredientIds] = useState<string[]>([])
  const [weights, setWeights] = useState<ConstraintWeights>({
    leftovers: 25, budget: 25, prepTime: 25, recipeRepeat: 25,
  })

  // ── TDEE suggestion apply ─────────────────────────────────────────────────
  const [tdeeApplying, setTdeeApplying] = useState(false)

  async function applyTdeeSuggestion() {
    if (!user) return
    setTdeeApplying(true)
    try {
      const updated = await usersService.updateSettings({
        mealPlanPreferences: {
          ...user.mealPlanPreferences,
          kcalTarget: user.suggestedKcalTarget != null
            ? Math.round(user.suggestedKcalTarget)
            : user.mealPlanPreferences?.kcalTarget,
          proteinTarget: user.suggestedProteinTarget != null
            ? Math.round(user.suggestedProteinTarget)
            : user.mealPlanPreferences?.proteinTarget,
        },
      })
      queryClient.setQueryData(['user-settings'], updated)
      queryClient.setQueryData(['me'], updated)
    } catch {
      // silently ignore — the banner stays visible; user can retry
    } finally {
      setTdeeApplying(false)
    }
  }

  // ── Pre-fill macro targets + forbidden ingredients from saved settings (once) ────
  useEffect(() => {
    if (!user || prefillApplied.current) return
    prefillApplied.current = true
    const updates: Array<() => void> = []
    if (user.carbsTargetG != null) updates.push(() => setCarbsTargetG(String(user.carbsTargetG)))
    if (user.fatTargetG != null) updates.push(() => setFatTargetG(String(user.fatTargetG)))
    const savedForbidden = user.mealPlanPreferences?.forbiddenIngredientIds
    if (savedForbidden && savedForbidden.length > 0) {
      updates.push(() => setForbiddenIngredientIds(savedForbidden))
    }
    updates.forEach(fn => fn())
  }, [user])

  // ── Active weight keys (inactive when their constraint is empty) ──────────
  const activeWeightKeys: WeightKey[] = (
    ['leftovers', 'budget', 'prepTime', 'recipeRepeat'] as WeightKey[]
  ).filter(k => {
    if (k === 'budget') return budgetMax.trim() !== ''
    if (k === 'prepTime') return prepTimeMax.trim() !== ''
    return true
  })

  const hasAnyConstraint = budgetMax.trim() !== '' || prepTimeMax.trim() !== ''

  // ── Mutation ──────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: planService.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['plan', 'active'] })
      void queryClient.invalidateQueries({ queryKey: ['points'] })
      if (isRegeneration) {
        capture('plan_regenerated', { reason: 'user_requested' })
      } else {
        capture('plan_created')
      }
      onSuccess?.()
    },
  })

  // ── Submit ────────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // The single-user generator only plans for the caller. When the user has kept other
    // family members in the household, hand off to the multi-member wizard so each
    // person's selection actually matters.
    if (hasMultipleIncluded) {
      navigate('/app/plans/new', { state: { initialMemberIds: includedMemberIds } })
      return
    }

    const prefs = user?.mealPlanPreferences
    const kcal = prefs?.kcalTarget ?? 2000
    const selectedMeals = (prefs?.selectedMealTypes ?? ['BREAKFAST', 'LUNCH', 'DINNER']) as MealType[]
    const mealCalorieTargets = prefs?.mealCalorieTargets ?? null
    const proteinTarget = prefs?.proteinTarget ?? null

    mutation.mutate({
      startDate: new Date().toISOString().split('T')[0],
      cycleDays: cadence,
      constraints: {
        days: cadence,
        selectedMeals,
        constraints: {
          kcalTarget: kcal,
          proteinTarget,
          budgetMax: budgetMax.trim() ? Number(budgetMax) : null,
          prepTimeMax: prepTimeMax.trim() ? Number(prepTimeMax) : null,
          maxRecipeRepetitions: maxRepetitions,
          constraintWeights: weights,
          mealCalorieTargets,
          dietaryRestrictions: null,
          carbsTargetG: carbsTargetG.trim() ? Number(carbsTargetG) : null,
          fatTargetG: fatTargetG.trim() ? Number(fatTargetG) : null,
          forbiddenIngredientIds: forbiddenIngredientIds.length > 0 ? forbiddenIngredientIds : undefined,
        },
      },
    })
  }

  // ── 422 detection ─────────────────────────────────────────────────────────
  const is422 =
    mutation.isError &&
    axios.isAxiosError(mutation.error) &&
    mutation.error.response?.status === 422

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-lg mx-auto">
      {/* TDEE suggestion — shown when backend has computed targets from body data */}
      {(user?.suggestedKcalTarget != null || user?.suggestedProteinTarget != null) && (
        <TdeeSuggestionBanner
          suggestedKcal={user.suggestedKcalTarget}
          suggestedProtein={user.suggestedProteinTarget}
          onApply={applyTdeeSuggestion}
          applying={tdeeApplying}
        />
      )}

      {/* Title */}
      <div>
        <h2 className="font-headline font-bold text-xl text-[#1A1A1A]">{t('preferences.title')}</h2>
        <p className="text-sm text-gray-500 mt-1">{t('preferences.subtitle')}</p>
      </div>

      {/* Section 1 — Household */}
      <section>
        <p className="text-sm font-semibold text-[#1A1A1A] mb-3">{t('preferences.household')}</p>
        <div className="flex flex-wrap gap-2">
          {(familyMembers.length > 0
            ? familyMembers
            : [{
                userId: currentUserId,
                role: 'PLANNER' as const,
                joinedAt: '',
                displayName: [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || '—',
                isManaged: false,
              }]
          ).map((m) => {
            const isSelf = m.userId === currentUserId
            const isIncluded = !excludedMemberIds.has(m.userId)
            return (
              <button
                key={m.userId}
                type="button"
                onClick={() => toggleMember(m.userId)}
                disabled={isSelf}
                aria-pressed={isIncluded}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-full border transition-colors',
                  isIncluded
                    ? 'border-[#4F7942] bg-white'
                    : 'border-gray-200 bg-gray-50 opacity-60',
                  isSelf ? 'cursor-default' : 'cursor-pointer hover:border-[#4F7942]/80',
                )}
                title={isSelf ? t('preferences.householdAlwaysIncluded') : undefined}
              >
                <div className="relative">
                  <UserAvatar
                    firstName={isSelf ? user?.firstName : (m.displayName ?? m.userId.slice(0, 8))}
                    lastName={isSelf ? user?.lastName : undefined}
                    email={isSelf ? user?.email : undefined}
                    size="sm"
                  />
                  {isIncluded && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#4F7942]">
                      <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 10" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="1,5 4,9 11,1" />
                      </svg>
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-[#1A1A1A] max-w-[120px] truncate">
                  {isSelf
                    ? ([user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || '—')
                    : (m.displayName ?? m.userId.slice(0, 8))}
                </span>
              </button>
            )
          })}

          {/* Invite — links to the family page where invites are generated */}
          <button
            type="button"
            onClick={() => navigate('/app/family')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-dashed border-gray-300 text-sm text-gray-500 hover:border-[#4F7942] hover:text-[#4F7942] transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            {t('preferences.inviteMember')}
          </button>
        </div>
        {hasMultipleIncluded && (
          <p className="mt-3 text-xs text-[#4F7942]">
            {t('preferences.multiMemberHint')}
          </p>
        )}
      </section>

      {/* Section 2 — Advanced settings disclosure */}
      <section>
        <button
          type="button"
          onClick={() => setAdvancedOpen(v => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-[#4F7942] hover:text-[#3d6033] transition-colors"
          aria-expanded={advancedOpen}
        >
          {advancedOpen
            ? <ChevronUp className="h-4 w-4 shrink-0" />
            : <ChevronDown className="h-4 w-4 shrink-0" />
          }
          {advancedOpen ? t('preferences.advancedToggleOpen') : t('preferences.advancedToggle')}
        </button>

        {advancedOpen && (
          <div className="mt-4 space-y-4 pl-1">
            {/* Max budget */}
            <div>
              <Label htmlFor="budget-max">{t('preferences.budgetMax')}</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="budget-max"
                  type="number"
                  min={0}
                  value={budgetMax}
                  onChange={e => setBudgetMax(e.target.value)}
                  placeholder={t('common.optional')}
                  className="w-32"
                />
                <span className="text-sm text-gray-500">{t('preferences.budgetUnit')}</span>
              </div>
            </div>

            {/* Max prep time */}
            <div>
              <Label htmlFor="prep-time-max">{t('preferences.prepTimeMax')}</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="prep-time-max"
                  type="number"
                  min={0}
                  value={prepTimeMax}
                  onChange={e => setPrepTimeMax(e.target.value)}
                  placeholder={t('common.optional')}
                  className="w-32"
                />
                <span className="text-sm text-gray-500">{t('preferences.prepTimeUnit')}</span>
              </div>
            </div>

            {/* Recipe repetitions stepper */}
            <div>
              <Label>{t('preferences.maxRepetitions')}</Label>
              <p className="text-xs text-gray-500 mt-0.5 mb-2">{t('preferences.maxRepetitionsHint')}</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMaxRepetitions(v => Math.max(1, v - 1))}
                  className="h-9 w-9 rounded-[10px] border border-gray-200 bg-white text-[#1A1A1A] font-semibold text-base hover:border-gray-400 transition-colors flex items-center justify-center"
                  aria-label="-"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-semibold text-[#1A1A1A]">{maxRepetitions}</span>
                <button
                  type="button"
                  onClick={() => setMaxRepetitions(v => Math.min(7, v + 1))}
                  className="h-9 w-9 rounded-[10px] border border-gray-200 bg-white text-[#1A1A1A] font-semibold text-base hover:border-gray-400 transition-colors flex items-center justify-center"
                  aria-label="+"
                >
                  +
                </button>
              </div>
            </div>

            {/* Carbs target */}
            <div>
              <Label htmlFor="carbs-target-g">{t('settings.macroTargets.carbsTargetG')}</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="carbs-target-g"
                  type="number"
                  min={0}
                  value={carbsTargetG}
                  onChange={e => setCarbsTargetG(e.target.value)}
                  placeholder={t('common.optional')}
                  className="w-32"
                />
                <span className="text-sm text-gray-500">g</span>
              </div>
            </div>

            {/* Fat target */}
            <div>
              <Label htmlFor="fat-target-g">{t('settings.macroTargets.fatTargetG')}</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="fat-target-g"
                  type="number"
                  min={0}
                  value={fatTargetG}
                  onChange={e => setFatTargetG(e.target.value)}
                  placeholder={t('common.optional')}
                  className="w-32"
                />
                <span className="text-sm text-gray-500">g</span>
              </div>
            </div>

            {/* Forbidden ingredients */}
            <div>
              <Label>{t('plan.forbiddenIngredients.label')}</Label>
              <div className="mt-2">
                <ForbiddenIngredientsPicker
                  value={forbiddenIngredientIds}
                  onChange={setForbiddenIngredientIds}
                />
              </div>
            </div>

            {/* Constraint priorities (only when at least one constraint is set) */}
            {hasAnyConstraint && (
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A] mb-1">{t('preferences.weightsTitle')}</p>
                <p className="text-xs text-gray-500 mb-4">{t('preferences.weightsHint')}</p>
                <div className="space-y-4">
                  {(
                    [
                      { key: 'leftovers' as WeightKey, label: t('preferences.weightLeftovers') },
                      { key: 'budget' as WeightKey, label: t('preferences.weightBudget') },
                      { key: 'prepTime' as WeightKey, label: t('preferences.weightPrepTime') },
                      { key: 'recipeRepeat' as WeightKey, label: t('preferences.weightRecipeRepeat') },
                    ]
                  ).map(({ key, label }) => {
                    const isActive = activeWeightKeys.includes(key)
                    return (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-1">
                          <span className={cn('text-sm', isActive ? 'text-[#1A1A1A] font-medium' : 'text-gray-400')}>
                            {label}
                          </span>
                          {isActive
                            ? <span className="text-sm font-semibold text-[#1A1A1A]">{weights[key]}%</span>
                            : <span className="text-xs text-gray-400">{t('preferences.weightDisabled')}</span>
                          }
                        </div>
                        <Slider
                          value={weights[key]}
                          min={0}
                          max={100}
                          step={1}
                          disabled={!isActive}
                          onChange={v => setWeights(prev => distributeWeights(key, v, prev, activeWeightKeys))}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Section 4 — Shopping cadence */}
      <section>
        <p className="text-sm font-semibold text-[#1A1A1A] mb-3">{t('preferences.shoppingCadence')}</p>
        <div className="grid grid-cols-2 gap-2">
          {([7, 14] as ShoppingCadence[]).map(days => (
            <button
              key={days}
              type="button"
              onClick={() => setCadence(days)}
              className={cn(
                'rounded-[12px] border p-3 text-left transition-colors',
                cadence === days
                  ? 'border-[#4F7942] bg-[#4F7942]/8'
                  : 'border-gray-200 bg-white hover:border-gray-400'
              )}
            >
              <p className="font-semibold text-sm text-[#1A1A1A]">
                {days === 7 ? t('preferences.cadenceWeekly') : t('preferences.cadenceBiweekly')}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{days} nap</p>
            </button>
          ))}
        </div>
      </section>

      {/* Submit */}
      <div className="pt-2">
        {mutation.isError && !is422 && (
          <p className="text-xs text-red-500 mb-3">{t('preferences.error')}</p>
        )}
        {is422 && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 mb-3">
            <p className="text-sm font-medium text-red-800">{t('preferences.infeasibleTitle')}</p>
            <p className="text-sm text-red-700 mt-1">{t('preferences.infeasibleDesc')}</p>
          </div>
        )}
        <Button
          type="submit"
          size="lg"
          disabled={mutation.isPending}
          className="w-full"
        >
          {mutation.isPending ? (
            <><Spinner className="h-4 w-4" /> {t('preferences.generating')}</>
          ) : hasMultipleIncluded ? (
            t('preferences.continueToWizard')
          ) : (
            t('preferences.generate')
          )}
        </Button>
      </div>
    </form>
  )
}
