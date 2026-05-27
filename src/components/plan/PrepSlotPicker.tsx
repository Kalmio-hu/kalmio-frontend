/**
 * PrepSlotPicker — modal for manually creating a template prep slot.
 *
 * Mirrors the style of TemplateCellPicker.
 * Lets the user pick:
 *   - Recipe (search-filtered list)
 *   - Window: MORNING (reggel) / EVENING (este)
 *   - servingsToMake (numeric input)
 *
 * On confirm: calls onConfirm with the chosen values.
 * Parent owns the mutation.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Check, Clock } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { recipesService } from '@/services/recipes'
import { getRecipeName } from '@/lib/i18nRecipe'
import { RecipeFamilyHint } from '@/components/recipe/RecipeFamilyHint'
import type { Recipe } from '@/types'

export interface PrepSlotPickerResult {
  recipe: Recipe
  scheduledWindow: 'MORNING' | 'EVENING'
  servingsToMake: number
}

interface PrepSlotPickerProps {
  open: boolean
  onConfirm: (result: PrepSlotPickerResult) => void
  onClose: () => void
  isSaving: boolean
}

const WINDOWS: Array<'MORNING' | 'EVENING'> = ['MORNING', 'EVENING']

export function PrepSlotPicker({ open, onConfirm, onClose, isSaving }: PrepSlotPickerProps) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage === 'hu' ? 'hu' : 'en') as 'hu' | 'en'

  const [search, setSearch] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [scheduledWindow, setScheduledWindow] = useState<'MORNING' | 'EVENING'>('MORNING')
  const [servingsToMake, setServingsToMake] = useState(2)

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: recipesService.list,
    staleTime: 5 * 60 * 1000,
    enabled: open,
  })

  const filtered = recipes.filter(r => {
    if (!search.trim()) return true
    const name = getRecipeName(r, lang).toLowerCase()
    return name.includes(search.trim().toLowerCase())
  })

  function handleConfirm() {
    if (!selectedRecipe) return
    onConfirm({ recipe: selectedRecipe, scheduledWindow, servingsToMake })
  }

  const canConfirm = selectedRecipe != null && servingsToMake > 0

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('plan.prep.picker.title')}</DialogTitle>
        </DialogHeader>

        {/* Recipe search */}
        <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide mb-1">
          {t('plan.prep.picker.recipeLabel')}
        </p>
        <Input
          placeholder={t('common.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-3"
          autoFocus
        />

        <div className="space-y-1.5 max-h-[36dvh] overflow-y-auto pr-1 mb-4">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Spinner className="h-5 w-5" />
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <p className="text-sm text-[#6b7280] text-center py-6">
              {t('mealPlan.recipePicker.noResults')}
            </p>
          )}
          {filtered.map(recipe => {
            const isSelected = recipe.id === selectedRecipe?.id
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
                    {recipe.familyId && (
                      <div className="mt-0.5">
                        <RecipeFamilyHint
                          familyId={recipe.familyId}
                          variantLabel={recipe.variantLabel}
                          dietTier={recipe.dietTier}
                        />
                      </div>
                    )}
                    {recipe.macros && (
                      <p className="text-xs text-[#6b7280] mt-0.5 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" aria-hidden />
                        {t('mealPlan.recipePicker.prepTime', {
                          min: recipe.prepTimeMinutes + recipe.cookTimeMinutes,
                        })}
                        <span aria-hidden className="text-[#d1d5db]">·</span>
                        {t('mealPlan.recipePicker.kcal', {
                          kcal: recipe.macros.kcal.toFixed(0),
                        })}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-[#4F7942] shrink-0 mt-0.5" aria-hidden />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Window picker */}
        <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide mb-1.5">
          {t('plan.prep.picker.windowLabel')}
        </p>
        <div className="flex gap-2 mb-4">
          {WINDOWS.map(w => (
            <button
              key={w}
              type="button"
              onClick={() => setScheduledWindow(w)}
              className={`
                flex-1 py-2 rounded-[10px] text-sm font-medium border transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]
                ${scheduledWindow === w
                  ? 'border-[#4f46e5] bg-[#4f46e5]/5 text-[#4f46e5]'
                  : 'border-[#e5e7eb] text-[#6b7280] hover:border-[#4f46e5] hover:text-[#4f46e5]'}
              `}
              aria-pressed={scheduledWindow === w}
            >
              {w === 'MORNING'
                ? t('plan.prep.windowMorning')
                : t('plan.prep.windowEvening')}
            </button>
          ))}
        </div>

        {/* Servings */}
        <div className="flex items-center gap-3 mb-5">
          <label
            htmlFor="prep-servings-to-make"
            className="text-sm text-[#6b7280] shrink-0"
          >
            {t('plan.prep.picker.servingsLabel')}
          </label>
          <Input
            id="prep-servings-to-make"
            type="number"
            min={1}
            max={20}
            step={1}
            value={servingsToMake}
            onChange={e => setServingsToMake(Math.max(1, Math.floor(Number(e.target.value))))}
            className="w-20"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#e5e7eb]">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={!canConfirm || isSaving}
          >
            {isSaving ? (
              <Spinner className="h-4 w-4" />
            ) : (
              t('plan.prep.picker.submit')
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
