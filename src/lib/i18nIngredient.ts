/**
 * Locale-aware field selectors for Ingredient objects.
 *
 * The backend persists a canonical `name` / `aliases` (often the English
 * source name for seeded data) plus a `translations` map keyed by locale.
 * Components must go through these helpers instead of reading
 * `ingredient.name` directly so that the Hungarian-first preference is
 * respected uniformly. Without this the exclude-ingredient picker shows
 * "Almonds" / "Carrot" to Hungarian users with the Hungarian name demoted
 * to a parenthetical alias — three personas (Reka × 3, Eszter) flagged
 * it.
 */

import type { Ingredient, IngredientTranslations } from '@/types'

export type SupportedLocale = 'hu' | 'en'

/**
 * Returns the localised ingredient name. Falls back:
 *   translations[lang] → translations.hu → translations.en → ingredient.name
 */
export function getIngredientName(
  ingredient: Pick<Ingredient, 'name' | 'translations'> | null | undefined,
  lang: SupportedLocale,
): string {
  if (!ingredient) return ''
  const t = ingredient.translations
  return (
    t?.[lang]?.name ||
    t?.hu?.name ||
    t?.en?.name ||
    ingredient.name
  )
}

/**
 * Returns the localised aliases for the given locale. When showing the
 * Hungarian-first label, the secondary aliases parenthetical should list
 * the *other-language* alternatives so users searching in either language
 * still find the ingredient — pass the opposite locale to get those.
 */
export function getIngredientAliases(
  ingredient: Pick<Ingredient, 'aliases' | 'translations'> | null | undefined,
  lang: SupportedLocale,
): string[] {
  if (!ingredient) return []
  const t = ingredient.translations
  const localised = t?.[lang]?.aliases
  if (localised && localised.length > 0) return localised
  // Fallback: the canonical aliases on the entity.
  return ingredient.aliases ?? []
}

/**
 * Returns the full searchable string for an ingredient: localised name
 * plus every alias from every available locale. Used by the
 * ForbiddenIngredientsPicker to keep search working when users type the
 * other-language name.
 */
export function getIngredientSearchHaystack(
  ingredient: Pick<Ingredient, 'name' | 'aliases' | 'translations'>,
): string {
  const t: IngredientTranslations | null | undefined = ingredient.translations
  const parts: string[] = [ingredient.name]
  if (ingredient.aliases) parts.push(...ingredient.aliases)
  if (t?.hu?.name) parts.push(t.hu.name)
  if (t?.hu?.aliases) parts.push(...t.hu.aliases)
  if (t?.en?.name) parts.push(t.en.name)
  if (t?.en?.aliases) parts.push(...t.en.aliases)
  return parts.join(' ').toLowerCase()
}
