/**
 * foundingMember service — KALMIO-20 / KALMIO-292
 *
 * Backend endpoints:
 *   GET  /api/founding-member/availability — public, no auth required.
 *        Returns { cap, soldCount, remaining, price, currency }.
 *        Cache-Control max-age=30 on the server side.
 *   POST /api/founding-member/checkout              — authenticated.
 *   POST /api/founding-member/checkout/preview?token — vault token, no session needed.
 *        Both initiate a Barion payment session and return { paymentId, gatewayUrl }.
 */

import { api } from '@/lib/api'
import type {
  FoundingMemberAvailability,
  FoundingMemberCheckoutRequest,
  FoundingMemberCheckoutResponse,
} from '@/types'

async function getAvailability(): Promise<FoundingMemberAvailability> {
  const res = await api.get<FoundingMemberAvailability>('/api/founding-member/availability')
  return res.data
}

/**
 * Initiates a Barion checkout session for the authenticated user.
 *
 * @param redirectUrl  The frontend success page URL Barion redirects to after payment.
 *                     Must be an absolute URL reachable by Barion's servers.
 * @returns `{ paymentId, gatewayUrl }` — redirect the user to `gatewayUrl` immediately.
 * @throws HTTP 409 when all founding-member slots are already taken (cap reached).
 *
 * No idempotency key: payment/checkout initiation must always create a fresh Barion
 * session. A deduplicated response could return a stale gatewayUrl from a prior
 * abandoned session, which Barion would reject or associate with the wrong attempt.
 */
async function checkout(redirectUrl: string, previewToken?: string): Promise<FoundingMemberCheckoutResponse> {
  const body: FoundingMemberCheckoutRequest = { redirectUrl }
  const url = previewToken
    ? `/api/founding-member/checkout/preview?token=${encodeURIComponent(previewToken)}`
    : '/api/founding-member/checkout'
  const res = await api.post<FoundingMemberCheckoutResponse>(url, body)
  return res.data
}

/**
 * Initiates a guest Barion checkout — no account required. The buyer pays first and
 * claims founding-member status after registering. The email is stored server-side so a
 * paid-but-unclaimed payment can be recovered.
 *
 * @param email       Buyer email (Barion also collects its own billing email separately).
 * @param redirectUrl Absolute success-page URL Barion redirects to after payment.
 * @returns `{ paymentId, gatewayUrl }` — store `paymentId` client-side, redirect to `gatewayUrl`.
 * @throws HTTP 409 when all founding-member slots are taken.
 */
async function checkoutGuest(email: string, redirectUrl: string): Promise<FoundingMemberCheckoutResponse> {
  const res = await api.post<FoundingMemberCheckoutResponse>(
    '/api/founding-member/checkout/guest',
    { email, redirectUrl },
  )
  return res.data
}

/**
 * Polls the coarse status of a guest checkout session. Returns 'PENDING' | 'SUCCEEDED' | 'FAILED'.
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
 * Claims a settled guest payment for the now-authenticated user, granting founding-member
 * status and binding the payment to their account.
 *
 * @throws HTTP 404 when there is no unclaimed guest payment for this paymentId.
 * @throws HTTP 409 when the payment has not settled yet, or all slots are taken.
 */
async function claimPayment(paymentId: string): Promise<void> {
  await api.post('/api/founding-member/claim', { paymentId })
}

/**
 * Returns the paymentId of a settled guest payment matching the logged-in user's email that
 * hasn't been claimed yet (e.g. the claim link was lost), or null if there's nothing to
 * recover. Lets the buy page offer to activate an existing payment instead of charging again.
 */
async function getUnclaimed(): Promise<{ paymentId: string | null }> {
  const res = await api.get<{ paymentId: string | null }>('/api/founding-member/unclaimed')
  return res.data
}

export const foundingMemberService = {
  getAvailability,
  checkout,
  checkoutGuest,
  getGuestPaymentStatus,
  claimPayment,
  getUnclaimed,
}
