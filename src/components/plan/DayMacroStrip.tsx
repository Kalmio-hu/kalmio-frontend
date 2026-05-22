/**
 * DayMacroStrip — compact per-day macro readout for a DayCard header.
 *
 * Renders one tiny horizontal progress bar per macro (kcal, protein, fat, carbs)
 * with the actual gram/kcal value above it. Bars fill toward the goal; an over-
 * shoot draws a darker tip beyond 100 % so the eye notices without alarm.
 *
 * When the user has no goal for a macro the value still renders, but the bar is
 * replaced by a single dim baseline so the layout stays consistent.
 */
import { useTranslation } from 'react-i18next'
import type { MacroTargets, MacroTotals } from '@/lib/planMacros'

interface DayMacroStripProps {
  totals: MacroTotals
  targets: MacroTargets
}

const MACROS = [
  { key: 'kcal', unit: 'kcal',
    bar: 'bg-[#4f46e5]', over: 'bg-[#312e81]', track: 'bg-[#eef2ff]' },
  { key: 'protein', unit: 'g',
    bar: 'bg-[#F28C28]', over: 'bg-[#9a4e0a]', track: 'bg-[#fff4e6]' },
  { key: 'fat', unit: 'g',
    bar: 'bg-[#4F7942]', over: 'bg-[#234a1f]', track: 'bg-[#eaf3df]' },
  { key: 'carbs', unit: 'g',
    bar: 'bg-[#1A1A1A]', over: 'bg-[#000000]', track: 'bg-[#f3f4f6]' },
] as const

export function DayMacroStrip({ totals, targets }: DayMacroStripProps) {
  const { t } = useTranslation()

  return (
    <div
      className="grid grid-cols-4 gap-3"
      aria-label={t('plan.detail.macros.dayStripAria')}
    >
      {MACROS.map(({ key, unit, bar, over, track }) => {
        const value = totals[key as keyof MacroTotals]
        const target = targets[key as keyof MacroTargets]
        const hasTarget = target != null && target > 0
        const ratio = hasTarget ? value / target! : 0
        const primaryWidth = Math.min(100, ratio * 100)
        const overshoot = ratio > 1 ? Math.min(100, (ratio - 1) * 100) : 0
        const label = t(`plan.detail.macros.${key}Short`, {
          defaultValue: key,
        })

        return (
          <div key={key} className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-baseline justify-between gap-1">
              <span className="text-[10px] uppercase tracking-wide text-[#9ca3af] font-medium truncate">
                {label}
              </span>
              <span className="text-[11px] font-semibold text-[#1A1A1A] tabular-nums shrink-0">
                {Math.round(value)}
                <span className="text-[#9ca3af] font-medium ml-0.5">{unit}</span>
              </span>
            </div>
            {hasTarget ? (
              <div
                className={`relative h-1.5 rounded-full overflow-hidden ${track}`}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={Math.round(target!)}
                aria-valuenow={Math.round(value)}
              >
                <div
                  className={`absolute inset-y-0 left-0 ${bar} transition-[width]`}
                  style={{ width: `${primaryWidth}%` }}
                />
                {overshoot > 0 && (
                  <div
                    className={`absolute inset-y-0 left-0 ${over} opacity-70 transition-[width]`}
                    style={{ width: `${Math.min(100, overshoot)}%` }}
                  />
                )}
              </div>
            ) : (
              <div className={`h-1.5 rounded-full ${track}`} aria-hidden />
            )}
          </div>
        )
      })}
    </div>
  )
}
