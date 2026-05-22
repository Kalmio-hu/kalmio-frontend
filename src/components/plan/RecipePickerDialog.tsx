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
import { getRecipeName } from '@/lib/i18nRecipe'
import { emptyFilterState, filterRecipes, type RecipeFilterState } from './recipeFilters'
import { RecipeFilterChips } from './RecipeFilterChips'
import type { Recipe } from '@/types'

interface RecipePickerDialogProps {
  open: boolean
  currentRecipeId: string
  onSelect: (recipe: Recipe) => void
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

  const filtered = filterRecipes(recipes, filters, lang, ingredientConstraintsMap)

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
          {!isLoading && filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">{t('mealPlan.recipePicker.noResults')}</p>
          )}
          {filtered.map(recipe => {
            const isCurrent = recipe.id === currentRecipeId
            return (
              <button
                key={recipe.id}
                type="button"
                onClick={() => { onSelect(recipe); onClose() }}
                className={`w-full text-left rounded-[10px] px-3 py-2.5 transition-colors border ${
                  isCurrent
                    ? 'border-[#4F7942] bg-[#4F7942]/5'
                    : 'border-transparent bg-[#F9F7F2] hover:bg-[#f0ede6]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#1A1A1A] leading-snug">{getRecipeName(recipe, lang)}</p>
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {t('mealPlan.recipePicker.prepTime', { min: recipe.prepTimeMinutes + recipe.cookTimeMinutes })}
                      </span>
                      {recipe.macros && (
                        <>
                          <span>{t('mealPlan.recipePicker.kcal', { kcal: recipe.macros.kcal.toFixed(0) })}</span>
                          <span>{t('mealPlan.recipePicker.protein', { protein: recipe.macros.protein.toFixed(0) })}</span>
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
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
