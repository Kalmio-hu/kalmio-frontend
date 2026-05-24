/**
 * Haptic feedback wrapper for mobile devices.
 * Uses the Vibration API where available — silently no-ops elsewhere.
 * KALMIO-327.
 */

/**
 * Fire a short haptic burst to signal drag initiation.
 * Pattern: 40ms on — chosen to feel like a soft click without being intrusive.
 */
export function triggerHaptic(pattern: number | number[] = 40): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern)
    }
  } catch {
    // Some browsers throw on vibrate in restricted contexts — silently ignore.
  }
}
