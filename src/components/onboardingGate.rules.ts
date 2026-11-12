/**
 * OnboardingGate decision rules — pure functions, no React, no router.
 *
 * Space-aware since Kalmio Move (movement-prd.md D8 rule 6, build contract §13):
 *   1. Paths under /app/move are always allowed — the Move shell and the start
 *      flow own their own gating.
 *   2. On app entry only (the first route of the tab), the /app index
 *      redirects to /app/move when Move is active and either it is the space
 *      used last or it is the only active space. An in-app click on
 *      "Irányítópult" always lands on the nutrition dashboard (founder,
 *      2026-11-12: the redirect on every click locked the dashboard away).
 *   3. A member with Move active and no nutrition preferences is never sent to
 *      nutrition onboarding.
 *   4. Otherwise today's rule: no meal/dietary preferences and no local
 *      done-flag → /app/onboarding, except on the always-allowed paths.
 */
import { readOnboardingDone } from '@/hooks/useOnboardingProgress'

export interface GatePrefs {
  mealPlanPreferences: unknown | null
  dietaryPreferences: unknown | null
}

/** Structural twin of MoveStatusDto — the gate must not import the feature's types. */
export interface GateMoveStatus {
  enabled: boolean
  spaceActive: boolean
  nutritionActive: boolean
  lastSpace: 'NUTRITION' | 'MOVE' | null
}

export const GATE_MOVE_OFF: GateMoveStatus = {
  enabled: false,
  spaceActive: false,
  nutritionActive: false,
  lastSpace: null,
}

export interface GateInput {
  pathname: string
  userId: string
  prefs: GatePrefs | undefined
  move: GateMoveStatus
  /** True on the tab's first route (a fresh load or sign-in landing), false after any in-app navigation. */
  isEntry: boolean
  isInvestorPreview: boolean
}

export type GateDecision =
  | { action: 'pass' }
  | { action: 'redirect'; to: '/app/onboarding' | '/app/move' }

// KALMIO-414: paths the gate lets through even mid-onboarding.
export const ALWAYS_ALLOWED = ['/app/profile', '/app/settings']
export const MOVE_PREFIX = '/app/move'

export function computeNeedsOnboarding(userId: string, prefs: GatePrefs | undefined): boolean {
  const doneLocally = userId ? readOnboardingDone(userId) : false
  const hasPreferences = !!(prefs?.mealPlanPreferences || prefs?.dietaryPreferences)
  return !doneLocally && !hasPreferences
}

export function isMovePath(pathname: string): boolean {
  return pathname === MOVE_PREFIX || pathname.startsWith(`${MOVE_PREFIX}/`)
}

export function isAppIndex(pathname: string): boolean {
  return pathname === '/app' || pathname === '/app/'
}

export function decideGate(input: GateInput): GateDecision {
  const { pathname, userId, prefs, move, isInvestorPreview, isEntry } = input

  if (isMovePath(pathname)) return { action: 'pass' }

  const moveActive = move.enabled && move.spaceActive

  if (isEntry && isAppIndex(pathname) && moveActive && (move.lastSpace === 'MOVE' || !move.nutritionActive)) {
    return { action: 'redirect', to: '/app/move' }
  }

  const needsOnboarding = computeNeedsOnboarding(userId, prefs)
  if (needsOnboarding && moveActive) return { action: 'pass' }

  const isAllowed = ALWAYS_ALLOWED.some((p) => pathname.startsWith(p))
  if (needsOnboarding && !isAllowed && !isInvestorPreview) {
    return { action: 'redirect', to: '/app/onboarding' }
  }

  return { action: 'pass' }
}
