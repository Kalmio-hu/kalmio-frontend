/**
 * Calendar helpers for Kalmio Move — ISO `YYYY-MM-DD` strings, Monday weeks.
 * No library: the week view only needs day arithmetic and labels.
 */

export function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function addDays(iso: string, days: number): string {
  const d = parseIsoDate(iso)
  d.setDate(d.getDate() + days)
  return toIsoDate(d)
}

export function todayIso(now: Date = new Date()): string {
  return toIsoDate(now)
}

/** Monday of the week that contains `iso` (ISO weeks, as the planner uses). */
export function weekStartOf(iso: string): string {
  const d = parseIsoDate(iso)
  const dow = d.getDay() === 0 ? 7 : d.getDay()
  d.setDate(d.getDate() - (dow - 1))
  return toIsoDate(d)
}

/** ISO weekday 1 = Monday … 7 = Sunday. */
export function isoWeekday(iso: string): number {
  const dow = parseIsoDate(iso).getDay()
  return dow === 0 ? 7 : dow
}

export function weekdayLabel(iso: string, locale: string, style: 'short' | 'long' = 'short'): string {
  return new Intl.DateTimeFormat(locale, { weekday: style }).format(parseIsoDate(iso))
}

export function dayMonthLabel(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(parseIsoDate(iso))
}

/** Weekday name for an ISO weekday number (1–7) in the given locale. */
export function weekdayName(weekday: number, locale: string, style: 'short' | 'long' = 'long'): string {
  // 2024-01-01 is a Monday.
  const base = new Date(2024, 0, 1 + (weekday - 1))
  return new Intl.DateTimeFormat(locale, { weekday: style }).format(base)
}
