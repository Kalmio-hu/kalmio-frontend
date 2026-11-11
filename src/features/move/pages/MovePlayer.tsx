/**
 * Session player — full screen, outside both shells (PRD §7.3, §17).
 *
 * Flow: four dials (skip-able) → POST /api/move/sessions/{id}/start → set-up
 * screen for the supported pack → one instruction per screen by format →
 * completion (effort tap, comfort question) → POST …/complete.
 * `?planB=1` lands here from the today card's "Csak rövidebbet" and starts
 * with POST …/plan-b straight away.
 *
 * Offline: the started PlayerSessionDto and the reducer state live in
 * localStorage under `kalmio.move.player.{sessionId}`; a reload resumes at the
 * same step with the entered sets. Completion, Entry "Megvolt" and media
 * reports are ordinary mutations — when the network is down the service
 * worker's BackgroundSync queue replays them and the UI shows "queued".
 */
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, OctagonX, Pause, Play, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { SyncQueueBanner } from '@/lib/syncQueue'
import { useMoveStatus } from '../lib/useMoveStatus'
import { useMoveT } from '../lib/register'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { MOVE_ACCENT, MOVE_HOME } from '../lib/constants'
import {
  clearSnapshot,
  currentStep,
  initialState,
  isLastStep,
  loadSnapshot,
  playerReducer,
  saveSnapshot,
  type PlayerAction,
  type PlayerState,
} from '../lib/playerState'
import { buildCompletion, durationMinutes, type ComfortAnswer } from '../lib/completion'
import { isOfflineError } from '../lib/offline'
import { useWakeLock } from '../lib/useWakeLock'
import { useNow } from '../lib/useNow'
import type { BodyRegion, PlayerSessionDto, StartSessionRequest } from '../types'
import { DialsScreen } from '../components/player/DialsScreen'
import { SetupScreen } from '../components/player/SetupScreen'
import { CardStep, CuesAndFaults } from '../components/player/CardStep'
import { FlowStep } from '../components/player/FlowStep'
import { TargetStep } from '../components/player/TargetStep'
import { DrillStep } from '../components/player/DrillStep'
import { EntryScreen } from '../components/player/EntryScreen'
import { PoolsideCard } from '../components/player/PoolsideCard'
import { CompletionScreen } from '../components/player/CompletionScreen'
import { ExerciseSwapSheet } from '../components/player/ExerciseSwapSheet'
import { StepMedia } from '../components/player/StepMedia'
import { Countdown } from '../components/player/Countdown'
import '../move.css'

const SNAPSHOT_MAX_AGE_MS = 24 * 60 * 60_000
const ACCENT_BUTTON = 'bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F]'

function reducer(state: PlayerState | null, action: PlayerAction): PlayerState | null {
  if (action.type === 'INIT') return initialState(action.session, action.now)
  if (!state) return state
  return playerReducer(state, action)
}

export function MovePlayer() {
  const { sessionId = '' } = useParams<{ sessionId: string }>()
  const [params] = useSearchParams()
  const planB = params.get('planB') === '1'
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { status, isLoading } = useMoveStatus()

  const [snapshot] = useState(() => {
    const s = loadSnapshot(sessionId)
    return s && Date.now() - s.savedAt <= SNAPSHOT_MAX_AGE_MS ? s : null
  })
  const [session, setSession] = useState<PlayerSessionDto | null>(snapshot?.session ?? null)
  const [state, dispatch] = useReducer(reducer, snapshot?.state ?? null)
  const [swapExerciseId, setSwapExerciseId] = useState<string | null>(null)
  const [queued, setQueued] = useState(false)
  const now = useNow(state?.phase === 'DONE', 60_000)

  const { t } = useMoveT(session?.register ?? null)

  // Dial defaults (only needed before the session starts).
  const needDefaults = !session && !planB && status.enabled
  const profile = useQuery({ queryKey: moveKeys.profile, queryFn: moveService.getProfile, staleTime: 60_000, enabled: needDefaults })
  const equipment = useQuery({ queryKey: moveKeys.equipment, queryFn: moveService.getEquipment, staleTime: 60_000, enabled: needDefaults })
  const today = useQuery({ queryKey: moveKeys.today, queryFn: moveService.getToday, staleTime: 30_000, enabled: needDefaults })
  const plannedSession = useMemo(() => {
    const d = today.data
    if (!d) return null
    return [d.session, d.firstSessionOffer].find((s) => s?.id === sessionId) ?? null
  }, [today.data, sessionId])

  const start = useMutation({
    mutationFn: (req: StartSessionRequest) => (planB ? moveService.planB(sessionId) : moveService.startSession(sessionId, req)),
    onSuccess: (dto) => {
      setSession(dto)
      dispatch({ type: 'INIT', session: dto, now: Date.now() })
      qc.setQueryData(moveKeys.session(sessionId), dto)
    },
    onError: () => toast({ title: t('player.error'), variant: 'destructive' }),
  })

  // Plan B has no dials: start as soon as the gate answers.
  useEffect(() => {
    if (planB && !session && status.enabled && start.isIdle) start.mutate({})
  }, [planB, session, status.enabled, start])

  // Persist every change; resume toast once.
  useEffect(() => {
    if (session && state && state.phase !== 'DONE') saveSnapshot({ session, state, savedAt: Date.now() })
  }, [session, state])
  useEffect(() => {
    if (snapshot) toast({ title: t('player.resumeLine'), variant: 'success' })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on mount
  }, [])

  useWakeLock(!!session && state?.phase === 'STEPS')

  const finishLocally = useCallback(
    (wasQueued: boolean) => {
      clearSnapshot(sessionId)
      setQueued(wasQueued)
      dispatch({ type: 'COMPLETED' })
      void qc.invalidateQueries({ queryKey: moveKeys.all })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
    [qc, sessionId],
  )

  const complete = useMutation({
    mutationFn: (args: { effort: number; comfort: ComfortAnswer | null; region: BodyRegion | null }) =>
      moveService.completeSession(
        sessionId,
        buildCompletion({ state: state!, effort: args.effort, comfort: args.comfort, region: args.region, now: Date.now(), plannedMin: session?.durationMin ?? 15 }),
      ),
    onSuccess: () => finishLocally(false),
    onError: (err) => (isOfflineError(err) ? finishLocally(true) : toast({ title: t('common.error'), variant: 'destructive' })),
  })

  const entryDone = useMutation({
    mutationFn: (effort: number) => moveService.entryDone(sessionId, { effort }),
    onSuccess: () => finishLocally(false),
    onError: (err) => (isOfflineError(err) ? finishLocally(true) : toast({ title: t('common.error'), variant: 'destructive' })),
  })

  const shorter = useMutation({
    mutationFn: () => moveService.shorterSession(sessionId),
    onMutate: () => {
      dispatch({ type: 'SHORTER' })
      toast({ title: t('player.shortened'), variant: 'success' })
    },
    onError: (err) => {
      if (!isOfflineError(err)) toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F9F7F2]" role="status">
        <Spinner className="border-[#2A9D8F]" />
      </div>
    )
  }
  if (!status.enabled) return <Navigate to="/app" replace />

  const large = session ? session.textSize === 'LARGE' : profile.data?.textSize === 'LARGE'
  const step = state ? currentStep(state) : null
  const inSteps = !!session && state?.phase === 'STEPS'
  const stepFormat = session && session.format !== 'ENTRY' && session.format !== 'POOLSIDE'
  const paused = !!state?.paused

  const onAutoNext = () => dispatch({ type: 'NEXT' })

  const body = () => {
    if (!session || !state) {
      if (planB || start.isPending) {
        return (
          <div className="flex-1 flex flex-col items-center justify-center gap-3" role="status">
            <Spinner className="border-[#2A9D8F]" />
            <p className="text-base text-gray-600">{t('player.loading')}</p>
          </div>
        )
      }
      if (start.isError && planB) {
        return (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <p className="text-base text-gray-700">{t('player.error')}</p>
            <Button variant="secondary" onClick={() => start.mutate({})}>{t('common.retry')}</Button>
          </div>
        )
      }
      return (
        <DialsScreen
          sessionId={sessionId}
          format={plannedSession?.format ?? null}
          date={plannedSession?.date}
          defaults={{
            minutes: plannedSession?.durationMin ?? profile.data?.minutes ?? null,
            equipment: equipment.data?.items ?? [],
            characterCode: profile.data?.characterCode ?? null,
          }}
          onStart={(req) => start.mutate(req)}
          busy={start.isPending}
        />
      )
    }

    if (state.phase === 'SETUP') {
      return <SetupScreen register={session.register} setupLine={session.setupLine} onReady={() => dispatch({ type: 'SETUP_DONE', now: Date.now() })} />
    }

    if (state.phase === 'DONE') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-3xl font-headline font-bold text-[#1A1A1A]">{t('player.completion.saved')}</p>
          <p className="text-lg text-gray-700">
            {session.modalityName} · {t('player.completion.durationLine', { minutes: durationMinutes(state, now, session.durationMin) })}
          </p>
          {queued && <p className="text-base text-gray-700">{t('player.completion.queued')}</p>}
          <Button size="lg" className={ACCENT_BUTTON} onClick={() => navigate(MOVE_HOME)}>{t('player.completion.backHome')}</Button>
        </div>
      )
    }

    if (session.format === 'ENTRY') {
      return <EntryScreen session={session} busy={entryDone.isPending} onDone={(effort) => entryDone.mutate(effort)} />
    }

    if (state.phase === 'COMPLETION') {
      return (
        <CompletionScreen
          register={session.register}
          askComfort={session.askComfort}
          busy={complete.isPending}
          onSubmit={(effort, comfort, region) => complete.mutate({ effort, comfort, region })}
        />
      )
    }

    if (session.format === 'POOLSIDE') {
      return <PoolsideCard session={session} onDone={() => dispatch({ type: 'FINISH' })} />
    }

    if (!step) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Button size="lg" className={ACCENT_BUTTON} onClick={() => dispatch({ type: 'FINISH' })}>{t('player.finish')}</Button>
        </div>
      )
    }

    const stepBody = () => {
      if (step.kind === 'REST') {
        return (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-headline font-bold text-[#1A1A1A]">{step.title || t('player.card.rest')}</h2>
            {step.instruction && <p className="text-lg text-[#1A1A1A]">{step.instruction}</p>}
            <div className="rounded-[12px] border border-[#e5e4e7] bg-white p-4">
              <Countdown seconds={step.targetSeconds ?? step.autoAdvanceSeconds ?? 60} running={!paused} resetKey={step.index} onDone={step.autoAdvance ? onAutoNext : undefined} />
            </div>
          </div>
        )
      }
      if (step.kind === 'INSTRUCTION' || step.kind === 'QUESTION') {
        return (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-headline font-bold text-[#1A1A1A]">{step.title}</h2>
            <p className="text-lg text-[#1A1A1A]">{step.instruction}</p>
            {(step.media || step.pictogramUrl) && <StepMedia step={step} paused={paused} family={session.characterCode === 'BOGYO'} />}
            <CuesAndFaults cues={step.cues} faults={step.faults} t={t} />
          </div>
        )
      }
      switch (session.format) {
        case 'CARD':
          return <CardStep step={step} session={session} state={state} dispatch={dispatch} paused={paused} onSwap={setSwapExerciseId} />
        case 'TARGET':
          return <TargetStep step={step} session={session} state={state} dispatch={dispatch} paused={paused} onAutoNext={onAutoNext} />
        case 'DRILL':
          return <DrillStep step={step} session={session} state={state} dispatch={dispatch} paused={paused} />
        case 'FLOW':
        default:
          return <FlowStep step={step} session={session} dispatch={dispatch} paused={paused} onAutoNext={onAutoNext} />
      }
    }

    const last = isLastStep(state)
    return (
      <div className="flex-1 flex flex-col gap-4">
        <p className="text-sm text-gray-600">
          {t('player.stepCount', { index: state.stepIndex + 1, total: state.steps.length })}
          {last && <> · {t('player.lastStep')}</>}
        </p>
        {stepBody()}
        <nav className="mt-auto pt-4 flex items-center gap-2" aria-label={t('player.title')}>
          <Button size="lg" variant="secondary" onClick={() => dispatch({ type: 'PREV' })} disabled={state.stepIndex === 0}>
            <ChevronLeft className="h-5 w-5" aria-hidden />
            {t('player.previous')}
          </Button>
          <Button size="lg" className={cn(ACCENT_BUTTON, 'flex-1')} onClick={() => dispatch({ type: 'NEXT' })}>
            {last ? t('player.finish') : t('player.next')}
            <ChevronRight className="h-5 w-5" aria-hidden />
          </Button>
        </nav>
      </div>
    )
  }

  return (
    <div
      className={cn('move-shell min-h-dvh w-full flex flex-col bg-[#F9F7F2]', large && 'move-large-text')}
      style={{ ['--move-accent' as string]: MOVE_ACCENT }}
      data-space="move"
    >
      <SyncQueueBanner />
      <header className="h-16 shrink-0 flex items-center justify-between gap-2 px-4 border-b border-[#1A1A1A]/8 move-no-print">
        <button
          type="button"
          onClick={() => navigate(MOVE_HOME)}
          aria-label={t('player.exit')}
          className="inline-flex items-center justify-center p-3 rounded-lg text-gray-600 hover:bg-black/5"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
        <p className="font-headline font-bold text-[#1A1A1A] truncate flex-1 text-center">
          {session ? `${session.modalityName} · ${t('common.minutes', { count: session.durationMin })}` : t('player.title')}
        </p>
        <div className="flex items-center gap-1">
          {inSteps && stepFormat && (
            <Button variant="ghost" size="sm" onClick={() => shorter.mutate()} disabled={shorter.isPending || state?.shortened}>
              {t('player.shorter')}
            </Button>
          )}
          {inSteps && stepFormat && (
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={paused}
              aria-label={paused ? t('player.resume') : t('player.pause')}
              onClick={() => dispatch(paused ? { type: 'RESUME', now: Date.now() } : { type: 'PAUSE', now: Date.now() })}
            >
              {paused ? <Play className="h-5 w-5" aria-hidden /> : <Pause className="h-5 w-5" aria-hidden />}
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col px-4 py-6 max-w-3xl w-full mx-auto move-body" aria-live="polite">
        {body()}
      </main>

      {/* Stop rule: one tap away on every screen */}
      <footer className="shrink-0 sticky bottom-0 border-t border-[#1A1A1A]/8 bg-white px-4 py-3 move-no-print">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <p className="flex items-start gap-2 text-sm text-gray-700">
            <OctagonX className="h-5 w-5 shrink-0 text-[#B91C1C]" aria-hidden />
            {session?.stopRule ?? t('player.stopRule')}
          </p>
          <Button variant="danger" onClick={() => navigate(MOVE_HOME)} className="shrink-0">
            {t('player.stop')}
          </Button>
        </div>
      </footer>

      {session && (
        <ExerciseSwapSheet
          sessionId={sessionId}
          exerciseId={swapExerciseId}
          characterCode={session.characterCode}
          register={session.register}
          onClose={() => setSwapExerciseId(null)}
          onApplied={(next) => {
            setSession(next)
            dispatch({ type: 'REPLACE_STEPS', steps: next.steps })
          }}
        />
      )}
    </div>
  )
}
