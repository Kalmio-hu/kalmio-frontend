/**
 * Flow format (PRD §5.2, §8.4): timed units with a count. In the supported
 * pack (`autoAdvance` false) the count is shown and the screen moves only on
 * "Tovább"; otherwise a visible countdown with a pause control advances by
 * itself. "Könnyebbet" / "Nehezebbet" switch to the sibling unit and the
 * choice goes into the completion payload.
 */
import { ArrowDown, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { useMoveT } from '../../lib/register'
import { advancesAutomatically, type PlayerAction } from '../../lib/playerState'
import type { PlayerSessionDto, PlayerStepDto } from '../../types'
import { StepMedia } from './StepMedia'
import { Countdown } from './Countdown'
import { CuesAndFaults } from './CardStep'

interface FlowStepProps {
  step: PlayerStepDto
  session: PlayerSessionDto
  dispatch: (a: PlayerAction) => void
  paused: boolean
  onAutoNext: () => void
}

export function FlowStep({ step, session, dispatch, paused, onAutoNext }: FlowStepProps) {
  const { t } = useMoveT(session.register)
  const auto = advancesAutomatically(step)
  const seconds = step.autoAdvanceSeconds ?? step.targetSeconds ?? null
  const family = session.characterCode === 'BOGYO'

  const sibling = (direction: 'EASIER' | 'HARDER') => {
    dispatch({ type: 'SIBLING', direction })
    toast({ title: direction === 'EASIER' ? t('player.flow.switchedEasier') : t('player.flow.switchedHarder'), variant: 'success' })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-headline font-bold text-[#1A1A1A]">{step.title}</h2>
        {step.instruction && <p className="text-lg text-[#1A1A1A] mt-1">{step.instruction}</p>}
      </div>

      <StepMedia step={step} paused={paused} family={family} />

      <div className="rounded-[12px] border border-[#e5e4e7] bg-white p-4 space-y-2">
        {step.count != null && (
          <p className="text-2xl font-headline font-bold text-[#1A1A1A]">{t('player.flow.count', { count: step.count })}</p>
        )}
        {auto && seconds ? (
          <Countdown seconds={seconds} running={!paused} resetKey={`${step.index}-${step.unitId ?? ''}`} onDone={onAutoNext} />
        ) : (
          <>
            {seconds != null && <p className="text-lg text-gray-700">{t('player.flow.seconds', { count: seconds })}</p>}
            <p className="text-base text-gray-600">{t('player.flow.tapWhenDone')}</p>
          </>
        )}
      </div>

      {(step.easier || step.harder) && (
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="secondary" size="lg" disabled={!step.easier} onClick={() => sibling('EASIER')}>
            <ArrowDown className="h-5 w-5" aria-hidden />
            {t('player.flow.easier')}
          </Button>
          <Button type="button" variant="secondary" size="lg" disabled={!step.harder} onClick={() => sibling('HARDER')}>
            <ArrowUp className="h-5 w-5" aria-hidden />
            {t('player.flow.harder')}
          </Button>
        </div>
      )}

      <CuesAndFaults cues={step.cues} faults={step.faults} t={t} />
    </div>
  )
}
