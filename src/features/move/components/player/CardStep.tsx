/**
 * Card format (PRD §5.2, §7.3 strength specifics): one exercise per card —
 * demonstration, target sets × reps (or seconds) with the weight pre-filled,
 * set entry rows, the last three results, a rest timer after each set, and
 * after the last set the one feedback question (PRD §8.2): three answers, or
 * in the first session "Mennyit tudott volna még?" 0–6+. "Másik gyakorlatot"
 * opens the substitutes.
 */
import { useState } from 'react'
import { Check, Repeat } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMoveT } from '../../lib/register'
import { MOVE_ACCENT } from '../../lib/constants'
import type { ExerciseFeedbackDto, PlayerSessionDto, PlayerStepDto, SetLogDto } from '../../types'
import type { PlayerAction, PlayerState } from '../../lib/playerState'
import { StepMedia } from './StepMedia'
import { Countdown } from './Countdown'

interface CardStepProps {
  step: PlayerStepDto
  session: PlayerSessionDto
  state: PlayerState
  dispatch: (a: PlayerAction) => void
  paused: boolean
  onSwap: (exerciseId: string) => void
}

const FEEDBACK: ExerciseFeedbackDto['answer'][] = ['EASY', 'RIGHT', 'HARD']
const DEFAULT_REST = 60

export function CardStep({ step, session, state, dispatch, paused, onSwap }: CardStepProps) {
  const { t } = useMoveT(session.register)
  const exerciseId = step.exerciseId ?? `step-${step.index}`
  const sets = Math.max(1, step.sets ?? 1)
  const timed = (step.targetSeconds ?? null) !== null && (step.targetReps ?? null) === null
  const logs = state.setLogs.filter((l) => l.exerciseId === exerciseId)
  const feedback = state.exerciseFeedback.find((f) => f.exerciseId === exerciseId) ?? null
  const [restAfter, setRestAfter] = useState<number | null>(null)
  const [drafts, setDrafts] = useState<Record<number, { weight: string; value: string }>>({})

  const logged = (i: number) => logs.find((l) => l.setIndex === i) ?? null
  const allDone = logs.length >= sets
  // the last exercise of the session needs no rest after it; every other one gets a rest before the next exercise
  const lastStep = step.index >= Math.max(...session.steps.map((s) => s.index))
  const draft = (i: number) => {
    const d = drafts[i]
    const existing = logged(i)
    return {
      weight: d?.weight ?? (existing?.weightKg ?? step.targetWeightKg ?? '').toString(),
      value: d?.value ?? (timed ? existing?.seconds ?? step.targetSeconds ?? '' : existing?.reps ?? step.targetReps ?? '').toString(),
    }
  }
  const setDraft = (i: number, patch: Partial<{ weight: string; value: string }>) =>
    setDrafts((cur) => ({ ...cur, [i]: { ...draft(i), ...patch } }))

  const markDone = (i: number) => {
    const d = draft(i)
    const num = (s: string) => (s.trim() === '' ? null : Number(s))
    const log: SetLogDto = {
      exerciseId,
      setIndex: i,
      weightKg: step.weighted || (step.targetWeightKg !== null && step.targetWeightKg !== undefined) ? num(d.weight) : null,
      reps: timed ? null : num(d.value),
      seconds: timed ? num(d.value) : null,
    }
    dispatch({ type: 'SET_LOG', log })
    if (i < sets - 1 || !lastStep) setRestAfter(i)
  }

  const targetLine = timed
    ? t('player.card.targetSeconds', { sets, seconds: step.targetSeconds })
    : t('player.card.target', { sets, reps: step.targetReps ?? '–' })

  const chip = (on: boolean) =>
    cn(
      'min-h-12 px-3 rounded-[12px] border text-base font-medium transition-colors',
      on ? 'text-white border-transparent' : 'bg-white text-[#1A1A1A] border-[#e5e4e7] hover:bg-[#F9F7F2]',
    )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-headline font-bold text-[#1A1A1A]">{step.title}</h2>
        <p className="text-lg text-[#1A1A1A] mt-1">
          {targetLine}
          {step.targetWeightKg != null && <> · {t('player.card.targetWeight', { kg: step.targetWeightKg })}</>}
        </p>
        {step.instruction && <p className="text-base text-gray-700 mt-1">{step.instruction}</p>}
      </div>

      <StepMedia step={step} paused={paused} />

      {step.lastResults && step.lastResults.length > 0 && (
        <p className="text-base text-gray-700">
          <span className="font-medium text-[#1A1A1A]">{t('player.card.lastResults')}:</span> {step.lastResults.slice(0, 3).join(' · ')}
        </p>
      )}

      <ol className="space-y-2" aria-label={targetLine}>
        {Array.from({ length: sets }, (_, i) => i).map((i) => {
          const done = logged(i)
          const d = draft(i)
          return (
            <li key={i} className={cn('rounded-[12px] border p-3 flex flex-wrap items-center gap-2 bg-white', done ? 'border-transparent' : 'border-[#e5e4e7]')} style={done ? { backgroundColor: 'rgba(42,157,143,0.12)' } : undefined}>
              <span className="text-base font-medium text-[#1A1A1A] w-24">{t('player.card.setRow', { index: i + 1 })}</span>
              {(step.weighted || step.targetWeightKg != null) && (
                <label className="flex items-center gap-1 text-sm text-gray-700">
                  <span className="sr-only">{t('player.card.weightKg')}</span>
                  <Input type="number" inputMode="decimal" step="0.5" min={0} value={d.weight} onChange={(e) => setDraft(i, { weight: e.target.value })} disabled={!!done} className="w-20 min-h-12 text-base" aria-label={t('player.card.weightKg')} />
                  kg
                </label>
              )}
              <label className="flex items-center gap-1 text-sm text-gray-700">
                <Input type="number" inputMode="numeric" min={0} value={d.value} onChange={(e) => setDraft(i, { value: e.target.value })} disabled={!!done} className="w-20 min-h-12 text-base" aria-label={timed ? t('player.card.seconds') : t('player.card.reps')} />
                {timed ? t('player.card.seconds').toLowerCase() : t('player.card.reps').toLowerCase()}
              </label>
              {done ? (
                <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={() => dispatch({ type: 'CLEAR_SET_LOG', exerciseId, setIndex: i })}>
                  {t('player.card.setUndo')}
                </Button>
              ) : (
                <Button type="button" size="md" className="ml-auto bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F]" onClick={() => markDone(i)}>
                  <Check className="h-5 w-5" aria-hidden />
                  {t('player.card.setDone')}
                </Button>
              )}
            </li>
          )
        })}
      </ol>

      {restAfter !== null && (!allDone || !lastStep) && (
        <div className="rounded-[12px] border border-[#e5e4e7] bg-white p-3 space-y-2">
          <Countdown seconds={step.restSeconds ?? DEFAULT_REST} running={!paused} resetKey={restAfter}
            label={allDone ? t('player.card.restBeforeNext') : t('player.card.rest')} onDone={() => setRestAfter(null)} />
          <Button type="button" variant="secondary" onClick={() => setRestAfter(null)}>{t('player.card.restSkip')}</Button>
        </div>
      )}

      {allDone && (
        <fieldset className="rounded-[12px] border border-[#e5e4e7] bg-white p-4 space-y-3">
          <legend className="px-1 text-lg font-headline font-bold text-[#1A1A1A]">
            {session.firstSession && step.targetWeightKg != null ? t('player.card.startingLoadQ') : t('player.card.feedbackQ')}
          </legend>
          {session.firstSession && step.targetWeightKg != null ? (
            <>
              <p className="text-sm text-gray-600">{t('player.card.startingLoadHint')}</p>
              <div className="grid grid-cols-7 gap-1" role="radiogroup">
                {[0, 1, 2, 3, 4, 5, 6].map((n) => {
                  const on = feedback?.repsInReserve === n
                  return (
                    <button key={n} type="button" role="radio" aria-checked={on} className={chip(on)} style={on ? { backgroundColor: MOVE_ACCENT } : undefined}
                      onClick={() => dispatch({ type: 'FEEDBACK', feedback: { exerciseId, answer: n >= 6 ? 'EASY' : n >= 2 ? 'RIGHT' : 'HARD', repsInReserve: n } })}>
                      {n === 6 ? t('player.card.sixPlus') : n}
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup">
              {FEEDBACK.map((a) => {
                const on = feedback?.answer === a && feedback.repsInReserve == null
                return (
                  <button key={a} type="button" role="radio" aria-checked={on} className={chip(on)} style={on ? { backgroundColor: MOVE_ACCENT } : undefined}
                    onClick={() => dispatch({ type: 'FEEDBACK', feedback: { exerciseId, answer: a } })}>
                    {t(`player.card.feedback.${a}`)}
                  </button>
                )
              })}
            </div>
          )}
        </fieldset>
      )}

      <CuesAndFaults cues={step.cues} faults={step.faults} t={t} />

      {step.exerciseId && (
        <Button type="button" variant="ghost" onClick={() => onSwap(step.exerciseId!)} className="self-start">
          <Repeat className="h-4 w-4" aria-hidden />
          {t('player.card.swap')}
        </Button>
      )}
    </div>
  )
}

export function CuesAndFaults({ cues, faults, t }: { cues: string[]; faults: string[]; t: (k: string) => string }) {
  if (cues.length === 0 && faults.length === 0) return null
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {cues.length > 0 && (
        <div>
          <p className="text-base font-medium text-[#1A1A1A]">{t('player.cues')}</p>
          <ul className="list-disc pl-5 text-base text-gray-700 space-y-0.5">{cues.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
      )}
      {faults.length > 0 && (
        <div>
          <p className="text-base font-medium text-[#1A1A1A]">{t('player.faults')}</p>
          <ul className="list-disc pl-5 text-base text-gray-700 space-y-0.5">{faults.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
      )}
    </div>
  )
}
