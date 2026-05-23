/**
 * RecipeDetail — full-page recipe view.
 *
 * Route: /app/recipes/:id
 *
 * Converted from RecipeDetailDialog (KALMIO-294). Provides:
 *   - Bookmarkable, deep-linkable URL
 *   - Browser back/forward navigation
 *   - Full-screen mobile experience (no cramped dialog sheet)
 *
 * Context is preserved via the `from` search param:
 *   ?from=timeline  → back label "Vissza az ütemtervhez"
 *   (default)       → back label "Receptek"
 *
 * The scaled macros passed via the dialog props are not available in the
 * page context (they are slot-specific). The page always shows the recipe's
 * own per-serving macros, which is the correct behaviour for a shareable
 * detail view.
 */
import { useMemo } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ChefHat } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { recipesService } from '@/services/recipes'
import { ingredientsService } from '@/services/ingredients'
import { getRecipeName, getRecipeSteps } from '@/lib/i18nRecipe'
import type { Ingredient } from '@/types'

export function RecipeDetail() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage === 'hu' ? 'hu' : 'en') as 'en' | 'hu'

  const from = searchParams.get('from')

  const { data: fullRecipe, isLoading, isError } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => recipesService.get(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })

  const { data: allIngredients = [] } = useQuery({
    queryKey: ['ingredients'],
    queryFn: ingredientsService.list,
    staleTime: 30_000,
  })

  const ingredientById = useMemo<Map<string, Ingredient>>(
    () => new Map(allIngredients.map(i => [i.id, i])),
    [allIngredients],
  )

  const steps = getRecipeSteps(fullRecipe, lang)
  const title = getRecipeName(fullRecipe, lang) || t('recipeDetail.untitled')
  const effectiveMacros = fullRecipe?.macros ?? null

  function handleBack() {
    // If we can go back in history, prefer that so scroll position is restored.
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/app/recipes')
    }
  }

  const backLabel = from === 'timeline'
    ? t('recipeDetail.backToTimeline')
    : t('recipeDetail.backToRecipes')

  return (
    <div className="max-w-lg mx-auto px-4 pb-12">
      {/* Back nav */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm pt-4 pb-2 -mx-4 px-4 border-b border-gray-100">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1A1A1A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] rounded"
          aria-label={backLabel}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {backLabel}
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16" aria-live="polite" aria-busy="true">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-red-600 py-10 text-center">
          {t('common.errorGeneric')}
        </p>
      )}

      {!isLoading && !isError && (
        <div className="space-y-6 pt-6">
          <h1 className="text-xl font-bold text-[#1A1A1A] leading-snug">
            {title}
          </h1>

          {/* Start cooking CTA */}
          {steps.length > 0 && id && (
            <button
              type="button"
              onClick={() => navigate(`/app/recipes/${id}/cook`)}
              className="
                w-full inline-flex items-center justify-center gap-2 rounded-xl
                bg-[#F28C28] px-4 py-3 text-sm font-semibold text-white
                hover:bg-[#d9761e] active:bg-[#c06917]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-1
              "
            >
              <ChefHat className="h-4 w-4" aria-hidden />
              {t('recipes.detail.startCooking')}
            </button>
          )}

          {/* Macro tiles */}
          {effectiveMacros && (
            <div className="grid grid-cols-4 gap-2 text-center">
              {([
                { labelKey: 'recipes.detail.kcal', value: effectiveMacros.kcal },
                { labelKey: 'recipes.detail.protein', value: effectiveMacros.protein },
                { labelKey: 'recipes.detail.fat', value: effectiveMacros.fat },
                { labelKey: 'recipes.detail.carbs', value: effectiveMacros.carbs },
              ] as const).map(({ labelKey, value }) => (
                <div key={labelKey} className="bg-[#F9F7F2] rounded-[10px] p-2">
                  <span className="sr-only">{t(labelKey)}: {Number(value).toFixed(0)}</span>
                  <p className="text-sm font-bold text-[#1A1A1A]" aria-hidden="true">
                    {Number(value).toFixed(0)}
                  </p>
                  <p className="text-[11px] text-gray-400" aria-hidden="true">
                    {t(labelKey)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Timing tiles */}
          {fullRecipe && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F9F7F2] rounded-[12px] p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">{t('recipes.detail.prep')}</p>
                <p className="text-base font-bold text-[#1A1A1A]">{fullRecipe.prepTimeMinutes} min</p>
              </div>
              <div className="bg-[#F9F7F2] rounded-[12px] p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">{t('recipes.detail.cook')}</p>
                <p className="text-base font-bold text-[#1A1A1A]">{fullRecipe.cookTimeMinutes} min</p>
              </div>
            </div>
          )}

          {/* Ingredients */}
          {fullRecipe && (
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {t('recipes.detail.ingredients')}
              </h2>
              {fullRecipe.ingredients.length === 0 ? (
                <p className="text-sm text-gray-400">{t('recipes.detail.noIngredients')}</p>
              ) : (
                <ul className="space-y-2">
                  {fullRecipe.ingredients.map(ing => {
                    const ingredient = ingredientById.get(ing.ingredientId)
                    const name = ingredient
                      ? (ingredient.translations?.[lang]?.name ?? ingredient.name)
                      : ing.ingredientId
                    const unitLabel =
                      ing.unit === 'G' ? 'g'
                      : ing.unit === 'ML' ? 'ml'
                      : t('recipes.detail.piece')
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
                      <li key={ing.id} className="flex items-start justify-between gap-3 text-sm">
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
            </section>
          )}

          {/* Steps */}
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {t('recipes.detail.steps')}
            </h2>
            {steps.length === 0 ? (
              <p className="text-sm text-gray-400">{t('recipes.detail.noSteps')}</p>
            ) : (
              <ol className="space-y-3">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-[#F28C28] text-white text-[11px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-[#1A1A1A] leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
