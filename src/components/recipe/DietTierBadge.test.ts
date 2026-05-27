/**
 * Unit tests for DietTierBadge utility logic.
 *
 * The component itself is tested via Storybook. Here we test the pure logic
 * of compatibleDietTiers which powers the VariantsChip filtering.
 */
import { describe, it, expect } from 'vitest'
import { compatibleDietTiers, DIET_TIER_ORDER } from '@/types'
import type { DietTier } from '@/types'

describe('compatibleDietTiers', () => {
  it('VEGAN user sees only VEGAN', () => {
    const allowed = compatibleDietTiers('VEGAN')
    expect(allowed).toEqual(['VEGAN'])
    expect(allowed).not.toContain('VEGETARIAN')
    expect(allowed).not.toContain('PESCATARIAN')
    expect(allowed).not.toContain('OMNIVORE')
  })

  it('VEGETARIAN user sees VEGAN and VEGETARIAN', () => {
    const allowed = compatibleDietTiers('VEGETARIAN')
    expect(allowed).toContain('VEGAN')
    expect(allowed).toContain('VEGETARIAN')
    expect(allowed).not.toContain('PESCATARIAN')
    expect(allowed).not.toContain('OMNIVORE')
  })

  it('PESCATARIAN user sees VEGAN, VEGETARIAN, PESCATARIAN', () => {
    const allowed = compatibleDietTiers('PESCATARIAN')
    expect(allowed).toContain('VEGAN')
    expect(allowed).toContain('VEGETARIAN')
    expect(allowed).toContain('PESCATARIAN')
    expect(allowed).not.toContain('OMNIVORE')
  })

  it('OMNIVORE user sees all four tiers', () => {
    const allowed = compatibleDietTiers('OMNIVORE')
    expect(allowed).toContain('VEGAN')
    expect(allowed).toContain('VEGETARIAN')
    expect(allowed).toContain('PESCATARIAN')
    expect(allowed).toContain('OMNIVORE')
  })

  it('returns a new array each call (no shared reference)', () => {
    const a = compatibleDietTiers('OMNIVORE')
    const b = compatibleDietTiers('OMNIVORE')
    expect(a).not.toBe(b)
  })
})

describe('DIET_TIER_ORDER', () => {
  it('VEGAN is strictest (lowest index)', () => {
    const tiers: DietTier[] = ['VEGAN', 'VEGETARIAN', 'PESCATARIAN', 'OMNIVORE']
    const sorted = [...tiers].sort((a, b) => DIET_TIER_ORDER[a] - DIET_TIER_ORDER[b])
    expect(sorted[0]).toBe('VEGAN')
    expect(sorted[sorted.length - 1]).toBe('OMNIVORE')
  })

  it('all four tiers have distinct order values', () => {
    const values = Object.values(DIET_TIER_ORDER)
    const unique = new Set(values)
    expect(unique.size).toBe(4)
  })
})
