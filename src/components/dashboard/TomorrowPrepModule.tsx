import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getRecipeNameFromTranslations } from '@/lib/i18nRecipe'
import { recipesService } from '@/services/recipes'
import { RecipeFamilyHint } from '@/components/recipe/RecipeFamilyHint'
import type { PrepTaskCard, PrepType, PrepWindow } from '@/types'

interface TomorrowPrepModuleProps {
  tasks: PrepTaskCard[]
}

function prepTypeLabel(prepType: PrepType, t: (key: string) => string): string {
  return t(`dashboard.prep.prepTypeLabels.${prepType}`)
}

function windowLabel(window: PrepWindow, t: (key: string) => string): string {
  return t(`dashboard.prep.windowLabels.${window}`)
}

export function TomorrowPrepModule({ tasks }: TomorrowPrepModuleProps) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language?.startsWith('hu') ? 'hu' : 'en') as 'hu' | 'en'
  // Recipes cache for family info — shared key with other surfaces.
  const { data: allRecipes = [] } = useQuery({
    queryKey: ['recipes'],
    queryFn: recipesService.list,
    staleTime: 5 * 60 * 1000,
    enabled: tasks.length > 0,
  })
  const recipesById = new Map(allRecipes.map(r => [r.id, r]))

  if (tasks.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.prep.tomorrowTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="pt-3 space-y-2">
        {tasks.map((task, idx) => {
          const recipe = task.recipeId ? recipesById.get(task.recipeId) : undefined
          return (
          <div
            key={task.id ?? `tomorrow-${task.recipeId}-${task.window}-${idx}`}
            className="flex items-start gap-3 p-3 rounded-[12px] bg-[#F9F7F2]"
          >
            <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" aria-hidden />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 font-medium capitalize">
                {windowLabel(task.window, t)}
              </p>
              <p className="text-sm font-semibold text-[#1A1A1A] leading-tight">
                {getRecipeNameFromTranslations(task.recipeTranslations ?? null, task.recipeName, lang)}
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
              <p className="text-xs text-gray-400">{prepTypeLabel(task.prepType, t)}</p>
              {task.servingsToMake != null && task.servingsToMake > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {t('dashboard.prep.cookServings', { count: Number(task.servingsToMake) })}
                  {task.feedsPlannedMealIds && task.feedsPlannedMealIds.length > 1 && (
                    <span className="text-gray-400">
                      {' '}· {t('dashboard.prep.feedsMeals', { count: task.feedsPlannedMealIds.length })}
                    </span>
                  )}
                </p>
              )}
              {task.servingsToFreeze != null && Number(task.servingsToFreeze) > 0 && (
                <p className="text-[11px] mt-0.5 text-blue-600 font-medium">
                  {t('dashboard.prep.freezeAtPrep', { count: Number(task.servingsToFreeze) })}
                </p>
              )}
              {task.durationMin != null && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {t('dashboard.prep.durationMin', { count: task.durationMin })}
                </p>
              )}
            </div>
          </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
