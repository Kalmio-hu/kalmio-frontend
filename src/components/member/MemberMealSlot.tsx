/**
 * MemberMealSlot — one meal row on the member's personal view.
 *
 * Default action: single-tap "ate it" → marks the slot EATEN (will call BE4
 * skip-slot / eat endpoint when available — currently calls the existing
 * PlannedMeal status update endpoint as a best-effort).
 *
 * Secondary action: "Something else" → opens the OffPlanLogSheet.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle, MoreHorizontal, Sparkles, Utensils } from 'lucide-react'
import { MealRationalePanel } from '@/components/plan/MealRationalePanel'
import { RecipeFamilyHint } from '@/components/recipe/RecipeFamilyHint'
import { recipesService } from '@/services/recipes'
import type { MealType, PlannedMealStatus } from '@/types'

export interface MemberMealSlotProps {
  plannedMealId: string
  date: string
  mealType: MealType
  recipeId: string | null
  recipeName: string | null
  portionKcal: number | null
  portionProtein: number | null
  portionFat: number | null
  portionCarbs: number | null
  servingMultiplier: number
  status: PlannedMealStatus
  isBatchCookLeftover: boolean
  /** True when this slot belongs to the viewing user (edit allowed). */
  isOwn: boolean
  onMarkEaten?: (plannedMealId: string) => void
  onLogOffPlan?: (plannedMealId: string) => void
}

const MEAL_TYPE_ORDER: MealType[] = [
  'BREAKFAST',
  'MORNING_SNACK',
  'LUNCH',
  'AFTERNOON_SNACK',
  'DINNER',
  'SNACK',
]

export { MEAL_TYPE_ORDER }

const STATUS_CLASSES: Record<PlannedMealStatus, string> = {
  PLANNED: '',
  EATEN: 'opacity-60',
  SKIPPED: 'opacity-50 line-through',
  REPLACED: 'opacity-60',
}

export function MemberMealSlot({
  plannedMealId,
  mealType,
  recipeId,
  recipeName,
  portionKcal,
  portionProtein,
  status,
  isBatchCookLeftover,
  isOwn,
  onMarkEaten,
  onLogOffPlan,
}: MemberMealSlotProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [rationaleOpen, setRationaleOpen] = useState(false)

  // Family info for the recipe — important for diet-restricted members to
  // see what variant is on their plate without opening the recipe detail.
  const { data: allRecipes = [] } = useQuery({
    queryKey: ['recipes'],
    queryFn: recipesService.list,
    staleTime: 5 * 60 * 1000,
    enabled: !!recipeId,
  })
  const recipe = recipeId ? allRecipes.find(r => r.id === recipeId) : undefined

  const mealLabel = t(`plan.mealTypes.${mealType}`, mealType)
  const isSettled = status === 'EATEN' || status === 'SKIPPED'

  return (
    <div className="flex flex-col">
    <div
      className={`
        relative flex items-center gap-3 py-3 px-3 rounded-xl border border-[#f0ede8]
        bg-white transition-colors
        ${STATUS_CLASSES[status]}
      `}
    >
      {/* Slot badge */}
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#6b7280] bg-[#f3f4f6] rounded px-1.5 py-0.5 w-16 text-center">
        {mealLabel}
      </span>

      {/* Recipe info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1a1a1a] truncate">
          {recipeName ?? t('member.slot.noRecipe')}
        </p>
        {recipe?.familyId && (
          <div className="mt-0.5">
            <RecipeFamilyHint
              familyId={recipe.familyId}
              variantLabel={recipe.variantLabel}
              dietTier={recipe.dietTier}
            />
          </div>
        )}
        <div className="flex items-center gap-2 mt-0.5 text-xs text-[#6b7280]">
          {portionKcal != null && (
            <span>{portionKcal.toFixed(0)} kcal</span>
          )}
          {portionProtein != null && (
            <span>{portionProtein.toFixed(0)}g {t('member.slot.protein')}</span>
          )}
          {isBatchCookLeftover && (
            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-semibold">
              {t('plan.planner.leftover')}
            </span>
          )}
        </div>
      </div>

      {/* Status badge */}
      {status === 'EATEN' && (
        <CheckCircle className="h-4 w-4 text-[#4f7942] shrink-0" aria-label={t('member.slot.eaten')} />
      )}
      {status === 'SKIPPED' && (
        <span className="text-[10px] font-semibold text-[#9ca3af] shrink-0">{t('member.slot.skipped')}</span>
      )}

      {/* Rationale toggle — available on every slot, settled or not */}
      <button
        type="button"
        aria-label={t('plan.rationale.toggle')}
        aria-expanded={rationaleOpen}
        onClick={() => setRationaleOpen(o => !o)}
        className={`
          shrink-0 p-1.5 rounded-lg transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]
          ${rationaleOpen ? 'text-[#F28C28] bg-[#FFF3E5]' : 'text-[#9ca3af] hover:text-[#F28C28] hover:bg-[#FFF8EF]'}
        `}
      >
        <Sparkles className="h-4 w-4" />
      </button>

      {/* Action area — own slots only, not yet settled */}
      {isOwn && !isSettled && (
        <div className="flex items-center gap-1 shrink-0">
          {/* Primary: ate it */}
          <button
            type="button"
            aria-label={t('member.actions.markEaten')}
            onClick={() => onMarkEaten?.(plannedMealId)}
            className="
              flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold
              bg-[#4f7942] text-white hover:bg-[#3d6132] active:bg-[#2e4a26]
              transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f7942]
            "
          >
            <CheckCircle className="h-3 w-3" />
            {t('member.actions.ateIt')}
          </button>

          {/* Secondary: overflow menu */}
          <div className="relative">
            <button
              type="button"
              aria-label={t('member.actions.moreOptions')}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(o => !o)}
              className="
                p-1.5 rounded-lg text-[#6b7280] hover:bg-[#f3f4f6] active:bg-[#e5e7eb]
                transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]
              "
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {menuOpen && (
              <>
                {/* Overlay to close on outside click */}
                <div
                  className="fixed inset-0 z-10"
                  aria-hidden="true"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-8 z-20 min-w-[170px] bg-white rounded-xl border border-[#e5e7eb] shadow-lg py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      onLogOffPlan?.(plannedMealId)
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[#1a1a1a] hover:bg-[#f9f7f2] text-left"
                  >
                    <Utensils className="h-3.5 w-3.5 text-[#6b7280]" />
                    {t('member.actions.somethingElse')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
      <MealRationalePanel
        plannedMealId={plannedMealId}
        recipeId={recipeId}
        open={rationaleOpen}
        onStartCooking={rid => navigate(`/app/recipes/${rid}/cook`)}
      />
    </div>
  )
}
