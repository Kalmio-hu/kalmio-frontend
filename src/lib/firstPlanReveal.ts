/**
 * Utilities for the first-plan reveal guard (KALMIO-157), the graduation
 * reveal guard (KALMIO-143), the Csemete welcome moment (KALMIO-172), the
 * founder farewell modal (KALMIO-456), and the premium-taster banner
 * (KALMIO-173). Kept in lib/ so reveal components only export React code.
 *
 * All guards are user-scoped (KALMIO-466 — follow-up to KALMIO-459). Each
 * function takes the current user's id and stores per-user state in
 * localStorage. Calling with `null` (no signed-in user) uses an `anon`
 * sentinel so the call is safe but inert.
 *
 * Migration: the keys used to be global (`kalmio:firstPlanRevealShown` etc.).
 * For users who had already dismissed a reveal under the old global key, we
 * fall back to reading the global key when the user-scoped key is absent.
 * The global keys are wiped by useAuthStore.signOut (KALMIO-459) so they
 * naturally disappear once any user signs out on the device.
 */

// ─── Internal helpers ────────────────────────────────────────────────────────

function userScopedKey(base: string, userId: string | null): string {
  return `${base}:${userId ?? 'anon'}`
}

/**
 * Read a guard with migration fallback: prefer the user-scoped key, fall
 * back to the legacy global key for already-dismissed users.
 */
function readGuard(base: string, userId: string | null): boolean {
  try {
    if (localStorage.getItem(userScopedKey(base, userId)) === 'true') return true
    // Legacy global key (pre-KALMIO-466) — honour it so existing users don't
    // re-see overlays they already dismissed.
    return localStorage.getItem(base) === 'true'
  } catch {
    return false
  }
}

function writeGuard(base: string, userId: string | null): void {
  try {
    localStorage.setItem(userScopedKey(base, userId), 'true')
  } catch {
    // localStorage unavailable (private browsing, storage quota) — fail silently.
  }
}

// ─── First-plan reveal (KALMIO-157) ──────────────────────────────────────────

const FIRST_PLAN_REVEAL_KEY = 'kalmio:firstPlanRevealShown'

/** Returns true if the first-plan reveal has already been shown to this user. */
export function hasRevealBeenShown(userId: string | null): boolean {
  return readGuard(FIRST_PLAN_REVEAL_KEY, userId)
}

/** Marks the reveal as shown so it is never displayed again for this user. */
export function markRevealShown(userId: string | null): void {
  writeGuard(FIRST_PLAN_REVEAL_KEY, userId)
}

// ─── Graduation reveal (KALMIO-143) ──────────────────────────────────────────

const GRADUATION_KEY = 'kalmio:graduationRevealShown'

export function hasGraduationRevealBeenShown(userId: string | null): boolean {
  return readGuard(GRADUATION_KEY, userId)
}

export function markGraduationRevealShown(userId: string | null): void {
  writeGuard(GRADUATION_KEY, userId)
}

// ─── Csemete welcome moment (KALMIO-172) ─────────────────────────────────────

const CSEMETE_WELCOME_KEY = 'kalmio:csemeteWelcomeShown'

export function hasCsemeteWelcomeBeenShown(userId: string | null): boolean {
  return readGuard(CSEMETE_WELCOME_KEY, userId)
}

export function markCsemeteWelcomeShown(userId: string | null): void {
  writeGuard(CSEMETE_WELCOME_KEY, userId)
}

// ─── Founder farewell modal (KALMIO-456) ─────────────────────────────────────

const FOUNDER_FAREWELL_KEY = 'kalmio:founderFarewellShown'

export function hasFounderFarewellBeenShown(userId: string | null): boolean {
  return readGuard(FOUNDER_FAREWELL_KEY, userId)
}

export function markFounderFarewellShown(userId: string | null): void {
  writeGuard(FOUNDER_FAREWELL_KEY, userId)
}

// ─── Premium taster reveal (KALMIO-173) ──────────────────────────────────────

/**
 * Base key per stage. The full user-scoped key built by readGuard/writeGuard
 * appends `:<userId>`, giving `kalmio:premiumTasterShown:SUHANG:<userId>`.
 */
function premiumTasterBase(stage: string): string {
  return `kalmio:premiumTasterShown:${stage.toUpperCase()}`
}

export function hasPremiumTasterBeenShown(stage: string, userId: string | null): boolean {
  return readGuard(premiumTasterBase(stage), userId)
}

export function markPremiumTasterShown(stage: string, userId: string | null): void {
  writeGuard(premiumTasterBase(stage), userId)
}
