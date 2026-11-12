/**
 * SpaceSwitcher — "Étrend | Mozgás" (movement-prd.md D8 rule 3).
 *
 * Rendered in the nutrition Header and in the Move shell header. Shows
 * whenever Move is active: nutrition is the base product, and "no saved meal
 * preferences" is not proof that the member does not use it (founder,
 * 2026-11-12 — the switcher vanished and the dashboard became unreachable). Imports from
 * the Move feature index only (ESLint boundary, contract §2).
 */
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Utensils, Footprints } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMoveStatus, MOVE_ACCENT } from '@/features/move'

interface SpaceSwitcherProps {
  /** Dark variant for the Move shell's dark rail. */
  tone?: 'light' | 'dark'
  className?: string
}

export function SpaceSwitcher({ tone = 'light', className }: SpaceSwitcherProps) {
  const { t } = useTranslation('move')
  const { status, setLastSpace } = useMoveStatus()
  const location = useLocation()
  const navigate = useNavigate()

  if (!status.enabled || !status.spaceActive) return null

  const inMove = location.pathname.startsWith('/app/move')

  const go = (space: 'NUTRITION' | 'MOVE') => {
    void setLastSpace(space)
    navigate(space === 'MOVE' ? '/app/move' : '/app')
  }

  const base =
    'inline-flex items-center gap-1.5 px-3 min-h-12 text-sm font-semibold rounded-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1'
  const idle = tone === 'dark' ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:bg-black/5'

  return (
    <div
      role="group"
      aria-label={t('switcher.label')}
      className={cn(
        'inline-flex items-center p-1 rounded-[12px] border',
        tone === 'dark' ? 'border-white/15 bg-white/5' : 'border-[#e5e4e7] bg-white',
        className,
      )}
    >
      <button
        type="button"
        aria-pressed={!inMove}
        onClick={() => go('NUTRITION')}
        className={cn(base, !inMove ? 'bg-[#F28C28] text-white' : idle)}
      >
        <Utensils className="h-4 w-4" aria-hidden />
        {t('switcher.nutrition')}
      </button>
      <span className={cn('px-1 text-xs', tone === 'dark' ? 'text-white/30' : 'text-gray-300')} aria-hidden>
        |
      </span>
      <button
        type="button"
        aria-pressed={inMove}
        onClick={() => go('MOVE')}
        className={cn(base, inMove ? 'text-white' : idle)}
        style={inMove ? { backgroundColor: MOVE_ACCENT } : undefined}
      >
        <Footprints className="h-4 w-4" aria-hidden />
        {t('switcher.move')}
      </button>
    </div>
  )
}
