/**
 * DispositionPicker — lets the member choose what happened to the food
 * from their planned slot.
 *
 * BE4 (KALMIO-214) DEPENDENCY: The submit path that sends the disposition to
 * the backend is STUBBED. The UI is fully rendered and interactive, but
 * `onConfirm` receives the selection without actually posting to the backend.
 * Wire up `offPlanDispositionService.submit()` when BE4 lands.
 *
 * Allergen safety: when "Given to [family member]" is selected and that
 * member has an allergen conflict, a warning badge appears next to their name
 * and selecting them shows a confirmation modal. The allergen check is also
 * stubbed (no real data from AllergenSafetyChecker yet).
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, ChevronRight, Info } from 'lucide-react'
import type { OffPlanDispositionType } from '@/types'

export interface FamilyRecipient {
  userId: string
  displayName: string
  /** Allergen names that conflict with the planned meal's ingredients. Stubbed as [] until BE4. */
  conflictingAllergens: string[]
}

interface DispositionPickerProps {
  /** Family members eligible to receive the meal (meal owner already excluded). */
  familyRecipients: FamilyRecipient[]
  /**
   * Called when the user confirms their disposition choice.
   * `allergenAcknowledged` is true when the user explicitly confirmed
   * an allergen warning modal before selecting the recipient.
   * Thread this flag through to the BE4 endpoint when it lands.
   */
  onConfirm: (
    disposition: OffPlanDispositionType,
    recipientUserId?: string,
    allergenAcknowledged?: boolean,
  ) => void
  onCancel: () => void
  /** True while the parent mutation is in-flight. */
  isSubmitting?: boolean
}

type TopLevel = OffPlanDispositionType | null

export function DispositionPicker({
  familyRecipients,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: DispositionPickerProps) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<TopLevel>('RETURNED_TO_FRIDGE')
  const [givenToOpen, setGivenToOpen] = useState(false)
  const [pendingRecipient, setPendingRecipient] = useState<FamilyRecipient | null>(null)
  const [allergenModalOpen, setAllergenModalOpen] = useState(false)
  const [chosenRecipient, setChosenRecipient] = useState<FamilyRecipient | null>(null)
  /** True once the user has explicitly confirmed an allergen warning for the chosen recipient. */
  const [allergenAcknowledged, setAllergenAcknowledged] = useState(false)

  function handleTopLevel(val: TopLevel) {
    setSelected(val)
    setGivenToOpen(val === 'GIVEN_TO_FAMILY' || val === 'GIVEN_TO_OTHER')
    setChosenRecipient(null)
    setAllergenAcknowledged(false)
  }

  function handleRecipientClick(r: FamilyRecipient) {
    if (r.conflictingAllergens.length > 0) {
      setPendingRecipient(r)
      setAllergenModalOpen(true)
    } else {
      setChosenRecipient(r)
    }
  }

  function handleAllergenConfirm() {
    setChosenRecipient(pendingRecipient)
    setPendingRecipient(null)
    setAllergenModalOpen(false)
    setAllergenAcknowledged(true)
  }

  function handleSubmit() {
    if (!selected) return
    if (selected === 'GIVEN_TO_FAMILY' && !chosenRecipient) return
    onConfirm(selected, chosenRecipient?.userId, allergenAcknowledged)
  }

  const canSubmit =
    selected !== null &&
    (selected !== 'GIVEN_TO_FAMILY' || chosenRecipient !== null)

  return (
    <div className="space-y-4">
      {/* BE4 stub notice */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[#f0f9ff] border border-[#bae6fd] text-xs text-[#0369a1]">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
        <span>{t('offPlan.disposition.stubNotice')}</span>
      </div>

      <p className="text-sm font-semibold text-[#1a1a1a]">{t('offPlan.disposition.question')}</p>

      <div className="space-y-2">
        {/* Returned to fridge — default */}
        <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
          selected === 'RETURNED_TO_FRIDGE'
            ? 'border-[#4f7942] bg-green-50'
            : 'border-[#e5e7eb] hover:bg-[#f9f7f2]'
        }`}>
          <input
            type="radio"
            name="disposition"
            value="RETURNED_TO_FRIDGE"
            checked={selected === 'RETURNED_TO_FRIDGE'}
            onChange={() => handleTopLevel('RETURNED_TO_FRIDGE')}
            className="accent-[#4f7942]"
          />
          <span className="text-sm text-[#1a1a1a]">{t('offPlan.disposition.returnedToFridge')}</span>
        </label>

        {/* Wasted */}
        <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
          selected === 'WASTED'
            ? 'border-[#dc2626] bg-red-50'
            : 'border-[#e5e7eb] hover:bg-[#f9f7f2]'
        }`}>
          <input
            type="radio"
            name="disposition"
            value="WASTED"
            checked={selected === 'WASTED'}
            onChange={() => handleTopLevel('WASTED')}
            className="accent-[#dc2626]"
          />
          <span className="text-sm text-[#1a1a1a]">{t('offPlan.disposition.wasted')}</span>
        </label>

        {/* Given to somebody else */}
        <label className={`flex flex-col gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${
          selected === 'GIVEN_TO_FAMILY' || selected === 'GIVEN_TO_OTHER'
            ? 'border-[#4F7942] bg-[#eef6eb]'
            : 'border-[#e5e7eb] hover:bg-[#f9f7f2]'
        }`}>
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="disposition"
              value="GIVEN_TO_FAMILY"
              checked={selected === 'GIVEN_TO_FAMILY' || selected === 'GIVEN_TO_OTHER'}
              onChange={() => handleTopLevel('GIVEN_TO_FAMILY')}
              className="accent-[#4F7942]"
            />
            <span className="text-sm text-[#1a1a1a]">{t('offPlan.disposition.givenToSomebody')}</span>
            <ChevronRight className={`h-4 w-4 text-[#6b7280] ml-auto transition-transform ${givenToOpen ? 'rotate-90' : ''}`} />
          </div>

          {/* Sub-picker: family members */}
          {givenToOpen && (
            <div className="mt-1 space-y-1.5 ml-6" onClick={e => e.stopPropagation()}>
              {familyRecipients.length > 0 && familyRecipients.map(r => (
                <button
                  key={r.userId}
                  type="button"
                  onClick={() => {
                    setSelected('GIVEN_TO_FAMILY')
                    handleRecipientClick(r)
                  }}
                  className={`
                    flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-left transition-colors
                    ${chosenRecipient?.userId === r.userId
                      ? 'bg-[#d4e8ce] text-[#4F7942] font-semibold'
                      : 'hover:bg-[#d4e8ce] text-[#1a1a1a]'}
                  `}
                >
                  <span className="flex-1">{r.displayName}</span>
                  {r.conflictingAllergens.length > 0 && (
                    <span
                      aria-label={t('offPlan.disposition.allergenWarning', { name: r.displayName })}
                      className="inline-flex items-center gap-1 text-amber-700 bg-amber-100 rounded px-1.5 py-0.5 text-[10px] font-semibold"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {t('offPlan.disposition.allergenBadge')}
                    </span>
                  )}
                </button>
              ))}

              {/* Somebody else (no follow-up) */}
              <button
                type="button"
                onClick={() => {
                  setSelected('GIVEN_TO_OTHER')
                  setChosenRecipient(null)
                }}
                className={`
                  flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-left transition-colors
                  ${selected === 'GIVEN_TO_OTHER'
                    ? 'bg-[#d4e8ce] text-[#4F7942] font-semibold'
                    : 'hover:bg-[#d4e8ce] text-[#1a1a1a]'}
                `}
              >
                {t('offPlan.disposition.givenToOther')}
              </button>
            </div>
          )}
        </label>
      </div>

      {/* Allergen confirmation modal */}
      {allergenModalOpen && pendingRecipient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="allergen-modal-title"
        >
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <h2 id="allergen-modal-title" className="font-semibold text-[#1a1a1a] text-sm leading-snug">
                {t('offPlan.disposition.allergenModalTitle', { name: pendingRecipient.displayName })}
              </h2>
            </div>
            <p className="text-sm text-[#6b7280] mb-5">
              {t('offPlan.disposition.allergenModalBody', {
                name: pendingRecipient.displayName,
                allergens: pendingRecipient.conflictingAllergens.join(', '),
              })}
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleAllergenConfirm}
                className="w-full py-2.5 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
              >
                {t('offPlan.disposition.allergenConfirm', { name: pendingRecipient.displayName })}
              </button>
              <button
                type="button"
                onClick={() => { setAllergenModalOpen(false); setPendingRecipient(null) }}
                className="w-full py-2.5 rounded-lg border border-[#e5e7eb] text-sm text-[#6b7280] hover:bg-[#f3f4f6] transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 py-2.5 rounded-lg border border-[#e5e7eb] text-sm text-[#6b7280] hover:bg-[#f3f4f6] transition-colors disabled:opacity-50"
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="flex-1 py-2.5 rounded-lg bg-[#4f7942] text-white text-sm font-semibold hover:bg-[#3d6132] transition-colors disabled:opacity-40"
        >
          {isSubmitting ? t('common.save') + '…' : t('offPlan.disposition.confirm')}
        </button>
      </div>
    </div>
  )
}
