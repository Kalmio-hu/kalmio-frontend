/**
 * Haptic feedback — Capacitor native engine on iOS/Android, Web Vibration API
 * fallback on browser (Android Chrome only; iOS Safari has no vibration).
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { Capacitor } from '@capacitor/core'

const native = Capacitor.isNativePlatform()

function vibrate(ms: number | number[]) {
  try { navigator.vibrate?.(ms) } catch { /* ignored */ }
}

async function nativeImpact(style: ImpactStyle, fallbackMs: number) {
  if (native) {
    try { await Haptics.impact({ style }) } catch { /* ignored */ }
  } else {
    vibrate(fallbackMs)
  }
}

async function nativeNotify(type: NotificationType, fallback: number | number[]) {
  if (native) {
    try { await Haptics.notification({ type }) } catch { /* ignored */ }
  } else {
    vibrate(fallback)
  }
}

/** Subtle tap — button press, item toggle, chip select */
export function hapticLight() { void nativeImpact(ImpactStyle.Light, 10) }

/** Standard interaction — drag start, modal open, confirm */
export function hapticMedium() { void nativeImpact(ImpactStyle.Medium, 25) }

/** Strong action — long-press activation, destructive confirm */
export function hapticHeavy() { void nativeImpact(ImpactStyle.Heavy, 50) }

/** Discrete tick — slider step, knob increment, picker row */
export function hapticSelection() {
  if (native) {
    void (async () => { try { await Haptics.selectionChanged() } catch { /* ignored */ } })()
  } else {
    vibrate(6)
  }
}

/** Positive outcome — swipe LOVE, plan generated, save success */
export function hapticSuccess() { void nativeNotify(NotificationType.Success, [15, 60, 20]) }

/** Attention — near limit, over invalid drop target */
export function hapticWarning() { void nativeNotify(NotificationType.Warning, [40, 30, 40]) }

/** Negative outcome — swipe HATE, validation error, rejected drop */
export function hapticError() { void nativeNotify(NotificationType.Error, [60, 20, 60]) }

/** Legacy compat — used by PrepGooDragContext (drag start) */
export function triggerHaptic(_pattern?: number | number[]) { hapticMedium() }
