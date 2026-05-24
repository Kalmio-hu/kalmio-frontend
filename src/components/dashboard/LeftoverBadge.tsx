/**
 * LeftoverBadge — KALMIO-321
 *
 * Rendered on Tue/Wed meal cards (the non-first-consumption meals in a batch
 * prep) to indicate that a batch was prepared on an earlier day and no prep
 * action is needed today.
 *
 * Tap scrolls back to the source meal card (the day the batch was prepared).
 * The source card ID is passed via `sourceMealCardId`; the parent handles the
 * actual scroll via `onTapSource`.
 *
 * Label: "maradvány · {sourceLabel}" (HU) / "leftover · {sourceLabel}" (EN)
 */

import { useTranslation } from 'react-i18next'

interface LeftoverBadgeProps {
  /** Human-readable label for the source meal, e.g. "Vasárnap vacsora" / "Sun dinner". */
  sourceLabel: string
  /** Called when the badge is tapped — parent scrolls to source card. */
  onTapSource: () => void
}

export function LeftoverBadge({ sourceLabel, onTapSource }: LeftoverBadgeProps) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={onTapSource}
      aria-label={t('dashboard.prep.leftover.tapAriaLabel', { source: sourceLabel })}
      className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 select-none"
    >
      {/* Plate with left-arrow to suggest "came from earlier" */}
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
      </svg>
      <span>{t('dashboard.prep.leftover.badge')}</span>
      <span className="text-amber-500 font-normal">{sourceLabel}</span>
    </button>
  )
}
