/**
 * recipePreferences service — KALMIO-435
 *
 * Builds the recipe card deck for the PreferenceSwipe onboarding step.
 * Fetches from GET /api/recipes, selects up to DECK_SIZE recipes that have
 * names, and maps them to PreferenceCardData.
 *
 * Signal submission delegates to tasteSignalsService.submitSignal — no new
 * endpoint is needed.  Signals are stored in the taste_signals table with
 * targetType=RECIPE and source=ONBOARDING.
 */

import { api } from '@/lib/api'
import type { Recipe } from '@/types'
import type { PreferenceCardData } from '@/components/onboarding/PreferenceCard'

const DECK_SIZE = 12

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
 * Fetches a curated sample of recipes for the preference swipe deck.
 * Returns at most DECK_SIZE cards.
 *
 * Priority order:
 *  1. Recipes with an imageUrl (better visual experience)
 *  2. Remaining recipes up to the cap
 *
 * Falls back gracefully — if the endpoint fails or returns nothing, returns [].
 */
export async function buildPreferenceDeck(): Promise<PreferenceCardData[]> {
  try {
    const res = await api.get<Recipe[]>('/api/recipes')
    const recipes = res.data ?? []

    if (recipes.length === 0) return []

    const withImage = recipes.filter((r) => !!r.imageUrl)
    const withoutImage = recipes.filter((r) => !r.imageUrl)

    // Stable shuffle within each bucket so repeated loads return different orders.
    const shuffled = [
      ...withImage.sort(() => Math.random() - 0.5),
      ...withoutImage.sort(() => Math.random() - 0.5),
    ].slice(0, DECK_SIZE)

    return shuffled.map((r): PreferenceCardData => ({
      id: r.id,
      name: r.translations?.hu?.name ?? r.name,
      subtitle: buildSubtitle(r),
      imageUrl: r.imageUrl,
    }))
  } catch {
    console.warn('[recipePreferences] failed to fetch recipe deck — returning empty array')
    return []
  }
}

export const recipePreferencesService = {
  buildDeck: buildPreferenceDeck,
}
