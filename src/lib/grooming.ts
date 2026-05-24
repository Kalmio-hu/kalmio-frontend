/**
 * lib/grooming.ts — KALMIO-313
 *
 * Lightweight utilities for the grooming prompt shown in RunPlanDialog.
 * Kept separate so the logic can be unit-tested independently.
 */
import type { FridgeItem } from '@/types'

/** Number of days ahead that counts as "expiring this week". */
const EXPIRY_WINDOW_DAYS = 7

/**
 * Count fridge items whose expiry date falls within the next EXPIRY_WINDOW_DAYS
 * days (inclusive of today) or is already past.
 *
 * Items with no expiry date are ignored — they have no urgency signal.
 */
export function countExpiringThisWeek(items: FridgeItem[]): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const windowEnd = new Date(today)
  windowEnd.setDate(today.getDate() + EXPIRY_WINDOW_DAYS)

  return items.filter(item => {
    if (!item.expiryDate) return false
    // Parse "YYYY-MM-DD" as a LOCAL calendar date.
    // new Date("YYYY-MM-DD") is UTC midnight, which falls before local midnight
    // in UTC+ timezones, causing day-boundary mismatches.  Replacing "-" with "/"
    // makes the Date constructor treat the string as local time on all platforms.
    const exp = new Date(item.expiryDate.replace(/-/g, '/'))
    // Include already-expired + expiring within the window
    return exp <= windowEnd
  }).length
}
