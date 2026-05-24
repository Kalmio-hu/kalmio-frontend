/**
 * TdeeSuggestionBanner — KALMIO-94
 *
 * Surfaces TDEE-derived calorie and protein suggestions to the user.
 * Used in:
 *  - OnboardingShell (step 2 — TDEE step)
 *
 * Props:
 *  - suggestedKcal  — TDEE-based kcal suggestion, null when body data is incomplete.
 *  - suggestedProtein — 1.8 g/kg protein suggestion, null when weight is absent.
 *  - onAccept — called with { kcalTarget, proteinTarget } when the user accepts.
 *  - onSkip  — called when the user chooses to skip.
 *  - accepting — true while the accept mutation is in-flight.
 *
 * The component is intentionally prop-driven — the caller owns the data fetch
 * and the mutation so the banner can be reused in any context.
 */

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

export function TdeeSuggestionBanner({
  suggestedKcal,
  suggestedProtein,
  onAccept,
  onSkip,
  accepting = false,
}: TdeeSuggestionBannerProps) {
  const { t } = useTranslation()

  const hasSuggestion = suggestedKcal != null || suggestedProtein != null

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
        <ul className="flex flex-col gap-2" aria-live="polite">
          {suggestedKcal != null && (
            <li className="flex items-baseline gap-2">
              <span
                className="text-[#F28C28] font-bold text-lg tabular-nums"
                aria-label={t('settings.suggestion.kcal', { n: suggestedKcal })}
              >
                {suggestedKcal.toLocaleString()}
              </span>
              <span className="text-sm text-[#6B6460]">kcal</span>
            </li>
          )}
          {suggestedProtein != null && (
            <li className="flex items-baseline gap-2">
              <span
                className="text-[#4f46e5] font-bold text-lg tabular-nums"
                aria-label={t('settings.suggestion.protein', { n: suggestedProtein })}
              >
                {suggestedProtein}
              </span>
              <span className="text-sm text-[#6B6460]">g {t('onboarding.tdeeStep.proteinUnit')}</span>
            </li>
          )}
        </ul>
      ) : (
        <p className="text-sm text-[#6B6460]">{t('onboarding.tdeeStep.bodyDataMissing')}</p>
      )}

      <p className="text-xs text-[#B0A89F]">{t('settings.suggestion.hint')}</p>

      <div className="flex flex-col gap-2 mt-1">
        {hasSuggestion && (
          <button
            type="button"
            disabled={accepting}
            onClick={() =>
              onAccept({ kcalTarget: suggestedKcal, proteinTarget: suggestedProtein })
            }
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
