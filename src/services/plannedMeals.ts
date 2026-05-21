/**
 * plannedMeals.ts — service for the materialized planned_meal table (meal-planning-v2).
 *
 * Backend endpoint: GET /api/planned-meals?from=YYYY-MM-DD&to=YYYY-MM-DD&memberId=UUID
 * Ticket: KALMIO-249 (backend follow-up — endpoint not yet implemented).
 *
 * Until KALMIO-249 ships, listInRange() and listInRangeForMember() return empty arrays
 * so the Calendar UI renders its empty-state gracefully.
 */
import { api } from '@/lib/api'
import type {
  MaterializedPlannedMeal,
  ShoppingList,
  UpdateMaterializedPlannedMealStatusRequest,
} from '@/types'

/** Request body for PATCH /api/planned-meals/{id}/recipe (KALMIO-backlog). */
export interface ReplaceRecipeRequest {
  recipeId: string
}

export const plannedMealsService = {
  /**
   * GET /api/planned-meals?from=YYYY-MM-DD&to=YYYY-MM-DD
   *
   * Returns all materialized planned_meal rows for the current user's family within
   * the inclusive date range, across all members.
   *
   * NOTE: returns empty array until KALMIO-249 ships — the backend controller
   * does not yet exist. The Calendar page renders its empty state in that case.
   */
  listInRange: (from: string, to: string): Promise<MaterializedPlannedMeal[]> =>
    api
      .get<MaterializedPlannedMeal[]>('/api/planned-meals', { params: { from, to } })
      .then(r => r.data)
      .catch(() => []),   // graceful stub: 404 from missing endpoint → empty

  /**
   * GET /api/planned-meals?from=YYYY-MM-DD&to=YYYY-MM-DD&memberId=UUID
   *
   * Like listInRange but scoped to a single family member.
   */
  listInRangeForMember: (
    from: string,
    to: string,
    memberId: string,
  ): Promise<MaterializedPlannedMeal[]> =>
    api
      .get<MaterializedPlannedMeal[]>('/api/planned-meals', {
        params: { from, to, memberId },
      })
      .then(r => r.data)
      .catch(() => []),

  /**
   * PATCH /api/planned-meals/{id}/status
   *
   * Updates the status of a single materialized planned meal.
   * Returns the updated row.
   */
  updateStatus: (
    id: string,
    req: UpdateMaterializedPlannedMealStatusRequest,
  ): Promise<MaterializedPlannedMeal> =>
    api
      .patch<MaterializedPlannedMeal>(`/api/planned-meals/${id}/status`, req)
      .then(r => r.data),

  /**
   * PATCH /api/planned-meals/{id}/recipe
   *
   * Replaces the recipe on a single materialized planned meal.
   * Returns the updated row.
   *
   * NOTE: Backend endpoint pending — see KALMIO-backlog (filed alongside
   * KALMIO-237 fix-forward). Returns the original meal unchanged until the
   * endpoint ships; the UI optimistically updates via cache invalidation.
   */
  replaceRecipe: (
    id: string,
    req: ReplaceRecipeRequest,
  ): Promise<MaterializedPlannedMeal> =>
    api
      .patch<MaterializedPlannedMeal>(`/api/planned-meals/${id}/recipe`, req)
      .then(r => r.data),

  /**
   * GET /api/planned-meals/shopping-list?from=YYYY-MM-DD&to=YYYY-MM-DD
   *
   * Aggregates ingredients from all planned_meal rows in the date range
   * and returns a ShoppingList DTO (same shape as /api/plans/{id}/shopping-list).
   *
   * NOTE: Backend endpoint pending — see KALMIO-249. Returns null until the
   * endpoint ships; ShoppingList falls back to the plan-based endpoint.
   */
  getShoppingList: (from: string, to: string): Promise<ShoppingList | null> =>
    api
      .get<ShoppingList>('/api/planned-meals/shopping-list', { params: { from, to } })
      .then(r => r.data)
      .catch(() => null),   // graceful stub: 404 from missing endpoint → null
}
