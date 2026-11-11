/**
 * Six-region body map for the comfort question (PRD §7.4): nyak-váll, hát,
 * csípő, térd, boka-láb, kar-csukló. Each region is a 48 px+ button both on
 * the figure and in the list beside it, so colour is never the only signal.
 */
import { cn } from '@/lib/utils'
import { useMoveT } from '../../lib/register'
import { MOVE_ACCENT } from '../../lib/constants'
import type { BodyRegion } from '../../types'

const BODY_REGIONS: BodyRegion[] = ['NECK_SHOULDER', 'BACK', 'HIP', 'KNEE', 'ANKLE_FOOT', 'ARM_WRIST']

const SHAPES: Record<BodyRegion, { x: number; y: number; w: number; h: number }> = {
  NECK_SHOULDER: { x: 30, y: 34, w: 60, h: 20 },
  ARM_WRIST: { x: 4, y: 56, w: 24, h: 70 },
  BACK: { x: 36, y: 56, w: 48, h: 44 },
  HIP: { x: 36, y: 102, w: 48, h: 24 },
  KNEE: { x: 38, y: 150, w: 44, h: 20 },
  ANKLE_FOOT: { x: 36, y: 186, w: 48, h: 20 },
}

interface BodyMapProps {
  value: BodyRegion | null
  onChange: (region: BodyRegion) => void
  disabled?: boolean
}

export function BodyMap({ value, onChange, disabled }: BodyMapProps) {
  const { t } = useMoveT()
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-stretch" role="radiogroup" aria-label={t('player.completion.bodyMapLabel')}>
      <svg viewBox="0 0 120 210" className="h-64 w-auto mx-auto shrink-0" aria-hidden focusable="false">
        <circle cx="60" cy="18" r="14" fill="#D1D5DB" />
        <rect x="38" y="34" width="44" height="96" rx="14" fill="#E5E7EB" />
        <rect x="8" y="40" width="18" height="86" rx="9" fill="#E5E7EB" />
        <rect x="94" y="40" width="18" height="86" rx="9" fill="#E5E7EB" />
        <rect x="40" y="128" width="17" height="76" rx="7" fill="#E5E7EB" />
        <rect x="63" y="128" width="17" height="76" rx="7" fill="#E5E7EB" />
        {BODY_REGIONS.map((r) => {
          const s = SHAPES[r]
          const on = value === r
          return (
            <rect
              key={r}
              x={s.x}
              y={s.y}
              width={s.w}
              height={s.h}
              rx="6"
              fill={on ? MOVE_ACCENT : 'transparent'}
              fillOpacity={on ? 0.55 : 0}
              stroke={on ? MOVE_ACCENT : '#9CA3AF'}
              strokeWidth={on ? 3 : 1.5}
              strokeDasharray={on ? undefined : '3 3'}
              style={{ cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onChange(r)}
            />
          )
        })}
      </svg>
      <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 flex-1">
        {BODY_REGIONS.map((r) => {
          const on = value === r
          return (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={disabled}
              onClick={() => onChange(r)}
              className={cn(
                'min-h-12 px-4 rounded-[12px] border text-base font-medium text-left transition-colors',
                on ? 'text-white border-transparent' : 'bg-white text-[#1A1A1A] border-[#e5e4e7] hover:bg-[#F9F7F2]',
              )}
              style={on ? { backgroundColor: MOVE_ACCENT } : undefined}
            >
              {t(`player.completion.region.${r}`)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
