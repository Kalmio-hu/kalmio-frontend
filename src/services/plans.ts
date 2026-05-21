import { api } from '@/lib/api'
import type { Plan, PlannedMeal, CreatePlanRequest, UpdatePlannedMealRequest, ReplanDiff, ShoppingList, PlanTemplate, CreatePlanTemplateRequest } from '@/types'

export const planService = {
  create: (req: CreatePlanRequest): Promise<Plan> =>
    api.post<Plan>('/api/plans', req).then(r => r.data),

  getActive: (): Promise<Plan | null> =>
    api.get<Plan>('/api/plans/active').then(r => r.data).catch((err: { response?: { status?: number } }) => {
      if (err.response?.status === 404) return null
      throw err
    }),

  getById: (id: string): Promise<Plan> =>
    api.get<Plan>(`/api/plans/${id}`).then(r => r.data),

  updateMeal: (planId: string, mealId: string, req: UpdatePlannedMealRequest): Promise<PlannedMeal> =>
    api.patch<PlannedMeal>(`/api/plans/${planId}/meals/${mealId}`, req).then(r => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/api/plans/${id}`).then(() => undefined),

  evaluateReplan: (planId: string, fromDate?: string): Promise<ReplanDiff | null> =>
    api.post<ReplanDiff>(
      `/api/plans/${planId}/replan-evaluate`,
      null,
      { params: fromDate ? { fromDate } : {}, validateStatus: (s) => s === 200 || s === 204 }
    ).then(r => r.status === 204 ? null : r.data),

  getReplanDiff: (planId: string): Promise<ReplanDiff | null> =>
    api.get<ReplanDiff>(
      `/api/plans/${planId}/replan-diff`,
      { validateStatus: (s) => s === 200 || s === 204 }
    ).then(r => r.status === 204 ? null : r.data),

  acceptReplan: (planId: string, diffId: string): Promise<Plan> =>
    api.post<Plan>(`/api/plans/${planId}/replan-accept`, { diffId }).then(r => r.data),

  getShoppingList: (planId: string): Promise<ShoppingList> =>
    api.get<ShoppingList>(`/api/plans/${planId}/shopping-list`).then(r => r.data),

  patchMealScheduledTime: (planId: string, mealId: string, scheduledTime: string | null): Promise<void> =>
    api.patch(`/api/plans/${planId}/meals/${mealId}/scheduled-time`, { scheduledTime }).then(() => undefined),
}

// ── Plan Templates (A4 / KALMIO-226) ─────────────────────────────────────

export const planTemplateService = {
  /** POST /api/plans — create a new plan template. Returns 201. */
  create: (req: CreatePlanTemplateRequest): Promise<PlanTemplate> =>
    api.post<PlanTemplate>('/api/plans', req).then(r => r.data),

  /** GET /api/plans — list all plans visible to the current user. */
  list: (): Promise<PlanTemplate[]> =>
    api.get<PlanTemplate[]>('/api/plans').then(r => r.data),

  /** GET /api/plans/{id} — single plan with template meals. */
  getById: (id: string): Promise<PlanTemplate> =>
    api.get<PlanTemplate>(`/api/plans/${id}`).then(r => r.data),

  /**
   * POST /api/plans/{id}/snapshot/refresh — re-reads current member prefs
   * into the plan's preferences_snapshot.
   *
   * Called after "Auto-fill" creation to ensure prefs are fresh before the
   * solver run (C13).
   */
  refreshSnapshot: (id: string): Promise<PlanTemplate> =>
    api.post<PlanTemplate>(`/api/plans/${id}/snapshot/refresh`).then(r => r.data),

  /** DELETE /api/plans/{id} — soft-archive the plan. */
  archive: (id: string): Promise<void> =>
    api.delete(`/api/plans/${id}`).then(() => undefined),

  /** POST /api/plans/{id}/copy — duplicate plan. */
  copy: (id: string, name?: string | null): Promise<PlanTemplate> =>
    api.post<PlanTemplate>(`/api/plans/${id}/copy`, name ? { name } : {}).then(r => r.data),
}
