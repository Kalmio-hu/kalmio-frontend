import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { CheckCircle, XCircle } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { adminContentService } from '@/services/adminContent'

type Tab = 'recipes' | 'ingredients'

export function ContentReview() {
  const { t, i18n } = useTranslation()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('recipes')
  const lang = (i18n.resolvedLanguage === 'hu' ? 'hu' : 'en') as 'en' | 'hu'

  // ── Recipes ──────────────────────────────────────────────────────────────
  const { data: pendingRecipes = [], isLoading: loadingRecipes } = useQuery({
    queryKey: ['admin-pending-recipes'],
    queryFn: adminContentService.pendingRecipes,
    enabled: activeTab === 'recipes',
  })

  const approveRecipeMutation = useMutation({
    mutationFn: (id: string) => adminContentService.approveRecipe(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pending-recipes'] })
      toast({ title: t('admin.contentReview.approveSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('admin.contentReview.approveError'), variant: 'destructive' })
    },
  })

  const rejectRecipeMutation = useMutation({
    mutationFn: (id: string) => adminContentService.rejectRecipe(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pending-recipes'] })
      toast({ title: t('admin.contentReview.rejectSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('admin.contentReview.rejectError'), variant: 'destructive' })
    },
  })

  // ── Ingredients ───────────────────────────────────────────────────────────
  const { data: pendingIngredients = [], isLoading: loadingIngredients } = useQuery({
    queryKey: ['admin-pending-ingredients'],
    queryFn: adminContentService.pendingIngredients,
    enabled: activeTab === 'ingredients',
  })

  const approveIngredientMutation = useMutation({
    mutationFn: (id: string) => adminContentService.approveIngredient(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pending-ingredients'] })
      toast({ title: t('admin.contentReview.approveSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('admin.contentReview.approveError'), variant: 'destructive' })
    },
  })

  const rejectIngredientMutation = useMutation({
    mutationFn: (id: string) => adminContentService.rejectIngredient(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pending-ingredients'] })
      toast({ title: t('admin.contentReview.rejectSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('admin.contentReview.rejectError'), variant: 'destructive' })
    },
  })

  const recipeActionPending = approveRecipeMutation.isPending || rejectRecipeMutation.isPending
  const ingredientActionPending = approveIngredientMutation.isPending || rejectIngredientMutation.isPending

  const tabClass = (tab: Tab) =>
    [
      'px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors',
      activeTab === tab
        ? 'border-[#F28C28] text-[#F28C28]'
        : 'border-transparent text-gray-500 hover:text-[#1A1A1A]',
    ].join(' ')

  return (
    <div>
      <Header
        title={t('admin.contentReview.title')}
        subtitle={t('admin.contentReview.subtitle')}
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-4">
        <button
          type="button"
          className={tabClass('recipes')}
          onClick={() => setActiveTab('recipes')}
        >
          {t('admin.contentReview.tabs.recipes')}
          {pendingRecipes.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded-full bg-[#F28C28] text-white text-[10px] font-bold leading-none">
              {pendingRecipes.length}
            </span>
          )}
        </button>
        <button
          type="button"
          className={tabClass('ingredients')}
          onClick={() => setActiveTab('ingredients')}
        >
          {t('admin.contentReview.tabs.ingredients')}
          {pendingIngredients.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded-full bg-[#F28C28] text-white text-[10px] font-bold leading-none">
              {pendingIngredients.length}
            </span>
          )}
        </button>
      </div>

      {/* Recipes tab */}
      {activeTab === 'recipes' && (
        <>
          {loadingRecipes ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : pendingRecipes.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-gray-400">
                {t('admin.contentReview.noRecipesPending')}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingRecipes.map(r => {
                const displayName = r.translations?.[lang]?.name ?? r.name
                return (
                  <Card key={r.id}>
                    <CardContent className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1A1A1A] truncate">{displayName}</p>
                          {r.createdByUsername && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              @{r.createdByUsername}
                            </p>
                          )}
                          <div className="flex gap-3 mt-1 text-xs text-gray-400">
                            <span>{r.prepTimeMinutes + r.cookTimeMinutes}m</span>
                            <span>{t('recipes.servings', { count: r.servings })}</span>
                          </div>
                        </div>

                        <div className="shrink-0 flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={recipeActionPending}
                            onClick={() => rejectRecipeMutation.mutate(r.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            {t('admin.contentReview.reject')}
                          </Button>
                          <Button
                            size="sm"
                            disabled={recipeActionPending}
                            onClick={() => approveRecipeMutation.mutate(r.id)}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            {t('admin.contentReview.approve')}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Ingredients tab */}
      {activeTab === 'ingredients' && (
        <>
          {loadingIngredients ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : pendingIngredients.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-gray-400">
                {t('admin.contentReview.noIngredientsPending')}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingIngredients.map(ing => {
                const displayName = ing.translations?.[lang]?.name ?? ing.name
                return (
                  <Card key={ing.id}>
                    <CardContent className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1A1A1A] truncate">{displayName}</p>
                          {ing.createdByUsername && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              @{ing.createdByUsername}
                            </p>
                          )}
                          <div className="flex gap-2 mt-1">
                            <Badge variant="gray">{t(`ingredientCategory.${ing.category}`, ing.category)}</Badge>
                            {ing.macros && (
                              <span className="text-xs text-gray-400">
                                {Math.round(ing.macros.kcal)} kcal
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={ingredientActionPending}
                            onClick={() => rejectIngredientMutation.mutate(ing.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            {t('admin.contentReview.reject')}
                          </Button>
                          <Button
                            size="sm"
                            disabled={ingredientActionPending}
                            onClick={() => approveIngredientMutation.mutate(ing.id)}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            {t('admin.contentReview.approve')}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
