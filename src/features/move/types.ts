/**
 * Kalmio Move — hand-written API types.
 *
 * Source of truth: kalmio-backend/docs/product/movement-build-contract.md §3, §5, §8.
 * The backend does not exist yet; where the contract only sketches a shape the
 * fields below are the single place that decision lives. Regenerate api.d.ts at
 * the end of the build and reconcile here.
 */

// ── Enums (contract §5) ──────────────────────────────────────────────────────

export type MoveRole = 'STRENGTH' | 'AEROBIC' | 'BALANCE' | 'MOBILITY' | 'SKILL'
export type Intensity = 'EASY' | 'MODERATE' | 'HARD'
export type SessionFormat = 'CARD' | 'FLOW' | 'TARGET' | 'DRILL' | 'ENTRY' | 'POOLSIDE'
export type SessionStatus = 'PLANNED' | 'DONE' | 'PLAN_B' | 'MISSED' | 'MOVED' | 'DROPPED' | 'ADDED'
export type LifeStateKind = 'ACTIVE' | 'SICK' | 'INJURED' | 'BREAK' | 'TRAVEL'
export type SupportedLevel = 'L0' | 'L1' | 'L2' | 'L3'
export type EnduranceLevel = 'W' | 'RW' | 'R1' | 'R2'
export type StrengthLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
export type ScreeningTrack = 'A' | 'B' | 'C'
export type ReadinessLight = 'GREEN' | 'AMBER' | 'RED' | 'ILL'
export type DayPart = 'MORNING' | 'MIDDAY' | 'EVENING' | 'ANY'
export type MediaType = 'STILL_START' | 'STILL_END' | 'LOOP' | 'SHEET' | 'PICTOGRAM'
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNPUBLISHED'
export type ReviewReasonCode =
  | 'WRONG_JOINT_POSITION'
  | 'WRONG_SUPPORT'
  | 'ANATOMY_ERROR'
  | 'EQUIPMENT_ERROR'
  | 'UNSAFE_RANGE'
  | 'STYLE_DRIFT'
export type Register = 'FORMAL' | 'INFORMAL'
export type TextSize = 'NORMAL' | 'LARGE'
export type Space = 'NUTRITION' | 'MOVE'
export type LoadClass = 'REST' | 'LIGHT' | 'MODERATE' | 'HARD' | 'LONG'
export type NotTodayChoice = 'SHORTER' | 'LATER' | 'UNWELL'
export type ContraindicationTag =
  | 'knee_deep_flexion'
  | 'floor_transfer'
  | 'overhead'
  | 'spinal_flexion'
  | 'impact'
  | 'single_leg_balance'
  | 'grip'
  | 'wrist_load'
  | 'neck_rotation'
  | 'breath_hold'

// ── Status and space (contract §3) ───────────────────────────────────────────

export interface MoveStatusDto {
  /** Feature gate for the caller. When false the UI renders nothing of Move. */
  enabled: boolean
  /** A movement_profile row exists with active = true. */
  spaceActive: boolean
  /** mealPlanPreferences or dietaryPreferences exist (today's OnboardingGate rule). */
  nutritionActive: boolean
  lastSpace: Space | null
  register: Register | null
}

export const DEFAULT_MOVE_STATUS: MoveStatusDto = {
  enabled: false,
  spaceActive: false,
  nutritionActive: false,
  lastSpace: null,
  register: null,
}

// ── Profile and start flow ───────────────────────────────────────────────────

export interface ModalityDto {
  code: string
  name: string
  roles: MoveRole[]
  format: SessionFormat
  /** True for ENTRY modalities (classes logged with "Megvolt", no pack). */
  entryOnly: boolean
  imageUrl?: string | null
  /** Picture of the start-flow grid, rendered from `lib/modalityPictures.tsx` (walk, run, cycle, strength, band, dumbbell, chair, mobility, family, yoga, dance, water, ball, gym, hike, garden, balance, other). */
  pictureKey?: string | null
}

export interface ModalityPick {
  code: string
  rank: number
}

export type EquipmentCode = 'NONE' | 'DUMBBELLS' | 'BANDS' | 'CHAIR' | 'MAT' | 'BIKE' | 'STEP' | 'PULL_UP_BAR'
export type BandLevel = 'LIGHT' | 'MEDIUM' | 'HEAVY'

export interface ScreeningAnswers {
  /** Ten yes/no answers, or null when the user skipped the questions. */
  answers: boolean[] | null
}

export interface StartFlowRequest {
  forUserId?: string
  modalities: ModalityPick[]
  daysPerWeek: number
  minutes: number
  equipment: EquipmentCode[]
  screening: ScreeningAnswers
  register?: Register
  characterCode?: string
  familySessionAges?: number[]
  /** Fixed classes entered on screen 3 (PRD §7.1); the backend creates the fixed-class rows. */
  fixedClasses?: CreateFixedClassRequest[]
}

export interface ScreeningResultDto {
  track: ScreeningTrack
  levelCap: SupportedLevel | null
  hrTargetsOff: boolean
  /** Present on track A/B; plain-words line such as "Beszéljen a háziorvosával, mielőtt elkezdi." */
  line?: string | null
  doctorConfirmed?: boolean
}

export interface MoveProfileDto {
  id: string
  userId: string
  active: boolean
  modalities: ModalityPick[]
  daysPerWeek: number
  minutes: number
  /** ISO weekdays (1 = Monday … 7 = Sunday) the user prefers; empty = any. */
  weekdays: number[]
  characterCode: string | null
  textSize: TextSize
  register: Register
  /** HH:mm local time for the one daily push, null = off. */
  pushTime: string | null
  hrTargets: boolean
  familySessionAges: number[]
  screening: ScreeningResultDto | null
  supportedLevel: SupportedLevel | null
  enduranceLevel: EnduranceLevel | null
  strengthLevel: StrengthLevel | null
  trainedRecently: boolean
  createdAt: string
  /** Current life state with its dates (PRD §7.7); ACTIVE with null dates when the plan runs. */
  lifeState?: LifeStateDto | null
}

export type UpdateMoveProfileRequest = Partial<
  Pick<
    MoveProfileDto,
    | 'modalities'
    | 'daysPerWeek'
    | 'minutes'
    | 'weekdays'
    | 'characterCode'
    | 'textSize'
    | 'register'
    | 'pushTime'
    | 'hrTargets'
    | 'familySessionAges'
  >
>

export interface StartFlowResponse {
  profile: MoveProfileDto
  screening: ScreeningResultDto
  week: WeekDto
  firstSession: SessionDto | null
}

export interface EquipmentDto {
  items: EquipmentCode[]
  /** Dumbbell inventory in kg, asked at the first strength session (or set in Settings). */
  dumbbellsKg: number[]
  bandLevels: BandLevel[]
}

export interface LimitDto {
  id: string
  tag: ContraindicationTag
  source: 'SCREENING' | 'USER' | 'HELPER' | 'FALL'
  note?: string | null
  createdAt: string
}

export interface CreateLimitRequest {
  tag: ContraindicationTag
  note?: string
}

export interface FixedClassDto {
  id: string
  modalityCode: string
  weekday: number
  startTime: string
  durationMin: number
  label?: string | null
}

export type CreateFixedClassRequest = Omit<FixedClassDto, 'id'>

export interface DoctorConfirmedRequest {
  confirmed: boolean
}

// ── Week and sessions ────────────────────────────────────────────────────────

export interface SessionDto {
  id: string
  date: string
  dayPart: DayPart
  startTime?: string | null
  modalityCode: string
  modalityName: string
  roles: MoveRole[]
  format: SessionFormat
  intensity: Intensity
  durationMin: number
  status: SessionStatus
  /** One plain line of what to expect, in the user's register. */
  expectLine: string | null
  /** True while the session is the generated 10–15 minute first offer. */
  firstSession?: boolean
  optional?: boolean
  /** A fixed class (PRD §7.1 step 3): stays where it is, cannot be dragged or swapped. */
  fixedClass?: boolean
}

export interface WeekDayDto {
  date: string
  restDay: boolean
  sessions: SessionDto[]
}

export interface WeekTargetDto {
  planned: number
  done: number
  activeWeek: boolean
}

export interface WeekDto {
  weekStart: string
  days: WeekDayDto[]
  target: WeekTargetDto
  activeWeeksOf12: number
}

export interface RegenerateWeekResponse {
  diff: MoveReplanDiffDto | null
}

export interface CheckInStateDto {
  due: boolean
  answered: boolean
  /** True when a device delivered last night's sleep — the sleep question is skipped. */
  sleepFromDevice?: boolean
  light?: ReadinessLight | null
}

export interface TodayDto {
  date: string
  session: SessionDto | null
  restDay: boolean
  tomorrowLine: string | null
  checkIn: CheckInStateDto
  pendingDiff: MoveReplanDiffDto | null
  lifeState: LifeStateKind
  gapDays: number
  firstSessionOffer: SessionDto | null
  // ── Added by the today page (PRD §7.7, §7.8); optional so partial DTOs still render ──
  /** Return date of a BREAK / TRAVEL life state, null otherwise. */
  lifeStateUntil?: string | null
  /** SICK / INJURED: the weekly optional "Hogy van? Visszatérjünk?" is due. */
  returnQuestionDue?: boolean
  /** Supported-exercise level; the "Elestem" button shows for L0–L2. */
  supportedLevel?: SupportedLevel | null
  /** The health questions were skipped at start → the page asks again (PRD §7.1 edge case). */
  screeningPending?: boolean
  /** 30-second chair-stand prompt every four weeks and the last two results (PRD §7.8). */
  selfTest?: SelfTestStateDto | null
}

export interface SelfTestStateDto {
  due: boolean
  latest: SelfTestDto | null
  previous: SelfTestDto | null
}

/**
 * The optional `movement` block of `DashboardDto`.
 * Carries the today card (PRD §7.3), the check-in state, the rest-day line and
 * one plain-words coupling line. Never a calorie or energy number.
 */
export interface MovementTodayBlockDto {
  date: string
  session: SessionDto | null
  restDay: boolean
  tomorrowLine: string | null
  checkIn: CheckInStateDto
  /** Plain words, e.g. "Ma erősítés van, ezért a vacsora fehérjében gazdagabb." */
  couplingLine: string | null
  lifeState: LifeStateKind
  pendingDiff: MoveReplanDiffDto | null
}

// ── Player ───────────────────────────────────────────────────────────────────

export interface MediaRefDto {
  mediaId: string
  type: MediaType
  url: string
  /** Still fallback for a loop; a pictogram for a still. */
  fallbackUrl?: string | null
  characterCode: string
  /** Always true today — every demonstration is generated and labelled. */
  generated: boolean
  /**
   * The API only ever returns APPROVED media; the UI still hides anything else
   * (contract §1 "nothing unreviewed is shown as a demonstration").
   */
  reviewStatus: ReviewStatus
}

/** Effort band of a Target step (PRD §8.3 tier 0): the talk-test text travels with it. */
export type EffortBand = 'EASY' | 'MODERATE' | 'HARD'

/** The six regions of the comfort-question body map (PRD §7.4). */
export type BodyRegion = 'NECK_SHOULDER' | 'BACK' | 'HIP' | 'KNEE' | 'ANKLE_FOOT' | 'ARM_WRIST'

/** Session focus dial (PRD §5.2 "four dials"); DEFAULT = whatever the engine planned. */
export type FocusCode = 'DEFAULT' | 'LOWER_BODY' | 'UPPER_BODY' | 'BALANCE' | 'MOBILITY' | 'CORE'

export interface SetLogDto {
  exerciseId: string
  setIndex: number
  reps?: number | null
  weightKg?: number | null
  seconds?: number | null
}

export interface PlayerStepDto {
  index: number
  kind: 'INSTRUCTION' | 'EXERCISE' | 'REST' | 'TARGET' | 'QUESTION'
  exerciseId?: string | null
  title: string
  instruction: string
  cues: string[]
  faults: string[]
  /** Start still (or loop) of the demonstration; null → pictogram + text cues. */
  media: MediaRefDto | null
  /** End still of the approved pair; the player cross-fades start ↔ end 1 s each way. */
  endMedia?: MediaRefDto | null
  pictogramUrl?: string | null
  targetReps?: number | null
  targetWeightKg?: number | null
  targetSeconds?: number | null
  sets?: number | null
  /** Rest between sets of a Card exercise, seconds. */
  restSeconds?: number | null
  /** Last three results of this exercise, newest first, already formatted ("2 × 10 · 6 kg"). */
  lastResults?: string[] | null
  optional: boolean
  /** Never true in the supported pack — the user or the helper taps "Tovább". */
  autoAdvance: boolean
  autoAdvanceSeconds?: number | null
  // ── Flow (PRD §8.4): the unit and its siblings in the family ──────────────
  unitId?: string | null
  /** Easier sibling, as a full step the player can switch to offline. */
  easier?: PlayerStepDto | null
  harder?: PlayerStepDto | null
  /** Flow count: how many repetitions or breaths to count out loud. */
  count?: number | null
  // ── Target (PRD §8.3 tier 0) ─────────────────────────────────────────────
  effortBand?: EffortBand | null
  /** "Végig tud beszélgetni" — the talk-test text for the band, in the user's register. */
  talkTest?: string | null
  /** Voice cue, shown as large text for now (PRD §7.8). */
  spokenCue?: string | null
  // ── Drill (PRD §5.2) ─────────────────────────────────────────────────────
  /** Top-down set-up diagram; null → the player draws cones and a wall inline. */
  diagramUrl?: string | null
  /** Ask for a 1–5 self-score after the task. */
  selfScore?: boolean
}

/** The four dials, pre-filled by the engine and editable before the first step. */
export interface SessionDialsDto {
  minutes: number
  equipment: EquipmentCode[]
  focus: FocusCode
  characterCode: string
}

export interface PlayerSessionDto {
  sessionId: string
  date: string
  modalityCode: string
  modalityName: string
  format: SessionFormat
  durationMin: number
  register: Register
  textSize: TextSize
  characterCode: string
  pack: string
  /** Supported-exercise pack: set-up screen, no auto-advance, formal strings. */
  supportedPack: boolean
  /** True in the user's first session of this modality: starting-load question instead of the 3-answer feedback. */
  firstSession: boolean
  /** Ask "Fájt valami közben?" (levels L0–L2 and the first eight weeks, PRD §7.4). */
  askComfort: boolean
  stopRule: string
  /** Where to prop the phone, in the user's register; null → the UI's default line. */
  setupLine: string | null
  /** ENTRY format: planned start time and place, shown before "Megvolt". */
  startTime?: string | null
  place?: string | null
  dials: SessionDialsDto
  steps: PlayerStepDto[]
  planB: boolean
}

export interface StartSessionRequest {
  minutes?: number
  equipment?: EquipmentCode[]
  focus?: FocusCode
  characterCode?: string
}

export interface ExerciseFeedbackDto {
  exerciseId: string
  /** EASY = "Sokkal több is ment volna", RIGHT = "Pont jó volt", HARD = "Nem ment végig" (PRD §8.2). */
  answer: 'EASY' | 'RIGHT' | 'HARD' | 'PAIN'
  /** First session only: "Mennyit tudott volna még?" 0–6 (6 = six or more). */
  repsInReserve?: number | null
}

/** A Flow sibling switch the user made during the session (PRD §8.4 "the choice is remembered"). */
export interface UnitChoiceDto {
  stepIndex: number
  fromUnitId: string
  toUnitId: string
  direction: 'EASIER' | 'HARDER'
}

export interface SelfScoreDto {
  stepIndex: number
  /** 1–5 */
  score: number
}

export interface CompleteSessionRequest {
  /** 0–10, anchors könnyű / közepes / nagyon nehéz. */
  effort: number
  /** 0 = Nem, 1 = Kicsit, 2 = Igen; absent when the comfort question was not asked. */
  comfort?: number
  painRegion?: BodyRegion
  setLogs: SetLogDto[]
  exerciseFeedback: ExerciseFeedbackDto[]
  unitChoices: UnitChoiceDto[]
  selfScores: SelfScoreDto[]
  /** Wall-clock minutes from the first step to completion, pauses excluded. */
  durationMin: number
  /** True when "Rövidebbet kérek" dropped the optional blocks. */
  shortened: boolean
}

export interface NotTodayRequest {
  choice: NotTodayChoice
}

export interface NotTodayResponse {
  session: SessionDto | null
  diff: MoveReplanDiffDto | null
  lifeState: LifeStateKind
}

export interface SwapSessionRequest {
  modalityCode?: string
  variant?: 'OTHER'
}

export interface MoveSessionRequest {
  date: string
}

export interface MoveSessionConflict {
  reason: string
}

export interface ExerciseSwapRequest {
  exerciseId: string
  /** Omit to list substitutes; set to apply one. */
  substituteId?: string
}

export interface ExerciseSwapResponse {
  substitutes: ExerciseSummaryDto[]
  applied: PlayerSessionDto | null
}

export interface LogUnplannedRequest {
  modalityCode: string
  minutes: number
  effort: number
  date?: string
}

export interface EntryDoneRequest {
  effort: number
}

// ── Check-in, life states, fall, self-test ───────────────────────────────────

export type CheckInFeeling = 'GOOD' | 'AVERAGE' | 'TIRED'
export type CheckInSoreness = 'NONE' | 'MILD' | 'STRONG'
export type CheckInSleep = 'GOOD' | 'MEDIUM' | 'POOR'

export interface CheckInRequest {
  feeling: CheckInFeeling
  soreness: CheckInSoreness
  sleep?: CheckInSleep
}

export interface CheckInResponse {
  light: ReadinessLight
  diff: MoveReplanDiffDto | null
}

export interface LifeStateRequest {
  state: Exclude<LifeStateKind, 'ACTIVE'>
  fromDate?: string
  toDate?: string
}

export interface LifeStateDto {
  state: LifeStateKind
  fromDate: string | null
  toDate: string | null
}

export interface FallReportRequest {
  hurt: boolean
  doctorSeen: boolean
}

/** Answer of `POST /api/move/fall` (PRD §7.8): one level down, health questions again, pause when hurt and no doctor yet. */
export interface FallReportResponse {
  /** Supported level after the drop (L0 stays L0). */
  level: SupportedLevel | null
  /** True when the plan is paused until the user confirms medical advice (hurt && !doctorSeen). */
  paused: boolean
  /** Always true: the health questions are repeated (the page opens them at once). */
  rescreen: boolean
}

export interface SelfTestDto {
  id: string
  date: string
  kind: 'SIT_TO_STAND_30S' | 'SINGLE_LEG_STAND' | 'WALK_6MIN' | 'OTHER'
  value: number
}

export interface SelfTestRequest {
  kind?: SelfTestDto['kind']
  value: number
}

// ── Replan diffs (shared replan_suggestions store, movement pillar) ──────────

export interface MoveReplanChangeDto {
  kind: 'MOVED' | 'DROPPED' | 'EASIER' | 'SHORTER' | 'ADDED' | 'SWAPPED'
  sessionId: string | null
  fromDate?: string | null
  toDate?: string | null
  line: string
}

export interface MoveReplanDiffDto {
  id: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'AUTO_APPLIED'
  /** One plain-words narrative line, e.g. "A mai edzés könnyebb lett: 30 perc laza tempóban." */
  narrative: string
  /** Shown behind "Miért?" */
  reason: string | null
  changes: MoveReplanChangeDto[]
  createdAt: string
}

// ── Progress, library, characters ────────────────────────────────────────────

export interface ProgressWeekDto {
  weekStart: string
  planned: number
  done: number
  active: boolean
  /** True when the week counts only through the reserve rule (done = planned − 1, PRD §11). */
  reserve?: boolean
}

/** One week of the load chart (PRD §8.5): session load sum, fitness/fatigue EWMA (42/7), form = fitness − fatigue. */
export interface LoadPointDto {
  /** Week start (Monday), ISO date. */
  date: string
  load: number
  fitness: number
  fatigue: number
  form: number
}

export interface ProgressGoalsDto {
  /** OPEN for beginners ("nézzük meg, mennyi megy ma"); OWN_HISTORY for regulars. Never a comparison with others. */
  kind: 'OPEN' | 'OWN_HISTORY'
  /** Plain-words target lines from the user's own history; empty for OPEN. */
  lines: string[]
}

export interface ProgressDto {
  activeWeeksOf12: number
  /** Up to the last 12 weeks, oldest first. */
  weeks: ProgressWeekDto[]
  selfTests: SelfTestDto[]
  levels: {
    supported: SupportedLevel | null
    endurance: EnduranceLevel | null
    strength: StrengthLevel | null
  }
  /** False for the first six weeks; the chart is hidden and `loadChart` is empty or null. */
  loadChartAvailable: boolean
  /** Present after six weeks of data; null before. */
  loadChart: LoadPointDto[] | null
  goals: ProgressGoalsDto
}

export interface ExerciseSummaryDto {
  id: string
  code: string
  name: string
  pack: string
  level: SupportedLevel | StrengthLevel | string
  roles: MoveRole[]
  equipment: EquipmentCode[]
  contraindications: ContraindicationTag[]
  media: MediaRefDto[]
  pictogramUrl?: string | null
}

export interface LibraryQuery {
  pack?: string
  level?: string
}

export interface LibraryPackDto {
  code: string
  name: string
  defaultCharacterCode: string
}

/** One library entry: `ExerciseSummaryDto` plus the text the detail sheet needs. */
export interface LibraryExerciseDto extends ExerciseSummaryDto {
  /** One-line cue under the name. */
  cue: string | null
  cues: string[]
  faults: string[]
  /** At least one APPROVED still for the exercise — shows the "gyógytornász ellenőrizte" line. */
  approved: boolean
}

export interface LibraryDto {
  exercises: LibraryExerciseDto[]
  /** Every pack the member may browse, for the tabs. */
  packs: LibraryPackDto[]
  /** Level codes available in the selected pack, in order. */
  levels: string[]
  /** The member's demonstrator; the UI falls back to the pack default, then pictogram + text. */
  characterCode: string | null
}

export interface CharacterDto {
  code: string
  name: string
  /** Plain-words age band from the character bible, e.g. "60-as évei eleje". */
  ageBand: string
  accentColor: string
  defaultRegister: Register
  /** Sheet views keyed by view name: front, threeQuarter, side, back, seated, counter. */
  sheetUrls: Record<string, string>
  sheetVersion: number
  /** BOGYO is the child-friendly figure; it never demonstrates adult exercises. */
  childFriendly: boolean
}

export interface MediaReportRequest {
  note?: string
}

// ── Helper ───────────────────────────────────────────────────────────────────

export interface HelperLinkDto {
  id: string
  helperUserId: string
  helpedUserId: string
  helperName: string | null
  helpedName: string | null
  consented: boolean
  createdAt: string
}

export interface HelperLinksDto {
  helping: HelperLinkDto[]
  helpedBy: HelperLinkDto[]
}

export interface HelperInviteRequest {
  email?: string
  memberId?: string
}

/** One planned session of the helped person — only what "Megvolt, én rögzítem" needs. */
export interface HelperSessionLineDto {
  id: string
  date: string
  modalityName: string
  durationMin: number
  status: SessionStatus
}

/**
 * The weekly summary a consented helper sees (PRD §7.10 step 3): done of planned,
 * the last self-test, whether "Elestem" was pressed. No health or check-in answers.
 */
export interface HelperSummaryDto {
  helpedUserId: string
  weekStart: string
  planned: number
  done: number
  lastSessionDate: string | null
  lastSelfTest: SelfTestDto | null
  /** "Elestem" pressed since the last summary week started. */
  fallReported: boolean
  lifeState: LifeStateKind
  lines: string[]
  sessions: HelperSessionLineDto[]
}

export type EncourageTemplateCode = 'ENC_PROUD' | 'ENC_KEEP_GOING' | 'ENC_SEE_YOU'

export interface EncourageRequest {
  templateCode: EncourageTemplateCode
}

export interface LogOnBehalfRequest {
  sessionId: string
}

// ── Printable sheet, devices, calendar ───────────────────────────────────────

export interface SheetExerciseDto {
  name: string
  pictogramUrl: string | null
  reps: string
  cue: string
}

export interface SheetDayDto {
  date: string
  label: string
  restDay: boolean
  sessionId: string | null
  title: string | null
  durationMin: number | null
  /** Session pictogram (modality), printed beside the title. */
  pictogramUrl: string | null
  exercises: SheetExerciseDto[]
}

export interface SheetQuery {
  start?: string
  /** Helper printing for a consented person (PRD §7.10). */
  forUserId?: string
}

export interface WeekSheetDto {
  weekStart: string
  name: string | null
  register: Register
  days: SheetDayDto[]
  stopRule: string
}

export interface CalendarTokenDto {
  token: string
  url: string
}

export interface DeviceDto {
  provider: 'GARMIN'
  status: 'CONNECTED' | 'MFA_REQUIRED' | 'DISCONNECTED' | 'ERROR'
  lastSyncAt: string | null
  displayName?: string | null
}

export interface DevicesDto {
  devices: DeviceDto[]
  calendar: CalendarTokenDto | null
}

export interface GarminConnectRequest {
  email: string
  password: string
  mfaCode?: string
}

export interface GarminConnectResponse {
  status: 'CONNECTED' | 'MFA_REQUIRED'
}

export interface FamilySessionUnitDto {
  id: string
  kind: 'GAME' | 'CHALLENGE' | 'GRANDPARENT'
  name: string
  minutes: number
  instruction: string
  media: MediaRefDto | null
}

export interface FamilySessionDto {
  date: string
  ages: number[]
  title: string
  /** Always BOGYO — the stylised figure is the only demonstrator of GAME units. */
  characterCode: string
  /** The Flow session the player opens; null when nothing is planned for today. */
  sessionId: string | null
  units: FamilySessionUnitDto[]
}

// ── Admin: review queue, exercises, media ────────────────────────────────────

export interface ShotCardDto {
  /** Start and end pose descriptions. */
  poses?: { start?: string; end?: string } | string[]
  camera?: string
  checkpoints?: string[]
  faults?: string[]
  cues?: { formal?: string[]; informal?: string[] } | string[]
  equipment?: string[]
  /** Any further keys the content agent stored; rendered generically. */
  [key: string]: unknown
}

export interface ReviewQueueItemDto {
  mediaId: string
  exerciseId: string
  exerciseCode: string
  exerciseName: string
  pack: string
  characterCode: string
  characterName: string
  mediaType: MediaType
  url: string
  /** The paired end still when the asset is a start/end pair. */
  pairUrl?: string | null
  style: string | null
  shotCardVersion: number
  provider: string | null
  model: string | null
  attempt: number
  reportCount: number
  status: ReviewStatus
  createdAt: string
  shotCard: ShotCardDto
}

export interface ReviewQueueCountsDto {
  pending: number
  approved: number
  rejected: number
  unpublished: number
}

export interface ReviewQueueDto {
  items: ReviewQueueItemDto[]
  counts: ReviewQueueCountsDto
  packs: string[]
  characters: { code: string; name: string }[]
}

export interface ReviewQueueQuery {
  status?: ReviewStatus
  pack?: string
  character?: string
}

export interface ReviewVerdictRequest {
  verdict: 'APPROVE' | 'REJECT'
  reasonCode?: ReviewReasonCode
  note?: string
}

export interface MediaDto {
  id: string
  exerciseId: string
  characterCode: string
  mediaType: MediaType
  url: string
  status: ReviewStatus
  reviewedAt: string | null
  reasonCode: ReviewReasonCode | null
}

export interface AdminExerciseDto extends ExerciseSummaryDto {
  shotCard: ShotCardDto
  shotCardStatus: 'DRAFT' | 'READY' | 'LOCKED'
  mediaCounts: Record<ReviewStatus, number>
}

export interface ShotCardPatchRequest {
  shotCard: ShotCardDto
  status: AdminExerciseDto['shotCardStatus']
}

export interface MoveAdminStatsDto {
  profiles: number
  activeProfiles: number
  sessionsThisWeek: number
  mediaPending: number
  mediaApproved: number
  mediaRejected: number
}
