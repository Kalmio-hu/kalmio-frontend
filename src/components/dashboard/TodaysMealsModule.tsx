import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Check, MoreHorizontal, Pencil, Sparkles, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { planService } from '@/services/plans'
import { dashboardService } from '@/services/dashboard'
import { plannedMealsService } from '@/services/plannedMeals'
import { usersService, USERS_ME_QUERY_KEY } from '@/services/users'
import { getRecipeNameFromTranslations } from '@/lib/i18nRecipe'
import { MealRationalePanel } from '@/components/plan/MealRationalePanel'
import { VariantsChip } from '@/components/recipe/VariantsChip'
import { LogOffPlanMealModal } from './LogOffPlanMealModal'
import { todayIsoLocal } from '@/lib/utils'
import { useSyncInvalidation } from '@/hooks/useSyncInvalidation'
import type { TodaysMealCard, OffPlanMealCard, Plan, DashboardDto, PlannedMealStatusExtended, DietTier } from '@/types'

interface TodaysMealsModuleProps {
  meals: TodaysMealCard[]
  offPlanMeals: OffPlanMealCard[]
  activePlan: Plan | null | undefined
  isLoading: boolean
}

interface MealCardProps {
  meal: TodaysMealCard
  planId: string
  today: string
  effectiveDietTier: DietTier
}

function MealTypeLabel({ mealType }: { mealType: string }) {
  const { t } = useTranslation()
  const key = `dashboard.meals.mealTypes.${mealType}`
  const label = t(key, { defaultValue: mealType })
  return (
    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
      {label}
    </span>
  )
}

function StatusPill({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    EATEN: 'bg-[#4F7942]/10 text-[#4F7942]',
    SKIPPED: 'bg-gray-100 text-gray-400',
    REPLACED: 'bg-blue-50 text-blue-600',
    PLANNED: 'bg-[#F9F7F2] text-gray-500',
  }
  const { t } = useTranslation()
  if (status === 'PLANNED') return null
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[status] ?? 'bg-gray-100 text-gray-500'}`}
    >
      {t(`plan.mealStatus.${status}`, { defaultValue: status })}
    </span>
  )
}

function MacroPill({ kcal, protein }: { kcal: number; protein: number }) {
  return (
    <span className="text-xs text-gray-400">
      {Math.round(kcal)} kcal &middot; {Math.round(protein)}g P
    </span>
  )
}

function MealCard({ meal, planId, today, effectiveDietTier }: MealCardProps) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language?.startsWith('hu') ? 'hu' : 'en') as 'hu' | 'en'
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [logModalOpen, setLogModalOpen] = useState(false)
  const [rationaleOpen, setRationaleOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  // ── Optimistic helpers ──────────────────────────────────────────────────
  // Applies a status change directly to the cached DashboardDto so the UI
  // responds instantly without waiting for the network. The snapshot is
  // stored in onMutate context and restored on terminal error.
  function applyOptimisticMealStatus(newStatus: PlannedMealStatusExtended) {
    void queryClient.cancelQueries({ queryKey: ['dashboard', today] })
    const snapshot = queryClient.getQueryData<DashboardDto>(['dashboard', today])
    queryClient.setQueryData<DashboardDto>(['dashboard', today], (prev) => {
      if (!prev) return prev
      return {
        ...prev,
        todaysMeals: prev.todaysMeals.map((m) =>
          m.mealId === meal.mealId ? { ...m, status: newStatus } : m,
        ),
      }
    })
    return { snapshot }
  }

  function rollbackMealStatus(context: { snapshot: DashboardDto | undefined } | undefined) {
    if (context?.snapshot) {
      queryClient.setQueryData(['dashboard', today], context.snapshot)
    }
  }

  const markEaten = useMutation({
    mutationFn: () =>
      planService.updateMeal(planId, meal.mealId, { status: 'EATEN' }),
    onMutate: () => applyOptimisticMealStatus('EATEN'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard', today] })
      void queryClient.invalidateQueries({ queryKey: ['macros', today] })
      toast({ title: t('dashboard.meals.markEaten'), variant: 'success' })
    },
    onError: (_err, _vars, context) => {
      rollbackMealStatus(context)
      toast({ title: t('mutation.mealStatusError'), variant: 'destructive' })
    },
  })

  const markSkipped = useMutation({
    mutationFn: () =>
      planService.updateMeal(planId, meal.mealId, { status: 'SKIPPED' }),
    onMutate: () => applyOptimisticMealStatus('SKIPPED'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard', today] })
      void queryClient.invalidateQueries({ queryKey: ['macros', today] })
      setMenuOpen(false)
    },
    onError: (_err, _vars, context) => {
      rollbackMealStatus(context)
      toast({ title: t('mutation.mealStatusError'), variant: 'destructive' })
      setMenuOpen(false)
    },
  })

  const markPlanned = useMutation({
    mutationFn: () =>
      planService.updateMeal(planId, meal.mealId, { status: 'PLANNED' }),
    onMutate: () => applyOptimisticMealStatus('PLANNED'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard', today] })
      void queryClient.invalidateQueries({ queryKey: ['macros', today] })
      setMenuOpen(false)
    },
    onError: (_err, _vars, context) => {
      rollbackMealStatus(context)
      toast({ title: t('mutation.mealStatusError'), variant: 'destructive' })
      setMenuOpen(false)
    },
  })

  // ── Variant swap mutation (W8) ──────────────────────────────────────────
  const swapVariant = useMutation({
    mutationFn: (targetRecipeId: string) =>
      plannedMealsService.swapVariant(meal.mealId, targetRecipeId),
    onMutate: async (targetRecipeId: string) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', today] })
      const snapshot = queryClient.getQueryData<DashboardDto>(['dashboard', today])
      // Optimistically update the recipe name to the sibling's variant label
      const sibling = meal.siblings?.find(s => s.id === targetRecipeId)
      queryClient.setQueryData<DashboardDto>(['dashboard', today], (prev) => {
        if (!prev) return prev
        return {
          ...prev,
          todaysMeals: prev.todaysMeals.map((m) =>
            m.mealId === meal.mealId
              ? {
                  ...m,
                  recipeId: targetRecipeId,
                  recipeName: sibling?.variantLabel ?? m.recipeName,
                  familyId: m.familyId,
                  siblings: m.siblings,
                  dietTier: sibling?.dietTier ?? m.dietTier,
                }
              : m,
          ),
        }
      })
      return { snapshot }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard', today] })
      void queryClient.invalidateQueries({ queryKey: ['macros', today] })
      // Also invalidate the calendar view's planned-meals cache so the user
      // sees the swap reflected if they navigate over there. Symmetric with
      // CalendarView, which invalidates the dashboard cache after its own swaps.
      void queryClient.invalidateQueries({ queryKey: ['planned-meals'] })
      toast({ title: t('recipeFamily.swapped'), variant: 'success' })
    },
    onError: (err: unknown, _vars, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(['dashboard', today], context.snapshot)
      }
      // Typed 422 error codes from the backend
      const status = (err as { response?: { status?: number; data?: { code?: string } } })?.response
      if (status?.status === 422) {
        const code = status?.data?.code
        if (code === 'CROSS_FAMILY_SWAP' || code === 'DIET_TIER_INCOMPATIBLE') {
          toast({ title: t('recipeFamily.noCompatibleVariants'), variant: 'destructive' })
          return
        }
      }
      toast({ title: t('common.errorGeneric'), variant: 'destructive' })
    },
  })

  const isEaten = meal.status === 'EATEN'
  const isSkipped = meal.status === 'SKIPPED'
  const isFinal = isEaten || isSkipped || meal.status === 'REPLACED'

  return (
    <div className="flex flex-col">
    <div className="relative flex items-start gap-3 p-3 rounded-[12px] bg-[#F9F7F2]">
      {/* Eaten checkbox */}
      <button
        type="button"
        aria-label={t('dashboard.meals.markEaten')}
        onClick={() => { if (!isFinal && !markEaten.isPending) markEaten.mutate() }}
        disabled={isFinal || markEaten.isPending}
        className={[
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-1',
          isEaten
            ? 'border-[#4F7942] bg-[#4F7942]'
            : isSkipped
              ? 'border-gray-300 bg-gray-100'
              : 'border-gray-300 hover:border-[#4F7942]',
        ].join(' ')}
      >
        {markEaten.isPending ? (
          <Spinner className="h-3 w-3" />
        ) : isEaten ? (
          <Check className="h-3 w-3 text-white" aria-hidden />
        ) : null}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <MealTypeLabel mealType={meal.mealType} />
            <p
              className={[
                'text-sm font-semibold text-[#1A1A1A] leading-tight',
                isSkipped ? 'line-through text-gray-400' : '',
              ].join(' ')}
            >
              {getRecipeNameFromTranslations(meal.recipeTranslations ?? null, meal.recipeName, lang)}
            </p>
            {meal.macros && (
              <MacroPill kcal={meal.macros.kcal} protein={meal.macros.protein} />
            )}
            {/* Variant swap chip — only when the recipe belongs to a family (W8) */}
            {meal.familyId && meal.siblings && meal.siblings.length > 0 && (
              <div className="mt-1">
                <VariantsChip
                  familyId={meal.familyId}
                  siblings={meal.siblings}
                  currentRecipeId={meal.recipeId}
                  currentDietTier={meal.dietTier ?? null}
                  effectiveDietTier={effectiveDietTier}
                  onSwap={(targetRecipeId) => swapVariant.mutate(targetRecipeId)}
                  isSwapping={swapVariant.isPending}
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <StatusPill status={meal.status} />
            {/* Rationale toggle */}
            <button
              type="button"
              aria-label={t('plan.rationale.toggle')}
              aria-expanded={rationaleOpen}
              onClick={() => setRationaleOpen(o => !o)}
              className={`p-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] ${
                rationaleOpen
                  ? 'text-[#F28C28] bg-[#FFF3E5]'
                  : 'text-gray-400 hover:text-[#F28C28] hover:bg-white'
              }`}
            >
              <Sparkles className="h-4 w-4" aria-hidden />
            </button>
            {/* Three-dot overflow menu — hidden only for REPLACED meals */}
            {meal.status !== 'REPLACED' && (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  aria-label={t('plan.mealActions')}
                  onClick={() => setMenuOpen(o => !o)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden />
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-8 z-20 min-w-[160px] rounded-[12px] border border-[#e5e4e7] bg-white shadow-lg py-1"
                  >
                    {isFinal ? (
                      <button
                        role="menuitem"
                        type="button"
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-[#F9F7F2] transition-colors"
                        onClick={() => markPlanned.mutate()}
                        disabled={markPlanned.isPending}
                      >
                        {t('dashboard.meals.undoStatus')}
                      </button>
                    ) : (
                      <>
                        <button
                          role="menuitem"
                          type="button"
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-[#F9F7F2] transition-colors"
                          onClick={() => { setMenuOpen(false); markSkipped.mutate() }}
                          disabled={markSkipped.isPending}
                        >
                          {t('dashboard.meals.markSkipped')}
                        </button>
                        <button
                          role="menuitem"
                          type="button"
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-[#F9F7F2] transition-colors"
                          onClick={() => { setMenuOpen(false); setLogModalOpen(true) }}
                        >
                          {t('dashboard.meals.logOther')}
                        </button>
                        <button
                          role="menuitem"
                          type="button"
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-[#F9F7F2] transition-colors"
                          onClick={() => { setMenuOpen(false); toast({ title: t('common.comingSoon') }) }}
                        >
                          {t('dashboard.meals.replaceRecipe')}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <LogOffPlanMealModal
        open={logModalOpen}
        onOpenChange={setLogModalOpen}
        mealType={meal.mealType}
        date={today}
        planId={planId}
        mealId={meal.mealId}
      />
    </div>
      <MealRationalePanel
        plannedMealId={meal.mealId}
        recipeId={meal.recipeId}
        open={rationaleOpen}
        onStartCooking={rid => navigate(`/app/recipes/${rid}/cook`)}
      />
    </div>
  )
}

function OffPlanMealCardItem({ meal, today }: { meal: OffPlanMealCard; today: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)

  const deleteMeal = useMutation({
    mutationFn: () => dashboardService.deleteOffPlanMeal(meal.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', today] })
      const snapshot = queryClient.getQueryData<DashboardDto>(['dashboard', today])
      queryClient.setQueryData<DashboardDto>(['dashboard', today], (prev) => {
        if (!prev) return prev
        return {
          ...prev,
          offPlanMeals: prev.offPlanMeals.filter((m) => m.id !== meal.id),
        }
      })
      return { snapshot }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard', today] })
      void queryClient.invalidateQueries({ queryKey: ['macros', today] })
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(['dashboard', today], context.snapshot)
      }
      toast({ title: t('dashboard.meals.errorUpdating'), variant: 'destructive' })
    },
  })

  return (
    <div className="flex items-start gap-3 p-3 rounded-[12px] bg-[#F9F7F2]">
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {meal.mealType && <MealTypeLabel mealType={meal.mealType} />}
            <p className="text-sm font-semibold text-[#1A1A1A] leading-tight">
              {meal.displayName}
            </p>
            {meal.macros && (
              <MacroPill kcal={meal.macros.kcal} protein={meal.macros.protein} />
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
              {t('dashboard.meals.offPlanBadge')}
            </span>
            <button
              type="button"
              aria-label={t('dashboard.meals.editOffPlan')}
              onClick={() => setEditOpen(true)}
              className="p-1.5 rounded-lg text-gray-300 hover:text-[#1A1A1A] hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
            >
              <Pencil className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              aria-label={t('dashboard.meals.deleteOffPlan')}
              onClick={() => deleteMeal.mutate()}
              disabled={deleteMeal.isPending}
              className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
            >
              {deleteMeal.isPending ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>
        </div>
      </div>
      <LogOffPlanMealModal
        open={editOpen}
        onOpenChange={setEditOpen}
        date={today}
        editing={meal}
      />
    </div>
  )
}

export function TodaysMealsModule({ meals, offPlanMeals, activePlan, isLoading }: TodaysMealsModuleProps) {
  const { t } = useTranslation()
  const today = todayIsoLocal()
  const [addModalOpen, setAddModalOpen] = useState(false)

  // Re-align with server state after background-sync drains (KALMIO-378).
  useSyncInvalidation([['dashboard', today], ['macros', today]])

  // Fetch the user's effective diet tier for variant filtering (W8).
  const { data: userMe } = useQuery({
    queryKey: USERS_ME_QUERY_KEY,
    queryFn: usersService.getMe,
    staleTime: 30_000,
  })
  const effectiveDietTier: DietTier = userMe?.effectiveDietTier ?? 'OMNIVORE'

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.meals.title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Spinner className="h-5 w-5" />
        </CardContent>
      </Card>
    )
  }

  if (!activePlan) return null

  const hasPlanned = meals.length > 0
  const hasOffPlan = offPlanMeals.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.meals.title')}</CardTitle>
      </CardHeader>
      <CardContent className="pt-3 space-y-2">
        {!hasPlanned ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            {t('dashboard.meals.noMealsToday')}
          </p>
        ) : (
          meals.map(meal => (
            <MealCard
              key={meal.mealId}
              meal={meal}
              planId={activePlan.id}
              today={today}
              effectiveDietTier={effectiveDietTier}
            />
          ))
        )}

        {/* Off-plan meals section */}
        {hasOffPlan && (
          <>
            {hasPlanned && (
              <hr className="border-dashed border-[#e5e4e7] my-1" />
            )}
            {offPlanMeals.map(meal => (
              <OffPlanMealCardItem key={meal.id} meal={meal} today={today} />
            ))}
          </>
        )}

        {/* Standalone add button */}
        <div className={hasPlanned || hasOffPlan ? 'pt-1' : ''}>
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-1 rounded"
          >
            {t('dashboard.meals.addOffPlan')}
          </button>
        </div>
      </CardContent>

      <LogOffPlanMealModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        date={today}
      />
    </Card>
  )
}
