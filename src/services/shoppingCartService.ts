import { api } from '@/lib/api'
import type {
  CartReceiptConfirmRequest,
  GenerateCartRequest,
  ReceiptScanResponse,
  ShoppingCartResponse,
} from '@/types'

/**
 * Shopping cart service — wraps the BE2 multi-plan cart endpoints.
 *
 * POST /api/shopping-cart/generate              →  aggregate unshopped plans into a cart.
 * POST /api/shopping-cart/{cartId}/mark-shopped →  atomically mark plans shopped.
 * POST /api/shopping-cart/{cartId}/receipt/scan →  OCR receipt → smart-matched lines (KALMIO-329).
 * POST /api/shopping-cart/{cartId}/receipt/confirm → persist confirmed lines to fridge (KALMIO-329).
 */
export const shoppingCartService = {
  /**
   * Generate an aggregated shopping cart across all unshopped plans in the
   * optional window. Both dates default server-side to today → today+30 days.
   */
  generate: (req: GenerateCartRequest = {}): Promise<ShoppingCartResponse> =>
    api
      .post<ShoppingCartResponse>('/api/shopping-cart/generate', req)
      .then(r => r.data),

  /**
   * Atomically mark all plans in the cart as shopped.
   * Returns 409 if the cart was already marked.
   */
  markShopped: (cartId: string): Promise<ShoppingCartResponse> =>
    api
      .post<ShoppingCartResponse>(`/api/shopping-cart/${cartId}/mark-shopped`)
      .then(r => r.data),

  /**
   * Upload a receipt photo and run 3-pass smart matching against the cart's expected
   * items and the ingredient catalog. Returns match results for the confirm screen.
   * Nothing is written to the fridge at this stage. Requires premium.
   *
   * @param cartId  the shopping cart to match against
   * @param file    the receipt photo file (JPEG/PNG, max 10 MB)
   */
  scanReceipt: (cartId: string, file: File): Promise<ReceiptScanResponse> => {
    const form = new FormData()
    form.append('image', file)
    return api
      .post<ReceiptScanResponse>(
        `/api/shopping-cart/${cartId}/receipt/scan`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      .then(r => r.data)
  },

  /**
   * Confirm reviewed receipt match lines and populate the fridge.
   * Only lines with a non-null ingredientId are written.
   * Idempotent: calling confirm twice overwrites rather than doubles quantities.
   *
   * @param cartId  the shopping cart this confirm belongs to
   * @param req     confirmed (possibly user-edited) match lines
   * @returns number of fridge items written
   */
  confirmReceipt: (
    cartId: string,
    req: CartReceiptConfirmRequest,
  ): Promise<{ savedCount: number }> =>
    api
      .post<{ savedCount: number }>(
        `/api/shopping-cart/${cartId}/receipt/confirm`,
        req,
      )
      .then(r => r.data),
}
