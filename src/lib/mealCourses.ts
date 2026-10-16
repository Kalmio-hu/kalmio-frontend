/**
 * Composable meals — courses inside a meal slot and the recipe roles each accepts.
 * Mirrors `MealCourse` / `RecipeRole` on the backend (docs/product/composable-meals.md §3.3).
 */
import type { MealCourse, RecipeRole, TemplateMeal } from '@/types'

/** Plating order inside a slot: soup first, then main, side, condiment. */
export const COURSE_ORDER: readonly MealCourse[] = ['SOUP', 'MAIN', 'SIDE', 'CONDIMENT'] as const

export const COURSE_ALLOWED_ROLES: Record<MealCourse, readonly RecipeRole[]> = {
  SOUP: ['SOUP'],
  MAIN: ['COMPLETE', 'MAIN'],
  SIDE: ['SIDE'],
  CONDIMENT: ['CONDIMENT'],
}

/** Courses that may be added to a slot given the ones already present (MAIN is always first). */
export function addableCourses(present: readonly MealCourse[]): MealCourse[] {
  if (!present.includes('MAIN')) return ['MAIN']
  return COURSE_ORDER.filter(c => !present.includes(c))
}

/** Sorts course rows of one slot into plating order. */
export function sortByCourse<T extends { course?: MealCourse | null }>(rows: readonly T[]): T[] {
  return [...rows].sort(
    (a, b) => COURSE_ORDER.indexOf(a.course ?? 'MAIN') - COURSE_ORDER.indexOf(b.course ?? 'MAIN'),
  )
}

/** The MAIN row of a slot (legacy rows without a course are MAIN). */
export function mainOf<T extends { course?: MealCourse | null }>(rows: readonly T[]): T | null {
  return rows.find(r => (r.course ?? 'MAIN') === 'MAIN') ?? null
}

/** All template-meal rows of one slot, in plating order. */
export function slotRows(
  meals: readonly TemplateMeal[],
  dayIndex: number,
  mealType: string,
  memberId: string,
): TemplateMeal[] {
  return sortByCourse(
    meals.filter(m => m.dayIndex === dayIndex && m.mealType === mealType && m.memberId === memberId),
  )
}

/** Whether a row may be removed: MAIN stays while other courses exist. */
export function canRemoveCourse(row: TemplateMeal, rows: readonly TemplateMeal[]): boolean {
  if ((row.course ?? 'MAIN') !== 'MAIN') return true
  return rows.filter(r => r.id !== row.id).length === 0
}
