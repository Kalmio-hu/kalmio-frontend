/**
 * Start flow reducer, gating, routing preview and payload (PRD §7.1).
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest'
import {
  buildStartPayload,
  canAdvance,
  HEALTH_QUESTION_COUNT,
  HEALTH_QUESTION_IDS,
  initialStartState,
  isUnderEighteen,
  fillsSingleRole,
  nextStep,
  previewRouting,
  previousStep,
  RECOMMENDED_OTHER,
  RECOMMENDED_SELF,
  startFlowReducer,
  type StartFlowState,
} from './startFlow'
import { START_STEPS } from './startSteps'
import hu from '../i18n/move.hu.json'

function answered(all: boolean, overrides: Record<number, boolean> = {}): (boolean | null)[] {
  const a = Array<boolean | null>(HEALTH_QUESTION_COUNT).fill(all)
  for (const [i, v] of Object.entries(overrides)) a[Number(i)] = v
  return a
}

function reduceAll(actions: Parameters<typeof startFlowReducer>[1][]): StartFlowState {
  return actions.reduce(startFlowReducer, initialStartState())
}

describe('start flow — screens', () => {
  it('has at most seven screens', () => {
    expect(START_STEPS.length).toBeLessThanOrEqual(7)
    expect(nextStep('result')).toBeNull()
    expect(previousStep('forWhom')).toBeNull()
    expect(nextStep('health')).toBe('result')
  })

  it('"Valaki másnak" sets the formal register; "Magamnak" sets informal', () => {
    const other = reduceAll([{ type: 'forWhom', value: 'OTHER', forUserId: 'u-2' }])
    expect(other.register).toBe('FORMAL')
    expect(other.forUserId).toBe('u-2')
    const self = startFlowReducer(other, { type: 'forWhom', value: 'SELF' })
    expect(self.register).toBe('INFORMAL')
    expect(self.forUserId).toBeNull()
  })

  it('"Nem tudom, ajánljon valamit" picks the default set by audience', () => {
    const self = reduceAll([{ type: 'forWhom', value: 'SELF' }, { type: 'recommend' }])
    expect(self.modalities).toEqual([...RECOMMENDED_SELF])
    const other = reduceAll([{ type: 'forWhom', value: 'OTHER' }, { type: 'recommend' }])
    expect(other.modalities).toEqual([...RECOMMENDED_OTHER])
  })

  it('equipment: "Nothing" clears the others and vice versa', () => {
    const s1 = reduceAll([{ type: 'toggleEquipment', code: 'DUMBBELLS' }, { type: 'toggleEquipment', code: 'CHAIR' }])
    expect(s1.equipment).toEqual(['DUMBBELLS', 'CHAIR'])
    const s2 = startFlowReducer(s1, { type: 'toggleEquipment', code: 'NONE' })
    expect(s2.equipment).toEqual(['NONE'])
    const s3 = startFlowReducer(s2, { type: 'toggleEquipment', code: 'MAT' })
    expect(s3.equipment).toEqual(['MAT'])
  })
})

describe('start flow — gating', () => {
  it('each screen gates on its own input', () => {
    const s = initialStartState()
    expect(canAdvance('forWhom', s)).toBe(false)
    expect(canAdvance('modalities', s)).toBe(false)
    expect(canAdvance('schedule', s)).toBe(true) // defaults: 3 days, 20 minutes
    expect(canAdvance('equipment', s)).toBe(true)
    expect(canAdvance('health', s)).toBe(false)
    expect(canAdvance('result', s)).toBe(false)
  })

  it('health advances when all ten are answered or when skipped', () => {
    const partly = { ...initialStartState(), answers: answered(false, { 3: null as unknown as boolean }) }
    expect(canAdvance('health', partly)).toBe(false)
    const full = { ...initialStartState(), answers: answered(false) }
    expect(canAdvance('health', full)).toBe(true)
    const skipped = startFlowReducer(initialStartState(), { type: 'skipHealth' })
    expect(canAdvance('health', skipped)).toBe(true)
    expect(skipped.answers.every((a) => a === null)).toBe(true)
  })

  it('days clamp to 1–7 and minutes only accept the five options', () => {
    const s = reduceAll([{ type: 'days', value: 12 }, { type: 'minutes', value: 25 }])
    expect(s.daysPerWeek).toBe(7)
    expect(s.minutes).toBe(20)
    expect(startFlowReducer(s, { type: 'minutes', value: 45 }).minutes).toBe(45)
  })

  it('a fixed class needs a modality, a weekday, HH:mm and 10–240 minutes', () => {
    const bad = reduceAll([{ type: 'addFixedClass', value: { modalityCode: '', weekday: 2, startTime: '18:00', durationMin: 60 } }])
    expect(canAdvance('schedule', bad)).toBe(false)
    const good = reduceAll([{ type: 'addFixedClass', value: { modalityCode: 'YOGA_CLASS', weekday: 2, startTime: '18:00', durationMin: 60 } }])
    expect(canAdvance('schedule', good)).toBe(true)
  })
})

describe('start flow — routing preview (PRD §7.1 table)', () => {
  it('any current symptom → track A, seated (L0)', () => {
    const r = previewRouting(answered(false, { 0: true }), false)
    expect(r.track).toBe('A')
    expect(r.levelCap).toBe('L0')
  })
  it('known disease, two falls or doctor-said-supervised → track B', () => {
    expect(previewRouting(answered(false, { 3: true, 6: true }), false).track).toBe('B')
    expect(previewRouting(answered(false, { 4: true, 5: true, 6: true }), false).track).toBe('B')
    expect(previewRouting(answered(false, { 9: true, 6: true }), false).track).toBe('B')
  })
  it('none of the above → track C; one fall alone does not route', () => {
    const r = previewRouting(answered(false, { 4: true, 6: true }), false)
    expect(r.track).toBe('C')
    expect(r.levelCap).toBeNull()
  })
  it('cannot stand up without hands → L0 cap, whatever the track', () => {
    expect(previewRouting(answered(false, { 6: false }), false).levelCap).toBe('L0')
  })
  it('beta-blocker or insulin → heart-rate targets off; pain → suggest a limit', () => {
    const r = previewRouting(answered(false, { 6: true, 7: true, 8: true }), false)
    expect(r.hrTargetsOff).toBe(true)
    expect(r.suggestLimit).toBe(true)
  })
  it('skipped → track B and flagged as skipped', () => {
    const r = previewRouting(answered(null as unknown as boolean), true)
    expect(r.track).toBe('B')
    expect(r.skipped).toBe(true)
  })
})

describe('start flow — payload', () => {
  const base = reduceAll([
    { type: 'forWhom', value: 'SELF' },
    { type: 'toggleModality', code: 'WALK' },
    { type: 'toggleModality', code: 'MOBILITY' },
    { type: 'days', value: 4 },
    { type: 'minutes', value: 30 },
    { type: 'toggleEquipment', code: 'BANDS' },
  ])

  it('ranks modalities in pick order and defaults equipment to NONE', () => {
    const p = buildStartPayload(base)
    expect(p.modalities).toEqual([
      { code: 'WALK', rank: 1 },
      { code: 'MOBILITY', rank: 2 },
    ])
    expect(p.daysPerWeek).toBe(4)
    expect(p.minutes).toBe(30)
    expect(p.equipment).toEqual(['BANDS'])
    expect(buildStartPayload(initialStartState()).equipment).toEqual(['NONE'])
    expect(p.register).toBe('INFORMAL')
  })

  it('sends the answers as a bare boolean array and nothing else about them', () => {
    const s = { ...base, answers: answered(false, { 4: true, 6: true }) }
    const p = buildStartPayload(s)
    expect(p.screening.answers).toHaveLength(HEALTH_QUESTION_COUNT)
    expect(p.screening.answers?.[4]).toBe(true)
    const json = JSON.stringify(p)
    // No question id and no question wording (either register) ever leaves the client.
    for (const id of HEALTH_QUESTION_IDS) expect(json).not.toContain(id)
    const questions = (hu as { start: { health: { q: Record<string, string> } } }).start.health.q
    for (const text of Object.values(questions)) expect(json).not.toContain(text)
    expect(json).not.toMatch(/béta|inzulin|insulin|diagn/i)
  })

  it('skipped questions post null and still build a plan request', () => {
    const p = buildStartPayload(startFlowReducer(base, { type: 'skipHealth' }))
    expect(p.screening.answers).toBeNull()
    expect(p.modalities.length).toBe(2)
  })

  it('carries forUserId only for "someone else", and fixed classes only when present', () => {
    expect(buildStartPayload(base).forUserId).toBeUndefined()
    expect(buildStartPayload(base).fixedClasses).toBeUndefined()
    const other = reduceAll([
      { type: 'forWhom', value: 'OTHER', forUserId: 'u-9' },
      { type: 'recommend' },
      { type: 'addFixedClass', value: { modalityCode: 'AQUA_FITNESS', weekday: 3, startTime: '09:00', durationMin: 45 } },
    ])
    const p = buildStartPayload(other)
    expect(p.forUserId).toBe('u-9')
    expect(p.register).toBe('FORMAL')
    expect(p.fixedClasses).toHaveLength(1)
  })
})

describe('start flow — edge cases', () => {
  it('under-18 members never see the flow (PRD §7.9)', () => {
    expect(isUnderEighteen({ ageYears: 12 })).toBe(true)
    expect(isUnderEighteen({ ageYears: 18 })).toBe(false)
    expect(isUnderEighteen({ birthYear: 2015 }, new Date(2026, 10, 11))).toBe(true)
    expect(isUnderEighteen({ ageYears: null })).toBe(false)
    expect(isUnderEighteen(null)).toBe(false)
  })

  it('detects picks that fill a single role (only yoga → suggest strength)', () => {
    const roles = { YOGA_CLASS: ['MOBILITY'], PILATES: ['MOBILITY'], WALK: ['AEROBIC'] }
    expect(fillsSingleRole(['YOGA_CLASS', 'PILATES'], roles)).toBe(true)
    expect(fillsSingleRole(['YOGA_CLASS', 'WALK'], roles)).toBe(false)
    expect(fillsSingleRole([], roles)).toBe(false)
  })
})
