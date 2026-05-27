/**
 * foundingMember service — KALMIO-20 / KALMIO-292
 *
 * Backend endpoints:
 *   GET  /api/founding-member/availability — public, no auth required.
 *        Returns { cap, soldCount, remaining, price, currency }.
 *        Cache-Control max-age=30 on the server side.
 *   POST /api/founding-member/checkout     — authenticated.
 *        Initiates a Barion payment session.
 *        Returns { paymentId, gatewayUrl }.
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
async function checkout(redirectUrl: string): Promise<FoundingMemberCheckoutResponse> {
  const body: FoundingMemberCheckoutRequest = { redirectUrl }
  const res = await api.post<FoundingMemberCheckoutResponse>('/api/founding-member/checkout', body)
  return res.data
}

export const foundingMemberService = {
  getAvailability,
  checkout,
}
