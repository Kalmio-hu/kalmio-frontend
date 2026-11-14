/**
 * subscription service — Kalmio Prémium recurring card payments via Barion
 * (docs/product/payments-subscriptions.md §1).
 *
 *   GET  /api/subscription                              → SubscriptionDto, 204 when the member never subscribed
 *   POST /api/subscription/checkout                     → { paymentId, gatewayUrl }; 409 when one is active,
 *                                                         400 unless the three acknowledgements are true
 *   GET  /api/subscription/payments/{paymentId}/status  → { status }
 *   POST /api/subscription/cancel                       → SubscriptionDto (cancelAtPeriodEnd: true)
 *   POST /api/subscription/resume                       → SubscriptionDto
 *   POST /api/subscription/pay-overdue                  → { paymentId, gatewayUrl } (PAST_DUE only)
 *
 * No idempotency keys on the Barion-starting calls: every attempt must open a fresh
 * gateway session, a replayed response would hand back a stale gatewayUrl.
 */

import { api } from '@/lib/api'
import type {
  BarionRedirectResponse,
  BillingInfo,
  SubscriptionCheckoutRequest,
  SubscriptionDto,
  SubscriptionPaymentStatusResponse,
  SubscriptionPlanCode,
} from '@/types'

export const SUBSCRIPTION_QUERY_KEY = ['subscription'] as const

async function get(): Promise<SubscriptionDto | null> {
  const res = await api.get<SubscriptionDto | ''>('/api/subscription')
  if (res.status === 204 || !res.data) return null
  return res.data
}

async function checkout(
  plan: SubscriptionPlanCode,
  billingInfo: BillingInfo,
  redirectUrl: string,
): Promise<BarionRedirectResponse> {
  const body: SubscriptionCheckoutRequest = {
    plan,
    billingInfo,
    redirectUrl,
    acceptTerms: true,
    startNowWaiveWithdrawal: true,
    acceptRecurringPayment: true,
  }
  const res = await api.post<BarionRedirectResponse>('/api/subscription/checkout', body)
  return res.data
}

async function getPaymentStatus(paymentId: string): Promise<SubscriptionPaymentStatusResponse> {
  const res = await api.get<SubscriptionPaymentStatusResponse>(
    `/api/subscription/payments/${encodeURIComponent(paymentId)}/status`,
  )
  return res.data
}

async function cancel(): Promise<SubscriptionDto> {
  const res = await api.post<SubscriptionDto>('/api/subscription/cancel', null, { requestIdempotencyKey: true })
  return res.data
}

async function resume(): Promise<SubscriptionDto> {
  const res = await api.post<SubscriptionDto>('/api/subscription/resume', null, { requestIdempotencyKey: true })
  return res.data
}

async function payOverdue(redirectUrl: string): Promise<BarionRedirectResponse> {
  const res = await api.post<BarionRedirectResponse>('/api/subscription/pay-overdue', { redirectUrl })
  return res.data
}

export const subscriptionService = { get, checkout, getPaymentStatus, cancel, resume, payOverdue }
