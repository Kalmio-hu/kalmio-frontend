/**
 * Utilities for the first-plan reveal guard (KALMIO-157) and the graduation
 * reveal guard (KALMIO-143). Kept in lib/ so reveal components only export
 * React code.
 */

// ─── First-plan reveal (KALMIO-157) ──────────────────────────────────────────

const LOCAL_STORAGE_KEY = 'kalmio:firstPlanRevealShown'

/** Returns true if the first-plan reveal has already been shown to this user. */
export function hasRevealBeenShown(): boolean {
  try {
    return localStorage.getItem(LOCAL_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

/** Marks the reveal as shown so it is never displayed again. */
export function markRevealShown(): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true')
  } catch {
    // localStorage unavailable (private browsing, storage quota) — fail silently.
  }
}

// ─── Graduation reveal (KALMIO-143) ──────────────────────────────────────────

const GRADUATION_LOCAL_STORAGE_KEY = 'kalmio:graduationRevealShown'

/** Returns true if the graduation reveal has already been shown to this user. */
export function hasGraduationRevealBeenShown(): boolean {
  try {
    return localStorage.getItem(GRADUATION_LOCAL_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

/** Marks the graduation reveal as shown so it is never displayed again. */
export function markGraduationRevealShown(): void {
  try {
    localStorage.setItem(GRADUATION_LOCAL_STORAGE_KEY, 'true')
  } catch {
    // localStorage unavailable (private browsing, storage quota) — fail silently.
  }
}

// ─── Csemete welcome moment (KALMIO-172) ─────────────────────────────────────

const CSEMETE_WELCOME_LOCAL_STORAGE_KEY = 'kalmio:csemeteWelcomeShown'

/** Returns true if the Csemete welcome overlay has already been shown to this user. */
export function hasCsemeteWelcomeBeenShown(): boolean {
  try {
    return localStorage.getItem(CSEMETE_WELCOME_LOCAL_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

/** Marks the Csemete welcome overlay as shown so it is never displayed again. */
export function markCsemeteWelcomeShown(): void {
  try {
    localStorage.setItem(CSEMETE_WELCOME_LOCAL_STORAGE_KEY, 'true')
  } catch {
    // localStorage unavailable (private browsing, storage quota) — fail silently.
  }
}

// ─── Founder farewell modal (KALMIO-456) ─────────────────────────────────────

const FOUNDER_FAREWELL_LOCAL_STORAGE_KEY = 'kalmio:founderFarewellShown'

/** Returns true if the founder farewell modal has already been shown to this user. */
export function hasFounderFarewellBeenShown(): boolean {
  try {
    return localStorage.getItem(FOUNDER_FAREWELL_LOCAL_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

/** Marks the founder farewell modal as shown so it is never displayed again. */
export function markFounderFarewellShown(): void {
  try {
    localStorage.setItem(FOUNDER_FAREWELL_LOCAL_STORAGE_KEY, 'true')
  } catch {
    // localStorage unavailable (private browsing, storage quota) — fail silently.
  }
}

// ─── Premium taster reveal (KALMIO-173) ──────────────────────────────────────

/**
 * Returns the localStorage key used to record that the taster reveal banner
 * has been shown for a given stage (SUHANG | FIATAL | TERMO).
 */
function premiumTasterKey(stage: string): string {
  return `kalmio:premiumTasterShown:${stage.toUpperCase()}`
}

/**
 * Returns true if the premium taster reveal banner has already been shown to
 * this user for the given stage transition.
 */
export function hasPremiumTasterBeenShown(stage: string): boolean {
  try {
    return localStorage.getItem(premiumTasterKey(stage)) === 'true'
  } catch {
    return false
  }
}

/**
 * Marks the premium taster reveal banner as shown for the given stage so it
 * is never displayed again for that stage.
 */
export function markPremiumTasterShown(stage: string): void {
  try {
    localStorage.setItem(premiumTasterKey(stage), 'true')
  } catch {
    // localStorage unavailable (private browsing, storage quota) — fail silently.
  }
}
