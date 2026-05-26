/**
 * TdeeSuggestionBanner — KALMIO-94 / KALMIO-452
 *
 * Surfaces TDEE-derived calorie and protein suggestions to the user.
 * Used in:
 *  - OnboardingShell (step 4 — TDEE step)
 *
 * Props:
 *  - suggestedKcal  — TDEE-based kcal suggestion, null when body data is incomplete.
 *  - suggestedProtein — 1.8 g/kg protein suggestion, null when weight is absent.
 *  - onAccept — called with { kcalTarget, proteinTarget } when the user accepts.
 *  - onSkip  — called when the user chooses to skip.
 *  - accepting — true while the accept mutation is in-flight.
 *
 * KALMIO-452: the kcal value is now pre-filled into an editable input so the user
 * can adjust the TDEE-derived suggestion before accepting it. The input is
 * bounded to 1 000–5 000 kcal and validated inline.
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
}

interface TdeeSuggestionBannerProps {
  suggestedKcal: number | null
  suggestedProtein: number | null
  onAccept: (values: TdeeSuggestionValues) => void
  onSkip: () => void
  accepting?: boolean
}

const KCAL_MIN = 1000
const KCAL_MAX = 5000

export function TdeeSuggestionBanner({
  suggestedKcal,
  suggestedProtein,
  onAccept,
  onSkip,
  accepting = false,
}: TdeeSuggestionBannerProps) {
  const { t } = useTranslation()

  // Editable kcal state — pre-filled from suggestedKcal on mount.
  // The component is typically re-mounted when body data changes (the user
  // navigates back to step 3 and returns), so the initial value is correct.
  const [kcalInput, setKcalInput] = useState<string>(
    suggestedKcal != null ? String(suggestedKcal) : ''
  )

  const parsedKcal = kcalInput.trim() ? parseInt(kcalInput, 10) : NaN
  const kcalError: string | null = (() => {
    if (suggestedKcal == null) return null
    if (isNaN(parsedKcal) || parsedKcal < KCAL_MIN || parsedKcal > KCAL_MAX) {
      return t('onboarding.tdeeStep.kcalEditError', { min: KCAL_MIN, max: KCAL_MAX })
    }
    return null
  })()

  const hasSuggestion = suggestedKcal != null || suggestedProtein != null
  const canAccept = !kcalError && (suggestedKcal == null || !isNaN(parsedKcal))

  function handleAccept() {
    if (!canAccept || accepting) return
    const resolvedKcal = suggestedKcal != null && !isNaN(parsedKcal) ? parsedKcal : suggestedKcal
    onAccept({ kcalTarget: resolvedKcal, proteinTarget: suggestedProtein })
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
          {/* Editable kcal target — pre-filled with the TDEE suggestion */}
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

          {suggestedProtein != null && (
            <div className="flex items-baseline gap-2">
              <span
                className="text-[#4f46e5] font-bold text-lg tabular-nums"
                aria-label={t('settings.suggestion.protein', { n: suggestedProtein })}
              >
                {suggestedProtein}
              </span>
              <span className="text-sm text-[#6B6460]">{t('onboarding.tdeeStep.proteinUnit')}</span>
            </div>
          )}
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
