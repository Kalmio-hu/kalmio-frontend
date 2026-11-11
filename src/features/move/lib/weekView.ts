/**
 * Week view model (PRD §7.2, §8.1) — pure functions over `WeekDto`.
 *
 * The planner lives in the backend; this module only arranges what it returns:
 * which days read "Pihenőnap", how chips are ordered inside a day, the target
 * line with the reserve rule, week navigation and the 409 refusal reason.
 */
import type { Intensity, SessionDto, SessionStatus, WeekDayDto, WeekDto } from '../types'
import { addDays, isoWeekday, weekStartOf } from './dates'

export const DRAG_PREFIX = 'move-session:'
export const DROP_PREFIX = 'move-day:'

export function sessionDragId(sessionId: string): string {
  return `${DRAG_PREFIX}${sessionId}`
}
export function dayDropId(date: string): string {
  return `${DROP_PREFIX}${date}`
}
export function parseSessionDragId(id: string): string | null {
  return id.startsWith(DRAG_PREFIX) ? id.slice(DRAG_PREFIX.length) : null
}
export function parseDayDropId(id: string): string | null {
  return id.startsWith(DROP_PREFIX) ? id.slice(DROP_PREFIX.length) : null
}

/** Statuses that still occupy the day (a DROPPED or MOVED-away row does not). */
const OCCUPYING: readonly SessionStatus[] = ['PLANNED', 'DONE', 'PLAN_B', 'MISSED', 'ADDED']

export function occupiesDay(s: SessionDto): boolean {
  return OCCUPYING.includes(s.status)
}

/** A day is a rest day when the DTO says so or when nothing occupies it. */
export function isRestDay(day: WeekDayDto): boolean {
  if (day.restDay) return true
  return !day.sessions.some(occupiesDay)
}

const DAY_PART_ORDER: Record<SessionDto['dayPart'], number> = { MORNING: 0, MIDDAY: 1, ANY: 2, EVENING: 3 }

/** Fixed classes first (they do not move), then by day part / start time, ties by id. */
export function orderSessions(sessions: SessionDto[]): SessionDto[] {
  return sessions
    .filter(occupiesDay)
    .slice()
    .sort((a, b) => {
      const fa = a.fixedClass ? 0 : 1
      const fb = b.fixedClass ? 0 : 1
      if (fa !== fb) return fa - fb
      if (a.startTime && b.startTime && a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime)
      const pa = DAY_PART_ORDER[a.dayPart] ?? 2
      const pb = DAY_PART_ORDER[b.dayPart] ?? 2
      if (pa !== pb) return pa - pb
      return a.id.localeCompare(b.id)
    })
}

export function isHard(s: Pick<SessionDto, 'intensity'>): boolean {
  return s.intensity === 'HARD'
}

/** Text marker beside the colour — never colour alone (PRD §17). */
export function intensityKey(i: Intensity): 'easy' | 'moderate' | 'hard' {
  return i === 'HARD' ? 'hard' : i === 'EASY' ? 'easy' : 'moderate'
}

export interface WeekDayView {
  date: string
  weekday: number
  restDay: boolean
  sessions: SessionDto[]
  isToday: boolean
  isPast: boolean
}

export interface WeekView {
  weekStart: string
  days: WeekDayView[]
  target: { done: number; planned: number; activeWeek: boolean; reserveApplies: boolean }
  activeWeeksOf12: number
  previousStart: string
  nextStart: string
  isCurrentWeek: boolean
}

/** Seven days, always — pads missing days from `weekStart` so the grid never has holes. */
export function buildWeekView(week: WeekDto, todayIso: string): WeekView {
  const byDate = new Map(week.days.map((d) => [d.date, d]))
  const days: WeekDayView[] = []
  for (let i = 0; i < 7; i++) {
    const date = addDays(week.weekStart, i)
    const dto = byDate.get(date) ?? { date, restDay: true, sessions: [] }
    days.push({
      date,
      weekday: isoWeekday(date),
      restDay: isRestDay(dto),
      sessions: orderSessions(dto.sessions),
      isToday: date === todayIso,
      isPast: date < todayIso,
    })
  }
  const planned = week.target.planned
  const done = week.target.done
  return {
    weekStart: week.weekStart,
    days,
    target: {
      done,
      planned,
      activeWeek: week.target.activeWeek,
      // Reserve rule (PRD §11): one fewer than planned still counts as active.
      reserveApplies: planned > 0 && done === planned - 1,
    },
    activeWeeksOf12: week.activeWeeksOf12,
    previousStart: addDays(week.weekStart, -7),
    nextStart: addDays(week.weekStart, 7),
    isCurrentWeek: weekStartOf(todayIso) === week.weekStart,
  }
}

/** The one-line reason the backend returns on 409, or null when the error is something else. */
export function refusalReason(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null
  const resp = (error as { response?: { status?: number; data?: unknown } }).response
  if (!resp || resp.status !== 409) return null
  const data = resp.data
  if (data && typeof data === 'object' && typeof (data as { reason?: unknown }).reason === 'string') {
    return (data as { reason: string }).reason
  }
  return ''
}

/** Modalities that fill the same role as the session, without the session's own. */
export function sameRoleAlternatives<T extends { code: string; roles: readonly string[]; entryOnly?: boolean }>(
  session: Pick<SessionDto, 'modalityCode' | 'roles'>,
  modalities: T[],
): T[] {
  return modalities.filter(
    (m) => m.code !== session.modalityCode && !m.entryOnly && m.roles.some((r) => session.roles.includes(r as SessionDto['roles'][number])),
  )
}

/** Can the chip be dragged? Fixed classes stay where they are; done/missed rows do not move. */
export function isDraggable(s: SessionDto): boolean {
  return !s.fixedClass && s.status === 'PLANNED'
}
