/**
 * Shared recipe-filter primitives used by the template cell picker and the
 * legacy recipe picker dialog. Filtering is pure / synchronous — the list of
 * recipes is already in memory.
 *
 * Filter axes:
 *  - free-text search (matches the localised name)
 *  - dietary toggles (a recipe passes when it has ALL selected flags true)
 *  - trait tags (QUICK / CHEAP / MEALPREP / HIGH_PROTEIN; passes when it has
 *    AT LEAST ONE selected tag)
 */
import type { DietaryConstraints, DietaryRestrictionKey, Recipe, RecipeTag } from '@/types'
import { getRecipeName } from '@/lib/i18nRecipe'

/**
 * ingredient id → dietary flags. Built once by the page (which already loads
 * the ingredients catalog for other purposes) and passed in here. When the
 * map is empty the dietary filter degrades gracefully (passes everything).
 */
export type IngredientConstraintsMap = Map<string, DietaryConstraints>

/** Trait tags users typically want to filter on (excludes meal-type tags). */
export const FILTERABLE_TAGS: RecipeTag[] = [
  'QUICK',
  'CHEAP',
  'MEALPREP',
  'HIGH_PROTEIN',
]

/** Subset of dietary flags surfaced as chips. Full set lives in DietaryConstraints. */
export const FILTERABLE_DIETARY: DietaryRestrictionKey[] = [
  'vegetarian',
  'vegan',
  'pescatarian',
  'glutenFree',
  'dairyFree',
  'lactoseFree',
  'eggFree',
  'nutFree',
  'lowGi',
  'lowFodmap',
  'keto',
  'paleo',
]

export interface RecipeFilterState {
  search: string
  dietary: Set<DietaryRestrictionKey>
  tags: Set<RecipeTag>
}

export function emptyFilterState(): RecipeFilterState {
  return { search: '', dietary: new Set(), tags: new Set() }
}

export function filterRecipes(
  recipes: Recipe[],
  state: RecipeFilterState,
  lang: 'hu' | 'en',
  ingredientConstraints?: IngredientConstraintsMap,
): Recipe[] {
  const needle = state.search.trim().toLowerCase()
  return recipes.filter(r => {
    if (needle && !getRecipeName(r, lang).toLowerCase().includes(needle)) return false
    if (state.dietary.size > 0 && ingredientConstraints && ingredientConstraints.size > 0) {
      // A recipe satisfies a dietary flag when EVERY ingredient satisfies it.
      // Ingredients with no constraint data are treated as compliant — same
      // behaviour as the Recipes page filter (KALMIO-148).
      const passes = r.ingredients.every(ri => {
        const c = ingredientConstraints.get(ri.ingredientId)
        if (!c) return true
        for (const key of state.dietary) {
          if (!c[key]) return false
        }
        return true
      })
      if (!passes) return false
    }
    if (state.tags.size > 0) {
      let anyTag = false
      for (const tag of state.tags) {
        if (r.tags.includes(tag)) { anyTag = true; break }
      }
      if (!anyTag) return false
    }
    return true
  })
}
