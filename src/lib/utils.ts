import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Recipe } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns today's date as a "YYYY-MM-DD" string in the **local** timezone.
 *
 * `new Date().toISOString()` is UTC-based: after 22:00 HU time (UTC+2) it
 * would return tomorrow's date.  `en-CA` locale reliably yields yyyy-mm-dd.
 *
 * Use this everywhere "today" is needed as a calendar key or date-input min.
 */
export function todayIsoLocal(): string {
  return new Date().toLocaleDateString('en-CA')
}

/**
 * Returns `date + n days` as a "YYYY-MM-DD" string in local timezone.
 * Handles DST correctly because arithmetic is on local midnight.
 */
export function addDaysIsoLocal(date: Date, n: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('en-CA')
}

/**
 * Converts a Date to a "YYYY-MM-DD" string in the **local** timezone.
 * Drop-in replacement for the `toISOString().split('T')[0]` pattern.
 */
export function dateToIsoLocal(d: Date): string {
  return d.toLocaleDateString('en-CA')
}

export function formatCurrency(value: number | null | undefined, currency = 'HUF', lang?: string): string {
  if (value == null) return '—'
  // Respect the active UI language so English-locale users get their own
  // number-formatting convention instead of always seeing Hungarian style.
  const locale = lang === 'en' ? 'en-GB' : 'hu-HU'
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

export function formatMacro(value: number | null | undefined, unit = 'g'): string {
  if (value == null) return '—'
  return `${Number(value).toFixed(1)}${unit}`
}

/**
 * Formats a Date (or ISO string) using the active i18n language.
 * Resolves to `hu-HU` for Hungarian, `en-GB` for everything else so dates
 * never default to the OS locale (which is commonly `en-US`).
 *
 * @param date   A Date object or an ISO-8601 string.
 * @param lang   The value of `i18n.language` (e.g. `'hu'` or `'en'`).
 * @param opts   Optional Intl.DateTimeFormatOptions — defaults to numeric year, month, day.
 */
export function formatLocalDate(
  date: Date | string,
  lang: string,
  opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' },
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString(lang === 'hu' ? 'hu-HU' : 'en-GB', opts)
}

/** Resolves the display photo URL for a recipe.
 *  Prefers the uploaded imageUrl; falls back to the legacy seed asset for the 5 shipped recipes. */
export function recipePhotoUrl(recipe: Pick<Recipe, 'id' | 'imageUrl'>): string {
  return recipe.imageUrl ?? `/assets/recipe-photos/${recipe.id}.png`
}
