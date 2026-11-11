/**
 * Entry format (PRD §5.2, §7.4): time and place before; afterwards one tap
 * "Megvolt" and the effort tap → POST /api/move/entry/{id}/done {effort}.
 */
import { useState } from 'react'
import { Clock, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMoveT } from '../../lib/register'
import { MOVE_ACCENT } from '../../lib/constants'
import type { PlayerSessionDto } from '../../types'
import { EffortScale } from '../EffortScale'

interface EntryScreenProps {
  session: PlayerSessionDto
  busy: boolean
  onDone: (effort: number) => void
}

export function EntryScreen({ session, busy, onDone }: EntryScreenProps) {
  const { t } = useMoveT(session.register)
  const [asking, setAsking] = useState(false)
  const [effort, setEffort] = useState<number | null>(null)

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-headline font-bold text-[#1A1A1A]">{session.modalityName}</h1>
        <p className="text-base text-gray-600 mt-1">{t('player.entry.hint')}</p>
      </div>

      <div className="rounded-[16px] bg-white border border-[#e5e4e7] p-5 space-y-3">
        <p className="flex items-center gap-3 text-lg text-[#1A1A1A]">
          <Clock className="h-6 w-6 shrink-0" aria-hidden style={{ color: MOVE_ACCENT }} />
          <span>
            <span className="text-sm text-gray-600 block">{t('player.entry.when')}</span>
            {session.startTime ? `${session.date} · ${session.startTime} · ${t('common.minutes', { count: session.durationMin })}` : t('player.entry.noDetails')}
          </span>
        </p>
        {session.place && (
          <p className="flex items-center gap-3 text-lg text-[#1A1A1A]">
            <MapPin className="h-6 w-6 shrink-0" aria-hidden style={{ color: MOVE_ACCENT }} />
            <span>
              <span className="text-sm text-gray-600 block">{t('player.entry.where')}</span>
              {session.place}
            </span>
          </p>
        )}
      </div>

      {!asking ? (
        <Button size="lg" className="bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F] mt-auto" onClick={() => setAsking(true)}>
          {t('player.entry.done')}
        </Button>
      ) : (
        <div className="space-y-4 mt-auto" aria-live="polite">
          <p className="text-xl font-headline font-bold text-[#1A1A1A]">{t('player.completion.effortQ')}</p>
          <EffortScale value={effort} onChange={setEffort} disabled={busy} />
          <Button size="lg" className="bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F] w-full" disabled={effort === null || busy} onClick={() => effort !== null && onDone(effort)}>
            {t('player.completion.done')}
          </Button>
        </div>
      )}
    </div>
  )
}
