/**
 * RecipePickerDialog — search-and-select dialog used for swapping a recipe
 * on the meal plan and the dashboard timeline. Shared so both consumers
 * stay in lockstep visually.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Check, Clock } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { recipesService } from '@/services/recipes'
import { ingredientsService } from '@/services/ingredients'
import { usersService, USERS_ME_QUERY_KEY } from '@/services/users'
import { getRecipeName } from '@/lib/i18nRecipe'
import { emptyFilterState, filterRecipes, type RecipeFilterState } from './recipeFilters'
import { RecipeFilterChips } from './RecipeFilterChips'
import { filterByDietTier, groupByFamily } from './recipeFamilyGrouping'
import { DietTierBadge } from '@/components/recipe/DietTierBadge'
import type { Recipe } from '@/types'

/**
 * Selection context returned to the caller alongside the picked recipe.
 *
 * `isSiblingSwap` lets the caller route same-family swaps through
 * `POST /api/planned-meals/{id}/swap-variant` (which emits the
 * MEAL_VARIANT_SWAPPED domain event) instead of the generic
 * `PATCH /api/planned-meals/{id}/recipe`. The picker knows the family
 * relationship from the recipes it has loaded, so the caller doesn't
 * need to look it up separately.
 */
export interface RecipePickerSelection {
  isSiblingSwap: boolean
  currentFamilyId: string | null
}

interface RecipePickerDialogProps {
  open: boolean
  currentRecipeId: string
  onSelect: (recipe: Recipe, ctx: RecipePickerSelection) => void
  onClose: () => void
}

export function RecipePickerDialog({ open, currentRecipeId, onSelect, onClose }: RecipePickerDialogProps) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage === 'hu' ? 'hu' : 'en') as 'hu' | 'en'
  const [filters, setFilters] = useState<RecipeFilterState>(emptyFilterState())

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: recipesService.list,
    staleTime: 5 * 60 * 1000,
    enabled: open,
  })

  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients'],
    queryFn: ingredientsService.list,
    staleTime: 5 * 60 * 1000,
    enabled: open && filters.dietary.size > 0,
  })
  const ingredientConstraintsMap = new Map(ingredients.map(i => [i.id, i.constraints]))

  // W7 — pull the user's effectiveDietTier so we hide variants they can't eat.
  // The chip popover already filters; this picker now does too, so the two surfaces stay
  // consistent. Server enforces the same rule for the swap-variant endpoint (W5b).
  const { data: me } = useQuery({
    queryKey: USERS_ME_QUERY_KEY,
    queryFn: usersService.getMe,
    staleTime: 5 * 60 * 1000,
    enabled: open,
  })

  const dietFiltered = filterByDietTier(
    filterRecipes(recipes, filters, lang, ingredientConstraintsMap),
    me?.effectiveDietTier,
  )
  const { siblings, others, familyId: currentFamilyId } = groupByFamily(dietFiltered, currentRecipeId)
  const currentRecipe = recipes.find(r => r.id === currentRecipeId) ?? null
  const familyName = currentRecipe?.familyName ?? null

  function handleRowSelect(recipe: Recipe, isSibling: boolean) {
    onSelect(recipe, {
      isSiblingSwap: isSibling,
      currentFamilyId,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('mealPlan.recipePicker.title')}</DialogTitle>
        </DialogHeader>

        <Input
          placeholder={t('mealPlan.recipePicker.search')}
          value={filters.search}
          onChange={e => setFilters({ ...filters, search: e.target.value })}
          className="mb-2"
          autoFocus
        />
        <div className="mb-3">
          <RecipeFilterChips state={filters} onChange={setFilters} compact />
        </div>

        <div className="space-y-2 max-h-[50dvh] overflow-y-auto pr-1">
          {isLoading && (
            <div className="flex justify-center py-8"><Spinner className="h-5 w-5" /></div>
          )}
          {!isLoading && siblings.length === 0 && others.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">{t('mealPlan.recipePicker.noResults')}</p>
          )}
          {siblings.length > 0 && (
            <>
              <h3 className="text-[10px] font-semibold tracking-wide text-[#4F7942] uppercase pt-1 pb-0.5">
                {familyName
                  ? t('recipeFamily.sameFamilyHeader', { family: familyName })
                  : t('recipeFamily.variants')}
              </h3>
              {siblings.map(recipe => (
                <RecipeRow
                  key={recipe.id}
                  recipe={recipe}
                  isCurrent={false}
                  isSibling
                  lang={lang}
                  onSelect={() => handleRowSelect(recipe, true)}
                  t={t}
                />
              ))}
            </>
          )}
          {others.length > 0 && (
            <>
              {siblings.length > 0 && (
                <h3 className="text-[10px] font-semibold tracking-wide text-gray-400 uppercase pt-2 pb-0.5">
                  {t('recipeFamily.otherRecipesHeader')}
                </h3>
              )}
              {others.map(recipe => (
                <RecipeRow
                  key={recipe.id}
                  recipe={recipe}
                  isCurrent={recipe.id === currentRecipeId}
                  isSibling={false}
                  lang={lang}
                  onSelect={() => handleRowSelect(recipe, false)}
                  t={t}
                />
              ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface RecipeRowProps {
  recipe: Recipe
  isCurrent: boolean
  isSibling: boolean
  lang: 'hu' | 'en'
  onSelect: () => void
  t: (key: string, options?: Record<string, unknown>) => string
}

function RecipeRow({ recipe, isCurrent, isSibling, lang, onSelect, t }: RecipeRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-[10px] px-3 py-2.5 transition-colors border ${
        isCurrent
          ? 'border-[#4F7942] bg-[#4F7942]/5'
          : isSibling
            ? 'border-[#4F7942]/30 bg-[#4F7942]/5 hover:bg-[#4F7942]/10'
            : 'border-transparent bg-[#F9F7F2] hover:bg-[#f0ede6]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-semibold text-sm text-[#1A1A1A] leading-snug">
              {getRecipeName(recipe, lang)}
            </p>
            {recipe.dietTier && <DietTierBadge tier={recipe.dietTier} />}
          </div>
          {isSibling && recipe.variantLabel && (
            <p className="text-[11px] text-[#4F7942] font-medium mt-0.5">
              {recipe.variantLabel}
            </p>
          )}
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-gray-500 mt-0.5">
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {t('mealPlan.recipePicker.prepTime', { min: recipe.prepTimeMinutes + recipe.cookTimeMinutes })}
            </span>
            {recipe.macros && (
              <>
                {/* recipe.macros holds RECIPE-TOTAL values; divide by servings
                    so the picker shows per-portion numbers consistent with the
                    Receptek list and the Dashboard meal cards. */}
                <span>{t('mealPlan.recipePicker.kcal', { kcal: (recipe.macros.kcal / Math.max(1, recipe.servings)).toFixed(0) })}</span>
                <span>{t('mealPlan.recipePicker.protein', { protein: (recipe.macros.protein / Math.max(1, recipe.servings)).toFixed(0) })}</span>
              </>
            )}
          </div>
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {recipe.tags.map(tag => (
                <Badge key={tag} variant="gray">{t(`recipes.tags.${tag}`, { defaultValue: tag })}</Badge>
              ))}
            </div>
          )}
        </div>
        {isCurrent && <Check className="h-4 w-4 text-[#4F7942] shrink-0 mt-0.5" />}
      </div>
    </button>
  )
}
