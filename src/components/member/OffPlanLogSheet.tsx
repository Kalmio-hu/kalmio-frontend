/**
 * OffPlanLogSheet — bottom sheet / modal that lets a member log a meal
 * that wasn't on their plan.
 *
 * Flow:
 * 1. Entry point is "Something else" from MemberMealSlot or floating CTA.
 * 2. Member picks an off-plan recipe (quick options or free-text).
 * 3. If there was a planned counterpart, the DispositionPicker appears.
 *
 * BE4 DEPENDENCY: The disposition submit path is stubbed — the off-plan meal
 * is logged via the existing POST /api/dashboard/off-plan-meals endpoint,
 * but the disposition record is not yet sent to the backend (BE4 not built).
 * The `plannedMealId` prop is stored in component state ready to wire up
 * when BE4 `POST /api/plans/{planId}/meals/{mealId}/disposition` lands.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { offPlanMealsService } from '@/services/offPlanMeals'
import { DispositionPicker } from './DispositionPicker'
import type { OffPlanDispositionType } from '@/types'

/** i18n key suffixes under offPlan.quickOptions.*  */
const QUICK_OPTION_KEYS = ['gyros', 'szendvics', 'salata', 'teszta', 'pizza', 'leves'] as const

export interface FamilyRecipient {
  userId: string
  displayName: string
  conflictingAllergens: string[]
}

interface OffPlanLogSheetProps {
  /** If logging from a planned slot, pass its ID for disposition pairing. */
  plannedMealId?: string | null
  /** Today's date ISO "YYYY-MM-DD". */
  date: string
  /** Family members who can receive the food (meal owner excluded). */
  familyRecipients?: FamilyRecipient[]
  onClose: () => void
}

type Step = 'pick-meal' | 'disposition'

export function OffPlanLogSheet({
  plannedMealId,
  date,
  familyRecipients = [],
  onClose,
}: OffPlanLogSheetProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [step, setStep] = useState<Step>('pick-meal')
  const [displayName, setDisplayName] = useState('')
  const [loggedMealId, setLoggedMealId] = useState<string | null>(null)

  const logMutation = useMutation({
    mutationFn: () =>
      offPlanMealsService.log({
        date,
        displayName: displayName.trim(),
        // Macros intentionally zero — member can't enter them here; the log
        // is for disposition tracking, not precise macro counting.
        kcal: 0,
      }),
    onSuccess: data => {
      setLoggedMealId(data.id)
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['offPlanMeals', date] })
      if (plannedMealId) {
        // Move to disposition step so the member can say what happened to the
        // planned food. BE4 will consume this when available.
        setStep('disposition')
      } else {
        onClose()
      }
    },
  })

  // BE4 stub: disposition is selected but not submitted to backend yet.
  // The signature preserves the full data shape so wiring to BE4 is one-line.
  function handleDispositionConfirm(
    disposition: OffPlanDispositionType,
    recipientUserId?: string,
    allergenAcknowledged?: boolean,
  ) {
    // TODO (BE4): POST /api/plans/{planId}/meals/{plannedMealId}/disposition
    // with { disposition, recipientUserId, allergenAcknowledged }
    // loggedMealId is available for correlation.
    void disposition
    void recipientUserId
    void allergenAcknowledged
    void loggedMealId
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label={t('offPlan.sheet.title')}
    >
      <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl pb-safe shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#f0ede8]">
          <h2 className="font-semibold text-[#1a1a1a] text-base">{t('offPlan.sheet.title')}</h2>
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6b7280] hover:bg-[#f3f4f6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7942]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {step === 'pick-meal' && (
            <>
              {/* Quick options */}
              <div>
                <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-2">
                  {t('offPlan.sheet.quickOptions')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_OPTION_KEYS.map(key => {
                    const label = t(`offPlan.quickOptions.${key}`)
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setDisplayName(label)}
                        className={`
                          px-3 py-1.5 rounded-full text-sm border transition-colors
                          ${displayName === label
                            ? 'bg-[#4F7942] text-white border-[#4F7942]'
                            : 'bg-white text-[#1a1a1a] border-[#e5e7eb] hover:bg-[#f3f4f6]'}
                        `}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Free-text entry */}
              <div>
                <label htmlFor="offplan-name" className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5">
                  {t('offPlan.sheet.freeName')}
                </label>
                <input
                  id="offplan-name"
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder={t('offPlan.sheet.freeNamePlaceholder')}
                  maxLength={100}
                  className="
                    w-full px-3 py-2.5 rounded-xl border border-[#e5e7eb] text-sm text-[#1a1a1a]
                    placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#4F7942]
                  "
                />
              </div>

              {/* Log button */}
              <button
                type="button"
                onClick={() => logMutation.mutate()}
                disabled={!displayName.trim() || logMutation.isPending}
                className="
                  w-full py-3 rounded-xl bg-[#4f7942] text-white text-sm font-semibold
                  hover:bg-[#3d6132] transition-colors disabled:opacity-40
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f7942]
                "
              >
                {logMutation.isPending ? t('offPlan.sheet.logging') : t('offPlan.sheet.log')}
              </button>

              {logMutation.isError && (
                <p className="text-sm text-red-600">{t('common.errorGeneric')}</p>
              )}
            </>
          )}

          {step === 'disposition' && (
            <DispositionPicker
              familyRecipients={familyRecipients}
              onConfirm={handleDispositionConfirm}
              onCancel={onClose}
              isSubmitting={false}
            />
          )}
        </div>
      </div>
    </div>
  )
}
