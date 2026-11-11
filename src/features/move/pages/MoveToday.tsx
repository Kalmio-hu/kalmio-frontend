/**
 * "Ma" — the Move home (PRD §7.3, §7.5, §7.6, §7.7, §7.8). Order on screen:
 * check-in, life state, pending diff, gap offer, health questions card,
 * today card, "Elestem", self-test, "Mást mozogtam". Never a calorie.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { MovePageFrame } from '../components/MovePageFrame'
import { CheckInStrip } from '../components/CheckInStrip'
import { TodayCard } from '../components/TodayCard'
import { ReplanDiffCard } from '../components/ReplanDiffCard'
import { LifeStateBanner } from '../components/LifeStateBanner'
import { FallDialog } from '../components/FallDialog'
import { HealthRescreenDialog } from '../components/HealthRescreenDialog'
import { SelfTestPrompt } from '../components/SelfTestPrompt'
import { LogUnplannedModal } from '../components/LogUnplannedModal'
import { FamilySessionCard } from '../components/FamilySessionCard'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { useMoveT } from '../lib/register'
import { MOVE_SESSION } from '../lib/constants'

const ACCENT_BUTTON = 'bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F]'
const GAP_DAYS = 7

export function MoveToday() {
  const { t, register } = useMoveT()
  const navigate = useNavigate()
  const q = useQuery({ queryKey: moveKeys.today, queryFn: moveService.getToday, staleTime: 30_000 })
  const today = q.data
  const profile = useQuery({ queryKey: moveKeys.profile, queryFn: moveService.getProfile, staleTime: 60_000 })
  const familyAges = (profile.data?.familySessionAges?.length ?? 0) > 0
  const [fallOpen, setFallOpen] = useState(false)
  const [rescreenOpen, setRescreenOpen] = useState(false)
  const [rescreenText, setRescreenText] = useState<string | undefined>(undefined)
  const [logOpen, setLogOpen] = useState(false)

  const active = today?.lifeState === 'ACTIVE'
  const supported = today?.supportedLevel ?? null
  const showFall = supported === 'L0' || supported === 'L1' || supported === 'L2'
  const offer = today?.session ?? today?.firstSessionOffer ?? null
  const gap = !!today && active && today.gapDays >= GAP_DAYS && !!offer

  return (
    <MovePageFrame title={t('today.title')} isLoading={q.isPending} isError={q.isError} onRetry={() => void q.refetch()}>
      {today && (
        <div className="flex flex-col gap-3">
          {active && <CheckInStrip date={today.date} checkIn={today.checkIn} />}

          {!active && <LifeStateBanner lifeState={today.lifeState} until={today.lifeStateUntil} returnQuestionDue={today.returnQuestionDue} />}

          {today.pendingDiff && <ReplanDiffCard diff={today.pendingDiff} />}

          {gap && offer && (
            <article className="move-block bg-white rounded-[16px] border border-[#e5e4e7] shadow-sm p-5 space-y-3">
              <h2 className="font-headline text-lg font-bold text-[#1A1A1A]">{t('today.gap.title')}</h2>
              <p className="text-base text-gray-700 move-body">{t('today.gap.offer')}</p>
              <Button size="lg" className={ACCENT_BUTTON} onClick={() => navigate(`${MOVE_SESSION(offer.id)}?planB=1`)}>
                {t('today.gap.cta')}
              </Button>
            </article>
          )}

          {today.screeningPending && (
            <article className="move-block bg-white rounded-[16px] border border-[#e5e4e7] shadow-sm p-5 space-y-3">
              <h2 className="font-headline text-lg font-bold text-[#1A1A1A]">{t('today.screeningPending.title')}</h2>
              <p className="text-base text-gray-700 move-body">{t('today.screeningPending.body')}</p>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => {
                  setRescreenText(undefined)
                  setRescreenOpen(true)
                }}
              >
                {t('today.screeningPending.cta')}
              </Button>
            </article>
          )}

          {active && (
            <TodayCard
              session={offer}
              restDay={today.restDay && !today.firstSessionOffer}
              tomorrowLine={today.tomorrowLine}
              lifeState={today.lifeState}
              gapLine={today.gapDays > 0 && today.gapDays < GAP_DAYS}
            />
          )}

          {active && <FamilySessionCard enabled={familyAges} />}

          {today.selfTest && <SelfTestPrompt due={today.selfTest.due} latest={today.selfTest.latest} previous={today.selfTest.previous} />}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {showFall && (
              <Button size="lg" variant="secondary" onClick={() => setFallOpen(true)} className="border-[#1A1A1A]/30">
                {t('today.fallButton')}
              </Button>
            )}
            <button
              type="button"
              onClick={() => setLogOpen(true)}
              className="text-base underline underline-offset-4 text-gray-700 hover:text-[#1A1A1A] px-3 rounded-lg"
            >
              {t('today.unplanned')}
            </button>
          </div>

          <FallDialog
            open={fallOpen}
            onOpenChange={setFallOpen}
            onReported={() => {
              setRescreenText(t('fall.done'))
              setRescreenOpen(true)
            }}
          />
          <HealthRescreenDialog open={rescreenOpen} onOpenChange={setRescreenOpen} register={register} description={rescreenText} />
          <LogUnplannedModal open={logOpen} onOpenChange={setLogOpen} defaultDate={today.date} />
        </div>
      )}
    </MovePageFrame>
  )
}
