import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from '@/components/ui/toast'
import { planService } from '@/services/plans'
import { recipesService } from '@/services/recipes'
import { capture } from '@/lib/analytics'
import { todayIsoLocal } from '@/lib/utils'
import { RecipeFamilyHint } from '@/components/recipe/RecipeFamilyHint'

interface Props {
  planId: string
  onAccept: () => void
  onDecline: () => void
}

export function ReplanDiffCard({ planId, onAccept, onDecline }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const today = todayIsoLocal()

  const [showDetails, setShowDetails] = useState(false)

  const { data: diff, isLoading } = useQuery({
    queryKey: ['replanDiff', planId],
    queryFn: () => planService.getReplanDiff(planId),
    staleTime: 60_000,
  })

  // Recipes catalogue for family lookup on each change row.
  const { data: allRecipes = [] } = useQuery({
    queryKey: ['recipes'],
    queryFn: recipesService.list,
    staleTime: 5 * 60 * 1000,
    enabled: !!diff && (diff.changes?.length ?? 0) > 0,
  })
  const recipesById = new Map(allRecipes.map(r => [r.id, r]))

  const acceptMutation = useMutation({
    mutationFn: () => planService.acceptReplan(planId, diff!.diffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan', 'active'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', today] })
      queryClient.invalidateQueries({ queryKey: ['points'] })
      capture('replan_accepted', {})
      onAccept()
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: ['replanDiff', planId] })
      toast({ title: t('dashboard.replan.acceptError'), variant: 'destructive' })
    },
  })

  if (isLoading) return null
  if (!diff) return null

  return (
    <Card>
      <CardContent className="pt-5">
        <h3 className="text-sm font-headline font-bold text-[#1A1A1A]">
          {t('dashboard.replan.title')}
        </h3>

        <div className="mt-1">
          {diff.narrative.length > 0 ? (
            diff.narrative.map((line, i) => (
              <p key={i} className="text-sm text-gray-700 mt-1">
                {line}
              </p>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              {t('dashboard.replan.noChanges')}
            </p>
          )}
        </div>

        {diff.changes.length > 0 && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="text-xs text-gray-500 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-1 rounded"
            >
              {showDetails
                ? t('dashboard.replan.hideDetails')
                : t('dashboard.replan.seeDetails')}
            </button>

            {showDetails && (
              <ul className="mt-2 space-y-2">
                {diff.changes.map((change) => {
                  const oldRecipe = recipesById.get(change.oldRecipeId)
                  const newRecipe = recipesById.get(change.newRecipeId)
                  const sameFamily =
                    oldRecipe?.familyId && newRecipe?.familyId
                      && oldRecipe.familyId === newRecipe.familyId
                  return (
                    <li key={change.mealId} className="text-xs text-gray-600">
                      <div>{change.date} {change.mealType}:</div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span>{change.oldRecipeName}</span>
                        {oldRecipe?.familyId && (
                          <RecipeFamilyHint
                            familyId={oldRecipe.familyId}
                            variantLabel={oldRecipe.variantLabel}
                            dietTier={oldRecipe.dietTier}
                            noTierBadge
                          />
                        )}
                        <span aria-hidden>&rarr;</span>
                        <span>{change.newRecipeName}</span>
                        {newRecipe?.familyId && (
                          <RecipeFamilyHint
                            familyId={newRecipe.familyId}
                            variantLabel={newRecipe.variantLabel}
                            dietTier={newRecipe.dietTier}
                            noTierBadge
                          />
                        )}
                        {sameFamily && (
                          <span className="text-[10px] font-semibold text-[#4F7942] bg-[#4F7942]/10 px-1.5 py-0.5 rounded-full">
                            {t('dashboard.replan.sameFamily')}
                          </span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        {(diff.wastedMeals ?? []).length > 0 && (
          <div className="mt-3 space-y-1">
            {diff.wastedMeals.map((wasted) => (
              <p key={wasted.recipeId} className="text-sm text-red-600">
                {t('dashboard.replan.wasted', {
                  name: wasted.recipeName,
                  cost: wasted.estimatedCost != null
                    ? ` (kb. ${Math.round(wasted.estimatedCost)} Ft)`
                    : '',
                })}
              </p>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mt-3">
          <button
            type="button"
            onClick={() => acceptMutation.mutate()}
            disabled={acceptMutation.isPending}
            className="bg-gray-900 text-white rounded px-4 py-2 text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
          >
            {t('dashboard.replan.accept')}
          </button>
          <button
            type="button"
            onClick={onDecline}
            className="text-gray-500 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-1 rounded"
          >
            {t('dashboard.replan.decline')}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
