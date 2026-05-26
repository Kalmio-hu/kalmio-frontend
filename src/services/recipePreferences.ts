/**
 * recipePreferences service — KALMIO-435 / KALMIO-454
 *
 * Builds the recipe card deck for the PreferenceSwipe onboarding step.
 * Fetches from GET /api/recipes (and GET /api/ingredients for ingredient
 * names), selects up to DECK_SIZE recipes, and maps them to
 * PreferenceCardData.
 *
 * KALMIO-454: enriched mapping adds macros, ingredientNames, prepSummary,
 * totalMinutes so RecipePreferenceCard can render the donut chart and
 * ingredient blurb.
 *
 * Signal submission delegates to tasteSignalsService.submitSignal — no new
 * endpoint is needed. Signals are stored in the taste_signals table with
 * targetType=RECIPE and source=ONBOARDING.
 */

import { api } from '@/lib/api'
import type { Recipe, Ingredient } from '@/types'
import type { PreferenceCardData } from '@/components/onboarding/PreferenceCard'

const DECK_SIZE = 12
/** Max ingredient names to carry in the card (limits payload size). */
const MAX_INGREDIENT_NAMES = 5

/**
 * Formats a short 1-line description for a recipe card:
 *   "28 perc · 480 kcal"  (HU locale-independent, numeric only)
 */
function buildSubtitle(recipe: Recipe): string | null {
  const parts: string[] = []
  const totalMinutes = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0)
  if (totalMinutes > 0) parts.push(`${totalMinutes} perc`)
  if (recipe.macros?.kcal != null) parts.push(`${Math.round(recipe.macros.kcal)} kcal`)
  return parts.length > 0 ? parts.join(' · ') : null
}

/**
 * Maps a Recipe to a PreferenceCardData with all enriched KALMIO-454 fields.
 *
 * @param recipe - source Recipe
 * @param ingredientMap - id → Hungarian name lookup (may be empty — degrades gracefully)
 */
function toCardData(
  recipe: Recipe,
  ingredientMap: Map<string, string>,
): PreferenceCardData {
  const totalMinutes =
    (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0)

  // Resolve up to MAX_INGREDIENT_NAMES ingredient names from the lookup map.
  const ingredientNames =
    recipe.ingredients
      .slice(0, MAX_INGREDIENT_NAMES)
      .map((ri) => ingredientMap.get(ri.ingredientId))
      .filter((n): n is string => !!n)

  // Macro shape expected by MacroDonutChart / RecipePreferenceCard.
  const macros =
    recipe.macros != null
      ? {
          kcal:     recipe.macros.kcal,
          proteinG: recipe.macros.protein,
          fatG:     recipe.macros.fat,
          carbsG:   recipe.macros.carbs,
        }
      : null

  // Use the first recipe step as a short prep preview, stripped of punctuation
  // bloat. Cap at 80 chars so it fits the single-line clamp.
  const huSteps = recipe.translations?.hu?.steps ?? recipe.steps ?? []
  const rawStep = huSteps[0] ?? null
  const prepSummary =
    rawStep && rawStep.length > 0
      ? rawStep.length > 80
        ? rawStep.slice(0, 77) + '…'
        : rawStep
      : null

  return {
    id:              recipe.id,
    name:            recipe.translations?.hu?.name ?? recipe.name,
    subtitle:        buildSubtitle(recipe),
    imageUrl:        recipe.imageUrl,
    macros,
    ingredientNames: ingredientNames.length > 0 ? ingredientNames : null,
    prepSummary,
    totalMinutes:    totalMinutes > 0 ? totalMinutes : null,
  }
}

/**
 * Fetches a curated sample of recipes for the preference swipe deck.
 * Also fetches /api/ingredients to resolve ingredient names.
 * Returns at most DECK_SIZE cards.
 *
 * Priority order:
 *  1. Recipes with an imageUrl (better visual experience)
 *  2. Remaining recipes up to the cap
 *
 * Falls back gracefully — if the endpoint fails or returns nothing, returns [].
 * If the ingredient fetch fails, cards are still returned without ingredient names.
 */
export async function buildPreferenceDeck(): Promise<PreferenceCardData[]> {
  try {
    // Fetch recipes and ingredients in parallel.
    const [recipesRes, ingredientsRes] = await Promise.allSettled([
      api.get<Recipe[]>('/api/recipes'),
      api.get<Ingredient[]>('/api/ingredients'),
    ])

    const recipes =
      recipesRes.status === 'fulfilled' ? (recipesRes.value.data ?? []) : []

    if (recipes.length === 0) return []

    // Build ingredient id→name map (HU name preferred, EN fallback, then raw name).
    const ingredientMap = new Map<string, string>()
    if (ingredientsRes.status === 'fulfilled') {
      for (const ing of ingredientsRes.value.data ?? []) {
        const huName = ing.translations?.hu?.name ?? null
        const enName = ing.translations?.en?.name ?? null
        ingredientMap.set(ing.id, huName ?? enName ?? ing.name)
      }
    }

    const withImage    = recipes.filter((r) => !!r.imageUrl)
    const withoutImage = recipes.filter((r) => !r.imageUrl)

    const shuffled = [
      ...withImage.sort(() => Math.random() - 0.5),
      ...withoutImage.sort(() => Math.random() - 0.5),
    ].slice(0, DECK_SIZE)

    return shuffled.map((r) => toCardData(r, ingredientMap))
  } catch {
    console.warn('[recipePreferences] failed to fetch recipe deck — returning empty array')
    return []
  }
}

export const recipePreferencesService = {
  buildDeck: buildPreferenceDeck,
}
