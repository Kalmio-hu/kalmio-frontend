import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MergePreviewResponse } from '@/types'

interface Props {
  preview: MergePreviewResponse
  onConfirmClaim: (checkedAllergens: string[]) => void
  onJoinWithoutClaim: () => void
  isPending: boolean
}

const MACRO_SOURCE_LABEL: Record<string, string> = {
  real_account: 'family.merge.sourceRealAccount',
  managed_profile: 'family.merge.sourceManagedProfile',
  not_set: 'family.merge.sourceNotSet',
}

export function MergeConfirmation({ preview, onConfirmClaim, onJoinWithoutClaim, isPending }: Props) {
  const { t } = useTranslation()

  // Allergens are checked by default for safety
  const [checkedAllergens, setCheckedAllergens] = useState<Set<string>>(
    new Set(preview.mergedAllergens),
  )

  function toggleAllergen(allergen: string) {
    setCheckedAllergens((prev) => {
      const next = new Set(prev)
      if (next.has(allergen)) {
        next.delete(allergen)
      } else {
        next.add(allergen)
      }
      return next
    })
  }

  const hasAnyDiff =
    preview.mergedAllergens.length > 0 ||
    preview.activeDietaryFlags.length > 0 ||
    preview.mergedDislikedIngredientIds.length > 0

  return (
    <div className="space-y-6">
      <p className="text-sm text-[#6b6b6b]">{t('family.merge.intro')}</p>

      {/* Allergens — safety-flagged, default checked */}
      {preview.mergedAllergens.length > 0 && (
        <section aria-labelledby="merge-allergens-heading">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" aria-hidden="true" />
            <h3
              id="merge-allergens-heading"
              className="text-sm font-semibold text-[#1A1A1A]"
            >
              {t('family.merge.allergenSection')}
            </h3>
          </div>
          <p className="text-xs text-[#6b6b6b] mb-3">{t('family.merge.allergenHint')}</p>
          <ul className="space-y-1.5" role="list">
            {preview.mergedAllergens.map((allergen) => (
              <li key={allergen}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkedAllergens.has(allergen)}
                    onChange={() => toggleAllergen(allergen)}
                    className="h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                    aria-label={t('family.merge.allergenItemAriaLabel', { allergen })}
                  />
                  <span className="text-sm text-[#1A1A1A] font-medium">{allergen}</span>
                  <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                    {t('family.merge.allergenSafetyBadge')}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Dietary flags */}
      {preview.activeDietaryFlags.length > 0 && (
        <section aria-labelledby="merge-flags-heading">
          <h3
            id="merge-flags-heading"
            className="text-sm font-semibold text-[#1A1A1A] mb-2"
          >
            {t('family.merge.dietaryFlagsSection')}
          </h3>
          <ul className="flex flex-wrap gap-1.5" role="list">
            {preview.activeDietaryFlags.map((flag) => (
              <li
                key={flag}
                className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium"
              >
                {flag}
              </li>
            ))}
          </ul>
          <p className="text-xs text-[#6b6b6b] mt-1.5">{t('family.merge.flagsUncheckable')}</p>
        </section>
      )}

      {/* Dislikes — read-only, informational */}
      {preview.mergedDislikedIngredientIds.length > 0 && (
        <section aria-labelledby="merge-dislikes-heading">
          <h3
            id="merge-dislikes-heading"
            className="text-sm font-semibold text-[#1A1A1A] mb-2"
          >
            {t('family.merge.dislikesSection')}
          </h3>
          <p className="text-xs text-[#6b6b6b] mb-3">{t('family.merge.dislikesHint')}</p>
          <ul
            className="flex flex-wrap gap-1.5"
            role="list"
            aria-label={t('family.merge.dislikesSection')}
          >
            {preview.mergedDislikedIngredientIds.map((id) => (
              <li
                key={id}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium"
              >
                {id}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Macro targets — real-wins */}
      <section aria-labelledby="merge-macros-heading">
        <h3
          id="merge-macros-heading"
          className="text-sm font-semibold text-[#1A1A1A] mb-2"
        >
          {t('family.merge.macroSection')}
        </h3>
        <p className="text-xs text-[#6b6b6b] mb-3">{t('family.merge.macroHint')}</p>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {[
            { label: t('family.merge.kcal'), source: preview.macros.kcalTargetSource },
            { label: t('family.merge.protein'), source: preview.macros.proteinTargetSource },
            { label: t('family.merge.carbs'), source: preview.macros.carbsTargetSource },
            { label: t('family.merge.fat'), source: preview.macros.fatTargetSource },
          ].map(({ label, source }) => (
            <div key={label} className="bg-[#F9F7F2] rounded-lg px-3 py-2">
              <dt className="text-xs text-[#6b6b6b]">{label}</dt>
              <dd className="text-sm font-medium text-[#1A1A1A]">
                {t(MACRO_SOURCE_LABEL[source] ?? 'family.merge.sourceNotSet')}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {!hasAnyDiff && (
        <p className="text-sm text-[#6b6b6b] italic">{t('family.merge.noDiff')}</p>
      )}

      <div className="flex flex-col gap-2 pt-2">
        <Button
          type="button"
          disabled={isPending}
          onClick={() => onConfirmClaim(Array.from(checkedAllergens))}
        >
          {isPending ? t('family.merge.confirming') : t('family.merge.confirmCta')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={onJoinWithoutClaim}
        >
          {t('family.merge.joinWithoutClaimCta')}
        </Button>
      </div>
    </div>
  )
}
