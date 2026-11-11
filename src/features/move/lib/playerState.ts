/**
 * Player step reducer and the offline snapshot (PRD §7.3, §17).
 *
 * Pure: no React, no network. The page dispatches, persists every state change
 * to localStorage under `kalmio.move.player.{sessionId}` together with the
 * started PlayerSessionDto, and restores both on reload so no session is lost.
 *
 * Rules carried here:
 *  - no auto-advance when `step.autoAdvance` is false (always so in the supported pack);
 *  - "Rövidebbet kérek" drops the OPTIONAL steps that are still ahead;
 *  - "Könnyebbet" / "Nehezebbet" swap the current Flow unit for its sibling and
 *    remember the choice for the completion payload;
 *  - pauses are excluded from the elapsed time.
 */
import type {
  ExerciseFeedbackDto,
  PlayerSessionDto,
  PlayerStepDto,
  SelfScoreDto,
  SetLogDto,
  UnitChoiceDto,
} from '../types'

export type PlayerPhase = 'SETUP' | 'STEPS' | 'COMPLETION' | 'DONE'

export interface PlayerState {
  sessionId: string
  phase: PlayerPhase
  stepIndex: number
  /** Effective steps after shorter / sibling swaps / exercise swaps. */
  steps: PlayerStepDto[]
  setLogs: SetLogDto[]
  exerciseFeedback: ExerciseFeedbackDto[]
  unitChoices: UnitChoiceDto[]
  selfScores: SelfScoreDto[]
  shortened: boolean
  paused: boolean
  /** Epoch ms when the first step was shown; null while still on set-up. */
  startedAt: number | null
  /** Active milliseconds accumulated up to the last pause. */
  activeMs: number
  /** Epoch ms of the last resume; null while paused or before start. */
  resumedAt: number | null
}

export type PlayerAction =
  | { type: 'INIT'; session: PlayerSessionDto; now: number }
  | { type: 'SETUP_DONE'; now: number }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'GO_TO'; index: number }
  | { type: 'PAUSE'; now: number }
  | { type: 'RESUME'; now: number }
  | { type: 'SET_LOG'; log: SetLogDto }
  | { type: 'CLEAR_SET_LOG'; exerciseId: string; setIndex: number }
  | { type: 'FEEDBACK'; feedback: ExerciseFeedbackDto }
  | { type: 'SIBLING'; direction: 'EASIER' | 'HARDER' }
  | { type: 'SHORTER' }
  | { type: 'REPLACE_STEPS'; steps: PlayerStepDto[] }
  | { type: 'SELF_SCORE'; stepIndex: number; score: number }
  | { type: 'FINISH' }
  | { type: 'COMPLETED' }

function reindex(steps: PlayerStepDto[]): PlayerStepDto[] {
  return steps.map((s, i) => (s.index === i ? s : { ...s, index: i }))
}

/** Formats without steps go straight to their own screen; the supported pack sees set-up first. */
export function initialState(session: PlayerSessionDto, now: number): PlayerState {
  const needsSetup = session.supportedPack && session.format !== 'ENTRY' && session.format !== 'POOLSIDE'
  return {
    sessionId: session.sessionId,
    phase: needsSetup ? 'SETUP' : 'STEPS',
    stepIndex: 0,
    steps: reindex(session.steps),
    setLogs: [],
    exerciseFeedback: [],
    unitChoices: [],
    selfScores: [],
    shortened: false,
    paused: false,
    startedAt: needsSetup ? null : now,
    activeMs: 0,
    resumedAt: needsSetup ? null : now,
  }
}

export function currentStep(state: PlayerState): PlayerStepDto | null {
  return state.steps[state.stepIndex] ?? null
}

export function isLastStep(state: PlayerState): boolean {
  return state.steps.length === 0 || state.stepIndex >= state.steps.length - 1
}

/** True when the step may count down and move on by itself (never in the supported pack). */
export function advancesAutomatically(step: PlayerStepDto | null): boolean {
  return !!step && step.autoAdvance === true && (step.autoAdvanceSeconds ?? step.targetSeconds ?? 0) > 0
}

/** Active time so far, pauses excluded. */
export function elapsedMs(state: PlayerState, now: number): number {
  if (state.startedAt === null) return 0
  const running = state.resumedAt !== null && !state.paused ? Math.max(0, now - state.resumedAt) : 0
  return state.activeMs + running
}

function unitKey(step: PlayerStepDto): string {
  return step.unitId ?? step.exerciseId ?? `step-${step.index}`
}

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'INIT':
      return initialState(action.session, action.now)

    case 'SETUP_DONE':
      if (state.phase !== 'SETUP') return state
      return { ...state, phase: 'STEPS', startedAt: action.now, resumedAt: action.now, paused: false }

    case 'NEXT': {
      if (state.phase !== 'STEPS') return state
      if (isLastStep(state)) return { ...state, phase: 'COMPLETION' }
      return { ...state, stepIndex: state.stepIndex + 1 }
    }

    case 'PREV':
      if (state.phase !== 'STEPS' || state.stepIndex === 0) return state
      return { ...state, stepIndex: state.stepIndex - 1 }

    case 'GO_TO': {
      if (state.phase !== 'STEPS') return state
      const index = Math.min(Math.max(0, action.index), Math.max(0, state.steps.length - 1))
      return { ...state, stepIndex: index }
    }

    case 'PAUSE': {
      if (state.paused || state.resumedAt === null) return state
      return { ...state, paused: true, activeMs: state.activeMs + Math.max(0, action.now - state.resumedAt), resumedAt: null }
    }

    case 'RESUME':
      if (!state.paused) return state
      return { ...state, paused: false, resumedAt: action.now }

    case 'SET_LOG': {
      const rest = state.setLogs.filter(
        (l) => !(l.exerciseId === action.log.exerciseId && l.setIndex === action.log.setIndex),
      )
      return { ...state, setLogs: [...rest, action.log].sort(bySet) }
    }

    case 'CLEAR_SET_LOG':
      return {
        ...state,
        setLogs: state.setLogs.filter((l) => !(l.exerciseId === action.exerciseId && l.setIndex === action.setIndex)),
      }

    case 'FEEDBACK': {
      const rest = state.exerciseFeedback.filter((f) => f.exerciseId !== action.feedback.exerciseId)
      return { ...state, exerciseFeedback: [...rest, action.feedback] }
    }

    case 'SIBLING': {
      const cur = currentStep(state)
      if (!cur) return state
      const sibling = action.direction === 'EASIER' ? cur.easier : cur.harder
      if (!sibling) return state
      // The way back is the current unit, unless the sibling brought its own chain.
      const next: PlayerStepDto =
        action.direction === 'EASIER'
          ? { ...sibling, index: cur.index, optional: cur.optional, autoAdvance: cur.autoAdvance, harder: sibling.harder ?? cur }
          : { ...sibling, index: cur.index, optional: cur.optional, autoAdvance: cur.autoAdvance, easier: sibling.easier ?? cur }
      const steps = state.steps.slice()
      steps[state.stepIndex] = next
      const choice: UnitChoiceDto = {
        stepIndex: state.stepIndex,
        fromUnitId: unitKey(cur),
        toUnitId: unitKey(next),
        direction: action.direction,
      }
      return { ...state, steps, unitChoices: [...state.unitChoices, choice] }
    }

    case 'SHORTER': {
      const kept = state.steps.filter((s, i) => i <= state.stepIndex || !s.optional)
      if (kept.length === state.steps.length) return { ...state, shortened: true }
      return { ...state, steps: reindex(kept), shortened: true }
    }

    case 'REPLACE_STEPS': {
      const steps = reindex(action.steps)
      const stepIndex = Math.min(state.stepIndex, Math.max(0, steps.length - 1))
      return { ...state, steps, stepIndex }
    }

    case 'SELF_SCORE': {
      const rest = state.selfScores.filter((s) => s.stepIndex !== action.stepIndex)
      return { ...state, selfScores: [...rest, { stepIndex: action.stepIndex, score: action.score }] }
    }

    case 'FINISH':
      if (state.phase === 'DONE') return state
      return { ...state, phase: 'COMPLETION' }

    case 'COMPLETED':
      return { ...state, phase: 'DONE', paused: false }

    default:
      return state
  }
}

function bySet(a: SetLogDto, b: SetLogDto): number {
  return a.exerciseId === b.exerciseId ? a.setIndex - b.setIndex : a.exerciseId.localeCompare(b.exerciseId)
}

// ── Offline snapshot ─────────────────────────────────────────────────────────

export const PLAYER_STORAGE_PREFIX = 'kalmio.move.player.'

export interface PlayerSnapshot {
  session: PlayerSessionDto
  state: PlayerState
  savedAt: number
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function defaultStorage(): StorageLike | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

export function snapshotKey(sessionId: string): string {
  return `${PLAYER_STORAGE_PREFIX}${sessionId}`
}

export function saveSnapshot(snapshot: PlayerSnapshot, storage: StorageLike | null = defaultStorage()): void {
  if (!storage) return
  try {
    storage.setItem(snapshotKey(snapshot.session.sessionId), JSON.stringify(snapshot))
  } catch {
    // Quota or private mode — the session still runs, it just will not survive a reload.
  }
}

export function loadSnapshot(sessionId: string, storage: StorageLike | null = defaultStorage()): PlayerSnapshot | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(snapshotKey(sessionId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PlayerSnapshot>
    if (!parsed.session || !parsed.state || parsed.state.sessionId !== sessionId) return null
    if (parsed.state.phase === 'DONE') return null
    return parsed as PlayerSnapshot
  } catch {
    return null
  }
}

export function clearSnapshot(sessionId: string, storage: StorageLike | null = defaultStorage()): void {
  if (!storage) return
  try {
    storage.removeItem(snapshotKey(sessionId))
  } catch {
    // ignore
  }
}
