/**
 * Completion payload: effort tap, comfort → body-map region, duration without
 * pauses, only meaningful set logs (PRD §7.4).
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest'
import { buildCompletion, comfortToNumber, durationMinutes } from './completion'
import { initialState, playerReducer } from './playerState'
import type { PlayerSessionDto } from '../types'

const sess: PlayerSessionDto = {
  sessionId: 's1',
  date: '2026-11-11',
  modalityCode: 'STRENGTH_HOME',
  modalityName: 'Erősítés',
  format: 'CARD',
  durationMin: 20,
  register: 'INFORMAL',
  textSize: 'NORMAL',
  characterCode: 'KATA',
  pack: 'STRENGTH',
  supportedPack: false,
  firstSession: true,
  askComfort: true,
  stopRule: 'Hagyd abba, ha szédülsz.',
  setupLine: null,
  dials: { minutes: 20, equipment: ['DUMBBELLS'], focus: 'DEFAULT', characterCode: 'KATA' },
  steps: [
    { index: 0, kind: 'EXERCISE', exerciseId: 'e1', title: 'Guggolás', instruction: '', cues: [], faults: [], media: null, sets: 2, targetReps: 10, optional: false, autoAdvance: false },
  ],
  planB: false,
}

describe('buildCompletion', () => {
  it('maps the two taps: effort, then comfort Nem → no region', () => {
    const state = initialState(sess, 0)
    const p = buildCompletion({ state, effort: 6, comfort: 'NO', region: null, now: 10 * 60_000, plannedMin: 20 })
    expect(p.effort).toBe(6)
    expect(p.comfort).toBe(0)
    expect(p.painRegion).toBeUndefined()
    expect(p.durationMin).toBe(10)
    expect(p.shortened).toBe(false)
    expect(p.unitChoices).toEqual([])
    expect(p.selfScores).toEqual([])
  })

  it('Igen carries the body-map region; Kicsit does not', () => {
    const state = initialState(sess, 0)
    expect(buildCompletion({ state, effort: 4, comfort: 'YES', region: 'KNEE', now: 60_000, plannedMin: 20 }).painRegion).toBe('KNEE')
    const little = buildCompletion({ state, effort: 4, comfort: 'LITTLE', region: 'KNEE', now: 60_000, plannedMin: 20 })
    expect(little.comfort).toBe(1)
    expect(little.painRegion).toBeUndefined()
  })

  it('omits comfort when the question was not asked', () => {
    const p = buildCompletion({ state: initialState(sess, 0), effort: 3, comfort: null, region: null, now: 60_000, plannedMin: 20 })
    expect('comfort' in p).toBe(false)
    expect('painRegion' in p).toBe(false)
  })

  it('keeps only meaningful set logs, carries feedback with reps in reserve and the shortened flag', () => {
    let state = initialState(sess, 0)
    state = playerReducer(state, { type: 'SET_LOG', log: { exerciseId: 'e1', setIndex: 0, reps: 10, weightKg: 6 } })
    state = playerReducer(state, { type: 'SET_LOG', log: { exerciseId: 'e1', setIndex: 1, reps: null, weightKg: null } })
    state = playerReducer(state, { type: 'FEEDBACK', feedback: { exerciseId: 'e1', answer: 'EASY', repsInReserve: 6 } })
    state = playerReducer(state, { type: 'SHORTER' })
    const p = buildCompletion({ state, effort: 11, comfort: null, region: null, now: 60_000, plannedMin: 20 })
    expect(p.effort).toBe(10)
    expect(p.setLogs).toEqual([{ exerciseId: 'e1', setIndex: 0, reps: 10, weightKg: 6 }])
    expect(p.exerciseFeedback).toEqual([{ exerciseId: 'e1', answer: 'EASY', repsInReserve: 6 }])
    expect(p.shortened).toBe(true)
  })

  it('duration excludes pauses, is at least 1 and capped at three times the plan', () => {
    let state = initialState(sess, 0)
    expect(durationMinutes(state, 10_000, 20)).toBe(1)
    state = playerReducer(state, { type: 'PAUSE', now: 5 * 60_000 })
    state = playerReducer(state, { type: 'RESUME', now: 50 * 60_000 })
    expect(durationMinutes(state, 55 * 60_000, 20)).toBe(10)
    expect(durationMinutes(state, 24 * 60 * 60_000, 20)).toBe(60)
  })

  it('comfortToNumber follows Nem / Kicsit / Igen', () => {
    expect([comfortToNumber('NO'), comfortToNumber('LITTLE'), comfortToNumber('YES')]).toEqual([0, 1, 2])
  })
})
