/**
 * BodyDataStep — in-flow body-data capture for OnboardingShell.
 *
 * Previously the TDEE step linked out to /app/profile?section=body-data when
 * the user had no body data yet, and the user could not get back to the
 * tutorial. This step keeps the capture inside the planting flow so TDEE
 * (the next step) has data to render.
 *
 * The five fields mirror Profile's body-data card; the parent owns the PATCH
 * call and the navigation. The user may skip — TDEE will then render its
 * "no body data" branch and the user can come back here via the Back button.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { computeTdeePreview } from '@/lib/tdee'
import type { BiologicalSex, ActivityLevel } from '@/types'

export interface BodyDataStepValues {
  weightKg: number | null
  heightCm: number | null
  ageYears: number | null
  biologicalSex: BiologicalSex | null
  activityLevel: ActivityLevel | null
}

interface BodyDataStepProps {
  initialValues?: Partial<BodyDataStepValues>
  onAdvance: (values: BodyDataStepValues) => void
  onSkip: () => void
  onBack: () => void
  isSubmitting?: boolean
}

export function BodyDataStep({
  initialValues,
  onAdvance,
  onSkip,
  onBack,
  isSubmitting = false,
}: BodyDataStepProps) {
  const { t } = useTranslation()

  const [weightKg, setWeightKg] = useState<string>(
    initialValues?.weightKg != null ? String(initialValues.weightKg) : ''
  )
  const [heightCm, setHeightCm] = useState<string>(
    initialValues?.heightCm != null ? String(initialValues.heightCm) : ''
  )
  const [ageYears, setAgeYears] = useState<string>(
    initialValues?.ageYears != null ? String(initialValues.ageYears) : ''
  )
  const [biologicalSex, setBiologicalSex] = useState<BiologicalSex | ''>(
    initialValues?.biologicalSex ?? ''
  )
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | ''>(
    initialValues?.activityLevel ?? ''
  )

  const parsedWeight = weightKg.trim() ? Number(weightKg) : null
  const parsedHeight = heightCm.trim() ? Number(heightCm) : null
  const parsedAge = ageYears.trim() ? Number(ageYears) : null

  const previewTdee = computeTdeePreview({
    weightKg: parsedWeight,
    heightCm: parsedHeight,
    ageYears: parsedAge,
    biologicalSex: biologicalSex || null,
    activityLevel: activityLevel || null,
  })

  const allComplete =
    parsedWeight != null && parsedHeight != null && parsedAge != null &&
    biologicalSex !== '' && activityLevel !== ''

  function handleSubmit() {
    if (!allComplete || isSubmitting) return
    onAdvance({
      weightKg: parsedWeight,
      heightCm: parsedHeight,
      ageYears: parsedAge,
      biologicalSex: (biologicalSex || null) as BiologicalSex | null,
      activityLevel: (activityLevel || null) as ActivityLevel | null,
    })
  }

  return (
    <div className="flex flex-col gap-5 py-6" data-testid="step-body-data">
      <div className="text-center px-2">
        <h2 className="font-headline text-xl font-bold text-[#1A1A1A] leading-snug mb-2">
          {t('onboarding.bodyDataStep.title')}
        </h2>
        <p className="text-sm text-[#6B6460] max-w-xs mx-auto leading-relaxed">
          {t('onboarding.bodyDataStep.body')}
        </p>
      </div>

      <div className="rounded-2xl border border-[#E8E4DC] bg-white p-5 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="onboarding-weight">{t('profile.bodyData.weightKg')}</Label>
            <Input
              id="onboarding-weight"
              type="number"
              inputMode="decimal"
              min={20}
              max={300}
              step={0.1}
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="onboarding-height">{t('profile.bodyData.heightCm')}</Label>
            <Input
              id="onboarding-height"
              type="number"
              inputMode="numeric"
              min={100}
              max={250}
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="onboarding-age">{t('profile.bodyData.ageYears')}</Label>
          <Input
            id="onboarding-age"
            type="number"
            inputMode="numeric"
            min={10}
            max={120}
            value={ageYears}
            onChange={(e) => setAgeYears(e.target.value)}
            className="mt-1 w-28"
          />
        </div>

        <div>
          <p className="text-xs font-medium text-[#1A1A1A] mb-2">
            {t('profile.bodyData.biologicalSex')}
          </p>
          <div className="space-y-2">
            {(['MALE', 'FEMALE', 'PREFER_NOT_TO_SAY'] as BiologicalSex[]).map((sex) => (
              <label key={sex} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="onboarding-biological-sex"
                  value={sex}
                  checked={biologicalSex === sex}
                  onChange={() => setBiologicalSex(sex)}
                  className="h-4 w-4 accent-[#E8956D]"
                />
                <span className="text-sm text-gray-800">
                  {t(
                    `profile.bodyData.sex${sex
                      .split('_')
                      .map((w, i) =>
                        i === 0
                          ? w.charAt(0) + w.slice(1).toLowerCase()
                          : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
                      )
                      .join('')}`
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="onboarding-activity">{t('profile.bodyData.activityLevel')}</Label>
          <select
            id="onboarding-activity"
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value as ActivityLevel | '')}
            className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#E8956D]/40"
          >
            <option value="">{t('common.optional')}</option>
            <option value="SEDENTARY">{t('profile.bodyData.activitySedentary')}</option>
            <option value="LIGHT">{t('profile.bodyData.activityLight')}</option>
            <option value="MODERATE">{t('profile.bodyData.activityModerate')}</option>
            <option value="ACTIVE">{t('profile.bodyData.activityActive')}</option>
            <option value="VERY_ACTIVE">{t('profile.bodyData.activityVeryActive')}</option>
          </select>
        </div>

        {/* Live TDEE preview — same util the Profile card uses. */}
        <div className="rounded-lg bg-[#F9F7F2] border border-[#e5e4e7] px-3.5 py-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            {t('profile.bodyData.tdee')}
          </p>
          {previewTdee != null ? (
            <p className="text-lg font-semibold text-[#1A1A1A]">
              {previewTdee.toLocaleString()} {t('profile.targets.unit_kcal')}
            </p>
          ) : (
            <p className="text-sm text-gray-400">
              {t('onboarding.bodyDataStep.tdeeHint')}
            </p>
          )}
        </div>

        <p className="text-[10px] text-gray-400 leading-relaxed">
          {t('profile.bodyData.privacy')}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allComplete || isSubmitting}
          className="h-12 w-full rounded-[12px] bg-[#F28C28] px-6 text-base font-semibold text-white transition-colors hover:bg-[#d97a20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? t('onboarding.bodyDataStep.saving')
            : t('onboarding.bodyDataStep.cta')}
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={isSubmitting}
          className="h-10 w-full rounded-[12px] text-sm text-[#6B6460] hover:bg-[#F28C28]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
        >
          {t('onboarding.bodyDataStep.skip')}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="h-10 w-full rounded-[12px] text-sm text-[#6B6460] hover:bg-[#F28C28]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
        >
          {t('common.back')}
        </button>
      </div>
    </div>
  )
}
