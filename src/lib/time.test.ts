import { describe, it, expect } from 'vitest'
import { isMealSlotPast, AUTO_TICK_OFFSET_MINUTES } from './time'

// All tests pass explicit `nowMinutes` to keep them deterministic — no
// dependency on the real wall clock.

describe('isMealSlotPast', () => {
  const OFFSET = AUTO_TICK_OFFSET_MINUTES // 60 by default

  describe('exactly at the auto-tick threshold', () => {
    it('returns true when nowMinutes equals slotStart + OFFSET exactly', () => {
      const slotStart = 8 * 60 // 08:00
      const now = slotStart + OFFSET
      expect(isMealSlotPast(slotStart, now)).toBe(true)
    })
  })

  describe('before the threshold', () => {
    it('returns false when nowMinutes is one minute before threshold', () => {
      const slotStart = 8 * 60 // 08:00
      const now = slotStart + OFFSET - 1
      expect(isMealSlotPast(slotStart, now)).toBe(false)
    })

    it('returns false immediately at slot start time (0 minutes elapsed)', () => {
      const slotStart = 12 * 60 // 12:00
      expect(isMealSlotPast(slotStart, slotStart)).toBe(false)
    })

    it('returns false when well before the slot start', () => {
      const slotStart = 19 * 60 // 19:00
      const now = 6 * 60        // 06:00
      expect(isMealSlotPast(slotStart, now)).toBe(false)
    })
  })

  describe('after the threshold', () => {
    it('returns true when nowMinutes is one minute past threshold', () => {
      const slotStart = 12 * 60 // 12:00
      const now = slotStart + OFFSET + 1
      expect(isMealSlotPast(slotStart, now)).toBe(true)
    })

    it('returns true well after the threshold', () => {
      const slotStart = 8 * 60  // 08:00
      const now = 23 * 60       // 23:00
      expect(isMealSlotPast(slotStart, now)).toBe(true)
    })
  })

  describe('day boundary cases', () => {
    it('handles midnight slot (0) correctly — past when now >= OFFSET', () => {
      expect(isMealSlotPast(0, OFFSET)).toBe(true)
      expect(isMealSlotPast(0, OFFSET - 1)).toBe(false)
    })

    it('handles late-night slot (23:00 = 1380 min) — not past at same minute', () => {
      const slotStart = 23 * 60 // 1380
      expect(isMealSlotPast(slotStart, slotStart)).toBe(false)
    })

    it('handles late-night slot — past when now >= slotStart + OFFSET (wraps into next day but comparison is still correct)', () => {
      // 23:00 + 60 = 24:00 = 1440 min; if now is 1440 it is past
      const slotStart = 23 * 60
      expect(isMealSlotPast(slotStart, slotStart + OFFSET)).toBe(true)
    })
  })

  describe('default nowMinutes (wall clock)', () => {
    it('does not throw when nowMinutes is omitted', () => {
      expect(() => isMealSlotPast(8 * 60)).not.toThrow()
    })

    it('returns a boolean when nowMinutes is omitted', () => {
      expect(typeof isMealSlotPast(8 * 60)).toBe('boolean')
    })
  })
})
