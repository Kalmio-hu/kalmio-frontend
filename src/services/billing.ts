/**
 * billing service — public price list (docs/product/payments-subscriptions.md §1).
 *
 *   GET /api/billing/plans — public. Subscription plans, the Founding Member offer and the
 *   bank-transfer beneficiary. All amounts are gross HUF integers.
 */

import { api } from '@/lib/api'
import type { BillingPlansResponse } from '@/types'

export const BILLING_PLANS_QUERY_KEY = ['billing', 'plans'] as const

async function getPlans(): Promise<BillingPlansResponse> {
  const res = await api.get<BillingPlansResponse>('/api/billing/plans')
  return res.data
}

export const billingService = { getPlans }
