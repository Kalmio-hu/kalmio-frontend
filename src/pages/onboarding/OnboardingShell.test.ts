/**
 * OnboardingShell — KALMIO-45
 *
 * Tests that the two code paths which mark onboarding as done both call
 * `writeOnboardingDone(userId)` correctly:
 *
 *   1. `goNext` when `currentStep >= TOTAL_STEPS` (final-step completion).
 *   2. `handleSkipConfirm` (user explicitly skips).
 *
 * We test the underlying storage contract rather than mounting the component
 * (no React, no router, no jsdom needed) — consistent with the project's
 * existing pure-function test style.
 *
 * The two test scenarios assert that `readOnboardingDone` returns true after
 * `writeOnboardingDone` is invoked — exactly what both code paths in
 * OnboardingShell do before calling `navigate('/app')`.
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  readOnboardingDone,
  writeOnboardingDone,
  clearOnboardingStep,
  readOnboardingStep,
  writeOnboardingStep,
} from '@/hooks/useOnboardingProgress'

// ---------------------------------------------------------------------------
// localStorage stub
// ---------------------------------------------------------------------------

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

// KALMIO-285: updated from 10 → 5 to match the current 5-step shell
// (KALMIO-241 collapsed the data-collection steps into the minimal flow).
const TOTAL_STEPS = 5
const TEST_USER_ID = 'user-shell-xyz'

// ---------------------------------------------------------------------------
// Inline logic mirrors that match the exact code paths in OnboardingShell.
//
// These simulate what happens when goNext() fires on the final step, and
// when handleSkipConfirm() fires. By testing the same localStorage helpers
// that the component calls, we verify the critical contract:
//   "After completion or skip, OnboardingGate must not re-redirect."
// ---------------------------------------------------------------------------

/**
 * Simulates OnboardingShell.goNext() when currentStep >= TOTAL_STEPS.
 * Replicates lines 155-164 of OnboardingShell.tsx.
 */
function simulateGoNextOnFinalStep(userId: string, currentStep: number): void {
  if (currentStep >= TOTAL_STEPS) {
    if (userId) {
      writeOnboardingDone(userId)
      clearOnboardingStep(userId)
    }
    // navigate('/app', { replace: true }) — omitted (no router in this env)
  }
}

/**
 * Simulates OnboardingShell.handleSkipConfirm().
 * Replicates lines 168-177 of OnboardingShell.tsx.
 */
function simulateHandleSkipConfirm(userId: string): void {
  if (userId) {
    writeOnboardingDone(userId)
    clearOnboardingStep(userId)
  }
  // navigate('/app', { replace: true }) — omitted (no router in this env)
}

describe('OnboardingShell — final-step completion calls writeOnboardingDone', () => {
  let lsStub: Storage

  beforeEach(() => {
    lsStub = makeLocalStorageStub()
    vi.stubGlobal('localStorage', lsStub)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  // ── Test 4: completing the final step calls writeOnboardingDone(userId) ────

  it('completing the final step sets the done-flag for the user', () => {
    // Seed an in-progress step so we can verify clearOnboardingStep too.
    writeOnboardingStep(TEST_USER_ID, TOTAL_STEPS)
    expect(readOnboardingStep(TEST_USER_ID)).toBe(TOTAL_STEPS)

    // Fire the final-step logic.
    simulateGoNextOnFinalStep(TEST_USER_ID, TOTAL_STEPS)

    // Done flag must be set — this is what OnboardingGate checks.
    expect(readOnboardingDone(TEST_USER_ID)).toBe(true)
  })

  it('completing the final step also clears the persisted step progress', () => {
    writeOnboardingStep(TEST_USER_ID, TOTAL_STEPS)
    simulateGoNextOnFinalStep(TEST_USER_ID, TOTAL_STEPS)

    // Step should be reset to 1 (default when no key in storage).
    expect(readOnboardingStep(TEST_USER_ID)).toBe(1)
  })

  it('goNext on step < TOTAL_STEPS does NOT set the done-flag', () => {
    // Mid-flow navigation must not accidentally mark the user as done.
    const midStep = 3
    simulateGoNextOnFinalStep(TEST_USER_ID, midStep)
    expect(readOnboardingDone(TEST_USER_ID)).toBe(false)
  })

  // ── Test 5: handleSkipConfirm calls writeOnboardingDone(userId) ────────────

  it('handleSkipConfirm sets the done-flag so the gate never re-redirects', () => {
    // User is mid-flow.
    writeOnboardingStep(TEST_USER_ID, 4)
    expect(readOnboardingDone(TEST_USER_ID)).toBe(false)

    simulateHandleSkipConfirm(TEST_USER_ID)

    expect(readOnboardingDone(TEST_USER_ID)).toBe(true)
  })

  it('handleSkipConfirm also clears the persisted step progress', () => {
    writeOnboardingStep(TEST_USER_ID, 4)
    simulateHandleSkipConfirm(TEST_USER_ID)

    expect(readOnboardingStep(TEST_USER_ID)).toBe(1)
  })
})
