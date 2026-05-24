import { api } from '@/lib/api'
import type { Plan, PlannedMeal, CreatePlanRequest, UpdatePlannedMealRequest, ReplanDiff, ShoppingList, PlanTemplate, CreatePlanTemplateRequest, TemplateMeal, RunPlanBody, RunPlanResponse, RecipeFilter } from '@/types'

// ── Template Meal upsert body ──────────────────────────────────────────────

export interface UpsertTemplateMealRequest {
  dayIndex: number
  mealType: string
  memberId: string
  recipeId?: string | null
  offPlanMealTemplateId?: string | null
  servings?: number
}

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

  /**
   * POST /api/plans/{id}/solve — runs the Timefold solver and writes
   * the resulting assignments back as template_meal rows.
   *
   * mode='EMPTY' (default) preserves existing cells; mode='ALL' wipes them
   * and replaces the whole grid.
   */
  solve: (id: string, mode: 'EMPTY' | 'ALL' = 'EMPTY'): Promise<PlanTemplate> =>
    api.post<PlanTemplate>(`/api/plans/${id}/solve`, null, { params: { mode } }).then(r => r.data),

  /** DELETE /api/plans/{id} — soft-archive the plan. */
  archive: (id: string): Promise<void> =>
    api.delete(`/api/plans/${id}`).then(() => undefined),

  /** POST /api/plans/{id}/copy — duplicate plan. */
  copy: (id: string, name?: string | null): Promise<PlanTemplate> =>
    api.post<PlanTemplate>(`/api/plans/${id}/copy`, name ? { name } : {}).then(r => r.data),

  /**
   * POST /api/plans/{id}/template-meals — create or upsert a template meal cell.
   * The backend enforces the XOR constraint (recipeId XOR offPlanMealTemplateId).
   * If templateMealId is provided, issues PUT to update an existing row.
   */
  upsertTemplateMeal: (
    planId: string,
    body: UpsertTemplateMealRequest,
    templateMealId?: string | null,
  ): Promise<TemplateMeal> => {
    if (templateMealId) {
      return api
        .put<TemplateMeal>(`/api/plans/${planId}/template-meals/${templateMealId}`, body)
        .then(r => r.data)
    }
    return api
      .post<TemplateMeal>(`/api/plans/${planId}/template-meals`, body)
      .then(r => r.data)
  },

  /**
   * DELETE /api/plans/{id}/template-meals/{templateMealId} — clear a cell.
   */
  clearTemplateMeal: (planId: string, templateMealId: string): Promise<void> =>
    api.delete(`/api/plans/${planId}/template-meals/${templateMealId}`).then(() => undefined),

  /**
   * DELETE /api/plans/{id}/template-meals — wipe every template_meal row on
   * the plan in one shot. Used by the "Terv ürítése" menu item. Plan metadata
   * stays intact.
   */
  clearAllTemplateMeals: (planId: string): Promise<void> =>
    api.delete(`/api/plans/${planId}/template-meals`).then(() => undefined),

  /**
   * POST /api/plans/{id}/run — one-click "Run this plan".
   *
   * Creates a Schedule and immediately materialises the plan onto the calendar.
   * When body.recurrence is null the schedule runs once (literal days startDayIndex..lengthDays).
   * When body.recurrence is provided the schedule repeats; startDayIndex is rotated.
   *
   * (KALMIO-307 / KALMIO-320)
   */
  runPlan: (planId: string, body: RunPlanBody): Promise<RunPlanResponse> =>
    api.post<RunPlanResponse>(`/api/plans/${planId}/run`, body).then(r => r.data),

  /**
   * POST /api/plans/{id}/template-meals/swap — atomically swap the
   * (day_index, meal_type, member_id) coords of two filled cells.
   *
   * Used by the drag-and-drop editor when the drop target already holds a
   * meal. Returns 204.
   */
  swapTemplateMeals: (planId: string, firstId: string, secondId: string): Promise<void> =>
    api.post(`/api/plans/${planId}/template-meals/swap`, { firstId, secondId })
      .then(() => undefined),

  /**
   * PATCH /api/plans/{id} — update only the plan name.
   *
   * Validation is server-enforced: trimmed 1–80 chars. The service trims
   * the value before persisting.
   *
   * (KALMIO-354)
   */
  updatePlanName: (planId: string, name: string): Promise<PlanTemplate> =>
    api.patch<PlanTemplate>(`/api/plans/${planId}`, { name }).then(r => r.data),

  /**
   * PATCH /api/plans/{id} — update only the recipe filter.
   *
   * Persists the pre-solve candidate-recipe filter on the plan entity so the
   * solver reads it on the next fill operation.
   *
   * (KALMIO-353)
   */
  patchRecipeFilter: (planId: string, recipeFilter: RecipeFilter | null): Promise<PlanTemplate> =>
    api.patch<PlanTemplate>(`/api/plans/${planId}`, { recipeFilter }).then(r => r.data),
}
