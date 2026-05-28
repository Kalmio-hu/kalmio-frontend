/**
 * TdeeSuggestionBanner — KALMIO-94 / KALMIO-452
 *
 * Surfaces TDEE-derived calorie and macro suggestions to the user.
 * Used in:
 *  - OnboardingShell (step 4 — TDEE step)
 *
 * Props:
 *  - suggestedKcal     — TDEE-based kcal suggestion, null when body data is incomplete.
 *  - suggestedProtein  — 1.8 g/kg protein suggestion, null when weight is absent.
 *  - suggestedCarbs    — Derived from kcal (40% / 4 kcal/g). Parent may pass explicit value.
 *  - suggestedFat      — Derived from kcal (30% / 9 kcal/g). Parent may pass explicit value.
 *  - onAccept — called with { kcalTarget, proteinTarget, carbsTargetG, fatTargetG } when the user accepts.
 *  - onSkip  — called when the user chooses to skip.
 *  - accepting — true while the accept mutation is in-flight.
 *
 * KALMIO-452: the kcal value is pre-filled into an editable input so the user
 * can adjust the TDEE-derived suggestion before accepting it.
 *
 * All four macro fields are editable with numeric inputs. Order: kcal → protein → carbs → fat.
 *
 * Defaults when parent does not pass carbs/fat (derived from kcal target):
 *   protein g = round(kcal * 0.30 / 4)
 *   carbs g   = round(kcal * 0.40 / 4)
 *   fat g     = round(kcal * 0.30 / 9)
 *
 * The component is intentionally prop-driven — the caller owns the data fetch
 * and the mutation so the banner can be reused in any context.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Spinner } from '@/components/ui/spinner'

export interface TdeeSuggestionValues {
  kcalTarget: number | null
  proteinTarget: number | null
  carbsTargetG: number | null
  fatTargetG: number | null
}

interface TdeeSuggestionBannerProps {
  suggestedKcal: number | null
  suggestedProtein: number | null
  /** Optional explicit carbs suggestion; derived from kcal if not provided. */
  suggestedCarbs?: number | null
  /** Optional explicit fat suggestion; derived from kcal if not provided. */
  suggestedFat?: number | null
  onAccept: (values: TdeeSuggestionValues) => void
  onSkip: () => void
  accepting?: boolean
}

const KCAL_MIN = 1000
const KCAL_MAX = 5000
const PROTEIN_MIN = 30
const PROTEIN_MAX = 400
const CARBS_MIN = 30
const CARBS_MAX = 600
const FAT_MIN = 10
const FAT_MAX = 250

/** Derive default carbs (g) from a kcal value: 40% of kcal at 4 kcal/g. */
function defaultCarbs(kcal: number): number {
  return Math.round((kcal * 0.40) / 4)
}

/** Derive default fat (g) from a kcal value: 30% of kcal at 9 kcal/g. */
function defaultFat(kcal: number): number {
  return Math.round((kcal * 0.30) / 9)
}

/** Derive default protein (g) from a kcal value: 30% of kcal at 4 kcal/g. */
function defaultProtein(kcal: number): number {
  return Math.round((kcal * 0.30) / 4)
}

export function TdeeSuggestionBanner({
  suggestedKcal,
  suggestedProtein,
  suggestedCarbs,
  suggestedFat,
  onAccept,
  onSkip,
  accepting = false,
}: TdeeSuggestionBannerProps) {
  const { t } = useTranslation()

  // Derive initial values for each macro field.
  // When the parent doesn't provide carbs/fat, derive from kcal.
  const initialKcal = suggestedKcal != null ? String(suggestedKcal) : ''
  const baseKcal = suggestedKcal ?? 2000

  const initialProtein = suggestedProtein != null
    ? String(suggestedProtein)
    : suggestedKcal != null ? String(defaultProtein(baseKcal)) : ''

  const initialCarbs = suggestedCarbs != null
    ? String(suggestedCarbs)
    : suggestedKcal != null ? String(defaultCarbs(baseKcal)) : ''

  const initialFat = suggestedFat != null
    ? String(suggestedFat)
    : suggestedKcal != null ? String(defaultFat(baseKcal)) : ''

  const [kcalInput, setKcalInput] = useState<string>(initialKcal)
  const [proteinInput, setProteinInput] = useState<string>(initialProtein)
  const [carbsInput, setCarbsInput] = useState<string>(initialCarbs)
  const [fatInput, setFatInput] = useState<string>(initialFat)

  const parsedKcal = kcalInput.trim() ? parseInt(kcalInput, 10) : NaN
  const parsedProtein = proteinInput.trim() ? parseInt(proteinInput, 10) : NaN
  const parsedCarbs = carbsInput.trim() ? parseInt(carbsInput, 10) : NaN
  const parsedFat = fatInput.trim() ? parseInt(fatInput, 10) : NaN

  const kcalError: string | null = (() => {
    if (suggestedKcal == null) return null
    if (isNaN(parsedKcal) || parsedKcal < KCAL_MIN || parsedKcal > KCAL_MAX) {
      return t('onboarding.tdeeStep.kcalEditError', { min: KCAL_MIN, max: KCAL_MAX })
    }
    return null
  })()

  const proteinError: string | null = (() => {
    if (!proteinInput.trim()) return null
    if (isNaN(parsedProtein) || parsedProtein < PROTEIN_MIN || parsedProtein > PROTEIN_MAX) {
      return t('onboarding.tdeeStep.macroEditError', { min: PROTEIN_MIN, max: PROTEIN_MAX })
    }
    return null
  })()

  const carbsError: string | null = (() => {
    if (!carbsInput.trim()) return null
    if (isNaN(parsedCarbs) || parsedCarbs < CARBS_MIN || parsedCarbs > CARBS_MAX) {
      return t('onboarding.tdeeStep.macroEditError', { min: CARBS_MIN, max: CARBS_MAX })
    }
    return null
  })()

  const fatError: string | null = (() => {
    if (!fatInput.trim()) return null
    if (isNaN(parsedFat) || parsedFat < FAT_MIN || parsedFat > FAT_MAX) {
      return t('onboarding.tdeeStep.macroEditError', { min: FAT_MIN, max: FAT_MAX })
    }
    return null
  })()

  const hasSuggestion = suggestedKcal != null || suggestedProtein != null
  const canAccept =
    !kcalError && !proteinError && !carbsError && !fatError &&
    (suggestedKcal == null || !isNaN(parsedKcal))

  function handleAccept() {
    if (!canAccept || accepting) return
    const resolvedKcal = suggestedKcal != null && !isNaN(parsedKcal) ? parsedKcal : suggestedKcal
    const resolvedProtein = !isNaN(parsedProtein) ? parsedProtein : (suggestedProtein ?? null)
    const resolvedCarbs = !isNaN(parsedCarbs) ? parsedCarbs : null
    const resolvedFat = !isNaN(parsedFat) ? parsedFat : null
    onAccept({
      kcalTarget: resolvedKcal,
      proteinTarget: resolvedProtein,
      carbsTargetG: resolvedCarbs,
      fatTargetG: resolvedFat,
    })
  }

  return (
    <div
      className="rounded-2xl border border-[#E8E4DC] bg-white p-5 flex flex-col gap-4"
      role="region"
      aria-label={t('settings.suggestion.title')}
    >
      <p className="text-sm font-semibold text-[#1A1A1A]">
        {t('settings.suggestion.title')}
      </p>

      {hasSuggestion ? (
        <div className="flex flex-col gap-3" aria-live="polite">
          {/* ── Kcal ─────────────────────────────────────────────────────── */}
          {suggestedKcal != null && (
            <div>
              <label
                htmlFor="tdee-kcal-input"
                className="block text-xs font-medium text-[#6B6460] mb-1"
              >
                {t('onboarding.tdeeStep.kcalEditLabel')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="tdee-kcal-input"
                  type="number"
                  inputMode="numeric"
                  min={KCAL_MIN}
                  max={KCAL_MAX}
                  step={50}
                  value={kcalInput}
                  onChange={(e) => setKcalInput(e.target.value)}
                  disabled={accepting}
                  className="w-32 rounded-lg border border-gray-200 bg-white px-3 py-2 text-base font-bold text-[#F28C28] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#F28C28]/40 disabled:opacity-60"
                  aria-label={t('settings.suggestion.kcal', { n: suggestedKcal })}
                  aria-describedby={kcalError ? 'tdee-kcal-error' : 'tdee-kcal-hint'}
                />
                <span className="text-sm text-[#6B6460]">kcal</span>
              </div>
              {kcalError ? (
                <p id="tdee-kcal-error" className="mt-1 text-xs text-red-600" role="alert">
                  {kcalError}
                </p>
              ) : (
                <p id="tdee-kcal-hint" className="mt-1 text-xs text-[#B0A89F]">
                  {t('onboarding.tdeeStep.kcalEditHint')}
                </p>
              )}
            </div>
          )}

          {/* ── Protein ──────────────────────────────────────────────────── */}
          <div>
            <label
              htmlFor="tdee-protein-input"
              className="block text-xs font-medium text-[#6B6460] mb-1"
            >
              {t('onboarding.tdeeStep.proteinEditLabel')}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="tdee-protein-input"
                type="number"
                inputMode="numeric"
                min={PROTEIN_MIN}
                max={PROTEIN_MAX}
                step={5}
                value={proteinInput}
                onChange={(e) => setProteinInput(e.target.value)}
                disabled={accepting}
                className="w-24 rounded-lg border border-gray-200 bg-white px-3 py-2 text-base font-bold text-[#4f46e5] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/40 disabled:opacity-60"
                aria-label={t('onboarding.tdeeStep.proteinEditLabel')}
                aria-describedby={proteinError ? 'tdee-protein-error' : undefined}
              />
              <span className="text-sm text-[#6B6460]">{t('onboarding.tdeeStep.proteinUnit')}</span>
            </div>
            {proteinError && (
              <p id="tdee-protein-error" className="mt-1 text-xs text-red-600" role="alert">
                {proteinError}
              </p>
            )}
          </div>

          {/* ── Carbs ────────────────────────────────────────────────────── */}
          <div>
            <label
              htmlFor="tdee-carbs-input"
              className="block text-xs font-medium text-[#6B6460] mb-1"
            >
              {t('onboarding.tdeeStep.carbsEditLabel')}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="tdee-carbs-input"
                type="number"
                inputMode="numeric"
                min={CARBS_MIN}
                max={CARBS_MAX}
                step={5}
                value={carbsInput}
                onChange={(e) => setCarbsInput(e.target.value)}
                disabled={accepting}
                className="w-24 rounded-lg border border-gray-200 bg-white px-3 py-2 text-base font-bold text-[#4F7942] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#4F7942]/40 disabled:opacity-60"
                aria-label={t('onboarding.tdeeStep.carbsEditLabel')}
                aria-describedby={carbsError ? 'tdee-carbs-error' : undefined}
              />
              <span className="text-sm text-[#6B6460]">{t('onboarding.tdeeStep.carbsUnit')}</span>
            </div>
            {carbsError && (
              <p id="tdee-carbs-error" className="mt-1 text-xs text-red-600" role="alert">
                {carbsError}
              </p>
            )}
          </div>

          {/* ── Fat ──────────────────────────────────────────────────────── */}
          <div>
            <label
              htmlFor="tdee-fat-input"
              className="block text-xs font-medium text-[#6B6460] mb-1"
            >
              {t('onboarding.tdeeStep.fatEditLabel')}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="tdee-fat-input"
                type="number"
                inputMode="numeric"
                min={FAT_MIN}
                max={FAT_MAX}
                step={5}
                value={fatInput}
                onChange={(e) => setFatInput(e.target.value)}
                disabled={accepting}
                className="w-24 rounded-lg border border-gray-200 bg-white px-3 py-2 text-base font-bold text-[#F5C57A] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#F5C57A]/40 disabled:opacity-60"
                aria-label={t('onboarding.tdeeStep.fatEditLabel')}
                aria-describedby={fatError ? 'tdee-fat-error' : undefined}
              />
              <span className="text-sm text-[#6B6460]">{t('onboarding.tdeeStep.fatUnit')}</span>
            </div>
            {fatError && (
              <p id="tdee-fat-error" className="mt-1 text-xs text-red-600" role="alert">
                {fatError}
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-[#6B6460]">{t('onboarding.tdeeStep.bodyDataMissing')}</p>
      )}

      <p className="text-xs text-[#B0A89F]">{t('settings.suggestion.hint')}</p>

      <div className="flex flex-col gap-2 mt-1">
        {hasSuggestion && (
          <button
            type="button"
            disabled={accepting || !canAccept}
            onClick={handleAccept}
            className="h-12 w-full rounded-[12px] bg-[#F28C28] text-base font-semibold text-white transition-colors hover:bg-[#d97a20] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2 flex items-center justify-center gap-2"
          >
            {accepting && <Spinner />}
            {t('settings.suggestion.accept')}
          </button>
        )}
        <button
          type="button"
          onClick={onSkip}
          disabled={accepting}
          className="h-10 w-full rounded-[12px] text-sm text-[#6B6460] hover:bg-[#F28C28]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {t('onboarding.tdeeStep.skip')}
        </button>
      </div>
    </div>
  )
}
