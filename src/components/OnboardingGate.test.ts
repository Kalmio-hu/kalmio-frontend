/**
 * OnboardingGate — KALMIO-45 + Kalmio Move spaces (D8 rule 6).
 *
 * Tests the gate's decision logic through the pure `decideGate` /
 * `computeNeedsOnboarding` functions in ./onboardingGate.rules.ts — the same
 * code the component runs, so nothing is mirrored here.
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  readOnboardingDone,
  writeOnboardingDone,
  clearOnboardingDone,
} from '@/hooks/useOnboardingProgress'
import {
  computeNeedsOnboarding,
  decideGate,
  GATE_MOVE_OFF,
  type GateMoveStatus,
  type GatePrefs,
} from './onboardingGate.rules'

function makeLocalStorageStub(): Storage {
  const store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() { return Object.keys(store).length },
  } as Storage
}

const TEST_USER_ID = 'user-abc-123'
const NO_PREFS: GatePrefs = { mealPlanPreferences: null, dietaryPreferences: null }
const WITH_PREFS: GatePrefs = { mealPlanPreferences: { days: 5 }, dietaryPreferences: null }

const MOVE_ONLY: GateMoveStatus = { enabled: true, spaceActive: true, nutritionActive: false, lastSpace: null }
const BOTH_LAST_MOVE: GateMoveStatus = { enabled: true, spaceActive: true, nutritionActive: true, lastSpace: 'MOVE' }
const BOTH_LAST_NUTRITION: GateMoveStatus = { enabled: true, spaceActive: true, nutritionActive: true, lastSpace: 'NUTRITION' }
const ENABLED_NOT_STARTED: GateMoveStatus = { enabled: true, spaceActive: false, nutritionActive: true, lastSpace: null }

function gate(pathname: string, prefs: GatePrefs | undefined, move: GateMoveStatus, isInvestorPreview = false) {
  return decideGate({ pathname, userId: TEST_USER_ID, prefs, move, isInvestorPreview })
}

describe('OnboardingGate — computeNeedsOnboarding', () => {
  beforeEach(() => { vi.stubGlobal('localStorage', makeLocalStorageStub()) })
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

  it('new user with null prefs and no done-flag → needs onboarding', () => {
    expect(computeNeedsOnboarding(TEST_USER_ID, NO_PREFS)).toBe(true)
  })

  it('returning user with mealPlanPreferences → no onboarding', () => {
    expect(computeNeedsOnboarding(TEST_USER_ID, WITH_PREFS)).toBe(false)
  })

  it('returning user with dietaryPreferences only → no onboarding', () => {
    expect(computeNeedsOnboarding(TEST_USER_ID, { mealPlanPreferences: null, dietaryPreferences: { vegan: true } })).toBe(false)
  })

  it('done-flag set in localStorage (no server prefs) → no onboarding', () => {
    writeOnboardingDone(TEST_USER_ID)
    expect(computeNeedsOnboarding(TEST_USER_ID, NO_PREFS)).toBe(false)
  })
})

describe('OnboardingGate — decideGate (nutrition only, Move gate off)', () => {
  beforeEach(() => { vi.stubGlobal('localStorage', makeLocalStorageStub()) })
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

  it('new user on /app → /app/onboarding', () => {
    expect(gate('/app', NO_PREFS, GATE_MOVE_OFF)).toEqual({ action: 'redirect', to: '/app/onboarding' })
  })

  it('new user on /app/plans → /app/onboarding', () => {
    expect(gate('/app/plans', NO_PREFS, GATE_MOVE_OFF)).toEqual({ action: 'redirect', to: '/app/onboarding' })
  })

  it('new user on the always-allowed paths passes (KALMIO-414)', () => {
    expect(gate('/app/profile', NO_PREFS, GATE_MOVE_OFF)).toEqual({ action: 'pass' })
    expect(gate('/app/settings', NO_PREFS, GATE_MOVE_OFF)).toEqual({ action: 'pass' })
  })

  it('investor preview is never redirected', () => {
    expect(gate('/app', NO_PREFS, GATE_MOVE_OFF, true)).toEqual({ action: 'pass' })
  })

  it('returning user passes', () => {
    expect(gate('/app', WITH_PREFS, GATE_MOVE_OFF)).toEqual({ action: 'pass' })
  })

  it('with the gate off nothing routes to Move, even with lastSpace MOVE', () => {
    const stale: GateMoveStatus = { enabled: false, spaceActive: true, nutritionActive: true, lastSpace: 'MOVE' }
    expect(gate('/app', WITH_PREFS, stale)).toEqual({ action: 'pass' })
  })
})

describe('OnboardingGate — decideGate (spaces)', () => {
  beforeEach(() => { vi.stubGlobal('localStorage', makeLocalStorageStub()) })
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

  it('paths under /app/move are always allowed, even for a brand-new user', () => {
    expect(gate('/app/move', NO_PREFS, GATE_MOVE_OFF)).toEqual({ action: 'pass' })
    expect(gate('/app/move/start', NO_PREFS, GATE_MOVE_OFF)).toEqual({ action: 'pass' })
    expect(gate('/app/move/session/abc', NO_PREFS, ENABLED_NOT_STARTED)).toEqual({ action: 'pass' })
  })

  it('does not treat /app/movement-like paths as Move', () => {
    expect(gate('/app/movers', NO_PREFS, GATE_MOVE_OFF)).toEqual({ action: 'redirect', to: '/app/onboarding' })
  })

  it('Move-only member (no nutrition prefs) is never sent to nutrition onboarding', () => {
    expect(gate('/app/plans', NO_PREFS, MOVE_ONLY)).toEqual({ action: 'pass' })
    expect(gate('/app/profile', NO_PREFS, MOVE_ONLY)).toEqual({ action: 'pass' })
  })

  it('/app index → /app/move when Move is the only active space', () => {
    expect(gate('/app', NO_PREFS, MOVE_ONLY)).toEqual({ action: 'redirect', to: '/app/move' })
    expect(gate('/app/', NO_PREFS, MOVE_ONLY)).toEqual({ action: 'redirect', to: '/app/move' })
  })

  it('/app index → /app/move when both spaces are active and the last space was MOVE', () => {
    expect(gate('/app', WITH_PREFS, BOTH_LAST_MOVE)).toEqual({ action: 'redirect', to: '/app/move' })
  })

  it('/app index stays on nutrition when both are active and the last space was NUTRITION', () => {
    expect(gate('/app', WITH_PREFS, BOTH_LAST_NUTRITION)).toEqual({ action: 'pass' })
  })

  it('only the index redirects — a deep nutrition path is left alone for a both-spaces member', () => {
    expect(gate('/app/plans', WITH_PREFS, BOTH_LAST_MOVE)).toEqual({ action: 'pass' })
  })

  it('gate enabled but Move not started: a new user still goes to nutrition onboarding', () => {
    expect(gate('/app', NO_PREFS, ENABLED_NOT_STARTED)).toEqual({ action: 'redirect', to: '/app/onboarding' })
  })
})

describe('OnboardingGate — readOnboardingDone localStorage contract', () => {
  beforeEach(() => { vi.stubGlobal('localStorage', makeLocalStorageStub()) })
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

  it('returns false when no flag is set (new user)', () => {
    expect(readOnboardingDone(TEST_USER_ID)).toBe(false)
  })

  it('returns true after writeOnboardingDone', () => {
    writeOnboardingDone(TEST_USER_ID)
    expect(readOnboardingDone(TEST_USER_ID)).toBe(true)
  })

  it('clearOnboardingDone resets the flag', () => {
    writeOnboardingDone(TEST_USER_ID)
    clearOnboardingDone(TEST_USER_ID)
    expect(readOnboardingDone(TEST_USER_ID)).toBe(false)
  })

  it('flags are keyed per user', () => {
    writeOnboardingDone('user-A')
    expect(readOnboardingDone('user-B')).toBe(false)
  })
})
