/**
 * Kalmio's sellable products (docs/product/payments-subscriptions.md) and small pure helpers
 * shared by the pricing page, the subscription settings card and the Barion Pixel events.
 */

import type { BarionPixelProduct } from '@/lib/barionPixel'
import { formatLocalDate } from '@/lib/utils'
import type { SubscriptionCard, SubscriptionDto, SubscriptionPlanCode } from '@/types'

/** List prices, used until GET /api/billing/plans answers. Gross HUF. */
export const DEFAULT_PRICES = {
  MONTHLY: 1990,
  YEARLY: 14990,
  FOUNDING_MEMBER: 19900,
} as const

/**
 * Days before a renewal charge the member is reminded by e-mail (contract §5); 0 means no reminder.
 * Mirrors the backend's SubscriptionService.Plan.
 */
export const RENEWAL_REMINDER_DAYS: Record<SubscriptionPlanCode, number> = { MONTHLY: 0, YEARLY: 14 }

/** PAST_DUE keeps premium for this long after the period end (contract §1). */
export const PAST_DUE_GRACE_DAYS = 7

export function planPixelProduct(plan: SubscriptionPlanCode, priceHuf?: number): BarionPixelProduct {
  return plan === 'MONTHLY'
    ? { id: 'kalmio-premium-monthly', name: 'Kalmio Prémium – havi', unitPrice: priceHuf ?? DEFAULT_PRICES.MONTHLY }
    : { id: 'kalmio-premium-yearly', name: 'Kalmio Prémium – éves', unitPrice: priceHuf ?? DEFAULT_PRICES.YEARLY }
}

export function foundingMemberPixelProduct(priceHuf?: number): BarionPixelProduct {
  return {
    id: 'kalmio-founding-member',
    name: 'Kalmio Alapító tagság',
    unitPrice: priceHuf ?? DEFAULT_PRICES.FOUNDING_MEMBER,
  }
}

export function isPlanCode(value: string | null | undefined): value is SubscriptionPlanCode {
  return value === 'MONTHLY' || value === 'YEARLY'
}

/**
 * The day of the first renewal charge for a subscription paid on `from`: one month or one year later,
 * counted the way the backend does (31 January → 28 February, 29 February → 28 February).
 */
export function nextChargeDate(plan: SubscriptionPlanCode, from: Date = new Date()): Date {
  const year = from.getFullYear() + (plan === 'YEARLY' ? 1 : 0)
  const month = from.getMonth() + (plan === 'MONTHLY' ? 1 : 0)
  const lastDay = new Date(year, month + 1, 0).getDate()
  return new Date(year, month, Math.min(from.getDate(), lastDay))
}

/** A charge day for the checkout texts ("2027. november 14."), kept on one line. */
export function chargeDateLabel(date: Date, lang: string): string {
  return formatLocalDate(date, lang, { year: 'numeric', month: 'long', day: 'numeric' }).replace(/ /g, '\u00a0')
}

/** Whole-percent saving of the yearly plan against twelve monthly charges (14 990 vs 23 880 → 37). */
export function yearlySavingPercent(monthly: number, yearly: number): number {
  if (monthly <= 0) return 0
  const full = monthly * 12
  return Math.max(0, Math.round(((full - yearly) / full) * 100))
}

/** "Visa •••• 0425, 12/28"; tolerant of missing parts. Null when nothing is known. */
export function formatCard(card: SubscriptionCard | null | undefined): string | null {
  if (!card) return null
  const parts: string[] = []
  if (card.type) parts.push(card.type)
  if (card.last4) parts.push(`•••• ${card.last4}`)
  if (parts.length === 0) return null
  const head = parts.join(' ')
  return card.validThru ? `${head}, ${card.validThru}` : head
}

/** End of the PAST_DUE grace window, or null when the period end is unknown. */
export function graceEnd(sub: Pick<SubscriptionDto, 'currentPeriodEnd'>): Date | null {
  if (!sub.currentPeriodEnd) return null
  const end = new Date(sub.currentPeriodEnd)
  if (Number.isNaN(end.getTime())) return null
  return new Date(end.getTime() + PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000)
}

/**
 * True while the subscription blocks a new checkout: PENDING, ACTIVE, PAST_DUE, or CANCELLED
 * (or cancel-at-period-end) before the period ends. Mirrors the backend's one-non-terminal rule.
 */
export function isSubscriptionOpen(sub: SubscriptionDto | null | undefined, now: number = Date.now()): boolean {
  if (!sub) return false
  if (sub.status === 'PENDING' || sub.status === 'ACTIVE' || sub.status === 'PAST_DUE') return true
  if (sub.status === 'CANCELLED') {
    const end = sub.currentPeriodEnd ? Date.parse(sub.currentPeriodEnd) : NaN
    return !Number.isNaN(end) && end > now
  }
  return false
}

/** Cancelled but still running until the period end, so it can be resumed. */
export function isResumable(sub: SubscriptionDto | null | undefined, now: number = Date.now()): boolean {
  if (!sub) return false
  if (!(sub.cancelAtPeriodEnd || sub.status === 'CANCELLED')) return false
  if (sub.status === 'EXPIRED' || sub.status === 'FAILED' || sub.status === 'PENDING') return false
  const end = sub.currentPeriodEnd ? Date.parse(sub.currentPeriodEnd) : NaN
  return !Number.isNaN(end) && end > now
}

/** Absolute success URL Barion redirects to; Barion appends `paymentId`. */
export function subscriptionReturnUrl(origin: string, plan: SubscriptionPlanCode, kind?: 'overdue'): string {
  const params = new URLSearchParams({ plan })
  if (kind) params.set('kind', kind)
  return `${origin}/app/premium/success?${params.toString()}`
}
