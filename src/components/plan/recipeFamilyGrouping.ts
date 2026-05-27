/**
 * Shared helpers for family-aware recipe lists in pickers.
 *
 * Used by both RecipePickerDialog (CalendarView, DailyTimeline) and TemplateCellPicker
 * so the family + diet-tier UX stays in lockstep across every place a user picks
 * a recipe to replace a planned meal.
 *
 * Three concerns:
 *   1. {@link filterByDietTier}  — hide recipes whose dietTier the user can't eat.
 *   2. {@link groupByFamily}     — partition a list into siblings of the current
 *                                  recipe vs everything else, with siblings ordered
 *                                  by diet-tier strictness then variant_label.
 *   3. {@link isSiblingSwap}     — predicate the caller uses to choose between the
 *                                  family-aware swap-variant endpoint and the
 *                                  generic replaceRecipe path.
 */
import { compatibleDietTiers, DIET_TIER_ORDER, type DietTier, type Recipe } from '@/types'

/**
 * Drop recipes whose dietTier is stricter than what the user accepts. Recipes with
 * a null dietTier (legacy rows the runner hasn't touched yet) pass through — same
 * conservative behaviour as the server-side hard-filter, which only excludes when
 * the tier is known to be incompatible.
 */
export function filterByDietTier(recipes: Recipe[], effectiveDietTier: DietTier | null | undefined): Recipe[] {
  if (!effectiveDietTier) return recipes
  const allowed = new Set<DietTier>(compatibleDietTiers(effectiveDietTier))
  return recipes.filter(r => r.dietTier == null || allowed.has(r.dietTier))
}

export interface FamilyGroupedRecipes {
  /** Recipes in the same family as the current recipe, excluding the current recipe itself. */
  siblings: Recipe[]
  /** Everything else — including the current recipe. */
  others: Recipe[]
  /** The familyId of the current recipe, when it has one. Null = no grouping applied. */
  familyId: string | null
}

/**
 * Partition a recipe list into (siblings of the current recipe, everything else).
 *
 * Siblings are ordered by diet-tier strictness ascending (VEGAN first), then by
 * variantLabel alphabetical — same ordering rule as the recipe-detail "Verziók"
 * section so the UX is consistent.
 *
 * When the current recipe has no familyId, returns `{ siblings: [], others: recipes }`.
 */
export function groupByFamily(recipes: Recipe[], currentRecipeId: string | null): FamilyGroupedRecipes {
  if (!currentRecipeId) {
    return { siblings: [], others: recipes, familyId: null }
  }
  const current = recipes.find(r => r.id === currentRecipeId)
  const familyId = current?.familyId ?? null
  if (!familyId) {
    return { siblings: [], others: recipes, familyId: null }
  }
  const siblings: Recipe[] = []
  const others: Recipe[] = []
  for (const r of recipes) {
    if (r.familyId === familyId && r.id !== currentRecipeId) {
      siblings.push(r)
    } else {
      others.push(r)
    }
  }
  siblings.sort((a, b) => {
    const ta = a.dietTier ? DIET_TIER_ORDER[a.dietTier] : 99
    const tb = b.dietTier ? DIET_TIER_ORDER[b.dietTier] : 99
    if (ta !== tb) return ta - tb
    return (a.variantLabel ?? '').localeCompare(b.variantLabel ?? '')
  })
  return { siblings, others, familyId }
}

/**
 * True when the target recipe is a sibling of the recipe the user is replacing —
 * i.e. the swap should route through `POST /api/planned-meals/{id}/swap-variant`
 * so the MEAL_VARIANT_SWAPPED domain event fires and PostHog tallies the swap
 * as a variant swap rather than a generic replacement.
 */
export function isSiblingSwap(
  currentRecipe: Pick<Recipe, 'familyId'> | null | undefined,
  targetRecipe: Pick<Recipe, 'familyId' | 'id'>,
): boolean {
  if (!currentRecipe?.familyId) return false
  if (!targetRecipe.familyId) return false
  return currentRecipe.familyId === targetRecipe.familyId
}
