/**
 * plannedMeals.ts — service for the materialized planned_meal table (meal-planning-v2).
 *
 * Backend: PlannedMealController — GET /api/planned-meals?from&to[&memberId],
 * PATCH /{id}/status, PATCH /{id}/recipe, POST /{id}/swap-variant.
 * Errors propagate to TanStack Query so pages can render their error state;
 * a 403 on a member-scoped list means the caller may not view that member.
 */
import { api } from '@/lib/api'
import type {
  MaterializedPlannedMeal,
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
   * Returns all materialized planned_meal rows visible to the current user within
   * the inclusive date range, across all members.
   */
  listInRange: (from: string, to: string): Promise<MaterializedPlannedMeal[]> =>
    api
      .get<MaterializedPlannedMeal[]>('/api/planned-meals', { params: { from, to } })
      .then(r => r.data),

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
      .then(r => r.data),

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

  /** PATCH /api/planned-meals/{id}/scheduled-time — set (HH:mm) or clear (null) the clock time. */
  patchScheduledTime: (id: string, scheduledTime: string | null): Promise<MaterializedPlannedMeal> =>
    api
      .patch<MaterializedPlannedMeal>(`/api/planned-meals/${id}/scheduled-time`, { scheduledTime }, { requestIdempotencyKey: true })
      .then(r => r.data),

  /**
   * PATCH /api/planned-meals/{id}/recipe
   *
   * Replaces the recipe on a single materialized planned meal.
   * Returns the updated row.
   *
   */
  replaceRecipe: (
    id: string,
    req: ReplaceRecipeRequest,
  ): Promise<MaterializedPlannedMeal> =>
    api
      .patch<MaterializedPlannedMeal>(`/api/planned-meals/${id}/recipe`, req)
      .then(r => r.data),

  /**
   * POST /api/planned-meals/{plannedMealId}/swap-variant
   *
   * Swaps the recipe on a planned meal to a sibling in the same family.
   * The backend enforces:
   *   - target must be in the same family as the current recipe
   *   - target's diet_tier must be compatible with the caller's effectiveDietTier
   *
   * Returns the updated MaterializedPlannedMeal on success.
   * Throws 422 with { code: "CROSS_FAMILY_SWAP" | "DIET_TIER_INCOMPATIBLE" } on violation.
   */
  swapVariant: (
    plannedMealId: string,
    targetRecipeId: string,
  ): Promise<MaterializedPlannedMeal> =>
    api
      .post<MaterializedPlannedMeal>(
        `/api/planned-meals/${plannedMealId}/swap-variant`,
        { targetRecipeId },
        { requestIdempotencyKey: true },
      )
      .then(r => r.data),
}
