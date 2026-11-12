/**
 * Kalmio Move API client — one function per endpoint of the build contract §8.
 *
 * Every mutation opts into the Idempotency-Key interceptor (`requestIdempotencyKey`)
 * like `dashboardService`, so offline replays through the service-worker queue
 * are deduplicated by the backend.
 */
import { api } from '@/lib/api'
import { normaliseCharacter } from '../lib/characters'
import type {
  AdminExerciseDto,
  CalendarTokenDto,
  CharacterDto,
  CheckInRequest,
  CheckInResponse,
  CompleteSessionRequest,
  CreateFixedClassRequest,
  CreateLimitRequest,
  DevicesDto,
  DoctorConfirmedRequest,
  EncourageRequest,
  EntryDoneRequest,
  EquipmentDto,
  ExerciseSwapRequest,
  ExerciseSwapResponse,
  FallReportRequest,
  FallReportResponse,
  FamilySessionDto,
  FixedClassDto,
  GarminConnectRequest,
  GarminConnectResponse,
  HelperInviteRequest,
  HelperLinkDto,
  HelperLinksDto,
  HelperSummaryDto,
  LibraryDto,
  LibraryQuery,
  LifeStateDto,
  LifeStateRequest,
  LimitDto,
  LogOnBehalfRequest,
  LogUnplannedRequest,
  MediaDto,
  MediaReportRequest,
  ModalityDto,
  MoveAdminStatsDto,
  MoveProfileDto,
  MoveReplanDiffDto,
  MoveSessionRequest,
  MoveStatusDto,
  NotTodayRequest,
  NotTodayResponse,
  PlayerSessionDto,
  ProgressDto,
  RegenerateWeekResponse,
  ReviewQueueDto,
  ReviewQueueQuery,
  ReviewVerdictRequest,
  ScreeningAnswers,
  ScreeningResultDto,
  SelfTestDto,
  SelfTestRequest,
  SessionDto,
  SheetQuery,
  ShotCardPatchRequest,
  Space,
  StartFlowRequest,
  StartFlowResponse,
  StartSessionRequest,
  SwapSessionRequest,
  TodayDto,
  UpdateMoveProfileRequest,
  WeekDto,
  WeekSheetDto,
  SessionLogDto,
  UpdateSessionLogRequest,
  CreateSessionRequest,
  ExercisePickDto,
  SessionExerciseDto,
  ModalityDemonstratorsDto,
  PendingGroupDto,
} from '../types'

const IDEMPOTENT = { requestIdempotencyKey: true } as const

export const moveService = {
  // ── Status and space ──────────────────────────────────────────────────────
  getStatus: (): Promise<MoveStatusDto> =>
    api.get<MoveStatusDto>('/api/move/status').then(r => r.data),

  setLastSpace: (space: Space): Promise<void> =>
    api.put('/api/move/space/last', { space }, IDEMPOTENT).then(() => undefined),

  // ── Start flow and profile ────────────────────────────────────────────────
  start: (req: StartFlowRequest): Promise<StartFlowResponse> =>
    api.post<StartFlowResponse>('/api/move/start', req, IDEMPOTENT).then(r => r.data),

  getProfile: (): Promise<MoveProfileDto> =>
    api.get<MoveProfileDto>('/api/move/profile').then(r => r.data),

  updateProfile: (req: UpdateMoveProfileRequest): Promise<MoveProfileDto> =>
    api.patch<MoveProfileDto>('/api/move/profile', req, IDEMPOTENT).then(r => r.data),

  getEquipment: (): Promise<EquipmentDto> =>
    api.get<EquipmentDto>('/api/move/equipment').then(r => r.data),

  putEquipment: (req: EquipmentDto): Promise<EquipmentDto> =>
    api.put<EquipmentDto>('/api/move/equipment', req, IDEMPOTENT).then(r => r.data),

  getLimits: (): Promise<LimitDto[]> =>
    api.get<LimitDto[]>('/api/move/limits').then(r => r.data),

  addLimit: (req: CreateLimitRequest): Promise<LimitDto> =>
    api.post<LimitDto>('/api/move/limits', req, IDEMPOTENT).then(r => r.data),

  removeLimit: (limitId: string): Promise<void> =>
    api.delete(`/api/move/limits/${limitId}`, IDEMPOTENT).then(() => undefined),

  getFixedClasses: (): Promise<FixedClassDto[]> =>
    api.get<FixedClassDto[]>('/api/move/fixed-classes').then(r => r.data),

  addFixedClass: (req: CreateFixedClassRequest): Promise<FixedClassDto> =>
    api.post<FixedClassDto>('/api/move/fixed-classes', req, IDEMPOTENT).then(r => r.data),

  removeFixedClass: (id: string): Promise<void> =>
    api.delete(`/api/move/fixed-classes/${id}`, IDEMPOTENT).then(() => undefined),

  screening: (req: ScreeningAnswers): Promise<ScreeningResultDto> =>
    api.post<ScreeningResultDto>('/api/move/screening', req, IDEMPOTENT).then(r => r.data),

  screeningDoctorConfirmed: (req: DoctorConfirmedRequest): Promise<ScreeningResultDto> =>
    api.post<ScreeningResultDto>('/api/move/screening/doctor-confirmed', req, IDEMPOTENT).then(r => r.data),

  getModalities: (): Promise<ModalityDto[]> =>
    api.get<ModalityDto[]>('/api/move/modalities').then(r => r.data),

  // ── Week and today ────────────────────────────────────────────────────────
  getWeek: (start?: string): Promise<WeekDto> =>
    api.get<WeekDto>('/api/move/week', { params: start ? { start } : {} }).then(r => r.data),

  regenerateWeek: (): Promise<RegenerateWeekResponse> =>
    api.post<RegenerateWeekResponse>('/api/move/week/regenerate', {}, IDEMPOTENT).then(r => r.data),

  getToday: (): Promise<TodayDto> =>
    api.get<TodayDto>('/api/move/today').then(r => r.data),

  // ── Sessions and player ───────────────────────────────────────────────────
  startSession: (sessionId: string, req: StartSessionRequest = {}): Promise<PlayerSessionDto> =>
    api.post<PlayerSessionDto>(`/api/move/sessions/${sessionId}/start`, req, IDEMPOTENT).then(r => r.data),

  shorterSession: (sessionId: string): Promise<PlayerSessionDto> =>
    api.post<PlayerSessionDto>(`/api/move/sessions/${sessionId}/shorter`, {}, IDEMPOTENT).then(r => r.data),

  completeSession: (sessionId: string, req: CompleteSessionRequest): Promise<SessionDto> =>
    api.post<SessionDto>(`/api/move/sessions/${sessionId}/complete`, req, IDEMPOTENT).then(r => r.data),

  planB: (sessionId: string): Promise<PlayerSessionDto> =>
    api.post<PlayerSessionDto>(`/api/move/sessions/${sessionId}/plan-b`, {}, IDEMPOTENT).then(r => r.data),

  notToday: (sessionId: string, req: NotTodayRequest): Promise<NotTodayResponse> =>
    api.post<NotTodayResponse>(`/api/move/sessions/${sessionId}/not-today`, req, IDEMPOTENT).then(r => r.data),

  swapSession: (sessionId: string, req: SwapSessionRequest): Promise<SessionDto> =>
    api.post<SessionDto>(`/api/move/sessions/${sessionId}/swap`, req, IDEMPOTENT).then(r => r.data),

  /** 200 → SessionDto; 409 → axios error whose `response.data` is `{ reason }`. */
  moveSession: (sessionId: string, req: MoveSessionRequest): Promise<SessionDto> =>
    api.post<SessionDto>(`/api/move/sessions/${sessionId}/move`, req, IDEMPOTENT).then(r => r.data),

  exerciseSwap: (sessionId: string, req: ExerciseSwapRequest): Promise<ExerciseSwapResponse> =>
    api.post<ExerciseSwapResponse>(`/api/move/sessions/${sessionId}/exercise-swap`, req, IDEMPOTENT).then(r => r.data),

  easierSession: (sessionId: string): Promise<PlayerSessionDto> =>
    api.post<PlayerSessionDto>(`/api/move/sessions/${sessionId}/easier`, {}, IDEMPOTENT).then(r => r.data),

  /** Add a session by hand (today or later); optional hand-picked exercises. */
  createSession: (req: CreateSessionRequest): Promise<SessionDto> =>
    api.post<SessionDto>('/api/move/sessions', req, IDEMPOTENT).then(r => r.data),

  getSessionExercises: (sessionId: string): Promise<SessionExerciseDto[]> =>
    api.get<SessionExerciseDto[]>(`/api/move/sessions/${sessionId}/exercises`).then(r => r.data),

  /** Replace the main part; an empty list hands it back to the planner. */
  setSessionExercises: (sessionId: string, exercises: ExercisePickDto[]): Promise<SessionExerciseDto[]> =>
    api.put<SessionExerciseDto[]>(`/api/move/sessions/${sessionId}/exercises`, { exercises }, IDEMPOTENT).then(r => r.data),

  /** Remove a session the member added by hand. */
  deleteSession: (sessionId: string): Promise<void> =>
    api.delete(`/api/move/sessions/${sessionId}`, IDEMPOTENT).then(() => undefined),

  getSessionLog: (sessionId: string): Promise<SessionLogDto> =>
    api.get<SessionLogDto>(`/api/move/sessions/${sessionId}/log`).then(r => r.data),

  updateSessionLog: (sessionId: string, req: UpdateSessionLogRequest): Promise<SessionLogDto> =>
    api.patch<SessionLogDto>(`/api/move/sessions/${sessionId}/log`, req, IDEMPOTENT).then(r => r.data),

  /** "Mégsem volt meg": the session opens again; an unplanned entry disappears. */
  undoSessionLog: (sessionId: string): Promise<SessionDto> =>
    api.delete<SessionDto>(`/api/move/sessions/${sessionId}/log`, IDEMPOTENT).then(r => r.data),

  logUnplanned: (req: LogUnplannedRequest): Promise<SessionDto> =>
    api.post<SessionDto>('/api/move/log', req, IDEMPOTENT).then(r => r.data),

  entryDone: (sessionId: string, req: EntryDoneRequest): Promise<SessionDto> =>
    api.post<SessionDto>(`/api/move/entry/${sessionId}/done`, req, IDEMPOTENT).then(r => r.data),

  exportFitUrl: (sessionId: string): string => `/api/move/sessions/${sessionId}/export.fit`,

  /** Downloads the FIT file with the auth header; the caller hands the blob to `saveBlob`. */
  exportFit: (sessionId: string): Promise<Blob> =>
    api
      .get<Blob>(`/api/move/sessions/${sessionId}/export.fit`, { responseType: 'blob' })
      .then(r => r.data),

  // ── Check-in, life state, fall, self-test ─────────────────────────────────
  checkIn: (req: CheckInRequest): Promise<CheckInResponse> =>
    api.post<CheckInResponse>('/api/move/checkin', req, IDEMPOTENT).then(r => r.data),

  checkInKeepOriginal: (): Promise<void> =>
    api.post('/api/move/checkin/keep-original', {}, IDEMPOTENT).then(() => undefined),

  setLifeState: (req: LifeStateRequest): Promise<LifeStateDto> =>
    api.post<LifeStateDto>('/api/move/life-state', req, IDEMPOTENT).then(r => r.data),

  clearLifeState: (): Promise<LifeStateDto> =>
    api.delete<LifeStateDto>('/api/move/life-state', IDEMPOTENT).then(r => r.data),

  reportFall: (req: FallReportRequest): Promise<FallReportResponse> =>
    api.post<FallReportResponse>('/api/move/fall', req, IDEMPOTENT).then(r => r.data),

  addSelfTest: (req: SelfTestRequest): Promise<SelfTestDto> =>
    api.post<SelfTestDto>('/api/move/self-test', req, IDEMPOTENT).then(r => r.data),

  getSelfTests: (): Promise<SelfTestDto[]> =>
    api.get<SelfTestDto[]>('/api/move/self-tests').then(r => r.data),

  updateSelfTest: (id: string, value: number): Promise<SelfTestDto> =>
    api.patch<SelfTestDto>(`/api/move/self-tests/${id}`, { value }, IDEMPOTENT).then(r => r.data),

  deleteSelfTest: (id: string): Promise<void> =>
    api.delete(`/api/move/self-tests/${id}`, IDEMPOTENT).then(() => undefined),

  // ── Replan diffs ──────────────────────────────────────────────────────────
  getReplan: (): Promise<MoveReplanDiffDto[]> =>
    api.get<MoveReplanDiffDto[]>('/api/move/replan').then(r => r.data),

  acceptReplan: (diffId: string): Promise<void> =>
    api.post(`/api/move/replan/${diffId}/accept`, {}, IDEMPOTENT).then(() => undefined),

  declineReplan: (diffId: string): Promise<void> =>
    api.post(`/api/move/replan/${diffId}/decline`, {}, IDEMPOTENT).then(() => undefined),

  // ── Progress, library, characters, media ──────────────────────────────────
  getProgress: (): Promise<ProgressDto> =>
    api.get<ProgressDto>('/api/move/progress').then(r => r.data),

  getLibrary: (q: LibraryQuery = {}): Promise<LibraryDto> =>
    api.get<LibraryDto>('/api/move/library', { params: q }).then(r => r.data),

  reportMedia: (mediaId: string, req: MediaReportRequest = {}): Promise<void> =>
    api.post(`/api/move/media/${mediaId}/report`, req, IDEMPOTENT).then(() => undefined),

  getDemonstrators: (): Promise<ModalityDemonstratorsDto[]> =>
    api.get<ModalityDemonstratorsDto[]>('/api/move/demonstrators').then(r => r.data),

  getCharacters: (): Promise<CharacterDto[]> =>
    api.get<Record<string, unknown>[]>('/api/move/characters').then(r => r.data.map(normaliseCharacter)),

  // ── Helper ────────────────────────────────────────────────────────────────
  getHelper: (): Promise<HelperLinksDto> =>
    api.get<HelperLinksDto>('/api/move/helper').then(r => r.data),

  inviteHelper: (req: HelperInviteRequest): Promise<HelperLinkDto> =>
    api.post<HelperLinkDto>('/api/move/helper/invite', req, IDEMPOTENT).then(r => r.data),

  consentHelper: (linkId: string): Promise<HelperLinkDto> =>
    api.post<HelperLinkDto>(`/api/move/helper/${linkId}/consent`, {}, IDEMPOTENT).then(r => r.data),

  revokeHelperConsent: (linkId: string): Promise<void> =>
    api.delete(`/api/move/helper/${linkId}/consent`, IDEMPOTENT).then(() => undefined),

  getHelperSummary: (helpedUserId: string): Promise<HelperSummaryDto> =>
    api.get<HelperSummaryDto>(`/api/move/helper/${helpedUserId}/summary`).then(r => r.data),

  encourage: (helpedUserId: string, req: EncourageRequest): Promise<void> =>
    api.post(`/api/move/helper/${helpedUserId}/encourage`, req, IDEMPOTENT).then(() => undefined),

  logOnBehalf: (helpedUserId: string, req: LogOnBehalfRequest): Promise<SessionDto> =>
    api.post<SessionDto>(`/api/move/helper/${helpedUserId}/log-on-behalf`, req, IDEMPOTENT).then(r => r.data),

  // ── Sheet, calendar, devices, family ──────────────────────────────────────
  /** `forUserId` prints for a consented helped person (PRD §7.10). */
  getSheet: (q: SheetQuery = {}): Promise<WeekSheetDto> =>
    api
      .get<WeekSheetDto>('/api/move/sheet', {
        params: { ...(q.start ? { start: q.start } : {}), ...(q.forUserId ? { forUserId: q.forUserId } : {}) },
      })
      .then(r => r.data),

  getCalendarToken: (): Promise<CalendarTokenDto> =>
    api.get<CalendarTokenDto>('/api/move/calendar/token').then(r => r.data),

  rotateCalendarToken: (): Promise<CalendarTokenDto> =>
    api.post<CalendarTokenDto>('/api/move/calendar/token/rotate', {}, IDEMPOTENT).then(r => r.data),

  getDevices: (): Promise<DevicesDto> =>
    api.get<DevicesDto>('/api/move/devices').then(r => r.data),

  connectGarmin: (req: GarminConnectRequest): Promise<GarminConnectResponse> =>
    api.post<GarminConnectResponse>('/api/move/devices/garmin/connect', req, IDEMPOTENT).then(r => r.data),

  disconnectGarmin: (): Promise<void> =>
    api.delete('/api/move/devices/garmin', IDEMPOTENT).then(() => undefined),

  syncGarmin: (): Promise<void> =>
    api.post('/api/move/devices/garmin/sync', {}, IDEMPOTENT).then(() => undefined),

  getFamilySession: (): Promise<FamilySessionDto> =>
    api.get<FamilySessionDto>('/api/move/family-session').then(r => r.data),

  // ── Admin ─────────────────────────────────────────────────────────────────
  admin: {
    reviewQueue: (q: ReviewQueueQuery = {}): Promise<ReviewQueueDto> =>
      api
        .get<ReviewQueueDto>('/api/admin/move/review/queue', {
          params: { status: q.status ?? 'PENDING', pack: q.pack ?? '', character: q.character ?? '' },
        })
        .then(r => r.data),

    review: (mediaId: string, req: ReviewVerdictRequest): Promise<MediaDto> =>
      api.post<MediaDto>(`/api/admin/move/review/${mediaId}`, req, IDEMPOTENT).then(r => r.data),

    pendingGroups: (): Promise<PendingGroupDto[]> =>
      api.get<PendingGroupDto[]>('/api/admin/move/review/pending-groups').then(r => r.data),

    /** Approves every pending asset of one pack and demonstrator. */
    approveAll: (packCode: string, characterCode: string): Promise<{ approved: number }> =>
      api.post<{ approved: number }>('/api/admin/move/review/bulk', { packCode, characterCode }, IDEMPOTENT).then(r => r.data),

    exercises: (): Promise<AdminExerciseDto[]> =>
      api.get<AdminExerciseDto[]>('/api/admin/move/exercises').then(r => r.data),

    exercise: (id: string): Promise<AdminExerciseDto> =>
      api.get<AdminExerciseDto>(`/api/admin/move/exercises/${id}`).then(r => r.data),

    patchShotCard: (id: string, req: ShotCardPatchRequest): Promise<AdminExerciseDto> =>
      api.patch<AdminExerciseDto>(`/api/admin/move/exercises/${id}/shot-card`, req, IDEMPOTENT).then(r => r.data),

    uploadMedia: (id: string, form: FormData): Promise<MediaDto> =>
      api
        .post<MediaDto>(`/api/admin/move/exercises/${id}/media`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          requestIdempotencyKey: true,
        })
        .then(r => r.data),

    uploadCharacterSheet: (code: string, form: FormData): Promise<CharacterDto> =>
      api
        .post<CharacterDto>(`/api/admin/move/characters/${code}/sheet`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          requestIdempotencyKey: true,
        })
        .then(r => r.data),

    stats: (): Promise<MoveAdminStatsDto> =>
      api.get<MoveAdminStatsDto>('/api/admin/move/stats').then(r => r.data),
  },
}
