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
  UpdateMaterializedPlannedMealStatusRequest,
} from '@/types'

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
}
