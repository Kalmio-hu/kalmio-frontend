/**
 * Target format (PRD §5.2, §8.3 tier 0): steps with a duration and an effort
 * band plus the talk-test text, a big elapsed timer, the spoken cue shown as
 * large text (PRD §7.8), and the segment list with the current one marked.
 */
import { Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMoveT } from '../../lib/register'
import { MOVE_ACCENT } from '../../lib/constants'
import { advancesAutomatically, elapsedMs, type PlayerAction, type PlayerState } from '../../lib/playerState'
import { useNow } from '../../lib/useNow'
import type { PlayerSessionDto, PlayerStepDto } from '../../types'
import { Countdown } from './Countdown'
import { formatClock } from '../../lib/clock'

interface TargetStepProps {
  step: PlayerStepDto
  session: PlayerSessionDto
  state: PlayerState
  dispatch: (a: PlayerAction) => void
  paused: boolean
  onAutoNext: () => void
}

const BAND_TONE: Record<string, string> = {
  EASY: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  MODERATE: 'bg-amber-50 text-amber-900 border-amber-200',
  HARD: 'bg-red-50 text-red-900 border-red-200',
}

export function TargetStep({ step, session, state, dispatch, paused, onAutoNext }: TargetStepProps) {
  const { t } = useMoveT(session.register)
  const now = useNow(!paused)
  const elapsed = elapsedMs(state, now)
  const band = step.effortBand ?? null
  const segments = state.steps.filter((s) => s.kind === 'TARGET' || s.targetSeconds != null)

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[16px] bg-white border border-[#e5e4e7] p-5 text-center">
        <p className="text-sm text-gray-600">{t('player.target.elapsed')}</p>
        <p className="text-6xl font-headline font-bold tabular-nums text-[#1A1A1A]" aria-live="off">{formatClock(elapsed / 1000)}</p>
        {paused && <p className="mt-1 text-base text-gray-600">{t('player.paused')}</p>}
      </div>

      <div>
        <h2 className="text-2xl font-headline font-bold text-[#1A1A1A]">{step.title}</h2>
        {step.instruction && <p className="text-lg text-[#1A1A1A] mt-1">{step.instruction}</p>}
      </div>

      {band && (
        <div className={cn('rounded-[12px] border p-4', BAND_TONE[band])}>
          <p className="text-lg font-semibold">
            {t(`player.target.band.${band}`)}
            {step.targetSeconds != null && <> · {formatClock(step.targetSeconds)}</>}
          </p>
          <p className="text-base mt-0.5">{step.talkTest ?? t(`player.target.talk.${band}`)}</p>
        </div>
      )}

      {step.spokenCue && (
        <p className="flex items-start gap-3 rounded-[12px] bg-[#1A1A1A] text-white p-4 text-2xl font-headline font-bold leading-snug">
          <Volume2 className="h-7 w-7 shrink-0 mt-1" aria-hidden style={{ color: MOVE_ACCENT }} />
          <span>
            <span className="sr-only">{t('player.target.cueLabel')}: </span>
            {step.spokenCue}
          </span>
        </p>
      )}

      {step.targetSeconds != null && (
        <div className="rounded-[12px] border border-[#e5e4e7] bg-white p-4">
          <Countdown
            seconds={step.autoAdvanceSeconds ?? step.targetSeconds}
            running={!paused}
            resetKey={step.index}
            onDone={advancesAutomatically(step) ? onAutoNext : undefined}
            compact
          />
        </div>
      )}

      {segments.length > 1 && (
        <ol className="rounded-[12px] border border-[#e5e4e7] bg-white divide-y divide-[#e5e4e7]" aria-label={t('player.target.segments')}>
          {segments.map((s) => {
            const current = s.index === step.index
            const done = s.index < step.index
            return (
              <li key={s.index} className={cn('flex items-center justify-between gap-3 px-4 min-h-12', current && 'font-semibold')} style={current ? { borderLeft: `4px solid ${MOVE_ACCENT}` } : undefined} aria-current={current ? 'step' : undefined}>
                <button type="button" className="text-left text-base text-[#1A1A1A] flex-1 min-h-12" onClick={() => dispatch({ type: 'GO_TO', index: s.index })}>
                  {done ? '✓ ' : ''}{s.title}
                </button>
                <span className="text-sm text-gray-600 tabular-nums">
                  {s.targetSeconds != null ? formatClock(s.targetSeconds) : ''}
                  {s.effortBand ? ` · ${t(`player.target.band.${s.effortBand}`)}` : ''}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
