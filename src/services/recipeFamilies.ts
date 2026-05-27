/**
 * recipeFamilies.ts — service for the recipe family resource (W7 / recipe-families epic).
 *
 * Admin-only endpoints: create, update, delete, assign, unassign.
 * Read endpoints: get, listMembers — available to all authenticated users.
 *
 * Backend endpoints live at /api/recipe-families/* and /api/recipes/{id}/family.
 */
import { api } from '@/lib/api'
import type {
  RecipeFamily,
  RecipeFamilyMember,
  DietTier,
  CreateRecipeFamilyRequest,
  UpdateRecipeFamilyRequest,
  AssignRecipeFamilyRequest,
} from '@/types'

export const recipeFamiliesService = {
  /**
   * GET /api/recipe-families
   * Returns all recipe families with member counts. Used by the admin family-management page.
   */
  list: (): Promise<RecipeFamily[]> =>
    api.get<RecipeFamily[]>('/api/recipe-families').then(r => r.data),

  /**
   * GET /api/recipe-families/{id}
   * Returns the family with its full member list.
   */
  get: (id: string): Promise<RecipeFamily> =>
    api.get<RecipeFamily>(`/api/recipe-families/${id}`).then(r => r.data),

  /**
   * GET /api/recipe-families/{id}/members?dietTier={tier}
   * Returns family members filtered to the given dietary tier or stricter.
   * When dietTier is omitted, the backend defaults to the caller's effectiveDietTier.
   */
  listMembers: (id: string, dietTier?: DietTier): Promise<RecipeFamilyMember[]> =>
    api
      .get<RecipeFamilyMember[]>(`/api/recipe-families/${id}/members`, {
        params: dietTier ? { dietTier } : undefined,
      })
      .then(r => r.data),

  /**
   * POST /api/recipe-families — admin only.
   * Creates a new recipe family.
   */
  create: (body: CreateRecipeFamilyRequest): Promise<RecipeFamily> =>
    api
      .post<RecipeFamily>('/api/recipe-families', body, { requestIdempotencyKey: true })
      .then(r => r.data),

  /**
   * PATCH /api/recipe-families/{id} — admin only.
   * Renames / re-describes a family.
   */
  update: (id: string, body: UpdateRecipeFamilyRequest): Promise<RecipeFamily> =>
    api
      .patch<RecipeFamily>(`/api/recipe-families/${id}`, body, { requestIdempotencyKey: true })
      .then(r => r.data),

  /**
   * DELETE /api/recipe-families/{id} — admin only.
   * Returns 409 when members exist — the caller must unassign all recipes first.
   */
  delete: (id: string): Promise<void> =>
    api
      .delete(`/api/recipe-families/${id}`, { requestIdempotencyKey: true })
      .then(() => undefined),

  /**
   * POST /api/recipes/{recipeId}/family — admin only.
   * Assigns a recipe to a family and sets its variant label.
   */
  assign: (recipeId: string, body: AssignRecipeFamilyRequest): Promise<void> =>
    api
      .post(`/api/recipes/${recipeId}/family`, body, { requestIdempotencyKey: true })
      .then(() => undefined),

  /**
   * DELETE /api/recipes/{recipeId}/family — admin only.
   * Removes a recipe from its family; familyId, variantLabel, dietTier become null.
   */
  unassign: (recipeId: string): Promise<void> =>
    api
      .delete(`/api/recipes/${recipeId}/family`, { requestIdempotencyKey: true })
      .then(() => undefined),
}
