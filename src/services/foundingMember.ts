/**
 * foundingMember service — KALMIO-20 / KALMIO-292, bank transfer since 2026-11-12.
 *
 * Barion does not provide a gateway for the lifetime tier, so the Founding Member
 * membership is sold by bank transfer only (docs/product/payments-subscriptions.md §2).
 *
 * Backend endpoints:
 *   GET  /api/founding-member/availability          — public; { cap, soldCount, remaining, price, currency }.
 *   POST /api/founding-member/transfer-order        — user; { billingInfo } → TransferOrderDto (open order if one exists).
 *   GET  /api/founding-member/transfer-order        — user; latest open or paid order, 204 when none.
 *   POST /api/founding-member/transfer-order/guest  — public; { email, billingInfo } → TransferOrderDto.
 *   GET  /api/founding-member/guest-payment-status  — public; legacy guest sessions and confirmed guest orders.
 *   POST /api/founding-member/claim                 — user; binds a settled guest order to the account.
 *   GET  /api/founding-member/unclaimed             — user; a settled guest order matching the user's email.
 */

import { api } from '@/lib/api'
import type { BillingInfo, FoundingMemberAvailability, TransferOrderDto } from '@/types'

async function getAvailability(): Promise<FoundingMemberAvailability> {
  const res = await api.get<FoundingMemberAvailability>('/api/founding-member/availability')
  return res.data
}

/**
 * Places (or returns the already open) bank-transfer order for the signed-in user.
 * The backend issues a díjbekérő (proforma) and emails it.
 *
 * @throws HTTP 409 when all founding-member slots are taken.
 */
async function createTransferOrder(billingInfo: BillingInfo): Promise<TransferOrderDto> {
  const res = await api.post<TransferOrderDto>('/api/founding-member/transfer-order', { billingInfo })
  return res.data
}

/** The signed-in user's latest open or paid transfer order, or null (HTTP 204) when there is none. */
async function getTransferOrder(): Promise<TransferOrderDto | null> {
  const res = await api.get<TransferOrderDto | ''>('/api/founding-member/transfer-order')
  if (res.status === 204 || !res.data) return null
  return res.data
}

/**
 * Places a bank-transfer order without an account. Once the transfer is confirmed the
 * buyer registers and claims the order with its `paymentId` (the same claim flow as a
 * legacy guest Barion payment).
 *
 * @throws HTTP 409 when all founding-member slots are taken.
 */
async function createGuestTransferOrder(email: string, billingInfo: BillingInfo): Promise<TransferOrderDto> {
  const res = await api.post<TransferOrderDto>('/api/founding-member/transfer-order/guest', { email, billingInfo })
  return res.data
}

/**
 * Coarse status of a guest order. Returns 'PENDING' | 'SUCCEEDED' | 'FAILED'.
 * Kept for legacy guest Barion sessions and used to check a stored guest transfer order.
 * @throws HTTP 404 when no guest session exists for this paymentId.
 */
async function getGuestPaymentStatus(paymentId: string): Promise<{ status: string }> {
  const res = await api.get<{ status: string }>(
    '/api/founding-member/guest-payment-status',
    { params: { paymentId } },
  )
  return res.data
}

/**
 * Claims a settled guest order for the now-authenticated user, granting founding-member
 * status and binding the order to their account.
 *
 * @throws HTTP 404 when there is no unclaimed guest order for this paymentId.
 * @throws HTTP 409 when the order has not settled yet, or all slots are taken.
 */
async function claimPayment(paymentId: string): Promise<void> {
  await api.post('/api/founding-member/claim', { paymentId })
}

/**
 * Returns the paymentId of a settled guest order matching the logged-in user's email that
 * hasn't been claimed yet, or null if there's nothing to recover. Lets the buy page offer to
 * activate an existing order instead of ordering again.
 */
async function getUnclaimed(): Promise<{ paymentId: string | null }> {
  const res = await api.get<{ paymentId: string | null }>('/api/founding-member/unclaimed')
  return res.data
}

export const FOUNDING_MEMBER_TRANSFER_ORDER_QUERY_KEY = ['founding-member', 'transfer-order'] as const

export const foundingMemberService = {
  getAvailability,
  createTransferOrder,
  getTransferOrder,
  createGuestTransferOrder,
  getGuestPaymentStatus,
  claimPayment,
  getUnclaimed,
}
