/**
 * CookTimerStrip — horizontal header strip showing all running timers (KALMIO-408).
 *
 * Renders a compact pill for each active timer. Tapping a pill selects it and
 * the parent mounts the full CookTimer clock face. The strip is always visible
 * when at least one timer exists; it scrolls horizontally when there are many.
 */

import { useTranslation } from 'react-i18next'
import { Timer } from 'lucide-react'
import { useCookTimersStore, timerPhase, type CookTimer } from '@/store/cookTimers'

// Derived color per phase
function phaseColor(timer: CookTimer): { bg: string; text: string; ring: string } {
  const phase = timerPhase(timer)
  if (phase === 'ready')   return { bg: '#EFF5EE', text: '#3a6030', ring: '#4F7942' }
  if (phase === 'past')    return { bg: '#FFF0EB', text: '#9b3d16', ring: '#C0522B' }
  return                          { bg: '#F3F4F6', text: '#374151', ring: '#9ca3af' }
}

function fmtElapsed(elapsedSeconds: number): string {
  const m = Math.floor(elapsedSeconds / 60)
  const s = elapsedSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

interface Props {
  selectedTimerId: string | null
  onSelect: (id: string) => void
}

export function CookTimerStrip({ selectedTimerId, onSelect }: Props) {
  const { t } = useTranslation()
  const timers = useCookTimersStore(s => s.timers)
  const timerList = Object.values(timers)

  if (timerList.length === 0) return null

  return (
    <div
      className="bg-white border-b border-[#EDEAE2] px-3 py-2 flex items-center gap-2 overflow-x-auto"
      role="region"
      aria-label={t('cook.timer.stripLabel')}
    >
      <Timer className="h-3.5 w-3.5 text-[#6b7280] shrink-0" aria-hidden />

      {timerList.map(timer => {
        const colors = phaseColor(timer)
        const isSelected = selectedTimerId === timer.id
        return (
          <button
            key={timer.id}
            type="button"
            onClick={() => onSelect(timer.id)}
            aria-pressed={isSelected}
            className="shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
            style={{
              backgroundColor: colors.bg,
              color: colors.text,
              outline: isSelected ? `2px solid ${colors.ring}` : undefined,
              outlineOffset: isSelected ? '2px' : undefined,
            }}
          >
            {/* Running indicator dot */}
            {timer.running && (
              <span
                className="inline-block h-1.5 w-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: colors.ring }}
                aria-hidden
              />
            )}
            <span className="truncate max-w-[200px]">
              {timer.recipeName ? `${timer.recipeName} – ${timer.stepLabel}` : timer.stepLabel}
            </span>
            <span className="tabular-nums opacity-80">{fmtElapsed(timer.elapsedSeconds)}</span>
          </button>
        )
      })}
    </div>
  )
}
