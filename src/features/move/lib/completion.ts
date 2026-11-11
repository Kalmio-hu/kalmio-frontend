/**
 * Builds the `POST /api/move/sessions/{id}/complete` payload from the player
 * state and the two completion taps (effort; comfort → body-map region).
 * Pure, so the "at most two taps after the last step" path is testable.
 */
import type { BodyRegion, CompleteSessionRequest, SetLogDto } from '../types'
import { elapsedMs, type PlayerState } from './playerState'

export type ComfortAnswer = 'NO' | 'LITTLE' | 'YES'

/** Nem = 0, Kicsit = 1, Igen = 2 (PRD §7.4). */
export function comfortToNumber(answer: ComfortAnswer): number {
  return answer === 'NO' ? 0 : answer === 'LITTLE' ? 1 : 2
}

export interface CompletionInput {
  state: PlayerState
  effort: number
  /** null when the comfort question was not asked (askComfort = false). */
  comfort: ComfortAnswer | null
  /** Only meaningful with comfort = YES. */
  region: BodyRegion | null
  now: number
  /** Planned minutes; caps a stale timer after a long interruption. */
  plannedMin: number
}

function meaningful(log: SetLogDto): boolean {
  return (log.reps ?? null) !== null || (log.seconds ?? null) !== null || (log.weightKg ?? null) !== null
}

export function durationMinutes(state: PlayerState, now: number, plannedMin: number): number {
  const raw = Math.round(elapsedMs(state, now) / 60_000)
  const cap = Math.max(1, plannedMin * 3)
  return Math.min(Math.max(1, raw), cap)
}

export function buildCompletion(input: CompletionInput): CompleteSessionRequest {
  const { state, effort, comfort, region, now, plannedMin } = input
  const payload: CompleteSessionRequest = {
    effort: Math.min(10, Math.max(0, Math.round(effort))),
    setLogs: state.setLogs.filter(meaningful),
    exerciseFeedback: state.exerciseFeedback,
    unitChoices: state.unitChoices,
    selfScores: state.selfScores,
    durationMin: durationMinutes(state, now, plannedMin),
    shortened: state.shortened,
  }
  if (comfort !== null) {
    payload.comfort = comfortToNumber(comfort)
    if (comfort === 'YES' && region) payload.painRegion = region
  }
  return payload
}
