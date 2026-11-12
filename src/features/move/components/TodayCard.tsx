/**
 * Today card (PRD §7.3): modality, minutes, one line, and three actions —
 * Kezdés / Másikat kérek / Ma nem megy. Rest days show "Pihenőnap" and
 * tomorrow in one line. Never a calorie number.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Play, Shuffle, MoonStar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { refusalReason } from '../lib/weekView'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { useMoveT } from '../lib/register'
import { MOVE_ACCENT, MOVE_SESSION } from '../lib/constants'
import { SessionLogEditor } from './SessionLogEditor'
import type { LifeStateKind, NotTodayChoice, SessionDto } from '../types'

interface TodayCardProps {
  session: SessionDto | null
  restDay: boolean
  tomorrowLine: string | null
  lifeState?: LifeStateKind
  /** Plain-words coupling line, present only when nutrition is active. */
  couplingLine?: string | null
  gapLine?: boolean
}

const ACCENT_BUTTON = 'bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F]'

export function TodayCard({ session, restDay, tomorrowLine, lifeState, couplingLine, gapLine }: TodayCardProps) {
  const { t } = useMoveT()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [choosing, setChoosing] = useState(false)

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: moveKeys.all })
    void qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const swap = useMutation({
    mutationFn: (id: string) => moveService.swapSession(id, { variant: 'OTHER' }),
    onSuccess: () => {
      toast({ title: t('today.swapped'), variant: 'success' })
      invalidate()
    },
    onError: (err) => toast({ title: refusalReason(err) || t('common.error'), variant: 'destructive' }),
  })

  const notToday = useMutation({
    mutationFn: ({ id, choice }: { id: string; choice: NotTodayChoice }) => moveService.notToday(id, { choice }),
    onSuccess: (res, vars) => {
      setChoosing(false)
      invalidate()
      if (vars.choice === 'SHORTER') {
        navigate(`${MOVE_SESSION(res.session?.id ?? vars.id)}?planB=1`)
        return
      }
      toast({ title: vars.choice === 'UNWELL' ? t('today.unwellSet') : t('today.moved'), variant: 'success' })
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  const busy = swap.isPending || notToday.isPending

  if (lifeState && lifeState !== 'ACTIVE') {
    return (
      <article className="move-block bg-white rounded-[16px] border border-[#e5e4e7] shadow-sm p-5">
        <p className="text-base text-[#1A1A1A]">{t(`today.lifeState.${lifeState}`)}</p>
      </article>
    )
  }

  if (restDay || !session) {
    return (
      <article className="move-block bg-white rounded-[16px] border border-[#e5e4e7] shadow-sm p-5 space-y-1">
        <p className="flex items-center gap-2 font-headline font-bold text-[#1A1A1A]">
          <MoonStar className="h-5 w-5" aria-hidden style={{ color: MOVE_ACCENT }} />
          {restDay ? t('today.restDay') : t('today.empty')}
        </p>
        {tomorrowLine && <p className="text-sm text-gray-600">{t('today.tomorrow', { line: tomorrowLine })}</p>}
        {couplingLine && <p className="text-sm text-gray-600">{couplingLine}</p>}
      </article>
    )
  }

  return (
    <article
      className="move-block bg-white rounded-[16px] border shadow-sm p-5 space-y-4"
      style={{ borderColor: `${MOVE_ACCENT}55` }}
      aria-labelledby={`move-today-${session.id}`}
    >
      <div className="space-y-1">
        {gapLine && <p className="text-sm text-gray-600">{t('today.gapLine')}</p>}
        <h3 id={`move-today-${session.id}`} className="font-headline text-lg font-bold text-[#1A1A1A]">
          {t('today.sessionLabel', { modality: session.modalityName, minutes: session.durationMin })}
        </h3>
        {session.firstSession && (
          <p className="text-sm" style={{ color: MOVE_ACCENT }}>
            {t('today.firstOffer', { minutes: session.durationMin })}
          </p>
        )}
        {session.expectLine && <p className="text-base text-gray-700">{session.expectLine}</p>}
        {couplingLine && <p className="text-sm text-gray-600">{couplingLine}</p>}
      </div>

      {session.status === 'DONE' || session.status === 'PLAN_B' ? (
        <div className="space-y-3">
          <p className="text-base font-semibold" style={{ color: MOVE_ACCENT }} aria-live="polite">
            {session.status === 'PLAN_B' ? t('today.donePlanB') : t('today.doneToday')}
          </p>
          <SessionLogEditor sessionId={session.id} />
        </div>
      ) : !choosing ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            size="lg"
            className={`${ACCENT_BUTTON} flex-1`}
            onClick={() => navigate(MOVE_SESSION(session.id))}
            disabled={busy}
          >
            <Play className="h-5 w-5" aria-hidden />
            {t('today.start')}
          </Button>
          <Button size="lg" variant="secondary" onClick={() => swap.mutate(session.id)} disabled={busy}>
            <Shuffle className="h-5 w-5" aria-hidden />
            {t('today.other')}
          </Button>
          <Button size="lg" variant="ghost" onClick={() => setChoosing(true)} disabled={busy}>
            {t('today.notToday')}
          </Button>
        </div>
      ) : (
        <fieldset className="space-y-2" aria-live="polite">
          <legend className="text-sm font-medium text-[#1A1A1A]">{t('today.notTodayQuestion')}</legend>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button size="lg" variant="secondary" disabled={busy} onClick={() => notToday.mutate({ id: session.id, choice: 'SHORTER' })}>
              {t('today.shorter')}
            </Button>
            <Button size="lg" variant="secondary" disabled={busy} onClick={() => notToday.mutate({ id: session.id, choice: 'LATER' })}>
              {t('today.later')}
            </Button>
            <Button size="lg" variant="secondary" disabled={busy} onClick={() => notToday.mutate({ id: session.id, choice: 'UNWELL' })}>
              {t('today.unwell')}
            </Button>
            <Button size="lg" variant="ghost" disabled={busy} onClick={() => setChoosing(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </fieldset>
      )}
    </article>
  )
}
