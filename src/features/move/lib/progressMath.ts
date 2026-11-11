/**
 * Progress helpers (PRD §11) — pure. The unit is the week; there are no
 * streaks, points or badges here, only "aktív hetek az elmúlt 12-ből".
 */
import type { ProgressWeekDto, SelfTestDto } from '../types'
import { addDays, weekStartOf } from './dates'

export type WeekMark = 'ACTIVE' | 'RESERVE' | 'INACTIVE' | 'FUTURE'

export interface WeekStripCell {
  weekStart: string
  mark: WeekMark
  done: number
  planned: number
}

/** A week counts when done ≥ planned, or one fewer than planned (reserve). */
export function isActiveWeek(w: Pick<ProgressWeekDto, 'planned' | 'done' | 'active'>): boolean {
  if (typeof w.active === 'boolean') return w.active
  return w.planned > 0 && w.done >= w.planned - 1
}

export function markOf(w: Pick<ProgressWeekDto, 'planned' | 'done' | 'active' | 'reserve'>): WeekMark {
  if (!isActiveWeek(w)) return 'INACTIVE'
  if (w.reserve === true) return 'RESERVE'
  if (w.reserve === false) return 'ACTIVE'
  return w.planned > 0 && w.done === w.planned - 1 ? 'RESERVE' : 'ACTIVE'
}

/** Active weeks among the last 12 — the backend figure wins when present. */
export function activeWeeksOf12(weeks: ProgressWeekDto[], backendValue?: number | null): number {
  if (typeof backendValue === 'number' && backendValue >= 0) return Math.min(12, backendValue)
  return lastTwelve(weeks).filter(isActiveWeek).length
}

export function lastTwelve(weeks: ProgressWeekDto[]): ProgressWeekDto[] {
  return weeks
    .slice()
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    .slice(-12)
}

/** Twelve cells ending with the current week; weeks the backend did not send read as inactive. */
export function twelveWeekStrip(weeks: ProgressWeekDto[], todayIso: string): WeekStripCell[] {
  const current = weekStartOf(todayIso)
  const byStart = new Map(weeks.map((w) => [w.weekStart, w]))
  const cells: WeekStripCell[] = []
  for (let i = 11; i >= 0; i--) {
    const weekStart = addDays(current, -7 * i)
    const w = byStart.get(weekStart)
    if (!w) {
      cells.push({ weekStart, mark: 'INACTIVE', done: 0, planned: 0 })
      continue
    }
    cells.push({ weekStart, mark: markOf(w), done: w.done, planned: w.planned })
  }
  return cells
}

/** "Négy hete 8-szor állt fel, ma 11-szer." needs two results of the same kind. */
export function selfTestComparison(tests: SelfTestDto[], kind: SelfTestDto['kind'] = 'SIT_TO_STAND_30S'): {
  previous: SelfTestDto
  latest: SelfTestDto
  weeksBetween: number
} | null {
  const same = tests.filter((t) => t.kind === kind).slice().sort((a, b) => a.date.localeCompare(b.date))
  if (same.length < 2) return null
  const latest = same[same.length - 1]
  const previous = same[same.length - 2]
  const ms = Date.parse(latest.date) - Date.parse(previous.date)
  return { previous, latest, weeksBetween: Math.max(0, Math.round(ms / (7 * 86_400_000))) }
}

/** A self-test is due four weeks after the last one, or at once when none exists. */
export function selfTestDue(tests: SelfTestDto[], todayIso: string, kind: SelfTestDto['kind'] = 'SIT_TO_STAND_30S'): boolean {
  const same = tests.filter((t) => t.kind === kind)
  if (same.length === 0) return true
  const last = same.map((t) => t.date).sort().at(-1)!
  return addDays(last, 28) <= todayIso
}

/**
 * "8-szor", "11-szer", "5-ször" — the Hungarian multiplicative suffix follows
 * the last spoken digit (vowel harmony); tens ending in zero follow their own
 * word (tíz → -szer, húsz → -szor, …). English: "8 times".
 */
export function timesWord(n: number, locale: string): string {
  if (!locale.toLowerCase().startsWith('hu')) return `${n} ${n === 1 ? 'time' : 'times'}`
  const abs = Math.abs(Math.round(n))
  const last = abs % 10
  let suffix: string
  if (last === 0) {
    const tens = (abs % 100) / 10
    if (abs === 0) suffix = 'szor'
    else if (abs % 100 === 0) suffix = 'szor' // száz, kétszáz…
    else if (tens === 1 || tens === 4 || tens === 5 || tens === 7 || tens === 9) suffix = 'szer' // tíz, negyven, ötven, hetven, kilencven
    else suffix = 'szor' // húsz, harminc, hatvan, nyolcvan
  } else if (last === 1 || last === 4 || last === 7 || last === 9) suffix = 'szer' // egy, négy, hét, kilenc
  else if (last === 2 || last === 5) suffix = 'ször' // kettő, öt
  else suffix = 'szor' // három, hat, nyolc
  return `${abs}-${suffix}`
}

/** Scale points into an SVG viewBox; returns null when there are fewer than two points. */
export function polylinePoints(values: number[], width: number, height: number, pad = 4): string | null {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const stepX = (width - 2 * pad) / (values.length - 1)
  return values
    .map((v, i) => {
      const x = pad + i * stepX
      const y = height - pad - ((v - min) / span) * (height - 2 * pad)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}
