/**
 * MoistureHistoryStrip — 14-day soil-moisture history below the DiofaWidget.
 *
 * Renders 14 small circles (dots) in a horizontal row, oldest on the left
 * and today on the right. Each dot is coloured per the day's moisture band:
 *
 *   DRY       → amber  (#d97706 bg)
 *   DRYING    → tan    (#a16207 bg)
 *   MOIST     → green  (#16a34a bg)
 *   SATURATED → dark green (#166534 bg)
 *
 * A tooltip appears on hover/focus showing the formatted date (no score value).
 *
 * Mobile target: the strip fits under 360px with no horizontal scroll.
 * WCAG 2.1 AA: each dot is keyboard-focusable and has an aria-label.
 *
 * Mounting: consume in the Diófa section of Dashboard.tsx once KALMIO-134 lands.
 * Example usage:
 *   <MoistureHistoryStrip />
 */

import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { todayIsoLocal } from '@/lib/utils'
import { useState } from 'react'
import { momentumService } from '@/services/momentum'
import type { MomentumHistoryEntry } from '@/types'
import { dotClassName } from './diofaUtils'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(isoDate: string, locale: string): string {
  try {
    const d = new Date(`${isoDate}T00:00:00`)
    return d.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })
  } catch {
    return isoDate
  }
}

// ─── Skeleton placeholder ─────────────────────────────────────────────────────

function StripSkeleton({ ariaLabel }: { ariaLabel: string }) {
  return (
    <div
      aria-busy="true"
      aria-label={ariaLabel}
      className="flex items-center justify-between gap-1 px-1 py-2"
    >
      {Array.from({ length: 14 }).map((_, i) => (
        <div
          key={i}
          className="h-4 w-4 rounded-full bg-neutral-200 animate-pulse shrink-0"
        />
      ))}
    </div>
  )
}

// ─── Single dot ──────────────────────────────────────────────────────────────

interface DotProps {
  entry: MomentumHistoryEntry
  isToday: boolean
  locale: string
  bandLabel: string
}

function Dot({ entry, isToday, locale, bandLabel }: DotProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const formattedDate = formatDate(entry.date, locale)
  const label = `${formattedDate} — ${bandLabel}`

  return (
    <div className="relative flex flex-col items-center shrink-0">
      <button
        type="button"
        aria-label={label}
        className={dotClassName(entry.band, isToday)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
      />

      {showTooltip && (
        <div
          role="tooltip"
          className={[
            'absolute bottom-full mb-1 whitespace-nowrap',
            'rounded bg-neutral-800 px-2 py-1 text-xs text-white shadow-md',
            'pointer-events-none z-10',
          ].join(' ')}
        >
          {formattedDate}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface MoistureHistoryStripProps {
  /** Number of days to fetch and display. Default: 14. */
  days?: number
  /** Extra classes applied to the outer wrapper. */
  className?: string
}

export function MoistureHistoryStrip({
  days = 14,
  className = '',
}: MoistureHistoryStripProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'hu' ? 'hu-HU' : 'en-GB'

  const { data, isLoading, isError } = useQuery({
    queryKey: ['momentum', 'history', days],
    queryFn: () => momentumService.getHistory(days),
    staleTime: 30_000,
  })

  if (isLoading) {
    return (
      <div className={['w-full max-w-[360px] mx-auto', className].join(' ')}>
        <StripSkeleton ariaLabel={t('diofa.history.ariaLabel', { days })} />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div
        className={[
          'w-full max-w-[360px] mx-auto text-center text-xs text-neutral-400 py-2',
          className,
        ].join(' ')}
      >
        {t('diofa.history.error')}
      </div>
    )
  }

  const todayIso = todayIsoLocal()

  return (
    <div
      className={['w-full max-w-[360px] mx-auto', className].join(' ')}
      aria-label={t('diofa.history.ariaLabel', { days })}
    >
      <div className="flex items-center justify-between gap-1 px-1 py-2">
        {data.map(entry => (
          <Dot
            key={entry.date}
            entry={entry}
            isToday={entry.date === todayIso}
            locale={locale}
            bandLabel={t(`diofa.history.bands.${entry.band}`)}
          />
        ))}
      </div>
    </div>
  )
}
