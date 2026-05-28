/**
 * RecipeDetailDialog — modal recipe view shared by the meal plan and
 * dashboard timeline.
 *
 * Fetches the full recipe + ingredient catalog on open and renders the
 * macros header, prep/cook times, ingredient list with per-ingredient
 * kcal/protein, and the numbered steps. A "Start cooking" CTA navigates
 * to `/app/recipes/:id/cook` when the recipe has steps.
 *
 * `macros` is optional — the meal plan passes the slot's scaled macros,
 * while the timeline lets the dialog fall back to the recipe's own macros.
 */
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ChefHat } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { recipesService } from '@/services/recipes'
import { ingredientsService } from '@/services/ingredients'
import { getRecipeName, getRecipeSteps, getRecipeGarnish } from '@/lib/i18nRecipe'
import type { Ingredient } from '@/types'

interface RecipeDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipeId: string
  /** Display name fallback while the recipe loads. */
  displayName?: string
  /** Scaled macros to show instead of per-serving recipe macros. */
  macros?: { kcal: number; protein: number; fat: number; carbs: number } | null
}

export function RecipeDetailDialog({
  open,
  onOpenChange,
  recipeId,
  displayName,
  macros,
}: RecipeDetailDialogProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const lang = (i18n.resolvedLanguage === 'hu' ? 'hu' : 'en') as 'en' | 'hu'

  const { data: fullRecipe } = useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: () => recipesService.get(recipeId),
    staleTime: 5 * 60 * 1000,
    enabled: open,
  })

  const { data: allIngredients = [] } = useQuery({
    queryKey: ['ingredients'],
    queryFn: ingredientsService.list,
    staleTime: 30_000,
    enabled: open,
  })

  const ingredientById = useMemo<Map<string, Ingredient>>(
    () => new Map(allIngredients.map(i => [i.id, i])),
    [allIngredients],
  )

  const steps = getRecipeSteps(fullRecipe, lang)
  const title = getRecipeName(fullRecipe, lang) || displayName || ''
  const garnish = getRecipeGarnish(fullRecipe, lang)
  const effectiveMacros = macros ?? fullRecipe?.macros ?? null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="leading-snug pr-6">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {steps.length > 0 && (
            <button
              type="button"
              onClick={() => navigate(`/app/recipes/${recipeId}/cook`)}
              className="
                w-full inline-flex items-center justify-center gap-2 rounded-xl
                bg-[#F28C28] px-4 py-2.5 text-sm font-semibold text-white
                hover:bg-[#d9761e] active:bg-[#c06917]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-1
              "
            >
              <ChefHat className="h-4 w-4" aria-hidden />
              {t('recipes.detail.startCooking')}
            </button>
          )}

          {effectiveMacros && (
            <div className="grid grid-cols-4 gap-1.5 text-center">
              {([
                { labelKey: 'recipes.detail.kcal', value: effectiveMacros.kcal },
                { labelKey: 'recipes.detail.protein', value: effectiveMacros.protein },
                { labelKey: 'recipes.detail.fat', value: effectiveMacros.fat },
                { labelKey: 'recipes.detail.carbs', value: effectiveMacros.carbs },
              ] as const).map(({ labelKey, value }) => (
                <div key={labelKey} className="bg-[#F9F7F2] rounded-[8px] p-1.5">
                  <span className="sr-only">{t(labelKey)}: {Number(value).toFixed(0)}</span>
                  <p className="text-xs font-bold text-[#1A1A1A]" aria-hidden="true">{Number(value).toFixed(0)}</p>
                  <p className="text-[10px] text-gray-400" aria-hidden="true">{t(labelKey)}</p>
                </div>
              ))}
            </div>
          )}

          {fullRecipe && (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#F9F7F2] rounded-[10px] p-2.5 text-center">
                <p className="text-[10px] text-gray-400 mb-0.5">{t('recipes.detail.prep')}</p>
                <p className="text-sm font-bold text-[#1A1A1A]">{fullRecipe.prepTimeMinutes}m</p>
              </div>
              <div className="bg-[#F9F7F2] rounded-[10px] p-2.5 text-center">
                <p className="text-[10px] text-gray-400 mb-0.5">{t('recipes.detail.cook')}</p>
                <p className="text-sm font-bold text-[#1A1A1A]">{fullRecipe.cookTimeMinutes}m</p>
              </div>
            </div>
          )}

          {fullRecipe && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {t('recipes.detail.ingredients')}
              </p>
              {fullRecipe.ingredients.length === 0 ? (
                <p className="text-sm text-gray-400">{t('recipes.detail.noIngredients')}</p>
              ) : (
                <ul className="space-y-1.5">
                  {fullRecipe.ingredients.map(ing => {
                    const ingredient = ingredientById.get(ing.ingredientId)
                    const name = ingredient
                      ? (ingredient.translations?.[lang]?.name ?? ingredient.name)
                      : ing.ingredientId
                    const unitLabel = ing.unit === 'G' ? 'g' : ing.unit === 'ML' ? 'ml' : t('recipes.detail.piece')
                    let ingKcal: number | null = null
                    let ingProtein: number | null = null
                    if (ingredient?.macros) {
                      const gramsEquiv =
                        ing.unit === 'PIECE'
                          ? ing.amount * (ingredient.gramsPerPiece ?? 100)
                          : ing.amount
                      ingKcal = (gramsEquiv / 100) * ingredient.macros.kcal
                      ingProtein = (gramsEquiv / 100) * ingredient.macros.protein
                    }
                    return (
                      <li key={ing.id} className="flex items-start justify-between gap-2 text-sm">
                        <div className="flex-1 min-w-0">
                          <span className="text-[#1A1A1A] leading-snug">{name}</span>
                          {ingKcal !== null && ingProtein !== null && (
                            <p className="text-[11px] text-gray-400 mt-0.5 tabular-nums">
                              {ingKcal.toFixed(0)} kcal · {ingProtein.toFixed(1)}g {t('recipes.detail.protein')}
                            </p>
                          )}
                        </div>
                        <span className="text-gray-500 tabular-nums shrink-0 mt-0.5">
                          {ing.amount}{unitLabel}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {t('recipes.detail.steps')}
            </p>
            {steps.length === 0 ? (
              <p className="text-sm text-gray-400">{t('recipes.detail.noSteps')}</p>
            ) : (
              <ol className="space-y-2">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-2.5 text-sm">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-[#F28C28] text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-[#1A1A1A] leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
          {garnish && (
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                {t('recipes.detail.garnish')}
              </p>
              <p className="text-sm text-[#1A1A1A] leading-relaxed">{garnish}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
