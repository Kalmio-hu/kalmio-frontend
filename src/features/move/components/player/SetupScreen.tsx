/**
 * Set-up screen of the supported pack (PRD §7.8): where to prop the phone
 * (1.5–2 m away, at chest height) and that the counter or a chair is at hand.
 * One tap, "Készen állok", then the first step.
 */
import { Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMoveT } from '../../lib/register'
import { MOVE_ACCENT } from '../../lib/constants'
import type { Register } from '../../types'

interface SetupScreenProps {
  register: Register
  setupLine: string | null
  onReady: () => void
}

export function SetupScreen({ register, setupLine, onReady }: SetupScreenProps) {
  const { t } = useMoveT(register)
  return (
    <div className="flex-1 flex flex-col gap-6">
      <h1 className="text-2xl font-headline font-bold text-[#1A1A1A]">{t('player.setup.title')}</h1>
      <div className="rounded-[16px] bg-white border border-[#e5e4e7] p-5 flex flex-col items-center gap-4">
        <svg viewBox="0 0 240 140" className="w-full max-w-sm" role="img" aria-hidden focusable="false">
          <line x1="10" y1="120" x2="230" y2="120" stroke="#D1D5DB" strokeWidth="3" strokeLinecap="round" />
          {/* person */}
          <circle cx="60" cy="40" r="12" fill="#9CA3AF" />
          <rect x="50" y="54" width="20" height="40" rx="8" fill="#9CA3AF" />
          <rect x="50" y="94" width="8" height="26" rx="3" fill="#9CA3AF" />
          <rect x="62" y="94" width="8" height="26" rx="3" fill="#9CA3AF" />
          {/* counter */}
          <rect x="22" y="70" width="26" height="6" rx="2" fill="#6B7280" />
          <rect x="24" y="76" width="4" height="44" fill="#6B7280" />
          {/* distance */}
          <line x1="80" y1="66" x2="186" y2="66" stroke={MOVE_ACCENT} strokeWidth="2" strokeDasharray="5 4" />
          <text x="133" y="60" textAnchor="middle" fontSize="12" fill={MOVE_ACCENT} fontFamily="sans-serif">1,5–2 m</text>
          {/* phone on a stand at chest height */}
          <rect x="190" y="52" width="18" height="32" rx="3" fill="#1A1A1A" />
          <rect x="193" y="55" width="12" height="22" rx="1" fill={MOVE_ACCENT} />
          <rect x="186" y="84" width="26" height="36" rx="2" fill="#D1D5DB" />
        </svg>
        <p className="flex items-start gap-3 text-base text-[#1A1A1A]">
          <Smartphone className="h-6 w-6 shrink-0" aria-hidden style={{ color: MOVE_ACCENT }} />
          {setupLine ?? t('player.setup.line')}
        </p>
        <p className="text-base text-gray-700">{t('player.setup.support')}</p>
      </div>
      <Button size="lg" className="bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F] mt-auto" onClick={onReady}>
        {t('player.setup.ready')}
      </Button>
    </div>
  )
}
