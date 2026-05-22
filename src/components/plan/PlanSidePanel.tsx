/**
 * PlanSidePanel — right rail summary for the plan template editor.
 *
 * Three sections:
 *  1. Becsült költség — sum of recipe.estimatedCostPerServing × cell.servings
 *     across every filled cell. Skips cells whose recipe lacks cost data and
 *     reports the count separately so the user knows the number is partial.
 *  2. A hűtődből (used) — ingredients the plan needs that are also currently
 *     in the user's fridge. Lets the user see "you already have eggs, milk…".
 *  3. Hűtőd tartalma — full fridge inventory, scrollable. Quick visual on
 *     what's at hand without leaving the page.
 *
 * Cost lives in HUF (Hungarian forint) per the existing PlanGlanceModule.
 */
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Refrigerator, Wallet, Sprout } from 'lucide-react'
import { fridgeService } from '@/services/fridge'
import type { FridgeItem, PlanTemplate, Recipe } from '@/types'

interface PlanSidePanelProps {
  plan: PlanTemplate
  recipesById: Record<string, Recipe>
}

export function PlanSidePanel({ plan, recipesById }: PlanSidePanelProps) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage === 'hu' ? 'hu' : 'en') as 'hu' | 'en'

  const { data: fridge = [] } = useQuery({
    queryKey: ['fridge'],
    queryFn: fridgeService.list,
    staleTime: 60_000,
  })

  // ── Cost rollup ─────────────────────────────────────────────────────────
  let totalCost = 0
  let costedCells = 0
  let uncostedCells = 0
  for (const cell of plan.templateMeals) {
    if (!cell.recipeId) continue
    const recipe = recipesById[cell.recipeId]
    if (!recipe) continue
    if (recipe.estimatedCostPerServing == null) {
      uncostedCells++
      continue
    }
    const servings = Number(cell.servings)
    if (!Number.isFinite(servings) || servings <= 0) continue
    totalCost += recipe.estimatedCostPerServing * servings
    costedCells++
  }

  // ── Fridge overlap ──────────────────────────────────────────────────────
  // Set of ingredient ids referenced by any cell's recipe.
  const usedIngredientIds = new Set<string>()
  for (const cell of plan.templateMeals) {
    if (!cell.recipeId) continue
    const recipe = recipesById[cell.recipeId]
    if (!recipe) continue
    for (const ri of recipe.ingredients) usedIngredientIds.add(ri.ingredientId)
  }
  const usedFromFridge = fridge.filter(item => usedIngredientIds.has(item.ingredientId))

  return (
    <div className="space-y-4">
      {/* Cost card */}
      <section
        aria-label={t('plan.detail.sidePanel.costSection')}
        className="rounded-[16px] border border-[#e5e7eb] bg-white"
      >
        <div className="px-4 py-3 border-b border-[#f3f4f6] flex items-center gap-2">
          <Wallet className="h-3.5 w-3.5 text-[#4f46e5]" aria-hidden />
          <h3 className="text-sm font-semibold text-[#1A1A1A]">
            {t('plan.detail.sidePanel.costTitle')}
          </h3>
        </div>
        <div className="px-4 py-3">
          {costedCells > 0 ? (
            <p className="text-2xl font-bold font-headline text-[#1A1A1A] tabular-nums">
              {Math.round(totalCost).toLocaleString(lang === 'hu' ? 'hu-HU' : 'en-US')}
              <span className="text-xs font-medium text-[#6b7280] ml-1">
                {t('plan.detail.sidePanel.costUnit')}
              </span>
            </p>
          ) : (
            <p className="text-sm text-[#9ca3af]">{t('plan.detail.sidePanel.costNoData')}</p>
          )}
          {uncostedCells > 0 && (
            <p className="text-[11px] text-[#9ca3af] mt-1">
              {t('plan.detail.sidePanel.costMissing', { count: uncostedCells })}
            </p>
          )}
          <p className="text-[11px] text-[#6b7280] mt-2">
            {t('plan.detail.sidePanel.costHint', { cells: costedCells })}
          </p>
        </div>
      </section>

      {/* Used-from-fridge card */}
      <section
        aria-label={t('plan.detail.sidePanel.usedSection')}
        className="rounded-[16px] border border-[#e5e7eb] bg-white"
      >
        <div className="px-4 py-3 border-b border-[#f3f4f6] flex items-center gap-2">
          <Sprout className="h-3.5 w-3.5 text-[#4F7942]" aria-hidden />
          <h3 className="text-sm font-semibold text-[#1A1A1A]">
            {t('plan.detail.sidePanel.usedTitle')}
          </h3>
          <span className="ml-auto text-[11px] text-[#6b7280]">{usedFromFridge.length}</span>
        </div>
        <FridgeList items={usedFromFridge} emptyText={t('plan.detail.sidePanel.usedEmpty')} />
      </section>

      {/* Full fridge */}
      <section
        aria-label={t('plan.detail.sidePanel.fridgeSection')}
        className="rounded-[16px] border border-[#e5e7eb] bg-white"
      >
        <div className="px-4 py-3 border-b border-[#f3f4f6] flex items-center gap-2">
          <Refrigerator className="h-3.5 w-3.5 text-[#6b7280]" aria-hidden />
          <h3 className="text-sm font-semibold text-[#1A1A1A]">
            {t('plan.detail.sidePanel.fridgeTitle')}
          </h3>
          <span className="ml-auto text-[11px] text-[#6b7280]">{fridge.length}</span>
        </div>
        <FridgeList items={fridge} emptyText={t('plan.detail.sidePanel.fridgeEmpty')} />
      </section>
    </div>
  )
}

function FridgeList({ items, emptyText }: { items: FridgeItem[]; emptyText: string }) {
  if (items.length === 0) {
    return <p className="px-4 py-6 text-xs text-[#9ca3af] text-center">{emptyText}</p>
  }
  return (
    <ul className="p-2 space-y-1 max-h-[260px] overflow-y-auto">
      {items.map(item => (
        <li
          key={item.id}
          className="flex items-center gap-2 px-2 py-1.5 rounded-[10px] hover:bg-[#F9F7F2]"
        >
          <span className="flex-1 text-xs text-[#1A1A1A] truncate">{item.ingredientName}</span>
          <span className="text-[11px] text-[#6b7280] tabular-nums shrink-0">
            {item.amount.toLocaleString()} {item.unit.toLowerCase()}
          </span>
        </li>
      ))}
    </ul>
  )
}
