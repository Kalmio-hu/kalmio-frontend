/**
 * TemplateCellPicker — two-tab modal for assigning a recipe or custom
 * off-plan meal to a single template-grid cell.
 *
 * Tab 0 — Recipe: reuses the same search/filter as RecipePickerDialog.
 * Tab 1 — Custom meal (off-plan): shows saved off-plan templates; if none
 *          exist, renders a minimal inline create form (name + kcal).
 *
 * On confirm: calls `onConfirm` with the chosen recipe or off-plan data.
 * Parent owns the mutation — this component is purely presentational.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Check, Clock, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { recipesService } from '@/services/recipes'
import { getRecipeName } from '@/lib/i18nRecipe'
import type { Recipe } from '@/types'

export interface TemplateCellPickerResult {
  type: 'recipe'
  recipe: Recipe
  servings: number
}

// Off-plan template — lightweight local type until a backend endpoint exists.
// The backend spec (A4) mentions off_plan_meal_template_id but the endpoint
// for listing saved templates is not yet shipped. We show the tab as a
// placeholder; the inline create form is wired but the save call is a no-op
// until the endpoint lands.
export interface OffPlanTemplate {
  id: string
  name: string
  kcal: number
}

interface TemplateCellPickerProps {
  open: boolean
  /** Current recipe id — used to show the "already selected" checkmark. */
  currentRecipeId: string | null
  /** Current servings count — seeded into the servings field. */
  currentServings: number
  onConfirm: (result: TemplateCellPickerResult) => void
  onClear: () => void
  onClose: () => void
  /** Whether the clear button should be shown (cell is not empty). */
  canClear: boolean
  isSaving: boolean
}

type Tab = 'recipe' | 'offplan'

export function TemplateCellPicker({
  open,
  currentRecipeId,
  currentServings,
  onConfirm,
  onClear,
  onClose,
  canClear,
  isSaving,
}: TemplateCellPickerProps) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage === 'hu' ? 'hu' : 'en') as 'hu' | 'en'

  const [tab, setTab] = useState<Tab>('recipe')
  const [search, setSearch] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [servings, setServings] = useState(currentServings > 0 ? currentServings : 1)

  // Off-plan create form state (placeholder until endpoint lands)
  const [offPlanName, setOffPlanName] = useState('')
  const [offPlanKcal, setOffPlanKcal] = useState('')

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: recipesService.list,
    staleTime: 5 * 60 * 1000,
    enabled: open && tab === 'recipe',
  })

  const filtered = recipes.filter(r =>
    getRecipeName(r, lang).toLowerCase().includes(search.toLowerCase()),
  )

  const effectiveRecipeId = selectedRecipe?.id ?? currentRecipeId

  function handleConfirm() {
    const recipe = selectedRecipe ?? recipes.find(r => r.id === currentRecipeId) ?? null
    if (!recipe) return
    onConfirm({ type: 'recipe', recipe, servings })
  }

  const canConfirm = selectedRecipe != null || currentRecipeId != null

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('plan.detail.cell.pickerTitle')}</DialogTitle>
        </DialogHeader>

        {/* Tab strip */}
        <div className="flex gap-1 mb-4 border-b border-[#e5e7eb]">
          {(['recipe', 'offplan'] as Tab[]).map(key => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`
                px-4 py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5] -mb-px
                ${tab === key
                  ? 'border-[#4f46e5] text-[#4f46e5]'
                  : 'border-transparent text-[#6b7280] hover:text-[#1A1A1A]'}
              `}
            >
              {key === 'recipe'
                ? t('plan.detail.cell.tabRecipe')
                : t('plan.detail.cell.tabOffPlan')}
            </button>
          ))}
        </div>

        {/* Recipe tab */}
        {tab === 'recipe' && (
          <>
            <Input
              placeholder={t('common.search')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mb-3"
              autoFocus
            />

            <div className="space-y-2 max-h-[42dvh] overflow-y-auto pr-1">
              {isLoading && (
                <div className="flex justify-center py-8">
                  <Spinner className="h-5 w-5" />
                </div>
              )}
              {!isLoading && filtered.length === 0 && (
                <p className="text-sm text-[#6b7280] text-center py-8">
                  {t('mealPlan.recipePicker.noResults')}
                </p>
              )}
              {filtered.map(recipe => {
                const isSelected = recipe.id === effectiveRecipeId
                return (
                  <button
                    key={recipe.id}
                    type="button"
                    onClick={() => setSelectedRecipe(recipe)}
                    className={`w-full text-left rounded-[10px] px-3 py-2.5 transition-colors border ${
                      isSelected
                        ? 'border-[#4F7942] bg-[#4F7942]/5'
                        : 'border-transparent bg-[#F9F7F2] hover:bg-[#f0ede6]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-[#1A1A1A] leading-snug">
                          {getRecipeName(recipe, lang)}
                        </p>
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-[#6b7280] mt-0.5">
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" aria-hidden />
                            {t('mealPlan.recipePicker.prepTime', {
                              min: recipe.prepTimeMinutes + recipe.cookTimeMinutes,
                            })}
                          </span>
                          {recipe.macros && (
                            <>
                              <span>
                                {t('mealPlan.recipePicker.kcal', {
                                  kcal: recipe.macros.kcal.toFixed(0),
                                })}
                              </span>
                              <span>
                                {t('mealPlan.recipePicker.protein', {
                                  protein: recipe.macros.protein.toFixed(0),
                                })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-[#4F7942] shrink-0 mt-0.5" aria-hidden />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Servings */}
            {canConfirm && (
              <div className="flex items-center gap-3 mt-4">
                <label
                  htmlFor="cell-servings"
                  className="text-sm text-[#6b7280] shrink-0"
                >
                  {t('plan.detail.cell.servingsLabel')}
                </label>
                <Input
                  id="cell-servings"
                  type="number"
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={servings}
                  onChange={e => setServings(Math.max(0.5, Number(e.target.value)))}
                  className="w-20"
                />
              </div>
            )}
          </>
        )}

        {/* Off-plan tab — placeholder until listing endpoint lands */}
        {tab === 'offplan' && (
          <div className="space-y-4 min-h-[120px]">
            <p className="text-sm text-[#6b7280]">{t('plan.detail.cell.offPlanEmpty')}</p>

            {/* Inline create form */}
            <div className="rounded-[12px] border border-[#e5e7eb] p-4 space-y-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
                <Plus className="h-3 w-3" aria-hidden />
                {t('plan.detail.cell.offPlanCreateName')}
              </p>
              <Input
                placeholder={t('plan.detail.cell.offPlanCreateName')}
                value={offPlanName}
                onChange={e => setOffPlanName(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder={t('plan.detail.cell.offPlanCreateKcal')}
                  value={offPlanKcal}
                  onChange={e => setOffPlanKcal(e.target.value)}
                  className="flex-1"
                />
                <span className="text-sm text-[#6b7280]">kcal</span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={!offPlanName.trim() || !offPlanKcal}
                onClick={() => {
                  // Endpoint not yet available — reset and close
                  setOffPlanName('')
                  setOffPlanKcal('')
                }}
              >
                {t('plan.detail.cell.offPlanCreateSave')}
              </Button>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#e5e7eb]">
          <div>
            {canClear && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                disabled={isSaving}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                {t('plan.detail.cell.clearSlot')}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={isSaving}>
              {t('common.cancel')}
            </Button>
            {tab === 'recipe' && (
              <Button
                size="sm"
                onClick={handleConfirm}
                disabled={!canConfirm || isSaving}
              >
                {isSaving ? t('plan.detail.cell.saving') : t('plan.detail.cell.confirmPick')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
