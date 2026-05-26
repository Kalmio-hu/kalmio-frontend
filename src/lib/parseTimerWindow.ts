/**
 * parseTimerWindow — parses a recipe step body for time range / duration cues.
 *
 * Recognised patterns (case-insensitive, HU + EN):
 *   "8-12 perc"       → { minSeconds: 480, maxSeconds: 720 }
 *   "8-12 minutes"    → { minSeconds: 480, maxSeconds: 720 }
 *   "10 perc"         → { minSeconds: 540, maxSeconds: 660 }  (±10%)
 *   "10 minutes"      → { minSeconds: 540, maxSeconds: 660 }  (±10%)
 *
 * Single values produce a ±10% window so the timer still shows a ready zone
 * and an overdue zone without needing an explicit range.
 *
 * Returns null if no parseable time reference is found.
 * Returns null if the parsed minutes exceed 60 (clock face upper bound).
 */

export interface TimerWindow {
  minSeconds: number
  maxSeconds: number
}

// N-M perc / N-M minutes (range)
const RANGE_RE = /(\d+)\s*[-–]\s*(\d+)\s*(perc|minutes?|min)/i

// N perc / N minutes (single)
const SINGLE_RE = /(\d+)\s*(perc|minutes?|min)/i

export function parseTimerWindow(stepBody: string): TimerWindow | null {
  const rangeMatch = RANGE_RE.exec(stepBody)
  if (rangeMatch) {
    const lo = parseInt(rangeMatch[1], 10)
    const hi = parseInt(rangeMatch[2], 10)
    // Ensure lo ≤ hi and within clock bounds
    const minMin = Math.min(lo, hi)
    const maxMin = Math.max(lo, hi)
    if (maxMin > 60 || minMin <= 0) return null
    return { minSeconds: minMin * 60, maxSeconds: maxMin * 60 }
  }

  const singleMatch = SINGLE_RE.exec(stepBody)
  if (singleMatch) {
    const n = parseInt(singleMatch[1], 10)
    if (n <= 0 || n > 60) return null
    // ±10% window, minimum 30s each side
    const delta = Math.max(30, Math.round(n * 60 * 0.1))
    return {
      minSeconds: n * 60 - delta,
      maxSeconds: n * 60 + delta,
    }
  }

  return null
}
