/**
 * AttachMealPicker — KALMIO-328
 *
 * Keyboard-accessible picker that opens when the user activates the
 * "Attach to meal" button on a standalone prep ball. Shows the list of
 * valid meals this prep task can attach to (its feedsPlannedMealIds set).
 *
 * Rendered as a small popover/dropdown (not a full dialog) to keep the
 * interaction lightweight. Closes on Escape or outside click.
 *
 * A11y:
 *  - role="listbox" + role="option" so screen readers announce it as a selection list.
 *  - First option receives focus on open.
 *  - Escape closes without selection.
 */

import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

export interface MealPickerOption {
  mealId: string
  /** Localized meal label, e.g. "Reggeli — Zabkása" */
  label: string
}

interface AttachMealPickerProps {
  options: MealPickerOption[]
  onSelect: (mealId: string) => void
  onClose: () => void
}

export function AttachMealPicker({ options, onSelect, onClose }: AttachMealPickerProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const firstOptionRef = useRef<HTMLButtonElement>(null)

  // Focus first option on mount.
  useEffect(() => {
    firstOptionRef.current?.focus()
  }, [])

  // Close on outside click.
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [onClose])

  // Close on Escape.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      ref={containerRef}
      role="listbox"
      aria-label={t('dashboard.prep.attach.pickerTitle')}
      className="absolute z-30 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-md py-1 min-w-[180px] max-w-[240px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-1 pb-1.5 border-b border-gray-100">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
          {t('dashboard.prep.attach.pickerTitle')}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="text-gray-400 hover:text-gray-600 transition-colors rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
        >
          <X className="h-3 w-3" aria-hidden />
        </button>
      </div>

      {/* Options */}
      {options.length === 0 ? (
        <p className="px-3 py-2 text-[12px] text-gray-400">
          {t('dashboard.prep.attach.noOptions')}
        </p>
      ) : (
        options.map((opt, i) => (
          <button
            key={opt.mealId}
            ref={i === 0 ? firstOptionRef : undefined}
            type="button"
            role="option"
            aria-selected={false}
            onClick={() => { onSelect(opt.mealId) }}
            className="w-full text-left px-3 py-2 text-[13px] text-gray-800 hover:bg-teal-50 hover:text-teal-800 transition-colors focus-visible:outline-none focus-visible:bg-teal-50 focus-visible:text-teal-800"
          >
            {opt.label}
          </button>
        ))
      )}
    </div>
  )
}
