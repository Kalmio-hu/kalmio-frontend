/**
 * Service for GET/PUT /api/users/me/shopping-category-order.
 * KALMIO-373 — C10 Settings UI: drag-to-reorder shopping categories.
 */
import { api } from '@/lib/api'
import type {
  ShoppingCategoryOrderResponse,
  UpdateShoppingCategoryOrderRequest,
} from '@/types'

/** TanStack Query key for the user's shopping category order. */
export const SHOPPING_CATEGORY_ORDER_QUERY_KEY = ['users', 'me', 'shopping-category-order'] as const

const shoppingCategoryOrderService = {
  /**
   * Fetches the authenticated user's shopping category order.
   * Returns the default enum order (PRODUCE first, OTHER last) if the user
   * has not yet customised their order.
   */
  getOrder: async (): Promise<ShoppingCategoryOrderResponse> => {
    const { data } = await api.get<ShoppingCategoryOrderResponse>(
      '/api/users/me/shopping-category-order',
    )
    return data
  },

  /**
   * Replaces the authenticated user's shopping category order.
   * The request must contain all 15 ShoppingCategory names exactly once.
   * Returns the saved order in the same shape as getOrder.
   */
  updateOrder: async (
    request: UpdateShoppingCategoryOrderRequest,
  ): Promise<ShoppingCategoryOrderResponse> => {
    const { data } = await api.put<ShoppingCategoryOrderResponse>(
      '/api/users/me/shopping-category-order',
      request,
      { requestIdempotencyKey: true },
    )
    return data
  },
}

export default shoppingCategoryOrderService
