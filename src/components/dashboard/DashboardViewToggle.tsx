/**
 * DashboardViewToggle — segmented Daily | Calendar control.
 *
 * KALMIO-308
 *
 * Renders two labelled buttons as a pill-shaped toggle. The active segment
 * is visually distinct. No icons — labels only (billionaire's-assistant tone:
 * functional, no decorative chrome).
 *
 * Keyboard: both buttons are reachable via Tab; Space/Enter activate.
 * WCAG 2.1 AA: contrast on the active segment passes 4.5:1 against #FEF3E7.
 */
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export type DashboardView = 'daily' | 'calendar'

interface DashboardViewToggleProps {
  view: DashboardView
  onChange: (view: DashboardView) => void
}

export function DashboardViewToggle({ view, onChange }: DashboardViewToggleProps) {
  const { t } = useTranslation()

  return (
    <div
      role="radiogroup"
      aria-label={t('dashboard.view.toggleLabel')}
      className="inline-flex rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-800"
    >
      {(['daily', 'calendar'] as DashboardView[]).map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={view === v}
          onClick={() => onChange(v)}
          className={cn(
            'rounded-md px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-1',
            view === v
              ? 'bg-white text-[#1A1A1A] shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
              : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200',
          )}
        >
          {t(`dashboard.view.${v}`)}
        </button>
      ))}
    </div>
  )
}
