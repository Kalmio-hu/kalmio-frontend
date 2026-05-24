/**
 * OnboardingShell — KALMIO-167 / KALMIO-241
 *
 * Multi-step onboarding container.  Owns:
 *   1. A 5-step progress indicator (OnboardingProgressBar, top of screen).
 *   2. A "Kihagyom most" link visible from step 2 onward (SkipConfirmModal).
 *   3. Resume: reads the last persisted step from localStorage on mount
 *      and lands the returning user there automatically.
 *   4. Step content: renders a step-specific content panel.
 *
 * KALMIO-241: Steps 2–6 (household size, activity+calories, dietary,
 * shopping cadence, forbidden ingredients) were removed because they
 * duplicate the Profile and Preferences pages. The flow is now 5 steps:
 *   1. Welcome
 *   2. App orientation (taste-swipe mini-tutorial)
 *   3. Plan generation loading
 *   4. First plan reveal
 *   5. Csemete moment
 *
 * Post-completion redirect:
 *   - Body data incomplete (weightKg or heightCm null) → /app/profile?section=body-data
 *   - Otherwise → /app/dashboard
 *
 * Route: /app/onboarding  (ProtectedRoute, no AppShell chrome — full-screen)
 *
 * Step → PlantingScene mapping (shell is 1-indexed; PlantingScene is 0-indexed):
 *   Shell step 1  → PlantingScene 0  — Welcome (hand above soil)
 *   Shell step 2  → PlantingScene 6  — Orientation (scene fast-forwards: hole, walnut, cover, mound, stake, swipe details all visible)
 *   Shell step 3  → PlantingScene 7  — Plan generation (watering can)
 *   Shell step 4  → PlantingScene 8  — First plan reveal (moist soil)
 *   Shell step 5  → PlantingScene 10 — Csemete (sprout)
 */

import { useCallback, useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { OnboardingProgressBar } from '@/components/onboarding/OnboardingProgressBar'
import { SkipConfirmModal } from '@/components/onboarding/SkipConfirmModal'
import { PlantingScene, type PlantingStep } from '@/components/onboarding/PlantingScene'
import { MiniTutorialPlanner } from '@/components/onboarding/MiniTutorialPlanner'
import { FirstPlanReveal } from '@/components/onboarding/FirstPlanReveal'
import { CsemeteWelcomeMoment } from '@/components/onboarding/CsemeteWelcomeMoment'
import { TdeeSuggestionBanner } from '@/components/shared/TdeeSuggestionBanner'
import { usersService, USERS_ME_QUERY_KEY } from '@/services/users'
import { toast } from '@/components/ui/toast'
import {
  readOnboardingStep,
  writeOnboardingStep,
  clearOnboardingStep,
  writeOnboardingDone,
} from '@/hooks/useOnboardingProgress'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * KALMIO-94: TDEE step added as step 2.
 * The previous steps 2–5 are now steps 3–6.
 *
 * Step 1 — Welcome
 * Step 2 — TDEE suggestion (new — reads suggestedKcalTarget from user settings)
 * Step 3 — App orientation (MiniTutorialPlanner)
 * Step 4 — Plan generation loading
 * Step 5 — First plan reveal
 * Step 6 — Csemete moment
 */
const TOTAL_STEPS = 6

/**
 * Maps the 1-indexed shell step to the PlantingScene 0-indexed step.
 * Steps 2–6 from the old shell (data-collection) are collapsed into a
 * fast-forward to PlantingScene step 6 so the scene still tells its story.
 * TDEE step (2) stays at planting step 0 (same as welcome — no scene change).
 */
const SHELL_TO_PLANTING: Record<number, PlantingStep> = {
  1: 0,
  2: 0,
  3: 6,
  4: 7,
  5: 8,
  6: 10,
}

// ---------------------------------------------------------------------------
// Plan generation loading step (step 3)
// ---------------------------------------------------------------------------

function PlanGenerationStep() {
  const { t } = useTranslation()
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 px-6 py-8 text-center"
      data-testid="step-plan-generation"
    >
      <p className="text-base font-semibold text-[#1A1A1A]">
        {t('onboarding.shell.stepLabels.4')}
      </p>
      <p className="text-sm text-[#6B6460] max-w-xs leading-relaxed">
        {t('onboarding.shell.planGeneratingBody')}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Welcome step (step 1) — always shown first, cannot be skipped
// ---------------------------------------------------------------------------

interface WelcomeStepProps {
  onNext: () => void
}

function WelcomeStep({ onNext }: WelcomeStepProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-6 px-6 py-8 text-center">
      <h1 className="font-headline text-2xl font-bold text-[#1A1A1A] leading-snug">
        {t('onboarding.shell.welcome.title')}
      </h1>
      <p className="text-[#6B6460] text-base max-w-xs leading-relaxed">
        {t('onboarding.shell.welcome.body')}
      </p>
      <button
        type="button"
        onClick={onNext}
        className="mt-2 h-12 w-full max-w-xs rounded-[12px] bg-[#F28C28] px-6 text-base font-semibold text-white transition-colors hover:bg-[#d97a20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
      >
        {t('onboarding.shell.welcome.cta')}
      </button>

      {/* Conversational alternative — premium opt-in (E11.7) */}
      <Link
        to="/app/onboarding/conversational"
        className="mt-1 text-sm text-[#6B6460] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2 rounded"
      >
        {t('onboarding.shell.welcome.chatToggle')}
      </Link>
    </div>
  )
}

// ---------------------------------------------------------------------------
// OnboardingShell
// ---------------------------------------------------------------------------

export function OnboardingShell() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id ?? '')

  // Prefetch user data so we can check body-data completeness on final step,
  // and to read suggestedKcalTarget / suggestedProteinTarget for the TDEE step.
  const { data: user } = useQuery({
    queryKey: USERS_ME_QUERY_KEY,
    queryFn: usersService.getMe,
    staleTime: 30_000,
    enabled: !!userId,
  })

  // ── TDEE step: persist accepted suggestion to mealPlanPreferences ─────────
  const tdeeMutation = useMutation({
    mutationFn: (kcalTarget: number) =>
      usersService.updateSettings({
        mealPlanPreferences: {
          ...user?.mealPlanPreferences,
          kcalTarget,
        },
      }),
    onSuccess: (updated) => {
      qc.setQueryData(USERS_ME_QUERY_KEY, updated)
      toast({ title: t('onboarding.tdeeStep.accepted'), variant: 'success' })
    },
  })

  // Resume: read persisted step at mount time.
  // useAuthStore.getState() is synchronous so it is safe to call inside the
  // useState lazy initializer — no setState-in-effect needed.
  const [currentStep, setCurrentStep] = useState<number>(() => {
    const uid = useAuthStore.getState().user?.id
    // Clamp persisted step to the new TOTAL_STEPS in case the user had a
    // higher step stored from the old 10-step shell (KALMIO-241 migration).
    const persisted = uid ? readOnboardingStep(uid) : 1
    return Math.min(persisted, TOTAL_STEPS)
  })
  const [skipModalOpen, setSkipModalOpen] = useState(false)

  // Persist step on every change.
  useEffect(() => {
    if (userId) {
      writeOnboardingStep(userId, currentStep)
    }
  }, [currentStep, userId])

  const goToStep = useCallback(
    (step: number) => {
      const clamped = Math.min(Math.max(1, step), TOTAL_STEPS)
      setCurrentStep(clamped)
    },
    []
  )

  const goNext = useCallback(() => {
    if (currentStep >= TOTAL_STEPS) {
      // Final step completed — mark done, clear step progress.
      if (userId) {
        writeOnboardingDone(userId)
        clearOnboardingStep(userId)
      }
      // KALMIO-241: redirect to Profile (body-data section) when body data is
      // incomplete; otherwise go straight to the dashboard.
      const bodyDataIncomplete =
        !!user && user.weightKg == null && user.heightCm == null
      if (bodyDataIncomplete) {
        navigate('/app/profile?section=body-data', { replace: true })
      } else {
        navigate('/app/dashboard', { replace: true })
      }
      return
    }
    goToStep(currentStep + 1)
  }, [currentStep, goToStep, navigate, userId, user])

  const handleSkipConfirm = useCallback(() => {
    // Skip: mark done, clear persisted progress and go to dashboard.
    if (userId) {
      writeOnboardingDone(userId)
      clearOnboardingStep(userId)
    }
    navigate('/app/dashboard', { replace: true })
  }, [navigate, userId])

  // Map shell step (1-indexed) to PlantingScene step (0-indexed, 0..10).
  const plantingStep: PlantingStep = SHELL_TO_PLANTING[currentStep] ?? 0

  return (
    <div
      className="min-h-screen flex flex-col bg-[#F9F7F2]"
      data-testid="onboarding-shell"
    >
      {/* ---- Header row: progress bar + skip link ---- */}
      <header className="flex items-center justify-between px-4 pt-4 md:px-8">
        <div className="flex-1">
          <OnboardingProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        </div>

        {/* Skip link: visible from step 2 onward */}
        {currentStep >= 2 && (
          <button
            type="button"
            onClick={() => setSkipModalOpen(true)}
            className="ml-4 shrink-0 text-sm text-[#6B6460] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2 rounded"
            aria-label={t('onboarding.shell.skipAriaLabel')}
          >
            {t('onboarding.shell.skip')}
          </button>
        )}
      </header>

      {/* ---- Planting scene (drives visual continuity across all steps) ---- */}
      {/* Hidden on steps 5–6 where FirstPlanReveal / CsemeteWelcomeMoment
          have their own full-bleed visuals. */}
      {currentStep <= 4 && (
        <div className="px-4 md:px-8 pt-4">
          <PlantingScene step={plantingStep} className="max-w-xs mx-auto" />
        </div>
      )}

      {/* ---- Step content area ---- */}
      <main className="flex-1 flex flex-col px-4 md:px-8 pb-8 max-w-lg mx-auto w-full">
        {/* Step 1: Welcome */}
        {currentStep === 1 && (
          <WelcomeStep onNext={goNext} />
        )}

        {/* Step 2: TDEE suggestion — KALMIO-94 */}
        {currentStep === 2 && (
          <div className="flex flex-col gap-4 py-6">
            <div className="text-center px-2">
              <h2 className="font-headline text-xl font-bold text-[#1A1A1A] leading-snug mb-2">
                {t('onboarding.tdeeStep.title')}
              </h2>
              <p className="text-sm text-[#6B6460] max-w-xs mx-auto leading-relaxed">
                {t('onboarding.tdeeStep.body')}
              </p>
            </div>

            <TdeeSuggestionBanner
              suggestedKcal={user?.suggestedKcalTarget ?? null}
              suggestedProtein={user?.suggestedProteinTarget ?? null}
              accepting={tdeeMutation.isPending}
              onAccept={({ kcalTarget }) => {
                if (kcalTarget != null) {
                  tdeeMutation.mutate(kcalTarget, { onSettled: () => goNext() })
                } else {
                  goNext()
                }
              }}
              onSkip={goNext}
            />

            <button
              type="button"
              onClick={() => goToStep(1)}
              className="h-10 w-full rounded-[12px] text-sm text-[#6B6460] hover:bg-[#F28C28]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
            >
              {t('common.back')}
            </button>
          </div>
        )}

        {/* Step 3: App orientation (MiniTutorialPlanner) */}
        {currentStep === 3 && (
          <>
            {/* MiniTutorialPlanner: onSkip advances to the next step */}
            <MiniTutorialPlanner onSkip={goNext} />
            <div className="mt-auto flex flex-col gap-3 pt-4">
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="h-10 w-full rounded-[12px] text-sm text-[#6B6460] hover:bg-[#F28C28]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
              >
                {t('common.back')}
              </button>
            </div>
          </>
        )}

        {/* Step 4: Plan generation loading */}
        {currentStep === 4 && (
          <>
            <PlanGenerationStep />
            <div className="mt-auto flex flex-col gap-3 pt-4">
              <button
                type="button"
                onClick={goNext}
                className="h-12 w-full rounded-[12px] bg-[#F28C28] px-6 text-base font-semibold text-white transition-colors hover:bg-[#d97a20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
              >
                {t('onboarding.shell.next')}
              </button>
              <button
                type="button"
                onClick={() => goToStep(3)}
                className="h-10 w-full rounded-[12px] text-sm text-[#6B6460] hover:bg-[#F28C28]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
              >
                {t('common.back')}
              </button>
            </div>
          </>
        )}

        {/* Step 5: First plan reveal */}
        {currentStep === 5 && (
          <FirstPlanReveal onDismiss={goNext} />
        )}

        {/* Step 6: Csemete moment */}
        {currentStep === 6 && (
          <CsemeteWelcomeMoment onDismiss={goNext} />
        )}
      </main>

      {/* ---- Skip confirmation modal ---- */}
      <SkipConfirmModal
        open={skipModalOpen}
        onOpenChange={setSkipModalOpen}
        onConfirm={handleSkipConfirm}
      />
    </div>
  )
}
