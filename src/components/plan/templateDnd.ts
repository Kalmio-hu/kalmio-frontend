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

/** Continuous-feeling stepper: 0.1× increments inside [SERVINGS_MIN, SERVINGS_MAX]. */
export const SERVINGS_STEP = 0.1
export const SERVINGS_MIN = 0.1
export const SERVINGS_MAX = 5

/**
 * Shift {@code current} by one 0.1× step in either direction, rounded to one
 * decimal place so floating-point drift doesn't accumulate (0.1 + 0.2 = 0.3
 * exactly, not 0.30000000000000004). Returns null when the move would leave
 * the [{@link SERVINGS_MIN}, {@link SERVINGS_MAX}] range so the stepper button
 * can be disabled.
 */
export function nextServings(current: number, direction: 1 | -1): number | null {
  const raw = current + direction * SERVINGS_STEP
  const rounded = Math.round(raw * 10) / 10
  if (rounded < SERVINGS_MIN || rounded > SERVINGS_MAX) return null
  return rounded
}
