/**
 * Effort tap 0–10 with the three anchors "könnyű / közepes / nagyon nehéz"
 * (PRD §7.4). Eleven 48 px targets; the anchors sit under 0, 5 and 10 so the
 * scale reads without numbers too. Used by the player's completion screen,
 * the Entry "Megvolt" and the "Mást mozogtam" modal.
 */
import { cn } from '@/lib/utils'
import { useMoveT } from '../lib/register'
import { MOVE_ACCENT } from '../lib/constants'

interface EffortScaleProps {
  value: number | null
  onChange: (value: number) => void
  disabled?: boolean
  id?: string
}

export function EffortScale({ value, onChange, disabled, id }: EffortScaleProps) {
  const { t } = useMoveT()
  return (
    <div className="space-y-2" id={id}>
      <div
        role="radiogroup"
        aria-label={t('player.completion.effortQ')}
        className="grid grid-cols-11 gap-1"
      >
        {Array.from({ length: 11 }, (_, i) => i).map((n) => {
          const selected = value === n
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={t('player.completion.effortValue', { value: n })}
              disabled={disabled}
              onClick={() => onChange(n)}
              className={cn(
                'min-h-12 rounded-[10px] border text-base font-semibold transition-colors',
                selected ? 'text-white border-transparent' : 'bg-white text-[#1A1A1A] border-[#e5e4e7] hover:bg-[#F9F7F2]',
              )}
              style={selected ? { backgroundColor: MOVE_ACCENT } : undefined}
            >
              {n}
            </button>
          )
        })}
      </div>
      <div className="flex justify-between text-sm text-gray-600" aria-hidden>
        <span>{t('player.completion.anchorEasy')}</span>
        <span>{t('player.completion.anchorMid')}</span>
        <span>{t('player.completion.anchorHard')}</span>
      </div>
    </div>
  )
}
