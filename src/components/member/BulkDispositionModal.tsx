/**
 * BulkDispositionModal — shown when a member is being removed from a plan.
 *
 * BE4 DEPENDENCY (KALMIO-214): The confirm path that calls BE4's
 * `POST /api/plans/{planId}/members/{userId}/confirm-removal` endpoint
 * is STUBBED. The modal renders fully but the confirm button fires onConfirm
 * with the selections without posting to the backend.
 *
 * Triggered from:
 * - FE1's family settings (member removal)
 * - FE2's plan member-edit UI
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, Info } from 'lucide-react'
import type { OffPlanDispositionType } from '@/types'

export interface PlannedSlotStub {
  plannedMealId: string
  date: string         // "YYYY-MM-DD"
  mealType: string
  recipeName: string | null
}

export interface BulkDispositionResult {
  global: OffPlanDispositionType
  perSlot: Record<string, OffPlanDispositionType>
}

interface BulkDispositionModalProps {
  memberName: string
  slots: PlannedSlotStub[]
  onConfirm: (result: BulkDispositionResult) => void
  onCancel: () => void
  isSubmitting?: boolean
}

const DISPOSITION_OPTIONS: { value: OffPlanDispositionType; labelKey: string }[] = [
  { value: 'RETURNED_TO_FRIDGE', labelKey: 'offPlan.disposition.returnedToFridge' },
  { value: 'WASTED', labelKey: 'offPlan.disposition.wasted' },
  { value: 'GIVEN_TO_OTHER', labelKey: 'offPlan.disposition.givenToOther' },
]

export function BulkDispositionModal({
  memberName,
  slots,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: BulkDispositionModalProps) {
  const { t } = useTranslation()
  const [globalDisposition, setGlobalDisposition] = useState<OffPlanDispositionType>('RETURNED_TO_FRIDGE')
  const [perSlot, setPerSlot] = useState<Record<string, OffPlanDispositionType>>({})
  const [customizeOpen, setCustomizeOpen] = useState(false)

  function handlePerSlot(mealId: string, val: OffPlanDispositionType) {
    setPerSlot(prev => ({ ...prev, [mealId]: val }))
  }

  function handleConfirm() {
    onConfirm({ global: globalDisposition, perSlot })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-disposition-title"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-[#f0ede8]">
          <h2 id="bulk-disposition-title" className="font-semibold text-[#1a1a1a] text-base leading-snug">
            {t('offPlan.bulkDisposition.title', { name: memberName, count: slots.length })}
          </h2>
          <p className="text-sm text-[#6b7280] mt-1">
            {t('offPlan.bulkDisposition.subtitle', { count: slots.length })}
          </p>
        </div>

        {/* BE4 stub notice */}
        <div className="mx-5 mt-4 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[#f0f9ff] border border-[#bae6fd] text-xs text-[#0369a1]">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{t('offPlan.disposition.stubNotice')}</span>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Global disposition selector */}
          <div>
            <p className="text-sm font-semibold text-[#1a1a1a] mb-2">{t('offPlan.bulkDisposition.applyToAll')}</p>
            <div className="space-y-2">
              {DISPOSITION_OPTIONS.map(opt => (
                <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  globalDisposition === opt.value
                    ? 'border-[#4f7942] bg-green-50'
                    : 'border-[#e5e7eb] hover:bg-[#f9f7f2]'
                }`}>
                  <input
                    type="radio"
                    name="global-disposition"
                    value={opt.value}
                    checked={globalDisposition === opt.value}
                    onChange={() => setGlobalDisposition(opt.value)}
                    className="accent-[#4f7942]"
                  />
                  <span className="text-sm text-[#1a1a1a]">{t(opt.labelKey)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Per-slot customization toggle */}
          <button
            type="button"
            onClick={() => setCustomizeOpen(o => !o)}
            className="flex items-center gap-2 text-sm font-semibold text-[#4F7942] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7942] rounded"
          >
            {customizeOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {t('offPlan.bulkDisposition.customizePerSlot')}
          </button>

          {customizeOpen && (
            <div className="space-y-3">
              {slots.map(slot => {
                const current = perSlot[slot.plannedMealId] ?? globalDisposition
                return (
                  <div key={slot.plannedMealId} className="rounded-xl border border-[#e5e7eb] p-3">
                    <p className="text-xs text-[#6b7280] mb-1">{slot.date} · {slot.mealType}</p>
                    <p className="text-sm font-semibold text-[#1a1a1a] mb-2 truncate">
                      {slot.recipeName ?? t('member.slot.noRecipe')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {DISPOSITION_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handlePerSlot(slot.plannedMealId, opt.value)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                            current === opt.value
                              ? 'bg-[#4F7942] text-white border-[#4F7942]'
                              : 'border-[#e5e7eb] text-[#6b7280] hover:bg-[#f3f4f6]'
                          }`}
                        >
                          {t(opt.labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 pb-5 pt-3 border-t border-[#f0ede8] flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl border border-[#e5e7eb] text-sm text-[#6b7280] hover:bg-[#f3f4f6] transition-colors disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl bg-[#4f7942] text-white text-sm font-semibold hover:bg-[#3d6132] transition-colors disabled:opacity-40"
          >
            {isSubmitting ? t('common.save') + '…' : t('offPlan.bulkDisposition.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
