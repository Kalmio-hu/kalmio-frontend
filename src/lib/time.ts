/**
 * Time helpers for slot-past detection.
 *
 * Convention (KALMIO-310): a meal slot is considered "past" when the current
 * wall-clock time is at least AUTO_TICK_OFFSET_MINUTES beyond the slot's
 * scheduled start time.  This matches the "+1h after slot start" rule from
 * the ticket and keeps the logic independent of slot-window duration, which
 * varies per meal type.
 */

/** Minutes after slot start before a meal is auto-ticked as presumed-eaten. */
export const AUTO_TICK_OFFSET_MINUTES = 60

/**
 * Returns true when `now` is at or after `slotStartMinutes + AUTO_TICK_OFFSET_MINUTES`.
 *
 * @param slotStartMinutes  0-based minute-of-day for the meal's scheduled start (0–1439).
 * @param nowMinutes        Current minute-of-day (defaults to wall clock when omitted).
 */
export function isMealSlotPast(
  slotStartMinutes: number,
  nowMinutes?: number,
): boolean {
  const now =
    nowMinutes ??
    (() => {
      const d = new Date()
      return d.getHours() * 60 + d.getMinutes()
    })()
  return now >= slotStartMinutes + AUTO_TICK_OFFSET_MINUTES
}
