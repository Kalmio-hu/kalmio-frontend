/**
 * Week view model (PRD §7.2): rest days, chip ordering, refusal handling.
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest'
import {
  buildWeekView,
  dayDropId,
  isDraggable,
  isRestDay,
  orderSessions,
  parseDayDropId,
  parseSessionDragId,
  refusalReason,
  sameRoleAlternatives,
  sessionDragId,
} from './weekView'
import type { SessionDto, WeekDto } from '../types'

function session(over: Partial<SessionDto> & { id: string; date: string }): SessionDto {
  return {
    dayPart: 'ANY',
    modalityCode: 'WALK',
    modalityName: 'Séta',
    roles: ['AEROBIC'],
    format: 'TARGET',
    intensity: 'EASY',
    durationMin: 20,
    status: 'PLANNED',
    expectLine: null,
    ...over,
  }
}

const week: WeekDto = {
  weekStart: '2026-11-09',
  days: [
    { date: '2026-11-09', restDay: false, sessions: [session({ id: 's1', date: '2026-11-09', intensity: 'HARD' })] },
    { date: '2026-11-10', restDay: true, sessions: [] },
    { date: '2026-11-11', restDay: false, sessions: [session({ id: 's2', date: '2026-11-11', status: 'DROPPED' })] },
    {
      date: '2026-11-12',
      restDay: false,
      sessions: [
        session({ id: 'b', date: '2026-11-12', dayPart: 'EVENING' }),
        session({ id: 'a', date: '2026-11-12', dayPart: 'EVENING' }),
        session({ id: 'fix', date: '2026-11-12', dayPart: 'MORNING', fixedClass: true, startTime: '18:00' }),
        session({ id: 'm', date: '2026-11-12', dayPart: 'MORNING' }),
      ],
    },
    // Friday–Sunday omitted on purpose: the view pads them.
  ],
  target: { planned: 3, done: 2, activeWeek: true },
  activeWeeksOf12: 5,
}

describe('week view — rest days', () => {
  it('a day is a rest day when flagged or when nothing occupies it', () => {
    expect(isRestDay(week.days[1])).toBe(true)
    expect(isRestDay(week.days[2])).toBe(true) // only a DROPPED row
    expect(isRestDay(week.days[0])).toBe(false)
  })

  it('always yields seven days and pads the missing ones as rest days', () => {
    const v = buildWeekView(week, '2026-11-11')
    expect(v.days).toHaveLength(7)
    expect(v.days.map((d) => d.date)).toEqual([
      '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15',
    ])
    expect(v.days[4].restDay).toBe(true)
    expect(v.days[6].weekday).toBe(7)
    expect(v.days[2].isToday).toBe(true)
    expect(v.days[0].isPast).toBe(true)
    expect(v.isCurrentWeek).toBe(true)
    expect(v.previousStart).toBe('2026-11-02')
    expect(v.nextStart).toBe('2026-11-16')
  })
})

describe('week view — chip ordering', () => {
  it('fixed classes first, then day part, ties by id; dropped rows hidden', () => {
    const ordered = orderSessions(week.days[3].sessions).map((s) => s.id)
    expect(ordered).toEqual(['fix', 'm', 'a', 'b'])
    expect(orderSessions(week.days[2].sessions)).toEqual([])
  })

  it('only planned, non-fixed sessions are draggable', () => {
    expect(isDraggable(session({ id: 'x', date: '2026-11-12' }))).toBe(true)
    expect(isDraggable(session({ id: 'x', date: '2026-11-12', fixedClass: true }))).toBe(false)
    expect(isDraggable(session({ id: 'x', date: '2026-11-12', status: 'DONE' }))).toBe(false)
  })

  it('drag and drop ids round-trip', () => {
    expect(parseSessionDragId(sessionDragId('s1'))).toBe('s1')
    expect(parseDayDropId(dayDropId('2026-11-13'))).toBe('2026-11-13')
    expect(parseSessionDragId('move-day:2026-11-13')).toBeNull()
    expect(parseDayDropId('move-session:s1')).toBeNull()
  })
})

describe('week view — target line and reserve rule (PRD §11)', () => {
  it('reserve applies when done is exactly one fewer than planned', () => {
    expect(buildWeekView(week, '2026-11-11').target.reserveApplies).toBe(true)
    const full = { ...week, target: { planned: 3, done: 3, activeWeek: true } }
    expect(buildWeekView(full, '2026-11-11').target.reserveApplies).toBe(false)
    const none = { ...week, target: { planned: 0, done: 0, activeWeek: false } }
    expect(buildWeekView(none, '2026-11-11').target.reserveApplies).toBe(false)
  })
})

describe('week view — refusal handling (PRD §8.1 hard constraints)', () => {
  it('reads the one-line reason from a 409 and ignores other errors', () => {
    expect(refusalReason({ response: { status: 409, data: { reason: 'Két kemény nap egymás után.' } } })).toBe('Két kemény nap egymás után.')
    expect(refusalReason({ response: { status: 409, data: {} } })).toBe('')
    expect(refusalReason({ response: { status: 500, data: { reason: 'x' } } })).toBeNull()
    expect(refusalReason(new Error('network'))).toBeNull()
    expect(refusalReason(null)).toBeNull()
  })
})

describe('week view — "Másikat kérek"', () => {
  it('offers the other modalities of the same role, never entry-only ones', () => {
    const mods = [
      { code: 'WALK', roles: ['AEROBIC'] },
      { code: 'CYCLE', roles: ['AEROBIC'] },
      { code: 'STRENGTH_BAND', roles: ['STRENGTH'] },
      { code: 'SWIM', roles: ['AEROBIC'], entryOnly: true },
    ]
    const alt = sameRoleAlternatives(session({ id: 's', date: '2026-11-09' }), mods).map((m) => m.code)
    expect(alt).toEqual(['CYCLE'])
  })
})
