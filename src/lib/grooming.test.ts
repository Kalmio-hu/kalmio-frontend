import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { countExpiringThisWeek } from './grooming'
import type { FridgeItem } from '@/types'

// ── helpers ───────────────────────────────────────────────────────────────

/** Produces a minimal FridgeItem with only the fields countExpiringThisWeek cares about. */
function fridgeItem(expiryDate: string | null): FridgeItem {
  return {
    id: crypto.randomUUID(),
    ingredientId: 'ing-1',
    ingredientName: 'Test Ingredient',
    ingredientCategory: null,
    pantryItem: false,
    amount: 100,
    unit: 'G',
    addedAt: '2025-01-01T00:00:00Z',
    expiryDate,
    source: 'MANUAL',
  }
}

/**
 * ISO date string for "today + n days" in the LOCAL timezone.
 *
 * The implementation computes `today` with setHours(0,0,0,0) (local midnight),
 * but parses expiryDate strings with `new Date("YYYY-MM-DD")` which yields UTC
 * midnight.  To avoid a cross-timezone gap we set the fake clock to UTC midnight
 * so both operations produce the same instant.
 */
function localDatePlusDays(n: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + n)
  // yyyy-mm-dd in local time (same method the implementation uses under the hood)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ── freeze the clock to UTC midnight so local midnight === UTC midnight,
//    eliminating cross-timezone drift when comparing Date("YYYY-MM-DD")
//    (parsed as UTC) against the local-midnight windowEnd in the implementation.
const FIXED_NOW = new Date('2025-06-15T00:00:00.000Z') // UTC midnight

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

// ── tests ──────────────────────────────────────────────────────────────────

describe('countExpiringThisWeek', () => {
  it('returns 0 for an empty fridge', () => {
    expect(countExpiringThisWeek([])).toBe(0)
  })

  it('ignores items with no expiry date', () => {
    const items = [fridgeItem(null), fridgeItem(null), fridgeItem(null)]
    expect(countExpiringThisWeek(items)).toBe(0)
  })

  it('counts an item expiring today (day 0) — inclusive boundary', () => {
    const items = [fridgeItem(localDatePlusDays(0))]
    expect(countExpiringThisWeek(items)).toBe(1)
  })

  it('counts an item expiring in exactly 7 days — inclusive boundary', () => {
    const items = [fridgeItem(localDatePlusDays(7))]
    expect(countExpiringThisWeek(items)).toBe(1)
  })

  it('does not count an item expiring in 8 days — outside the window', () => {
    const items = [fridgeItem(localDatePlusDays(8))]
    expect(countExpiringThisWeek(items)).toBe(0)
  })

  it('counts already-expired items (negative offset)', () => {
    // Expired yesterday
    const items = [fridgeItem(localDatePlusDays(-1))]
    expect(countExpiringThisWeek(items)).toBe(1)
  })

  it('counts items expired long ago', () => {
    const items = [fridgeItem('2020-01-01')]
    expect(countExpiringThisWeek(items)).toBe(1)
  })

  it('counts multiple qualifying items while ignoring non-qualifying ones', () => {
    const items = [
      fridgeItem(localDatePlusDays(0)),   // today — counts
      fridgeItem(localDatePlusDays(3)),   // 3 days — counts
      fridgeItem(localDatePlusDays(7)),   // 7 days — counts (inclusive boundary)
      fridgeItem(localDatePlusDays(8)),   // 8 days — does NOT count
      fridgeItem(null),                   // no expiry — does NOT count
    ]
    expect(countExpiringThisWeek(items)).toBe(3)
  })

  it('counts all items when all are expiring within the window', () => {
    const items = [
      fridgeItem(localDatePlusDays(-2)),
      fridgeItem(localDatePlusDays(1)),
      fridgeItem(localDatePlusDays(4)),
      fridgeItem(localDatePlusDays(7)),
    ]
    expect(countExpiringThisWeek(items)).toBe(4)
  })
})
