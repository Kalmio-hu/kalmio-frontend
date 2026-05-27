import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { dashboardService } from '@/services/dashboard'
import type { WeeklyDayDto } from '@/types'

// ── constants ──────────────────────────────────────────────────────────────

const KCAL_TREND_THRESHOLD = 50

// ── helpers ────────────────────────────────────────────────────────────────

function formatShortDate(isoDate: string, locale: string): string {
  const d = new Date(isoDate + 'T00:00:00')
  return d.toLocaleDateString(locale === 'hu' ? 'hu-HU' : 'en-GB', {
    month: 'numeric',
    day: 'numeric',
  })
}

function TrendIndicator({ delta }: { delta: number | null }) {
  const { t } = useTranslation()
  if (delta === null) return null

  const isUp = delta > KCAL_TREND_THRESHOLD
  const isDown = delta < -KCAL_TREND_THRESHOLD
  // within ±KCAL_TREND_THRESHOLD kcal we call it flat

  if (isUp) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium tabular-nums"
        aria-label={t('dashboard.weeklySummary.trendUp', { delta: Math.round(delta) })}
      >
        <span aria-hidden>↑</span>
        {t('dashboard.weeklySummary.trendUp', { delta: Math.round(delta) })}
      </span>
    )
  }
  if (isDown) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium tabular-nums"
        aria-label={t('dashboard.weeklySummary.trendDown', { delta: Math.round(Math.abs(delta)) })}
      >
        <span aria-hidden>↓</span>
        {t('dashboard.weeklySummary.trendDown', { delta: Math.round(Math.abs(delta)) })}
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium"
      aria-label={t('dashboard.weeklySummary.trendFlat')}
    >
      <span aria-hidden>→</span>
      {t('dashboard.weeklySummary.trendFlat')}
    </span>
  )
}

// ── bar chart ──────────────────────────────────────────────────────────────

interface BarProps {
  day: WeeklyDayDto
  maxKcal: number
  locale: string
}

function DayBar({ day, maxKcal, locale }: BarProps) {
  const { t } = useTranslation()
  const [showTooltip, setShowTooltip] = useState(false)

  const actualPct = maxKcal > 0 ? Math.min(100, (day.kcal / maxKcal) * 100) : 0
  const targetPct = maxKcal > 0 ? Math.min(100, (day.target.kcal / maxKcal) * 100) : 0

  const label = formatShortDate(day.date, locale)
  const tooltipText = t('dashboard.weeklySummary.dayTooltip', {
    date: label,
    actual: Math.round(day.kcal),
    target: Math.round(day.target.kcal),
  })

  return (
    <div className="relative flex flex-col items-center gap-1 flex-1 min-w-0">
      {/* tooltip */}
      {showTooltip && (
        <div
          role="tooltip"
          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-lg bg-[#1A1A1A] text-white text-[11px] px-2.5 py-1.5 shadow-lg pointer-events-none"
        >
          {tooltipText}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1A1A1A]" aria-hidden />
        </div>
      )}

      {/* bar area */}
      <button
        type="button"
        className="w-full h-20 flex items-end justify-center gap-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-1 rounded"
        aria-label={tooltipText}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
      >
        {/* actual bar */}
        <div
          className="w-3 rounded-t-sm bg-[#F28C28] transition-all duration-300"
          style={{ height: `${actualPct}%`, minHeight: actualPct > 0 ? 2 : 0 }}
          aria-hidden
        />
        {/* target bar (faint) */}
        <div
          className="w-1.5 rounded-t-sm bg-[#e5e4e7] transition-all duration-300"
          style={{ height: `${targetPct}%`, minHeight: targetPct > 0 ? 2 : 0 }}
          aria-hidden
        />
      </button>

      {/* day label */}
      <span className="text-[10px] text-gray-400 tabular-nums truncate max-w-full">
        {label}
      </span>
    </div>
  )
}

// ── main module ────────────────────────────────────────────────────────────

export function WeeklySummaryModule() {
  const { t, i18n } = useTranslation()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'weekly-summary', 7] as const,
    queryFn: () => dashboardService.getWeeklySummary(7),
    staleTime: 30_000,
  })

  // Always render the card — show a skeleton while loading, empty-state when
  // there is no data (API not yet available, network error, or genuinely zero
  // history). Returning null here made the section invisible to new users.
  const hasData = data != null && data.compliancePct !== null
  const maxKcal = data != null && data.daily.length > 0
    ? Math.max(...data.daily.map(d => Math.max(d.kcal, d.target.kcal)), 1)
    : 1

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-headline font-bold text-[#1A1A1A]">
          {t('dashboard.weeklySummary.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">

        {isLoading ? (
          /* Loading skeleton — card stays visible so the layout does not jump */
          <div className="space-y-3 animate-pulse">
            <div className="h-8 w-24 rounded bg-gray-100" aria-hidden />
            <div className="flex items-end gap-1 w-full h-20">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-1 rounded-t-sm bg-gray-100" style={{ height: `${40 + (i % 3) * 20}%` }} aria-hidden />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* compliance row */}
            {hasData ? (
              <div className="flex items-center justify-between gap-2">
                <p className="text-2xl font-headline font-bold text-[#1A1A1A] tabular-nums leading-none">
                  {Math.round(data!.compliancePct as number)}%
                </p>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-xs text-gray-500 text-right">
                    {t('dashboard.weeklySummary.complianceLabel')}
                  </p>
                  <TrendIndicator delta={data!.weekOverWeekDeltaKcal} />
                </div>
              </div>
            ) : (
              <div className="py-2">
                <p className="text-sm text-gray-700 font-medium">
                  {t('dashboard.weeklySummary.emptyState')}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {t('dashboard.weeklySummary.emptyStateHint')}
                </p>
              </div>
            )}

            {/* average actual vs target */}
            {hasData && (
              <div className="flex gap-4 text-xs text-gray-600">
                <div className="min-w-0 flex-1">
                  <span className="block text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
                    {t('dashboard.weeklySummary.avgActual')}
                  </span>
                  <span className="font-semibold tabular-nums text-sm">
                    {Math.round(data!.averageActual.kcal)}{' '}
                    <span className="font-normal text-gray-400">{t('dashboard.weeklySummary.kcalUnit')}</span>
                  </span>
                  <div className="mt-1 space-y-0.5 text-[11px] text-gray-500 tabular-nums">
                    <div>
                      <span className="text-gray-400">{t('dashboard.weeklySummary.protein')}</span>{' '}
                      {Math.round(data!.averageActual.protein)}{' '}
                      <span className="text-gray-400">/ {Math.round(data!.averageTarget.protein)} g</span>
                    </div>
                    <div>
                      <span className="text-gray-400">{t('dashboard.weeklySummary.fat')}</span>{' '}
                      {Math.round(data!.averageActual.fat)}{' '}
                      <span className="text-gray-400">
                        {(data!.averageTarget.fat ?? 0) > 0
                          ? `/ ${Math.round(data!.averageTarget.fat)} g`
                          : 'g'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">{t('dashboard.weeklySummary.carbs')}</span>{' '}
                      {Math.round(data!.averageActual.carbs)}{' '}
                      <span className="text-gray-400">
                        {(data!.averageTarget.carbs ?? 0) > 0
                          ? `/ ${Math.round(data!.averageTarget.carbs)} g`
                          : 'g'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-px bg-gray-100 self-stretch" aria-hidden />
                <div className="min-w-0">
                  <span className="block text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
                    {t('dashboard.weeklySummary.avgTarget')}
                  </span>
                  <span className="font-semibold tabular-nums text-sm">
                    {Math.round(data!.averageTarget.kcal)}{' '}
                    <span className="font-normal text-gray-400">{t('dashboard.weeklySummary.kcalUnit')}</span>
                  </span>
                </div>
              </div>
            )}

            {/* day-by-day bar chart */}
            {data != null && data.daily.length > 0 && (
              <div
                role="img"
                aria-label={t('dashboard.weeklySummary.chartAriaLabel')}
                className="flex items-end gap-1 w-full"
              >
                {data.daily.map(day => (
                  <DayBar
                    key={day.date}
                    day={day}
                    maxKcal={maxKcal}
                    locale={i18n.language}
                  />
                ))}
              </div>
            )}

            {/* legend */}
            {data != null && data.daily.length > 0 && (
              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-2 rounded-sm bg-[#F28C28]" aria-hidden />
                  {t('dashboard.weeklySummary.legendActual')}
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-1.5 h-2 rounded-sm bg-[#e5e4e7]" aria-hidden />
                  {t('dashboard.weeklySummary.legendTarget')}
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
