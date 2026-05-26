/**
 * OnboardingShell — KALMIO-167 / KALMIO-241 / KALMIO-393 / KALMIO-436 / KALMIO-435 / KALMIO-450
 *
 * Multi-step onboarding container.  Owns:
 *   1. A 7-step progress indicator (OnboardingProgressBar, top of screen).
 *   2. A "Kihagyom most" link visible from step 2 onward (SkipConfirmModal).
 *   3. Resume: reads the last persisted step from localStorage on mount
 *      and lands the returning user there automatically.
 *   4. Step content: renders a step-specific content panel.
 *
 * KALMIO-393: Re-added the 6-field preferences capture step (PRD §4.2)
 * between Welcome (step 1) and TDEE (now step 3).
 *
 * KALMIO-435: Added PreferenceSwipe — recipe-focused two-direction swipe deck.
 *
 * KALMIO-450: Consolidated TasteSwipe (step 5) and PreferenceSwipe (step 6) into
 * a single combined step 5 using TasteSwipe (which already handles both ingredient
 * and recipe cards). Step 6 is removed. TOTAL_STEPS drops from 8 to 7.
 * The planting-metaphor mapping is updated accordingly.
 *
 * Full flow:
 *   1. Welcome
 *   2. Preferences (household, kcal, dietary, shopping cadence/day, forbidden)
 *   3. Body data
 *   4. TDEE suggestion
 *   5. TasteSwipe (ingredient + recipe cards, combined deck, capped at 20)
 *   6. App orientation (MiniTutorialPlanner)
 *   7. Plan generation loading → redirect to /app/plans?fresh=1
 *
 * KALMIO-436: Steps 8 (FirstPlanReveal) and 9 (CsemeteWelcomeMoment) removed
 * from the shell flow. On completion of step 7, the user is redirected directly
 * to /app/plans?fresh=1, which auto-triggers plan generation. The Csemete
 * welcome moment is shown later by AppShell's useCsemeteWelcomeMoment hook
 * once the MAG → CSEMETE stage transition has occurred.
 *
 * Post-completion redirect:
 *   - Always → /app/plans?fresh=1
 *
 * Route: /app/onboarding  (ProtectedRoute, no AppShell chrome — full-screen)
 *
 * Step → PlantingScene mapping (shell is 1-indexed; PlantingScene is 0-indexed):
 *   Shell step 1  → PlantingScene 0  — Welcome (hand above soil)
 *   Shell step 2  → PlantingScene 2  — Preferences (walnut in the hole — we have the data)
 *   Shell step 3  → PlantingScene 3  — Body data
 *   Shell step 4  → PlantingScene 4  — TDEE suggestion
 *   Shell step 5  → PlantingScene 5  — TasteSwipe (combined ingredient + recipe deck)
 *   Shell step 6  → PlantingScene 6  — Orientation
 *   Shell step 7  → PlantingScene 7  — Plan generation (watering can)
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
import { TdeeSuggestionBanner } from '@/components/shared/TdeeSuggestionBanner'
import { PreferencesStep, type PreferencesStepValues } from '@/components/onboarding/PreferencesStep'
import { BodyDataStep, type BodyDataStepValues } from '@/components/onboarding/BodyDataStep'
import { TasteSwipe } from '@/components/taste/TasteSwipe'
import { tasteSignalsService } from '@/services/tasteSignals'
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
 * Step 1 — Welcome
 * Step 2 — Preferences (household, kcal, dietary, shopping, forbidden, budget)
 * Step 3 — Body data (weight, height, age, biological sex, activity level) —
 *          in-flow capture so TDEE has data to render and the user is never
 *          bounced to /app/profile mid-tutorial.
 * Step 4 — TDEE suggestion (reads suggestedKcalTarget from user settings)
 * Step 5 — TasteSwipe (combined ingredient + recipe deck, capped at 20 cards)
 *          KALMIO-450: merged former step 6 (PreferenceSwipe) into this step.
 *          TasteSwipe already handles both INGREDIENT and RECIPE targetTypes.
 *          Analytics events fire under their original source tags.
 * Step 6 — App orientation (MiniTutorialPlanner)
 * Step 7 — Plan generation loading → redirect to /app/plans?fresh=1
 *
 * KALMIO-436: Steps 8 (FirstPlanReveal) and 9 (CsemeteWelcomeMoment) are
 * no longer part of the shell flow. Plan generation and the welcome moment
 * happen on the Plans page after redirect.
 */
const TOTAL_STEPS = 7

/**
 * Maps the 1-indexed shell step to the PlantingScene 0-indexed step (0..10).
 * KALMIO-450: step 6 (PreferenceSwipe) removed; steps renumbered.
 */
const SHELL_TO_PLANTING: Record<number, PlantingStep> = {
  1: 0,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
}

/**
 * Narrative copy is keyed 1–6 in i18n. Step 4 (TDEE) reuses narrative 3
 * because the body-data narrative ("we'll suggest a calorie target")
 * naturally bridges the two screens.
 * KALMIO-450: step 6 (PreferenceSwipe) removed; steps 6 and 7 take narratives 5 and 6.
 */
const SHELL_TO_NARRATIVE: Record<number, number | null> = {
  1: 1,
  2: 2,
  3: 3,
  4: 3,
  5: 4,
  6: 5,
  7: 6,
}

// ---------------------------------------------------------------------------
// Narrative block — sits beside the PlantingScene in the left aside on
// desktop. One short stanza per shell step (1–4) that mirrors what the
// scene is showing at that moment in the planting metaphor.
// ---------------------------------------------------------------------------

function NarrativeBlock({ step }: { step: number }) {
  const { t } = useTranslation()
  const narrativeKey = SHELL_TO_NARRATIVE[step]
  if (narrativeKey == null) return null
  return (
    <div className="flex flex-col gap-4 text-center text-[#5C3D1E] max-w-md">
      <p className="font-headline text-xl lg:text-2xl leading-snug font-semibold">
        {t(`onboarding.shell.narrative.${narrativeKey}.lead`)}
      </p>
      <p className="text-sm lg:text-base leading-relaxed text-[#5C3D1E]/80">
        {t(`onboarding.shell.narrative.${narrativeKey}.body`)}
      </p>
    </div>
  )
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
        {t('onboarding.shell.stepLabels.7')}
      </p>
      <p className="text-sm text-[#6B6460] max-w-xs leading-relaxed">
        {t('onboarding.shell.planGeneratingBody')}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TasteSwipe step (step 4) — KALMIO-431
// Loads the user's taste deck from the backend and renders the swipe UI.
// onContinue fires when the deck is exhausted, the user taps skip-all, or
// the deck failed to load — we never let the user get stuck here.
// ---------------------------------------------------------------------------

interface TasteSwipeStepProps {
  onContinue: () => void
}

function TasteSwipeStep({ onContinue }: TasteSwipeStepProps) {
  const { t } = useTranslation()
  const { data: deck, isLoading, isError } = useQuery({
    queryKey: ['taste-deck'],
    queryFn: () => tasteSignalsService.buildDeck(),
    staleTime: 5 * 60_000,
  })

  // Auto-advance if the deck failed entirely so the user isn't stuck on
  // an empty screen. If it just hasn't loaded yet, show the spinner.
  useEffect(() => {
    if (isError) onContinue()
  }, [isError, onContinue])

  return (
    <div
      className="flex flex-col items-center gap-5 px-4 py-2 w-full"
      data-testid="step-taste-swipe"
    >
      <div className="text-center max-w-md mx-auto">
        <h2 className="font-headline text-xl font-bold text-[#1A1A1A] leading-snug">
          {t('taste.onboardingTitle')}
        </h2>
        <p className="text-sm text-[#6B6460] mt-1.5 leading-relaxed">
          {t('taste.onboardingBody')}
        </p>
      </div>

      {isLoading || !deck ? (
        <div className="flex items-center justify-center w-full h-[520px]">
          <div className="w-10 h-10 rounded-full border-2 border-[#F28C28] border-t-transparent animate-spin" />
        </div>
      ) : deck.length === 0 ? (
        // Empty deck — nothing to rate; just continue.
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-[#6B6460]">{t('taste.emptyDeck', { defaultValue: 'Most nincs mit értékelned — folytasd a következő lépéssel.' })}</p>
          <button
            type="button"
            onClick={onContinue}
            className="h-11 px-6 rounded-[12px] bg-[#F28C28] text-white font-semibold text-sm hover:bg-[#d97a20] transition-colors"
          >
            {t('onboarding.shell.next')}
          </button>
        </div>
      ) : (
        <TasteSwipe
          cards={deck}
          source="ONBOARDING"
          onComplete={onContinue}
          onSkipAll={onContinue}
        />
      )}
    </div>
  )
}

// PreferenceSwipeStep removed (KALMIO-450): recipe preference cards are now
// included in the TasteSwipe deck (step 5). The PreferenceSwipe component is
// kept in the codebase for standalone use but is no longer wired into the shell.

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

  // ── Preferences step: persist all six fields on advance ──────────────────
  // KALMIO-430: the budget field is optional. `budgetMax === null` clears any
  // previously-set value; a positive integer constrains the solver's soft
  // cost penalty for the whole week.
  const preferencesMutation = useMutation({
    mutationFn: (values: PreferencesStepValues) => {
      const { householdSize, kcalTarget, dietary, cadenceDays, shoppingDayOfWeek, forbiddenIngredientIds, budgetMax } = values
      return usersService.updateSettings({
        mealPlanPreferences: {
          ...user?.mealPlanPreferences,
          kcalTarget,
          days: cadenceDays,
          forbiddenIngredientIds: forbiddenIngredientIds.length > 0 ? forbiddenIngredientIds : undefined,
          budgetMax: budgetMax ?? undefined,
          // Map household size (1–6) to servingConfig.maxMultiplier so analytics
          // can derive a household-size bucket from the existing pattern.
          servingConfig: {
            minMultiplier: 1,
            maxMultiplier: householdSize,
            step: 1,
          },
        },
        dietaryPreferences: dietary,
        // preferredPrepDayOfWeek doubles as shopping day of week in this context.
        preferredPrepDayOfWeek: shoppingDayOfWeek,
      })
    },
    onSuccess: (updated) => {
      qc.setQueryData(USERS_ME_QUERY_KEY, updated)
    },
  })

  // ── Body data step: PATCH body-data, then refresh user record so the next
  // step's `suggestedKcalTarget` is available.
  const bodyDataMutation = useMutation({
    mutationFn: (values: BodyDataStepValues) =>
      usersService.patchBodyData({
        weightKg: values.weightKg,
        heightCm: values.heightCm,
        ageYears: values.ageYears,
        biologicalSex: values.biologicalSex,
        activityLevel: values.activityLevel,
      }),
    onSuccess: (updated) => {
      qc.setQueryData(USERS_ME_QUERY_KEY, updated)
    },
    onError: () => {
      toast({ title: t('onboarding.bodyDataStep.saveError'), variant: 'destructive' })
    },
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

  // KALMIO-403 — no auto-skip for the TDEE step when body data is absent.
  // Instead the step renders a clear "add body data" state so the user
  // understands what is needed and has a path forward (see step-3 JSX below).

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
      // KALMIO-436: redirect directly to /app/plans?fresh=1 so the Plans page
      // can auto-trigger plan generation. The post-induction "kicsírázott" /
      // founder screens are no longer shown inside the onboarding shell.
      navigate('/app/plans?fresh=1', { replace: true })
      return
    }
    goToStep(currentStep + 1)
  }, [currentStep, goToStep, navigate, userId])

  const handleSkipConfirm = useCallback(() => {
    // Skip: mark done, clear persisted progress and go to dashboard.
    if (userId) {
      writeOnboardingDone(userId)
      clearOnboardingStep(userId)
    }
    navigate('/app/plans', { replace: true })
  }, [navigate, userId])

  // Map shell step (1-indexed) to PlantingScene step (0-indexed, 0..10).
  const plantingStep: PlantingStep = SHELL_TO_PLANTING[currentStep] ?? 0

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row bg-[#F9F7F2]"
      data-testid="onboarding-shell"
    >
      {/* ---- Desktop-only illustration column (md+) ---- */}
      <aside
        className="hidden md:flex md:w-[45%] lg:w-[40%] md:flex-col md:items-center md:justify-center bg-[#F5EDD8] p-8 lg:p-12"
        aria-hidden="false"
      >
        <div className="flex flex-col items-center gap-10 w-full max-w-xl">
          <NarrativeBlock step={currentStep} />
          <PlantingScene step={plantingStep} className="w-full" />
        </div>
      </aside>

      {/* ---- Content column ---- */}
      <div className="flex-1 flex flex-col min-h-screen md:min-h-0">
        {/* ---- Header row: progress bar + chat toggle + skip link ---- */}
        <header className="flex items-center justify-between px-4 pt-4 md:px-8 md:pt-6">
          <div className="flex-1">
            <OnboardingProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />
          </div>

          {/* Chat toggle: visible through steps 1–3 so a user partway through
              the form can still switch modes before investing real effort. */}
          {currentStep <= 3 && (
            <Link
              to="/app/onboarding/conversational"
              className="ml-4 shrink-0 text-sm text-[#6B6460] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2 rounded"
            >
              {t('onboarding.shell.welcome.chatToggle')}
            </Link>
          )}

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

        {/* ---- Mobile-only planting scene (hidden on md+) ---- */}
        <div className="md:hidden px-4 pt-4">
          <PlantingScene step={plantingStep} className="max-w-xs mx-auto" />
        </div>

        {/* ---- Step content area ---- */}
        <main className="flex-1 flex flex-col px-4 md:px-8 pb-8 max-w-lg mx-auto w-full md:justify-center">
        {/* Step 1: Welcome */}
        {currentStep === 1 && (
          <WelcomeStep onNext={goNext} />
        )}

        {/* Step 2: Preferences — KALMIO-393 */}
        {currentStep === 2 && (
          <PreferencesStep
            initialValues={{
              kcalTarget: user?.mealPlanPreferences?.kcalTarget ?? 2000,
              dietary: user?.dietaryPreferences ?? undefined,
              cadenceDays: user?.mealPlanPreferences?.days ?? 7,
              shoppingDayOfWeek: user?.preferredPrepDayOfWeek ?? 7,
              forbiddenIngredientIds: (user?.mealPlanPreferences?.forbiddenIngredientIds ?? []) as string[],
              budgetMax: user?.mealPlanPreferences?.budgetMax ?? null,
            }}
            onAdvance={(values) => {
              preferencesMutation.mutate(values, { onSettled: () => goNext() })
            }}
            onBack={() => goToStep(1)}
            isSubmitting={preferencesMutation.isPending}
          />
        )}

        {/* Step 3: Body data — in-flow capture (replaces the old /app/profile escape hatch) */}
        {currentStep === 3 && (
          <BodyDataStep
            initialValues={{
              weightKg: user?.weightKg ?? null,
              heightCm: user?.heightCm ?? null,
              ageYears: user?.ageYears ?? null,
              biologicalSex: user?.biologicalSex ?? null,
              activityLevel: user?.activityLevel ?? null,
            }}
            onAdvance={(values) => {
              bodyDataMutation.mutate(values, { onSettled: () => goNext() })
            }}
            onSkip={goNext}
            onBack={() => goToStep(2)}
            isSubmitting={bodyDataMutation.isPending}
          />
        )}

        {/* Step 4: TDEE suggestion — KALMIO-94 / KALMIO-403 */}
        {currentStep === 4 && (
          <div className="flex flex-col gap-4 py-6">
            {user?.suggestedKcalTarget == null ? (
              /* Body data still missing (user skipped step 3). Send them back
                 to step 3 rather than out of the tutorial. */
              <>
                <div className="text-center px-2">
                  <h2 className="font-headline text-xl font-bold text-[#1A1A1A] leading-snug mb-2">
                    {t('onboarding.tdeeStep.noBodyData.title')}
                  </h2>
                  <p className="text-sm text-[#6B6460] max-w-xs mx-auto leading-relaxed">
                    {t('onboarding.tdeeStep.noBodyData.description')}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#E8E4DC] bg-white p-5 flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={() => goToStep(3)}
                    className="flex h-12 w-full items-center justify-center rounded-[12px] bg-[#F28C28] px-6 text-base font-semibold text-white transition-colors hover:bg-[#d97a20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
                  >
                    {t('onboarding.tdeeStep.noBodyData.cta')}
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="h-10 w-full rounded-[12px] text-sm text-[#6B6460] hover:bg-[#F28C28]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
                  >
                    {t('onboarding.tdeeStep.noBodyData.skip')}
                  </button>
                </div>
              </>
            ) : (
              /* Normal path: body data present, show suggestion banner */
              <>
                <div className="text-center px-2">
                  <h2 className="font-headline text-xl font-bold text-[#1A1A1A] leading-snug mb-2">
                    {t('onboarding.tdeeStep.title')}
                  </h2>
                  <p className="text-sm text-[#6B6460] max-w-xs mx-auto leading-relaxed">
                    {t('onboarding.tdeeStep.body')}
                  </p>
                </div>

                <TdeeSuggestionBanner
                  suggestedKcal={user.suggestedKcalTarget}
                  suggestedProtein={user?.suggestedProteinTarget ?? null}
                  accepting={tdeeMutation.isPending}
                  onAccept={({ kcalTarget }) => {
                    // proteinTarget from TdeeSuggestionValues is intentionally not
                    // persisted here. The AC for KALMIO-94 specifies kcalTarget only;
                    // protein is shown as an informational reference in the banner but
                    // is not written to mealPlanPreferences at this stage.
                    if (kcalTarget != null) {
                      tdeeMutation.mutate(kcalTarget, { onSettled: () => goNext() })
                    } else {
                      goNext()
                    }
                  }}
                  onSkip={goNext}
                />
              </>
            )}

            <button
              type="button"
              onClick={() => goToStep(3)}
              className="h-10 w-full rounded-[12px] text-sm text-[#6B6460] hover:bg-[#F28C28]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
            >
              {t('common.back')}
            </button>
          </div>
        )}

        {/* Step 5: TasteSwipe (KALMIO-431) — Tinder-style swipe over up to 20 cards */}
        {currentStep === 5 && (
          <>
            <TasteSwipeStep onContinue={goNext} />
            <div className="mt-auto md:mt-0 flex flex-col gap-3 pt-4">
              <button
                type="button"
                onClick={() => goToStep(4)}
                className="h-10 w-full rounded-[12px] text-sm text-[#6B6460] hover:bg-[#F28C28]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
              >
                {t('common.back')}
              </button>
            </div>
          </>
        )}

        {/* Step 6: App orientation (MiniTutorialPlanner) — was step 7 pre-KALMIO-450 */}
        {currentStep === 6 && (
          <>
            {/* MiniTutorialPlanner: onSkip advances to the next step */}
            <MiniTutorialPlanner onSkip={goNext} />
            <div className="mt-auto md:mt-0 flex flex-col gap-3 pt-4">
              <button
                type="button"
                onClick={() => goToStep(5)}
                className="h-10 w-full rounded-[12px] text-sm text-[#6B6460] hover:bg-[#F28C28]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
              >
                {t('common.back')}
              </button>
            </div>
          </>
        )}

        {/* Step 7: Plan generation loading — was step 8 pre-KALMIO-450 */}
        {currentStep === 7 && (
          <>
            <PlanGenerationStep />
            <div className="mt-auto md:mt-0 flex flex-col gap-3 pt-4">
              <button
                type="button"
                onClick={goNext}
                className="h-12 w-full rounded-[12px] bg-[#F28C28] px-6 text-base font-semibold text-white transition-colors hover:bg-[#d97a20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
              >
                {t('onboarding.shell.next')}
              </button>
              <button
                type="button"
                onClick={() => goToStep(6)}
                className="h-10 w-full rounded-[12px] text-sm text-[#6B6460] hover:bg-[#F28C28]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
              >
                {t('common.back')}
              </button>
            </div>
          </>
        )}

        </main>
      </div>

      {/* ---- Skip confirmation modal ---- */}
      <SkipConfirmModal
        open={skipModalOpen}
        onOpenChange={setSkipModalOpen}
        onConfirm={handleSkipConfirm}
      />
    </div>
  )
}
