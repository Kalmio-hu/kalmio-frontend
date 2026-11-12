import { describe, it, expect } from 'vitest'
import {
  formatCard,
  graceEnd,
  isPlanCode,
  isResumable,
  isSubscriptionOpen,
  planPixelProduct,
  subscriptionReturnUrl,
  yearlySavingPercent,
} from './billingProducts'
import type { SubscriptionDto } from '@/types'

const NOW = Date.parse('2026-11-12T10:00:00Z')

function sub(overrides: Partial<SubscriptionDto> = {}): SubscriptionDto {
  return {
    id: 's1',
    plan: 'MONTHLY',
    priceHuf: 1990,
    status: 'ACTIVE',
    currentPeriodStart: '2026-11-01T10:00:00Z',
    currentPeriodEnd: '2026-12-01T10:00:00Z',
    cancelAtPeriodEnd: false,
    nextChargeAt: '2026-12-01T10:00:00Z',
    card: { type: 'Visa', last4: '0425', validThru: '12/28' },
    payments: [],
    ...overrides,
  }
}

describe('billingProducts', () => {
  it('formats the registered card', () => {
    expect(formatCard({ type: 'Visa', last4: '0425', validThru: '12/28' })).toBe('Visa •••• 0425, 12/28')
    expect(formatCard({ type: null, last4: '0425', validThru: null })).toBe('•••• 0425')
    expect(formatCard({ type: null, last4: null, validThru: '12/28' })).toBeNull()
    expect(formatCard(null)).toBeNull()
  })

  it('computes the yearly saving', () => {
    expect(yearlySavingPercent(1990, 14990)).toBe(37)
    expect(yearlySavingPercent(0, 14990)).toBe(0)
  })

  it('maps plans to the pixel product ids from the contract', () => {
    expect(planPixelProduct('MONTHLY').id).toBe('kalmio-premium-monthly')
    expect(planPixelProduct('YEARLY', 15990)).toMatchObject({ id: 'kalmio-premium-yearly', unitPrice: 15990 })
    expect(isPlanCode('YEARLY')).toBe(true)
    expect(isPlanCode('LIFETIME')).toBe(false)
  })

  it('treats PENDING, ACTIVE, PAST_DUE and a running CANCELLED as open', () => {
    expect(isSubscriptionOpen(sub(), NOW)).toBe(true)
    expect(isSubscriptionOpen(sub({ status: 'PAST_DUE' }), NOW)).toBe(true)
    expect(isSubscriptionOpen(sub({ status: 'CANCELLED' }), NOW)).toBe(true)
    expect(isSubscriptionOpen(sub({ status: 'CANCELLED', currentPeriodEnd: '2026-11-01T00:00:00Z' }), NOW)).toBe(false)
    expect(isSubscriptionOpen(sub({ status: 'EXPIRED' }), NOW)).toBe(false)
    expect(isSubscriptionOpen(null, NOW)).toBe(false)
  })

  it('allows resume only for a cancelled subscription still inside its period', () => {
    expect(isResumable(sub({ cancelAtPeriodEnd: true, nextChargeAt: null }), NOW)).toBe(true)
    expect(isResumable(sub(), NOW)).toBe(false)
    expect(isResumable(sub({ cancelAtPeriodEnd: true, currentPeriodEnd: '2026-11-01T00:00:00Z' }), NOW)).toBe(false)
    expect(isResumable(sub({ status: 'EXPIRED', cancelAtPeriodEnd: true }), NOW)).toBe(false)
  })

  it('adds the 7-day grace to the period end', () => {
    expect(graceEnd(sub())?.toISOString()).toBe('2026-12-08T10:00:00.000Z')
    expect(graceEnd(sub({ currentPeriodEnd: null }))).toBeNull()
  })

  it('builds the Barion return URL Barion appends paymentId to', () => {
    expect(subscriptionReturnUrl('https://kalmio.hu', 'YEARLY')).toBe('https://kalmio.hu/app/premium/success?plan=YEARLY')
    expect(subscriptionReturnUrl('https://kalmio.hu', 'MONTHLY', 'overdue')).toBe(
      'https://kalmio.hu/app/premium/success?plan=MONTHLY&kind=overdue',
    )
  })
})
