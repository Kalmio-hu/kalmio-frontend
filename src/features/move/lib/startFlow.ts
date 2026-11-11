/**
 * Start flow state (PRD §7.1) — pure functions, no React, no storage.
 *
 * The health answers live in this in-memory state only until `buildStartPayload`
 * puts them into the POST body. Nothing here is ever written to localStorage,
 * sessionStorage or a query cache: the backend stores routing flags only.
 */
import type {
  CreateFixedClassRequest,
  EquipmentCode,
  ModalityPick,
  Register,
  ScreeningTrack,
  StartFlowRequest,
  SupportedLevel,
} from '../types'
import { START_STEPS, type StartStep } from './startSteps'

export type ForWhom = 'SELF' | 'OTHER'

export const MINUTE_OPTIONS = [10, 20, 30, 45, 60] as const
export const DEFAULT_DAYS_PER_WEEK = 3
export const DEFAULT_MINUTES = 20

/** Equipment asked on screen 4 — no weights here (PRD §7.1 step 4). */
export const START_EQUIPMENT: readonly EquipmentCode[] = ['NONE', 'DUMBBELLS', 'BANDS', 'CHAIR', 'MAT', 'BIKE']

/** "Nem tudom, ajánljon valamit" — for myself. */
export const RECOMMENDED_SELF = ['WALK', 'STRENGTH_BODYWEIGHT', 'MOBILITY'] as const
/** "Nem tudom, ajánljon valamit" — when set up for someone else (supported track). */
export const RECOMMENDED_OTHER = ['SUPPORTED_EXERCISE', 'WALK'] as const

/**
 * The ten yes/no questions of screen 5, by id. The wording lives in i18n under
 * `start.health.q.<id>` (+ `_formal`). The id is all that ever leaves this
 * module — and even the id is sent only as a position in `answers[]`.
 */
export const HEALTH_QUESTION_IDS = [
  'chestPain', // A: current symptom
  'fainting', // A: current symptom
  'breathlessAtRest', // A: current symptom
  'knownDisease', // B: heart / lung / metabolic disease
  'fellOnce', // informational
  'fellTwice', // B: two or more falls in a year
  'chairStandNoHands', // "yes" is the good answer; "no" → L0
  'painAvoidsMovement', // suggests a limit, no routing
  'betaBlockerOrInsulin', // hrTargetsOff, then discarded
  'doctorSaidSupervised', // B
] as const
export type HealthQuestionId = (typeof HEALTH_QUESTION_IDS)[number]
export const HEALTH_QUESTION_COUNT = HEALTH_QUESTION_IDS.length

export interface StartFlowState {
  forWhom: ForWhom | null
  forUserId: string | null
  modalities: string[]
  daysPerWeek: number
  minutes: number
  fixedClasses: CreateFixedClassRequest[]
  equipment: EquipmentCode[]
  /** Ten answers in question order; `null` until answered. */
  answers: (boolean | null)[]
  healthSkipped: boolean
  register: Register | null
  familySessionAges: number[]
}

export function initialStartState(): StartFlowState {
  return {
    forWhom: null,
    forUserId: null,
    modalities: [],
    daysPerWeek: DEFAULT_DAYS_PER_WEEK,
    minutes: DEFAULT_MINUTES,
    fixedClasses: [],
    equipment: [],
    answers: Array<boolean | null>(HEALTH_QUESTION_COUNT).fill(null),
    healthSkipped: false,
    register: null,
    familySessionAges: [],
  }
}

export type StartFlowAction =
  | { type: 'forWhom'; value: ForWhom; forUserId?: string | null }
  | { type: 'toggleModality'; code: string }
  | { type: 'recommend' }
  | { type: 'days'; value: number }
  | { type: 'minutes'; value: number }
  | { type: 'addFixedClass'; value: CreateFixedClassRequest }
  | { type: 'removeFixedClass'; index: number }
  | { type: 'toggleEquipment'; code: EquipmentCode }
  | { type: 'answer'; index: number; value: boolean }
  | { type: 'skipHealth' }
  | { type: 'unskipHealth' }
  | { type: 'register'; value: Register }

export function startFlowReducer(state: StartFlowState, action: StartFlowAction): StartFlowState {
  switch (action.type) {
    case 'forWhom':
      return {
        ...state,
        forWhom: action.value,
        forUserId: action.value === 'OTHER' ? (action.forUserId ?? state.forUserId) : null,
        // Set up for someone else → formal address (PRD §16); back to "Magamnak" → informal.
        register: action.value === 'OTHER' ? 'FORMAL' : 'INFORMAL',
      }
    case 'toggleModality': {
      const has = state.modalities.includes(action.code)
      return { ...state, modalities: has ? state.modalities.filter((c) => c !== action.code) : [...state.modalities, action.code] }
    }
    case 'recommend':
      return { ...state, modalities: [...recommendedModalities(state.forWhom)] }
    case 'days':
      return { ...state, daysPerWeek: clampDays(action.value) }
    case 'minutes':
      return { ...state, minutes: (MINUTE_OPTIONS as readonly number[]).includes(action.value) ? action.value : state.minutes }
    case 'addFixedClass':
      return { ...state, fixedClasses: [...state.fixedClasses, action.value] }
    case 'removeFixedClass':
      return { ...state, fixedClasses: state.fixedClasses.filter((_, i) => i !== action.index) }
    case 'toggleEquipment': {
      if (action.code === 'NONE') return { ...state, equipment: state.equipment.includes('NONE') ? [] : ['NONE'] }
      const without = state.equipment.filter((c) => c !== 'NONE' && c !== action.code)
      return { ...state, equipment: state.equipment.includes(action.code) ? without : [...without, action.code] }
    }
    case 'answer': {
      if (action.index < 0 || action.index >= HEALTH_QUESTION_COUNT) return state
      const answers = state.answers.slice()
      answers[action.index] = action.value
      return { ...state, answers, healthSkipped: false }
    }
    case 'skipHealth':
      return { ...state, healthSkipped: true, answers: Array<boolean | null>(HEALTH_QUESTION_COUNT).fill(null) }
    case 'unskipHealth':
      return { ...state, healthSkipped: false }
    case 'register':
      return { ...state, register: action.value }
    default:
      return state
  }
}

export function clampDays(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_DAYS_PER_WEEK
  return Math.min(7, Math.max(1, Math.round(n)))
}

export function recommendedModalities(forWhom: ForWhom | null): readonly string[] {
  return forWhom === 'OTHER' ? RECOMMENDED_OTHER : RECOMMENDED_SELF
}

export function allAnswered(answers: (boolean | null)[]): boolean {
  return answers.length === HEALTH_QUESTION_COUNT && answers.every((a) => a !== null)
}

/** Step gating — may the user leave `step` forward? */
export function canAdvance(step: StartStep, state: StartFlowState): boolean {
  switch (step) {
    case 'forWhom':
      return state.forWhom !== null
    case 'modalities':
      return state.modalities.length > 0
    case 'schedule':
      return (
        state.daysPerWeek >= 1 &&
        state.daysPerWeek <= 7 &&
        (MINUTE_OPTIONS as readonly number[]).includes(state.minutes) &&
        state.fixedClasses.every(isValidFixedClass)
      )
    case 'equipment':
      return true
    case 'health':
      return state.healthSkipped || allAnswered(state.answers)
    case 'result':
      return false
  }
}

export function isValidFixedClass(fc: CreateFixedClassRequest): boolean {
  return (
    fc.modalityCode.length > 0 &&
    fc.weekday >= 1 &&
    fc.weekday <= 7 &&
    /^\d{2}:\d{2}$/.test(fc.startTime) &&
    fc.durationMin >= 10 &&
    fc.durationMin <= 240
  )
}

export function nextStep(step: StartStep): StartStep | null {
  const i = START_STEPS.indexOf(step)
  return i >= 0 && i < START_STEPS.length - 1 ? START_STEPS[i + 1] : null
}

export function previousStep(step: StartStep): StartStep | null {
  const i = START_STEPS.indexOf(step)
  return i > 0 ? START_STEPS[i - 1] : null
}

/** The health screen is the last one before the POST; the result screen shows the answer. */
export const SUBMIT_AFTER_STEP: StartStep = 'health'

// ── Routing preview (PRD §7.1 table) ─────────────────────────────────────────

export interface RoutingPreview {
  track: ScreeningTrack
  /** Level cap on the supported track: L0 when the person cannot stand up without hands. */
  levelCap: SupportedLevel | null
  hrTargetsOff: boolean
  /** The person said pain makes them avoid movement — offer a limit statement later. */
  suggestLimit: boolean
  skipped: boolean
}

const A_INDEXES = [0, 1, 2]
const B_INDEXES = [3, 5, 9]
const CHAIR_INDEX = 6
const PAIN_INDEX = 7
const MEDICATION_INDEX = 8

/**
 * Mirrors the backend routing table so the result screen can show the right
 * line while the POST is in flight. The backend's answer wins once it arrives.
 * Skipped questions → track B (PRD §7.1 edge case).
 */
export function previewRouting(answers: (boolean | null)[], skipped: boolean): RoutingPreview {
  if (skipped || !allAnswered(answers)) {
    return { track: 'B', levelCap: null, hrTargetsOff: false, suggestLimit: false, skipped: true }
  }
  const yes = (i: number) => answers[i] === true
  const track: ScreeningTrack = A_INDEXES.some(yes) ? 'A' : B_INDEXES.some(yes) ? 'B' : 'C'
  const cannotStand = answers[CHAIR_INDEX] === false
  return {
    track,
    levelCap: track === 'A' || cannotStand ? 'L0' : null,
    hrTargetsOff: yes(MEDICATION_INDEX),
    suggestLimit: yes(PAIN_INDEX),
    skipped: false,
  }
}

// ── Payload ──────────────────────────────────────────────────────────────────

export function rankedModalities(codes: string[]): ModalityPick[] {
  return codes.map((code, i) => ({ code, rank: i + 1 }))
}

/**
 * Builds the POST body. The answers go in as a bare boolean array in question
 * order (or null when skipped) — no ids, no wording, nothing else.
 */
export function buildStartPayload(state: StartFlowState): StartFlowRequest {
  const answers = state.healthSkipped || !allAnswered(state.answers) ? null : (state.answers as boolean[])
  const req: StartFlowRequest = {
    modalities: rankedModalities(state.modalities),
    daysPerWeek: clampDays(state.daysPerWeek),
    minutes: state.minutes,
    equipment: state.equipment.length === 0 ? ['NONE'] : state.equipment,
    screening: { answers },
    register: state.register ?? undefined,
  }
  if (state.forWhom === 'OTHER' && state.forUserId) req.forUserId = state.forUserId
  if (state.fixedClasses.length > 0) req.fixedClasses = state.fixedClasses
  if (state.familySessionAges.length > 0) req.familySessionAges = state.familySessionAges
  return req
}

/** Under-18 members never see the flow (PRD §7.9). */
export function isUnderEighteen(me: { ageYears?: number | null; birthYear?: number | null } | null | undefined, now = new Date()): boolean {
  if (!me) return false
  if (typeof me.ageYears === 'number') return me.ageYears < 18
  if (typeof me.birthYear === 'number') return now.getFullYear() - me.birthYear < 18
  return false
}

/** True when the picked modalities fill only one role — one line suggests what is missing (PRD §7.1). */
export function fillsSingleRole(picked: string[], rolesByCode: Record<string, readonly string[]>): boolean {
  const roles = new Set<string>()
  for (const code of picked) for (const r of rolesByCode[code] ?? []) roles.add(r)
  return picked.length > 0 && roles.size === 1
}
