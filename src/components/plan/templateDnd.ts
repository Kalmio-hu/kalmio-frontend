/**
 * Drag-and-drop id helpers for the plan template grid.
 *
 * Drop targets register with {@link dndCellId}; the PlanDetail drag-end handler
 * parses the same string to recover the (day, slot, member) tuple.
 */
import type { MealType } from '@/types'

export function dndCellId(dayIndex: number, slot: MealType, memberId: string): string {
  return `cell:${dayIndex}:${slot}:${memberId}`
}

/** Drag id used by RecipePalette items. Drop handler dispatches on the prefix. */
export function paletteDragId(recipeId: string): string {
  return `palette:${recipeId}`
}

/** Matches the solver's ServingConfig: step=0.25, min=0.75, max=4.0. */
export const SERVINGS_STEP = 0.25
export const SERVINGS_MIN = 0.75
export const SERVINGS_MAX = 4.0

/**
 * Shift {@code current} by one 0.25× step in either direction, snapped to the
 * nearest 0.25 grid first so any pre-existing off-grid value (e.g. from a
 * manual DB edit) re-aligns cleanly on the first press. Returns null when the
 * move would leave [{@link SERVINGS_MIN}, {@link SERVINGS_MAX}].
 */
export function nextServings(current: number, direction: 1 | -1): number | null {
  // Snap to nearest 0.25 grid, then move one step.
  const snapped = Math.round(current / SERVINGS_STEP) * SERVINGS_STEP
  const raw = snapped + direction * SERVINGS_STEP
  const rounded = Math.round(raw * 100) / 100   // eliminate float drift
  if (rounded < SERVINGS_MIN || rounded > SERVINGS_MAX) return null
  return rounded
}
