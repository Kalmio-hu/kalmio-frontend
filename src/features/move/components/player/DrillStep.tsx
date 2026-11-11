/**
 * Drill format (PRD §5.2): top-down set-up diagram (`diagramUrl`, or the
 * inline cones-and-wall drawing), the task, repetitions or time, and a 1–5
 * self-score that goes into the completion payload.
 */
import { cn } from '@/lib/utils'
import { useMoveT } from '../../lib/register'
import { MOVE_ACCENT } from '../../lib/constants'
import type { PlayerAction, PlayerState } from '../../lib/playerState'
import type { PlayerSessionDto, PlayerStepDto } from '../../types'
import { ConesDiagram } from './Figures'
import { Countdown } from './Countdown'
import { CuesAndFaults } from './CardStep'
import { StepMedia } from './StepMedia'

interface DrillStepProps {
  step: PlayerStepDto
  session: PlayerSessionDto
  state: PlayerState
  dispatch: (a: PlayerAction) => void
  paused: boolean
}

export function DrillStep({ step, session, state, dispatch, paused }: DrillStepProps) {
  const { t } = useMoveT(session.register)
  const score = state.selfScores.find((s) => s.stepIndex === step.index)?.score ?? null
  const hasMedia = !!step.media || !!step.pictogramUrl

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-headline font-bold text-[#1A1A1A]">{step.title}</h2>
      </div>

      <figure className="rounded-[16px] bg-white border border-[#e5e4e7] p-3">
        {step.diagramUrl ? (
          <img src={step.diagramUrl} alt={t('player.drill.diagramAlt')} className="w-full max-h-[40vh] object-contain rounded-[12px]" />
        ) : (
          <ConesDiagram className="w-full max-h-[40vh]" title={t('player.drill.diagramAlt')} />
        )}
      </figure>

      {hasMedia && <StepMedia step={step} paused={paused} />}

      <div className="rounded-[12px] border border-[#e5e4e7] bg-white p-4 space-y-2">
        <p className="text-base font-medium text-[#1A1A1A]">{t('player.drill.task')}</p>
        <p className="text-lg text-[#1A1A1A]">{step.instruction}</p>
        {step.targetReps != null && <p className="text-lg text-gray-700">{step.sets ? `${step.sets} × ` : ''}{step.targetReps} {t('player.card.reps').toLowerCase()}</p>}
        {step.targetSeconds != null && <Countdown seconds={step.targetSeconds} running={!paused} resetKey={step.index} compact />}
      </div>

      {step.selfScore !== false && (
        <fieldset className="rounded-[12px] border border-[#e5e4e7] bg-white p-4 space-y-2">
          <legend className="px-1 text-lg font-headline font-bold text-[#1A1A1A]">{t('player.drill.selfScoreQ')}</legend>
          <p className="text-sm text-gray-600">{t('player.drill.selfScoreHint')}</p>
          <div className="grid grid-cols-5 gap-2" role="radiogroup">
            {[1, 2, 3, 4, 5].map((n) => {
              const on = score === n
              return (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => dispatch({ type: 'SELF_SCORE', stepIndex: step.index, score: n })}
                  className={cn('min-h-12 rounded-[12px] border text-lg font-semibold', on ? 'text-white border-transparent' : 'bg-white text-[#1A1A1A] border-[#e5e4e7] hover:bg-[#F9F7F2]')}
                  style={on ? { backgroundColor: MOVE_ACCENT } : undefined}
                >
                  {n}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      <CuesAndFaults cues={step.cues} faults={step.faults} t={t} />
    </div>
  )
}
