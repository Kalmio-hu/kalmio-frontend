/**
 * tasteSignals service — KALMIO-156 / E9.5
 *
 * Two backend dependencies that may not exist yet:
 *  - POST /api/users/me/taste-signals  (KALMIO-153 / E9.1 — TasteSignal entity)
 *  - GET  /api/users/me/taste-deck     (KALMIO-153 / E9.2 — card deck construction)
 *
 * Until those endpoints ship, `buildDeck()` falls back to sampling from the
 * existing /api/ingredients and /api/recipes lists.  `submitSignal()` is
 * fire-and-forget: it logs a warning on 404 but does not throw, so the UI
 * advances regardless.
 */

import { api } from '@/lib/api'
import type {
  TasteCard,
  TasteSignalRequest,
  Ingredient,
  Recipe,
} from '@/types'

// ── Submit a single taste signal ──────────────────────────────────────────

export async function submitTasteSignal(
  body: TasteSignalRequest,
): Promise<void> {
  try {
    await api.post('/api/users/me/taste-signals', body)
  } catch (err: unknown) {
    // 404 = backend endpoint not yet deployed (E9.1).  Swallow gracefully.
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 404) {
      console.warn(
        '[tasteSignals] POST /api/users/me/taste-signals returned 404 — ' +
          'backend endpoint not yet deployed (KALMIO-153 / E9.1).  Signal dropped.',
      )
      return
    }
    throw err
  }
}

// ── Build the card deck ───────────────────────────────────────────────────

/**
 * Tries GET /api/users/me/taste-deck first (E9.2).
 * Falls back to a placeholder deck sampled from ingredients + recipes when
 * the endpoint is unavailable.
 *
 * Deck order mirrors E9.2 spec:
 *  - First 5: high-confidence Hungarian positives (csirkemell, paradicsom, …)
 *  - Middle 8–10: preference-surfacing cards (tofu, quinoa, …)
 *  - Last 2–3: recipe-level cards (lecsó, csirkepörkölt, …)
 *
 * The placeholder simply picks the first 18 ingredients + 3 recipes from the
 * API, sorted by name.  The real algorithm ships with E9.2.
 */
/**
 * KALMIO-431: server returns each card with a `type: "INGREDIENT" | "RECIPE"`
 * field, but the frontend type contract (and POST /taste-signals payload) is
 * `targetType`. Normalise here so consumers downstream can rely on a single
 * field name without per-call translation.
 */
type ServerTasteCard = TasteCard & { type?: 'INGREDIENT' | 'RECIPE' }

function normalizeCard(c: ServerTasteCard): TasteCard {
  const targetType = c.targetType ?? c.type
  // Don't trust the server enum to be present — fall back to INGREDIENT so the
  // UI still renders, but never let the POST go out with an undefined field.
  return { ...c, targetType: targetType ?? 'INGREDIENT' }
}

export async function buildTasteDeck(): Promise<TasteCard[]> {
  // 1. Try the real endpoint first.
  try {
    const res = await api.get<ServerTasteCard[]>('/api/users/me/taste-deck')
    if (res.data && res.data.length > 0) return res.data.map(normalizeCard)
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status !== 404) throw err
    console.warn(
      '[tasteSignals] GET /api/users/me/taste-deck returned 404 — ' +
        'falling back to placeholder deck (KALMIO-153 / E9.2 not yet shipped).',
    )
  }

  // 2. Placeholder fallback — sample from existing lists.
  const [ingredientsRes, recipesRes] = await Promise.allSettled([
    api.get<Ingredient[]>('/api/ingredients'),
    api.get<Recipe[]>('/api/recipes'),
  ])

  const ingredients: Ingredient[] =
    ingredientsRes.status === 'fulfilled' ? ingredientsRes.value.data : []
  const recipes: Recipe[] =
    recipesRes.status === 'fulfilled' ? recipesRes.value.data : []

  // Hungarian-positive seed names (best-effort match — E9.2 will do this properly).
  const HU_POSITIVES = [
    'csirkemell',
    'paradicsom',
    'hagyma',
    'sajt',
    'kenyér',
  ]
  const DIVERGENT_NAMES = [
    'tofu',
    'quinoa',
    'kelkáposzta',
    'kecskesajt',
    'avokádó',
    'lencse',
    'csicseriborsó',
    'édeskömény',
  ]
  const RECIPE_NAMES = ['lecsó', 'csirkepörkölt', 'gyors zöldségleves']

  const byName = (names: string[], pool: Ingredient[]): TasteCard[] => {
    const result: TasteCard[] = []
    for (const n of names) {
      const match = pool.find(
        (i) =>
          i.name.toLowerCase().includes(n.toLowerCase()) ||
          (i.aliases ?? []).some((a) => a.toLowerCase().includes(n.toLowerCase())),
      )
      if (match) {
        result.push({
          id: match.id,
          targetType: 'INGREDIENT',
          name: match.translations?.hu?.name ?? match.name,
          subtitle: match.category ?? undefined,
        })
      }
    }
    return result
  }

  const byRecipeName = (names: string[], pool: Recipe[]): TasteCard[] => {
    const result: TasteCard[] = []
    for (const n of names) {
      const match = pool.find((r) =>
        r.name.toLowerCase().includes(n.toLowerCase()),
      )
      if (match) {
        result.push({
          id: match.id,
          targetType: 'RECIPE',
          name: match.translations?.hu?.name ?? match.name,
          imageUrl: match.imageUrl,
        })
      }
    }
    return result
  }

  const positiveCards = byName(HU_POSITIVES, ingredients)
  const divergentCards = byName(DIVERGENT_NAMES, ingredients)
  const recipeCards = byRecipeName(RECIPE_NAMES, recipes)

  // Fill with remaining ingredients if named ones are missing.
  const usedIds = new Set(
    [...positiveCards, ...divergentCards].map((c) => c.id),
  )
  const fillerIngredients = ingredients
    .filter((i) => !usedIds.has(i.id))
    .slice(0, Math.max(0, 15 - positiveCards.length - divergentCards.length))
    .map(
      (i): TasteCard => ({
        id: i.id,
        targetType: 'INGREDIENT',
        name: i.translations?.hu?.name ?? i.name,
        subtitle: i.category ?? undefined,
      }),
    )

  const deck: TasteCard[] = [
    ...positiveCards,
    ...divergentCards,
    ...fillerIngredients,
    ...recipeCards,
  ]

  // Deduplicate by id (belt-and-suspenders).
  const seen = new Set<string>()
  return deck.filter((c) => {
    if (seen.has(c.id)) return false
    seen.add(c.id)
    return true
  })
}

export const tasteSignalsService = {
  submitSignal: submitTasteSignal,
  buildDeck: buildTasteDeck,
}
