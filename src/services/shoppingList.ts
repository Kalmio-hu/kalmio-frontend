/**
 * Persistent shopping list service (KALMIO-374 / C11).
 *
 * Wraps the /api/plans/{planId}/shopping-list/** and
 * /api/shopping-list-items/{id}/** endpoints added by the C11 backend ticket.
 *
 * Idempotency-Key headers are added manually here until KALMIO-377/378 (Wave 3)
 * wires the header into the Axios interceptor.
 */
import { api } from '@/lib/api'
import type {
  PersistentShoppingListResponse,
  PersistentShoppingListItem,
  AdHocShoppingListItemRequest,
} from '@/types'

/** Generates a v4-style UUID for Idempotency-Key headers. */
function generateIdempotencyKey(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export const persistentShoppingListService = {
  /**
   * POST /api/plans/{planId}/shopping-list/generate
   *
   * Derives a fresh list from the plan's non-SKIPPED planned meals.
   * Idempotent: calling again replaces the existing list (ADHOC items are lost).
   * Returns 201 with the new list.
   */
  generate: (planId: string): Promise<PersistentShoppingListResponse> =>
    api
      .post<PersistentShoppingListResponse>(`/api/plans/${planId}/shopping-list/generate`)
      .then((r) => r.data),

  /**
   * GET /api/plans/{planId}/shopping-list
   *
   * Returns the current list grouped by category.
   * Returns 404 if no list has been generated yet — callers should catch that.
   */
  getForPlan: (planId: string): Promise<PersistentShoppingListResponse> =>
    api
      .get<PersistentShoppingListResponse>(`/api/plans/${planId}/shopping-list`)
      .then((r) => r.data),

  /**
   * PATCH /api/shopping-list-items/{id}/tick
   *
   * Sets ticked_at = now(). Idempotent. Sends Idempotency-Key header.
   */
  tick: (itemId: string): Promise<PersistentShoppingListItem> =>
    api
      .patch<PersistentShoppingListItem>(`/api/shopping-list-items/${itemId}/tick`, null, {
        headers: { 'Idempotency-Key': generateIdempotencyKey() },
      })
      .then((r) => r.data),

  /**
   * PATCH /api/shopping-list-items/{id}/untick
   *
   * Sets ticked_at = NULL. Idempotent. Sends Idempotency-Key header.
   */
  untick: (itemId: string): Promise<PersistentShoppingListItem> =>
    api
      .patch<PersistentShoppingListItem>(`/api/shopping-list-items/${itemId}/untick`, null, {
        headers: { 'Idempotency-Key': generateIdempotencyKey() },
      })
      .then((r) => r.data),

  /**
   * POST /api/plans/{planId}/shopping-list/items
   *
   * Adds a user-supplied ad-hoc item. Returns the created ItemResponse.
   */
  addAdHocItem: (
    planId: string,
    request: AdHocShoppingListItemRequest,
  ): Promise<PersistentShoppingListItem> =>
    api
      .post<PersistentShoppingListItem>(`/api/plans/${planId}/shopping-list/items`, request)
      .then((r) => r.data),

  /**
   * DELETE /api/shopping-list-items/{id}
   *
   * Removes an item (PLAN or ADHOC). Returns 204.
   */
  deleteItem: (itemId: string): Promise<void> =>
    api.delete(`/api/shopping-list-items/${itemId}`).then(() => undefined),
}
