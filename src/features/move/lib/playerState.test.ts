/**
 * Player step reducer: next/prev, no auto-advance flag, "Rövidebbet kérek"
 * drops OPTIONAL blocks, resume from storage, sibling swap (PRD §7.3, §8.4, §17).
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest'
import {
  advancesAutomatically,
  clearSnapshot,
  currentStep,
  elapsedMs,
  initialState,
  isLastStep,
  loadSnapshot,
  playerReducer,
  saveSnapshot,
  snapshotKey,
  type PlayerState,
} from './playerState'
import type { MediaRefDto, PlayerSessionDto, PlayerStepDto } from '../types'

const still: MediaRefDto = {
  mediaId: 'm1',
  type: 'STILL_START',
  url: 'https://x/m1.png',
  characterCode: 'ILDIKO',
  generated: true,
  reviewStatus: 'APPROVED',
}

function step(over: Partial<PlayerStepDto> & { index: number }): PlayerStepDto {
  return {
    kind: 'EXERCISE',
    title: `Step ${over.index}`,
    instruction: 'Do it',
    cues: [],
    faults: [],
    media: still,
    optional: false,
    autoAdvance: false,
    ...over,
  }
}

function session(over: Partial<PlayerSessionDto> = {}): PlayerSessionDto {
  return {
    sessionId: 's1',
    date: '2026-11-11',
    modalityCode: 'SUPPORTED_EXERCISE',
    modalityName: 'Támogatott gyakorlatok',
    format: 'FLOW',
    durationMin: 15,
    register: 'FORMAL',
    textSize: 'LARGE',
    characterCode: 'ILDIKO',
    pack: 'SUPPORTED_EXERCISE',
    supportedPack: true,
    firstSession: false,
    askComfort: true,
    stopRule: 'Hagyja abba, ha szédül.',
    setupLine: null,
    dials: { minutes: 15, equipment: ['CHAIR'], focus: 'DEFAULT', characterCode: 'ILDIKO' },
    steps: [
      step({ index: 0, kind: 'INSTRUCTION' }),
      step({ index: 1, exerciseId: 'e1', unitId: 'u1', targetSeconds: 30 }),
      step({ index: 2, exerciseId: 'e2', optional: true }),
      step({ index: 3, exerciseId: 'e3' }),
      step({ index: 4, exerciseId: 'e4', optional: true }),
    ],
    planB: false,
    ...over,
  }
}

function memoryStorage() {
  const m = new Map<string, string>()
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    size: () => m.size,
  }
}

describe('playerReducer', () => {
  it('starts on the set-up screen for the supported pack and on the steps otherwise', () => {
    expect(initialState(session(), 1000).phase).toBe('SETUP')
    expect(initialState(session({ supportedPack: false }), 1000).phase).toBe('STEPS')
    expect(initialState(session({ format: 'ENTRY' }), 1000).phase).toBe('STEPS')
  })

  it('SETUP_DONE starts the clock; NEXT/PREV walk the steps; NEXT after the last step opens completion', () => {
    let s = initialState(session(), 1000)
    s = playerReducer(s, { type: 'SETUP_DONE', now: 2000 })
    expect(s.phase).toBe('STEPS')
    expect(s.startedAt).toBe(2000)
    s = playerReducer(s, { type: 'PREV' })
    expect(s.stepIndex).toBe(0)
    for (let i = 0; i < 4; i++) s = playerReducer(s, { type: 'NEXT' })
    expect(s.stepIndex).toBe(4)
    expect(isLastStep(s)).toBe(true)
    s = playerReducer(s, { type: 'NEXT' })
    expect(s.phase).toBe('COMPLETION')
  })

  it('never advances automatically when autoAdvance is false (supported pack), and does when it is on with a duration', () => {
    const s = initialState(session(), 0)
    expect(advancesAutomatically(s.steps[1])).toBe(false)
    expect(advancesAutomatically(step({ index: 9, autoAdvance: true, autoAdvanceSeconds: 20 }))).toBe(true)
    expect(advancesAutomatically(step({ index: 9, autoAdvance: true }))).toBe(false)
    expect(advancesAutomatically(null)).toBe(false)
  })

  it('SHORTER drops only the OPTIONAL steps still ahead and keeps the current one', () => {
    let s = initialState(session({ supportedPack: false }), 0)
    s = playerReducer(s, { type: 'NEXT' })
    s = playerReducer(s, { type: 'NEXT' }) // now on the optional e2
    s = playerReducer(s, { type: 'SHORTER' })
    expect(s.shortened).toBe(true)
    expect(s.steps.map((x) => x.exerciseId ?? 'intro')).toEqual(['intro', 'e1', 'e2', 'e3'])
    expect(s.steps.map((x) => x.index)).toEqual([0, 1, 2, 3])
    expect(currentStep(s)?.exerciseId).toBe('e2')
  })

  it('SIBLING swaps the current Flow unit, keeps the way back and records the choice', () => {
    const easier = step({ index: 99, exerciseId: 'e1-easy', unitId: 'u1-easy', title: 'Easier' })
    const sess = session({ supportedPack: false })
    sess.steps[1] = { ...sess.steps[1], easier }
    let s = initialState(sess, 0)
    s = playerReducer(s, { type: 'NEXT' })
    s = playerReducer(s, { type: 'SIBLING', direction: 'HARDER' }) // no harder sibling → no-op
    expect(currentStep(s)?.unitId).toBe('u1')
    s = playerReducer(s, { type: 'SIBLING', direction: 'EASIER' })
    const cur = currentStep(s)!
    expect(cur.unitId).toBe('u1-easy')
    expect(cur.index).toBe(1)
    expect(cur.harder?.unitId).toBe('u1')
    expect(s.unitChoices).toEqual([{ stepIndex: 1, fromUnitId: 'u1', toUnitId: 'u1-easy', direction: 'EASIER' }])
    s = playerReducer(s, { type: 'SIBLING', direction: 'HARDER' })
    expect(currentStep(s)?.unitId).toBe('u1')
    expect(s.unitChoices).toHaveLength(2)
  })

  it('upserts set logs and exercise feedback by key', () => {
    let s = initialState(session({ supportedPack: false, format: 'CARD' }), 0)
    s = playerReducer(s, { type: 'SET_LOG', log: { exerciseId: 'e1', setIndex: 0, reps: 10, weightKg: 4 } })
    s = playerReducer(s, { type: 'SET_LOG', log: { exerciseId: 'e1', setIndex: 0, reps: 12, weightKg: 4 } })
    s = playerReducer(s, { type: 'SET_LOG', log: { exerciseId: 'e1', setIndex: 1, reps: 9, weightKg: 4 } })
    expect(s.setLogs).toEqual([
      { exerciseId: 'e1', setIndex: 0, reps: 12, weightKg: 4 },
      { exerciseId: 'e1', setIndex: 1, reps: 9, weightKg: 4 },
    ])
    s = playerReducer(s, { type: 'FEEDBACK', feedback: { exerciseId: 'e1', answer: 'HARD' } })
    s = playerReducer(s, { type: 'FEEDBACK', feedback: { exerciseId: 'e1', answer: 'RIGHT' } })
    expect(s.exerciseFeedback).toEqual([{ exerciseId: 'e1', answer: 'RIGHT' }])
    s = playerReducer(s, { type: 'CLEAR_SET_LOG', exerciseId: 'e1', setIndex: 1 })
    expect(s.setLogs).toHaveLength(1)
  })

  it('excludes pauses from the elapsed time', () => {
    let s = initialState(session({ supportedPack: false }), 1_000)
    expect(elapsedMs(s, 61_000)).toBe(60_000)
    s = playerReducer(s, { type: 'PAUSE', now: 61_000 })
    expect(elapsedMs(s, 200_000)).toBe(60_000)
    s = playerReducer(s, { type: 'RESUME', now: 200_000 })
    expect(elapsedMs(s, 230_000)).toBe(90_000)
  })

  it('REPLACE_STEPS (exercise swap applied) keeps the position', () => {
    let s = initialState(session({ supportedPack: false }), 0)
    s = playerReducer(s, { type: 'GO_TO', index: 3 })
    s = playerReducer(s, { type: 'REPLACE_STEPS', steps: [step({ index: 0 }), step({ index: 1 })] })
    expect(s.stepIndex).toBe(1)
    expect(s.steps).toHaveLength(2)
  })
})

describe('offline snapshot', () => {
  it('round-trips through storage under the session-id key and resumes at the same step with sets intact', () => {
    const storage = memoryStorage()
    const sess = session({ supportedPack: false, format: 'CARD' })
    let state: PlayerState = initialState(sess, 0)
    state = playerReducer(state, { type: 'NEXT' })
    state = playerReducer(state, { type: 'SET_LOG', log: { exerciseId: 'e1', setIndex: 0, reps: 8, weightKg: 3 } })
    saveSnapshot({ session: sess, state, savedAt: 5 }, storage)
    expect(snapshotKey('s1')).toBe('kalmio.move.player.s1')
    const loaded = loadSnapshot('s1', storage)
    expect(loaded?.state.stepIndex).toBe(1)
    expect(loaded?.state.setLogs).toEqual([{ exerciseId: 'e1', setIndex: 0, reps: 8, weightKg: 3 }])
    expect(loaded?.session.sessionId).toBe('s1')
  })

  it('ignores a finished or foreign snapshot and clears on demand', () => {
    const storage = memoryStorage()
    const sess = session()
    const done = playerReducer(initialState(sess, 0), { type: 'COMPLETED' })
    saveSnapshot({ session: sess, state: done, savedAt: 1 }, storage)
    expect(loadSnapshot('s1', storage)).toBeNull()
    storage.setItem(snapshotKey('s2'), '{not json')
    expect(loadSnapshot('s2', storage)).toBeNull()
    clearSnapshot('s1', storage)
    clearSnapshot('s2', storage)
    expect(storage.size()).toBe(0)
    expect(loadSnapshot('s1', null)).toBeNull()
  })
})
