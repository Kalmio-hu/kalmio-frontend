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

export const foundingMemberService = {
  getAvailability,
  checkout,
}
