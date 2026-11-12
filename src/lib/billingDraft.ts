/**
 * Billing address draft for the NAV e-invoice — shared by the subscription checkout and the
 * Founding Member transfer order (see BillingAddressForm).
 */

import type { BillingInfo } from '@/types'

export type BillingField = 'name' | 'postCode' | 'city' | 'address'
export type BillingErrors = Partial<Record<BillingField, boolean>>

export interface BillingDraft {
  name: string
  postCode: string
  city: string
  address: string
}

export const EMPTY_BILLING: BillingDraft = { name: '', postCode: '', city: '', address: '' }

export function validateBilling(draft: BillingDraft): BillingErrors {
  const next: BillingErrors = {}
  if (!draft.name.trim()) next.name = true
  if (!draft.postCode.trim()) next.postCode = true
  if (!draft.city.trim()) next.city = true
  if (!draft.address.trim()) next.address = true
  return next
}

export function toBillingInfo(draft: BillingDraft): BillingInfo {
  return {
    name: draft.name.trim(),
    countryCode: 'HU',
    postCode: draft.postCode.trim(),
    city: draft.city.trim(),
    address: draft.address.trim(),
  }
}
