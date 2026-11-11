/**
 * Progress maths (PRD §11): active weeks of 12, the strip, self-test lines.
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest'
import {
  activeWeeksOf12,
  isActiveWeek,
  markOf,
  polylinePoints,
  selfTestComparison,
  selfTestDue,
  timesWord,
  twelveWeekStrip,
} from './progressMath'
import type { ProgressWeekDto, SelfTestDto } from '../types'

function w(weekStart: string, planned: number, done: number, extra: Partial<ProgressWeekDto> = {}): ProgressWeekDto {
  return { weekStart, planned, done, active: planned > 0 && done >= planned - 1, ...extra }
}

describe('progress — active weeks', () => {
  it('a week with one session fewer than planned still counts (reserve rule)', () => {
    expect(isActiveWeek({ planned: 3, done: 2, active: undefined as unknown as boolean })).toBe(true)
    expect(isActiveWeek({ planned: 3, done: 1, active: undefined as unknown as boolean })).toBe(false)
    expect(isActiveWeek({ planned: 0, done: 0, active: undefined as unknown as boolean })).toBe(false)
    expect(markOf(w('2026-11-02', 3, 2))).toBe('RESERVE')
    expect(markOf(w('2026-11-02', 3, 3))).toBe('ACTIVE')
    expect(markOf(w('2026-11-02', 3, 0))).toBe('INACTIVE')
    expect(markOf(w('2026-11-02', 3, 3, { reserve: true }))).toBe('RESERVE')
  })

  it('counts only the last twelve weeks and prefers the backend figure', () => {
    const weeks: ProgressWeekDto[] = []
    for (let i = 0; i < 15; i++) {
      const d = new Date(2026, 6, 6 + 7 * i)
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      weeks.push(w(iso, 3, i % 2 === 0 ? 3 : 0))
    }
    // Last 12 of 15: indexes 3..14 → even indexes 4,6,8,10,12,14 = 6 active.
    expect(activeWeeksOf12(weeks)).toBe(6)
    expect(activeWeeksOf12(weeks, 9)).toBe(9)
    expect(activeWeeksOf12(weeks, 40)).toBe(12)
  })

  it('the strip ends with the current week and pads unknown weeks as inactive', () => {
    const strip = twelveWeekStrip([w('2026-11-09', 3, 3), w('2026-10-26', 3, 2)], '2026-11-11')
    expect(strip).toHaveLength(12)
    expect(strip[11].weekStart).toBe('2026-11-09')
    expect(strip[11].mark).toBe('ACTIVE')
    expect(strip[9].mark).toBe('RESERVE')
    expect(strip[0].weekStart).toBe('2026-08-24')
    expect(strip[0].mark).toBe('INACTIVE')
  })
})

describe('progress — self-tests', () => {
  const tests: SelfTestDto[] = [
    { id: '1', date: '2026-09-16', kind: 'SIT_TO_STAND_30S', value: 8 },
    { id: '2', date: '2026-10-14', kind: 'SIT_TO_STAND_30S', value: 11 },
    { id: '3', date: '2026-10-20', kind: 'SINGLE_LEG_STAND', value: 9 },
  ]

  it('compares the last two chair-stand results ("Négy hete 8-szor, ma 11-szer")', () => {
    const c = selfTestComparison(tests)
    expect(c?.previous.value).toBe(8)
    expect(c?.latest.value).toBe(11)
    expect(c?.weeksBetween).toBe(4)
    expect(selfTestComparison(tests.slice(0, 1))).toBeNull()
  })

  it('is due four weeks after the last result, and at once when none exists', () => {
    expect(selfTestDue(tests, '2026-11-10')).toBe(false)
    expect(selfTestDue(tests, '2026-11-11')).toBe(true)
    expect(selfTestDue([], '2026-11-11')).toBe(true)
  })

  it('writes the Hungarian multiplicative suffix by vowel harmony', () => {
    expect(timesWord(8, 'hu')).toBe('8-szor')
    expect(timesWord(11, 'hu')).toBe('11-szer')
    expect(timesWord(5, 'hu')).toBe('5-ször')
    expect(timesWord(12, 'hu')).toBe('12-ször')
    expect(timesWord(10, 'hu')).toBe('10-szer')
    expect(timesWord(20, 'hu')).toBe('20-szor')
    expect(timesWord(3, 'hu-HU')).toBe('3-szor')
    expect(timesWord(1, 'en')).toBe('1 time')
    expect(timesWord(9, 'en-GB')).toBe('9 times')
  })

  it('polyline needs at least two points and stays inside the box', () => {
    expect(polylinePoints([5], 100, 40)).toBeNull()
    const pts = polylinePoints([8, 11, 10], 100, 40)!
    const coords = pts.split(' ').map((p) => p.split(',').map(Number))
    for (const [x, y] of coords) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(100)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(40)
    }
    expect(coords[1][1]).toBeLessThan(coords[0][1]) // higher value → higher on screen
  })
})
