/**
 * Browser-side memory of a guest's Founding Member transfer order.
 *
 * A guest has no account, so there is no GET endpoint to restore their order on reload. The
 * order returned by POST /api/founding-member/transfer-order/guest is kept in localStorage
 * until it is claimed (GuestFoundingMemberClaim) or the guest starts over.
 */

import type { TransferOrderDto } from '@/types'

export const GUEST_TRANSFER_ORDER_KEY = 'kalmio_fm_guest_transfer_order'

/** sessionStorage key that carried a legacy guest Barion paymentId across the gateway redirect. */
export const PENDING_FM_PAYMENT_KEY = 'kalmio_pending_fm_payment_id'

export interface StoredGuestOrder {
  email: string
  order: TransferOrderDto
}

export function loadGuestTransferOrder(): StoredGuestOrder | null {
  try {
    const raw = localStorage.getItem(GUEST_TRANSFER_ORDER_KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as StoredGuestOrder
    if (!v?.order?.reference || !v.order.paymentId) return null
    return v
  } catch {
    return null
  }
}

export function saveGuestTransferOrder(value: StoredGuestOrder): void {
  try {
    localStorage.setItem(GUEST_TRANSFER_ORDER_KEY, JSON.stringify(value))
  } catch {
    // Storage blocked: the instructions are still on screen and in the emailed díjbekérő.
  }
}

export function clearGuestTransferOrder(): void {
  try {
    localStorage.removeItem(GUEST_TRANSFER_ORDER_KEY)
  } catch {
    // ignore
  }
}

/** Pixel `purchase` dedupe for transfer orders (confirmed later by an admin). */
export function markPurchaseTracked(reference: string): boolean {
  const key = `kalmio-pixel-purchase-${reference}`
  try {
    if (localStorage.getItem(key) === '1') return false
    localStorage.setItem(key, '1')
    return true
  } catch {
    return false
  }
}
