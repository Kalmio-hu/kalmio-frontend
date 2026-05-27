/**
 * Unit tests for VariantsChip filtering logic.
 *
 * The chip filters siblings client-side by effectiveDietTier — these tests
 * verify that filtering produces the right counts for each user tier.
 */
import { describe, it, expect } from 'vitest'
import { compatibleDietTiers } from '@/types'
import type { DietTier, RecipeSibling } from '@/types'

// ── Helper: simulates the filtering logic inside VariantsChip ────────────

function filterCompatibleSiblings(
  siblings: RecipeSibling[],
  currentRecipeId: string,
  effectiveDietTier: DietTier,
): RecipeSibling[] {
  const allowed = compatibleDietTiers(effectiveDietTier)
  return siblings.filter(
    s => s.id !== currentRecipeId && (s.dietTier === null || allowed.includes(s.dietTier)),
  )
}

// ── Fixtures ────────────────────────────────────────────────────────────

const SIBLINGS: RecipeSibling[] = [
  { id: 'r-vegan',        variantLabel: 'tofuval',          dietTier: 'VEGAN',       kcal: 300, protein: 12 },
  { id: 'r-vegetarian',   variantLabel: 'tükörtojással',    dietTier: 'VEGETARIAN',  kcal: 350, protein: 15 },
  { id: 'r-pescatarian',  variantLabel: 'hallal',           dietTier: 'PESCATARIAN', kcal: 380, protein: 20 },
  { id: 'r-omnivore',     variantLabel: 'csirkével',        dietTier: 'OMNIVORE',    kcal: 420, protein: 30 },
]

describe('VariantsChip — compatible sibling count', () => {
  it('VEGAN user: sees only VEGAN siblings (excluding current recipe)', () => {
    const result = filterCompatibleSiblings(SIBLINGS, 'r-vegan', 'VEGAN')
    expect(result).toHaveLength(0) // current is VEGAN, only VEGAN sibling is excluded as current
  })

  it('VEGAN user: sees VEGAN sibling when current recipe is something else', () => {
    const result = filterCompatibleSiblings(SIBLINGS, 'r-omnivore', 'VEGAN')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('r-vegan')
  })

  it('VEGETARIAN user: sees VEGAN and VEGETARIAN (not pesc/omni)', () => {
    const result = filterCompatibleSiblings(SIBLINGS, 'r-vegetarian', 'VEGETARIAN')
    expect(result.map(s => s.dietTier)).toContain('VEGAN')
    expect(result.map(s => s.dietTier)).not.toContain('PESCATARIAN')
    expect(result.map(s => s.dietTier)).not.toContain('OMNIVORE')
    expect(result).toHaveLength(1) // only VEGAN (current VEGETARIAN excluded)
  })

  it('PESCATARIAN user: excludes OMNIVORE', () => {
    const result = filterCompatibleSiblings(SIBLINGS, 'r-omnivore', 'PESCATARIAN')
    const tiers = result.map(s => s.dietTier)
    expect(tiers).not.toContain('OMNIVORE')
    expect(result).toHaveLength(3) // VEGAN + VEGETARIAN + PESCATARIAN
  })

  it('OMNIVORE user: sees all siblings except current', () => {
    const result = filterCompatibleSiblings(SIBLINGS, 'r-omnivore', 'OMNIVORE')
    expect(result).toHaveLength(3)
    expect(result.map(s => s.id)).not.toContain('r-omnivore')
  })

  it('siblings with null dietTier are always visible (treated as safe)', () => {
    const siblingsWithNull: RecipeSibling[] = [
      { id: 'r-null-tier', variantLabel: 'ismeretlen', dietTier: null, kcal: null, protein: null },
    ]
    const result = filterCompatibleSiblings(siblingsWithNull, 'r-current', 'VEGAN')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('r-null-tier')
  })

  it('empty siblings array returns empty', () => {
    const result = filterCompatibleSiblings([], 'r-current', 'OMNIVORE')
    expect(result).toHaveLength(0)
  })
})
