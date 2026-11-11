/**
 * Poolside card (PRD §5.2): a printable large-type card with pictograms —
 * the phone stays in the locker. "Nyomtatás" prints the card alone (print
 * CSS in move.css); "Megvolt" goes to the effort tap.
 */
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMoveT } from '../../lib/register'
import { chooseStepMedia } from '../../lib/mediaFallback'
import type { PlayerSessionDto } from '../../types'
import { PersonPictogram } from './Figures'
import { formatClock } from '../../lib/clock'

interface PoolsideCardProps {
  session: PlayerSessionDto
  onDone: () => void
}

export function PoolsideCard({ session, onDone }: PoolsideCardProps) {
  const { t } = useMoveT(session.register)
  return (
    <div className="flex-1 flex flex-col gap-4">
      <div className="move-no-print">
        <h1 className="text-2xl font-headline font-bold text-[#1A1A1A]">{t('player.poolside.title')}</h1>
        <p className="text-base text-gray-600 mt-1">{t('player.poolside.hint')}</p>
      </div>

      <section className="move-sheet move-print-card bg-white rounded-[16px] border border-[#e5e4e7] p-5 space-y-4" aria-label={t('player.poolside.title')}>
        <header className="flex items-baseline justify-between gap-3 border-b border-[#e5e4e7] pb-2">
          <h2 className="text-2xl font-headline font-bold text-[#1A1A1A]">{session.modalityName}</h2>
          <span className="text-lg text-gray-700">{session.date} · {t('common.minutes', { count: session.durationMin })}</span>
        </header>
        <ol className="space-y-3">
          {session.steps.map((s, i) => {
            const media = chooseStepMedia(s)
            const picto = media.kind === 'TEXT' ? media.pictogramUrl : null
            return (
              <li key={s.index} className="flex items-start gap-4 text-lg text-[#1A1A1A]">
                <span className="w-8 shrink-0 font-headline font-bold">{i + 1}.</span>
                {picto ? <img src={picto} alt="" className="h-14 w-14 object-contain shrink-0" /> : <PersonPictogram className="h-14 w-14 shrink-0" />}
                <span className="flex-1">
                  <span className="font-semibold block">{s.title}</span>
                  <span className="block">{s.instruction}</span>
                  {(s.sets || s.targetReps || s.targetSeconds) && (
                    <span className="block text-gray-700">
                      {s.sets ? `${s.sets} × ` : ''}{s.targetReps ?? ''}{s.targetSeconds != null ? formatClock(s.targetSeconds) : ''}
                    </span>
                  )}
                </span>
                <span className="h-8 w-8 shrink-0 border-2 border-[#1A1A1A] rounded-[6px]" aria-hidden />
              </li>
            )
          })}
        </ol>
        <p className="text-base text-[#1A1A1A] border-t border-[#e5e4e7] pt-3">{session.stopRule}</p>
      </section>

      <div className="move-no-print mt-auto flex flex-col sm:flex-row gap-2">
        <Button size="lg" variant="secondary" onClick={() => window.print()}>
          <Printer className="h-5 w-5" aria-hidden />
          {t('player.poolside.print')}
        </Button>
        <Button size="lg" className="bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F] flex-1" onClick={onDone}>
          {t('player.poolside.done')}
        </Button>
      </div>
    </div>
  )
}
