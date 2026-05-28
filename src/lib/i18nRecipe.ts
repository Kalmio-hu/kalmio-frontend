/**
 * Locale-aware field selectors for Recipe objects.
 *
 * The backend persists a canonical `name` / `steps` (typically the original
 * language the recipe was created in — often English for seeded data) plus a
 * `translations` map keyed by locale code.  Components must always go through
 * these helpers instead of reading `recipe.name` or `recipe.steps` directly so
 * that the Hungarian-first locale preference is respected uniformly.
 */

import type { Recipe, RecipeTranslations } from '@/types'

export type SupportedLocale = 'hu' | 'en'

/**
 * Returns the localised recipe name for the given locale.
 * Falls back: translations[lang] → translations.hu → translations.en → recipe.name
 */
export function getRecipeName(
  recipe: Pick<Recipe, 'name' | 'translations'> | null | undefined,
  lang: SupportedLocale,
): string {
  if (!recipe) return ''
  const t = recipe.translations
  return (
    t?.[lang]?.name ||
    t?.hu?.name ||
    t?.en?.name ||
    recipe.name
  )
}

/**
 * Returns the localised recipe steps for the given locale.
 * Falls back: translations[lang] → translations.hu → translations.en → recipe.steps
 */
export function getRecipeSteps(
  recipe: Pick<Recipe, 'steps' | 'translations'> | null | undefined,
  lang: SupportedLocale,
): string[] {
  if (!recipe) return []
  const t = recipe.translations
  return (
    t?.[lang]?.steps ||
    t?.hu?.steps ||
    t?.en?.steps ||
    recipe.steps
  )
}

/**
 * Returns the localised garnish/serving suggestion for the given locale.
 * Falls back: translations[lang] → translations.hu → translations.en → recipe.garnish
 * Returns null when the recipe has no garnish in any locale.
 */
export function getRecipeGarnish(
  recipe: Pick<Recipe, 'garnish' | 'translations'> | null | undefined,
  lang: SupportedLocale,
): string | null {
  if (!recipe) return null
  const t = recipe.translations
  return (
    t?.[lang]?.garnish ||
    t?.hu?.garnish ||
    t?.en?.garnish ||
    recipe.garnish ||
    null
  )
}

/**
 * Returns the localised recipe name from a RecipeTranslations object plus a
 * raw fallback name string — for use with `SavedMealSlot` which carries
 * `recipeTranslations` and `recipeName` separately (no full Recipe object).
 */
export function getRecipeNameFromTranslations(
  translations: RecipeTranslations | null | undefined,
  fallbackName: string,
  lang: SupportedLocale,
): string {
  return (
    translations?.[lang]?.name ||
    translations?.hu?.name ||
    translations?.en?.name ||
    fallbackName
  )
}
