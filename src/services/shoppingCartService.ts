import { api } from '@/lib/api'
import type {
  AddCartItemRequest,
  CartLineItemResponse,
  CartReceiptConfirmRequest,
  GenerateCartRequest,
  ReceiptScanResponse,
  RetailHandoffResponse,
  ShoppingCartResponse,
  CartPriceComparison,
} from '@/types'

/**
 * The shopping cart — the one shopping model.
 *
 * POST  /api/shopping-cart/generate              build (or rebuild, keeping ticks + ad-hoc lines)
 *                                                 the cart for a plan's current cycle, fridge-deducted
 * GET   /api/shopping-cart/current                the open cart (null when none)
 * POST  /api/shopping-cart/{cartId}/mark-shopped  move the cart into the fridge
 * PATCH /api/shopping-cart/items/{itemId}         tick / untick
 * POST  /api/shopping-cart/{cartId}/items         add by hand
 * DELETE /api/shopping-cart/items/{itemId}        remove a line
 * POST  /api/shopping-cart/{cartId}/receipt/scan|confirm  receipt OCR against the cart (premium)
 */
export const shoppingCartService = {
  generate: (req: GenerateCartRequest = {}): Promise<ShoppingCartResponse> =>
    api.post<ShoppingCartResponse>('/api/shopping-cart/generate', req).then(r => r.data),

  current: (planId?: string | null): Promise<ShoppingCartResponse | null> =>
    api
      .get<ShoppingCartResponse>('/api/shopping-cart/current', {
        params: planId ? { planId } : {},
        validateStatus: s => s === 200 || s === 404,
      })
      .then(r => (r.status === 404 ? null : r.data)),

  getById: (cartId: string): Promise<ShoppingCartResponse> =>
    api.get<ShoppingCartResponse>(`/api/shopping-cart/${cartId}`).then(r => r.data),

  priceComparison: (cartId: string): Promise<CartPriceComparison> =>
    api.get<CartPriceComparison>(`/api/shopping-cart/${cartId}/price-comparison`).then(r => r.data),

  markShopped: (cartId: string): Promise<ShoppingCartResponse> =>
    api
      .post<ShoppingCartResponse>(`/api/shopping-cart/${cartId}/mark-shopped`, null, { requestIdempotencyKey: true })
      .then(r => r.data),

  toggleItem: (itemId: string, bought: boolean): Promise<{ shoppingItemId: string; bought: boolean }> =>
    api
      .patch<{ shoppingItemId: string; bought: boolean }>(`/api/shopping-cart/items/${itemId}`, { bought }, { requestIdempotencyKey: true })
      .then(r => r.data),

  addItem: (cartId: string, req: AddCartItemRequest): Promise<CartLineItemResponse> =>
    api
      .post<CartLineItemResponse>(`/api/shopping-cart/${cartId}/items`, req, { requestIdempotencyKey: true })
      .then(r => r.data),

  deleteItem: (itemId: string): Promise<void> =>
    api.delete(`/api/shopping-cart/items/${itemId}`, { requestIdempotencyKey: true }).then(() => undefined),

  /** Push the to-buy lines into a connected partner's basket. The user pays on the partner site. */
  handoff: (cartId: string, providerId: string): Promise<RetailHandoffResponse> =>
    api
      .post<RetailHandoffResponse>(`/api/shopping-cart/${cartId}/handoff/${providerId}`, null, { requestIdempotencyKey: true })
      .then(r => r.data),

  /** Receipt photo → 3-pass match against the cart and the catalog. Nothing is written yet. Premium. */
  scanReceipt: (cartId: string, file: File): Promise<ReceiptScanResponse> => {
    const form = new FormData()
    form.append('image', file)
    return api
      .post<ReceiptScanResponse>(`/api/shopping-cart/${cartId}/receipt/scan`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(r => r.data)
  },

  /** Confirm reviewed receipt lines into the fridge. Idempotent (replaces quantities). */
  confirmReceipt: (cartId: string, req: CartReceiptConfirmRequest): Promise<{ savedCount: number }> =>
    api
      .post<{ savedCount: number }>(`/api/shopping-cart/${cartId}/receipt/confirm`, req)
      .then(r => r.data),
}
