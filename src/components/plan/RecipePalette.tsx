/**
 * RecipePalette — the side rail listing every distinct recipe currently used
 * somewhere in the plan template. Dragging a palette item onto a cell COPIES
 * the recipe into that slot (new template_meal row); the palette item stays.
 *
 * Identifier discipline:
 *  - Each palette draggable uses id `palette:<recipeId>` so PlanDetail's
 *    onDragEnd can dispatch on the prefix (cell vs palette).
 */
import { useTranslation } from 'react-i18next'
import { useDraggable } from '@dnd-kit/core'
import { Sparkles } from 'lucide-react'
import { getRecipeName } from '@/lib/i18nRecipe'
import { paletteDragId } from './templateDnd'
import type { PlanTemplate, Recipe } from '@/types'

interface RecipePaletteProps {
  plan: PlanTemplate
  recipesById: Record<string, Recipe>
  lang: 'hu' | 'en'
}

export function RecipePalette({ plan, recipesById, lang }: RecipePaletteProps) {
  const { t } = useTranslation()

  // Unique recipes used somewhere in the plan, in order of first appearance,
  // plus a per-recipe count of how many cells reference it.
  const seen = new Set<string>()
  const recipes: Recipe[] = []
  const usageCount = new Map<string, number>()
  for (const cell of plan.templateMeals) {
    if (!cell.recipeId) continue
    usageCount.set(cell.recipeId, (usageCount.get(cell.recipeId) ?? 0) + 1)
    if (seen.has(cell.recipeId)) continue
    const recipe = recipesById[cell.recipeId]
    if (!recipe) continue
    seen.add(cell.recipeId)
    recipes.push(recipe)
  }

  return (
    <section
      aria-label={t('plan.detail.palette.title')}
      className="rounded-[16px] border border-[#e5e7eb] bg-white"
    >
      <div className="px-4 py-3 border-b border-[#f3f4f6] flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-[#4f46e5]" aria-hidden />
        <h3 className="text-sm font-semibold text-[#1A1A1A]">
          {t('plan.detail.palette.title')}
        </h3>
        <span className="ml-auto text-[11px] text-[#6b7280]">{recipes.length}</span>
      </div>
      {recipes.length === 0 ? (
        <p className="px-4 py-6 text-xs text-[#9ca3af] text-center">
          {t('plan.detail.palette.empty')}
        </p>
      ) : (
        <ul className="p-2 space-y-1.5 max-h-[60vh] overflow-y-auto">
          {recipes.map(recipe => (
            <PaletteItem
              key={recipe.id}
              recipe={recipe}
              lang={lang}
              assignedCount={usageCount.get(recipe.id) ?? 0}
            />
          ))}
        </ul>
      )}
      <p className="px-4 py-2 text-[10.5px] text-[#9ca3af] border-t border-[#f3f4f6]">
        {t('plan.detail.palette.hint')}
      </p>
    </section>
  )
}

function PaletteItem({ recipe, lang, assignedCount }: { recipe: Recipe; lang: 'hu' | 'en'; assignedCount: number }) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: paletteDragId(recipe.id),
  })

  // Recipe.macros is the total across all servings — show per-serving for the
  // palette so the user reads it like they would on a recipe card.
  let kcalPerServing = 0
  if (recipe.macros && recipe.servings > 0) {
    kcalPerServing = recipe.macros.kcal / recipe.servings
  }

  return (
    <li>
      <button
        type="button"
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className={`
          group w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[10px]
          bg-[#F0EDE6] hover:bg-[#e8e4dc] text-left
          cursor-grab active:cursor-grabbing touch-none select-none
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]
          transition-colors
          ${isDragging ? 'opacity-40' : ''}
        `}
      >
        <span className="flex-1 min-w-0">
          <span className="block text-xs font-medium text-[#1A1A1A] truncate">
            {getRecipeName(recipe, lang)}
          </span>
          {kcalPerServing > 0 && (
            <span className="block text-[10.5px] text-[#6b7280] tabular-nums">
              {Math.round(kcalPerServing)} kcal · 1 adag
            </span>
          )}
        </span>
        {assignedCount > 0 && (
          <span
            aria-label={t('plan.detail.palette.usageCountAria', { count: assignedCount })}
            title={t('plan.detail.palette.usageCountAria', { count: assignedCount })}
            className="
              shrink-0 inline-flex items-center justify-center
              h-5 min-w-[1.25rem] px-1.5 rounded-full
              bg-[#4f46e5]/10 text-[#4f46e5] text-[10.5px] font-semibold tabular-nums
            "
          >
            ×{assignedCount}
          </span>
        )}
      </button>
    </li>
  )
}
