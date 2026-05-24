/**
 * EmbeddedPrepChip — KALMIO-318
 *
 * Compact chip rendered near the top-right of a meal card whenever ≥1 prep
 * task is embedded in that meal.  Two states:
 *
 *   - Active:   knife icon + total prep minutes.  Tap scrolls/focuses the
 *               embedded prep list inside the same card.
 *   - Done:     green check only.  Shown when every embedded prep is DONE.
 *
 * Icon + number only — no i18n copy needed for the visible label.
 * An aria-label is provided in both languages for screen-reader users.
 */

import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface EmbeddedPrepChipProps {
  /** Total prep duration in minutes across all embedded preps. */
  totalMinutes: number
  /** When true every embedded prep is DONE — chip shows green check. */
  allDone: boolean
  /** Called when the chip is tapped — parent scrolls the prep list into view. */
  onTap: () => void
}

export function EmbeddedPrepChip({ totalMinutes, allDone, onTap }: EmbeddedPrepChipProps) {
  const { t } = useTranslation()

  if (allDone) {
    return (
      <button
        type="button"
        onClick={onTap}
        aria-label={t('dashboard.prep.chip.doneAriaLabel')}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      >
        <Check className="h-3 w-3" aria-hidden />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={t('dashboard.prep.chip.ariaLabel', { count: totalMinutes })}
      className="inline-flex items-center gap-0.5 rounded-full bg-stone-100 border border-stone-200 px-1.5 py-0.5 text-[10px] font-medium text-stone-500 shrink-0 hover:bg-stone-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 select-none"
    >
      {/* Knife SVG — Lucide does not ship a standalone "knife" icon at this weight,
          so we inline a minimal path that reads cleanly at 10px. */}
      <svg
        width="9"
        height="9"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {/* Blade */}
        <path d="M6 2 L18 14" />
        {/* Handle */}
        <path d="M14 14 L20 20" strokeWidth="3" strokeLinecap="round" />
        {/* Guard */}
        <path d="M12 12 L15 9" />
      </svg>
      {totalMinutes > 0 && (
        <span className="tabular-nums">{totalMinutes}</span>
      )}
    </button>
  )
}
