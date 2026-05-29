/**
 * Pure helpers to roll up plan-template macros from recipe data.
 *
 * Recipe.macros in the API is the *total* for the whole recipe (all servings).
 * Per-meal macros = (recipe.macros / recipe.servings) × templateMeal.servings.
 *
 * Targets live in plan.preferencesSnapshot[memberId] under target_kcal /
 * target_protein_g / target_carbs_g / target_fat_g — any may be null when the
 * member has not set goals yet.
 */
import type { Macros, PlanTemplate, Recipe, TargetSetResponse } from '@/types'

export type MacroTotals = Macros

export interface MacroTargets {
  kcal: number | null
  protein: number | null
  fat: number | null
  carbs: number | null
}

/**
 * Convert the goal-computed {@link TargetSetResponse} from /api/users/me/targets
 * into the snapshot-shaped object the rest of the helpers consume.
 */
export function targetsFromLive(t: TargetSetResponse | null): MemberSnapshot | null {
  if (!t) return null
  return {
    target_kcal: t.targetKcal,
    target_protein_g: t.proteinG,
    target_carbs_g: t.carbsG,
    target_fat_g: t.fatG,
  }
}

const ZERO_TOTALS: MacroTotals = { kcal: 0, protein: 0, fat: 0, carbs: 0 }

export interface MemberSnapshot {
  target_kcal?: number | null
  target_protein_g?: number | null
  target_carbs_g?: number | null
  target_fat_g?: number | null
  preferred_meal_types?: string[]
  meal_calorie_split?: Record<string, number> | null
}

/**
 * Returns a per-member set of preferred meal-type names from the plan's
 * frozen snapshot. Empty set means "no preference recorded" — the grid uses
 * that to skip the dimming treatment so users who never configured this don't
 * see every slot marked as non-preferred.
 */
export function preferredSlotsByMember(plan: PlanTemplate): Record<string, Set<string>> {
  const snapshot = (plan.preferencesSnapshot ?? {}) as Record<string, MemberSnapshot>
  const out: Record<string, Set<string>> = {}
  for (const memberId of plan.memberIds) {
    const slots = snapshot[memberId]?.preferred_meal_types ?? []
    out[memberId] = new Set(slots)
  }
  return out
}

/**
 * Sum of plan-wide target_kcal / target_protein_g / etc. across every plan member.
 * Useful for aggregate views — daily totals across all members compare against
 * the sum of their individual goals. Missing targets contribute null overall:
 * if any single member's target is null we treat the aggregate as "no target."
 *
 * {@code liveOverrides} maps member UUID → a snapshot-shaped override. Live values
 * take PRIORITY over the frozen snapshot — this ensures the display always reflects
 * the user's current goals even when the plan snapshot has not been re-solved yet.
 * The snapshot is only used as a fallback when no live value is available.
 */
export function aggregateTargets(
  plan: PlanTemplate,
  liveOverrides: Record<string, MemberSnapshot> = {},
): MacroTargets {
  const snapshot = (plan.preferencesSnapshot ?? {}) as Record<string, MemberSnapshot>
  const out: MacroTargets = { kcal: null, protein: null, fat: null, carbs: null }
  if (plan.memberIds.length === 0) return out

  let kcalSum = 0, proteinSum = 0, fatSum = 0, carbsSum = 0
  let kcalKnown = true, proteinKnown = true, fatKnown = true, carbsKnown = true

  for (const memberId of plan.memberIds) {
    const snap = snapshot[memberId] ?? {}
    const live = liveOverrides[memberId] ?? {}
    // Live overrides take precedence; snapshot is the fallback for members without live data.
    const kcal = numericOrNull(live.target_kcal) ?? numericOrNull(snap.target_kcal)
    const protein = numericOrNull(live.target_protein_g) ?? numericOrNull(snap.target_protein_g)
    const fat = numericOrNull(live.target_fat_g) ?? numericOrNull(snap.target_fat_g)
    const carbs = numericOrNull(live.target_carbs_g) ?? numericOrNull(snap.target_carbs_g)

    if (kcal != null) kcalSum += kcal; else kcalKnown = false
    if (protein != null) proteinSum += protein; else proteinKnown = false
    if (fat != null) fatSum += fat; else fatKnown = false
    if (carbs != null) carbsSum += carbs; else carbsKnown = false
  }

  out.kcal = kcalKnown ? kcalSum : null
  out.protein = proteinKnown ? proteinSum : null
  out.fat = fatKnown ? fatSum : null
  out.carbs = carbsKnown ? carbsSum : null
  return out
}

function numericOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

/**
 * Single-member targets, layered the same way as {@link aggregateTargets}:
 * live override first, frozen snapshot as fallback.
 *
 * Useful for per-cell rendering — a meal belongs to one specific member and
 * should be compared against THAT member's goals, not a family aggregate.
 */
export function targetsForMember(
  plan: PlanTemplate,
  memberId: string,
  liveOverrides: Record<string, MemberSnapshot> = {},
): MacroTargets {
  const snapshot = (plan.preferencesSnapshot ?? {}) as Record<string, MemberSnapshot>
  const snap = snapshot[memberId] ?? {}
  const live = liveOverrides[memberId] ?? {}
  // Live overrides take precedence; snapshot is the fallback.
  return {
    kcal:    numericOrNull(live.target_kcal)      ?? numericOrNull(snap.target_kcal),
    protein: numericOrNull(live.target_protein_g) ?? numericOrNull(snap.target_protein_g),
    fat:     numericOrNull(live.target_fat_g)     ?? numericOrNull(snap.target_fat_g),
    carbs:   numericOrNull(live.target_carbs_g)   ?? numericOrNull(snap.target_carbs_g),
  }
}

/**
 * Per-day macro totals across all members of the plan, indexed by day index.
 * Days with no filled cells return ZERO_TOTALS (so callers can render an
 * empty-but-present row instead of skipping).
 */
export function dailyTotals(
  plan: PlanTemplate,
  recipesById: Record<string, Recipe>,
): MacroTotals[] {
  const out: MacroTotals[] = []
  for (let i = 0; i < plan.lengthDays; i++) out.push({ ...ZERO_TOTALS })

  for (const cell of plan.templateMeals) {
    if (!cell.recipeId) continue
    const recipe = recipesById[cell.recipeId]
    if (!recipe || !recipe.macros || recipe.servings <= 0) continue

    const servings = typeof cell.servings === 'number' ? cell.servings : Number(cell.servings)
    if (!Number.isFinite(servings) || servings <= 0) continue

    const perServingFactor = servings / recipe.servings
    const day = cell.dayIndex
    if (day < 0 || day >= out.length) continue

    out[day].kcal += recipe.macros.kcal * perServingFactor
    out[day].protein += recipe.macros.protein * perServingFactor
    out[day].fat += recipe.macros.fat * perServingFactor
    out[day].carbs += recipe.macros.carbs * perServingFactor
  }

  return out
}

/** Average daily macros across the whole plan (total / lengthDays). */
export function weeklyAverage(daily: MacroTotals[]): MacroTotals {
  if (daily.length === 0) return { ...ZERO_TOTALS }
  const sum: MacroTotals = { ...ZERO_TOTALS }
  for (const d of daily) {
    sum.kcal += d.kcal
    sum.protein += d.protein
    sum.fat += d.fat
    sum.carbs += d.carbs
  }
  return {
    kcal: sum.kcal / daily.length,
    protein: sum.protein / daily.length,
    fat: sum.fat / daily.length,
    carbs: sum.carbs / daily.length,
  }
}
