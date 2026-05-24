import { api } from '@/lib/api'
import type { BiologicalSex, ActivityLevel, DietaryConstraints, Goal, HealthFeedbackItem, TargetSetResponse, TdeeResponse, TimePreferencesDto, UserStageResponse, DashboardStateResponse } from '@/types'

export interface UserMealPreferences {
  days?: number
  selectedMealTypes?: string[]
  kcalTarget?: number
  proteinTarget?: number
  budgetMax?: number
  prepTimeMax?: number
  forbiddenIngredientIds?: string[]
  maxRecipeRepetitions?: number
  constraintWeights?: { leftovers: number; budget: number; prepTime: number; recipeRepeat: number }
  servingConfig?: { minMultiplier: number; maxMultiplier: number; step: number }
  mealCalorieTargets?: Record<string, number>
}

export type DietaryPreferences = DietaryConstraints

export interface UserSettings {
  id: string
  email: string
  role: 'USER' | 'ADMIN'
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  username: string | null
  languagePreference: string | null
  mealPlanPreferences: UserMealPreferences | null
  dietaryPreferences: DietaryPreferences | null
  createdAt: string
  /** When true, the prep scheduler may extend batches into the freezer hold window. */
  prefersFreezing: boolean
  /** ISO weekday (1=Mon..7=Sun) the user prefers to do prep on. Null = no preference. */
  preferredPrepDayOfWeek: number | null
  // ── Body data ──────────────────────────────────────────────────────────────
  weightKg: number | null
  heightCm: number | null
  ageYears: number | null
  biologicalSex: BiologicalSex | null
  activityLevel: ActivityLevel | null
  /** TDEE-derived suggestion, null until body data is set. */
  suggestedKcalTarget: number | null
  /** 1.8 g/kg protein target, null until weight is set. */
  suggestedProteinTarget: number | null
  // ── Macro targets ──────────────────────────────────────────────────────────
  /** Daily carbohydrate target in grams. Null = no target set. */
  carbsTargetG: number | null
  /** Daily fat target in grams. Null = no target set. */
  fatTargetG: number | null
  /**
   * Composed premium status — true when the user is premium from any source
   * (admin flag, Founding Member purchase, active taster grant). Never combine
   * the raw fields client-side; use this single field.
   */
  isPremium: boolean
  /** True when the user has purchased the lifetime Founding Member entitlement. */
  foundingMember: boolean
  /** ISO-8601 timestamp of the Founding Member purchase. Null until purchased. */
  foundingMemberPurchasedAt: string | null
  /** User-chosen name for their diófa tree. Available from FIATAL stage onward. Null = unnamed. */
  diofaName: string | null
  /** User's current fitness/nutrition goal. Null = not yet set. KALMIO-223. */
  goal: Goal | null
  /** Optional override for the goal's default %BW/week rate. Null = use built-in default. */
  goalTargetPct: number | null
  /**
   * Identifiers of coachmarks the user has already dismissed.
   * Server-persisted so the max-once guarantee survives sign-out / device switch.
   * KALMIO-326.
   */
  coachmarksSeen: string[]
  /**
   * When true, the meal-plan solver rewards recipes backed by locally sourced
   * ingredients (Hungarian provenance). Default false.
   * KALMIO-352.
   */
  preferLocallySourced: boolean
}

export interface BodyDataRequest {
  weightKg?: number | null
  heightCm?: number | null
  ageYears?: number | null
  biologicalSex?: BiologicalSex | null
  activityLevel?: ActivityLevel | null
}

/** PATCH /api/users/me/body-data extended with goal — KALMIO-230 / B8.
 *  Backend needs to accept this field; tracked in the B8 In Progress comment. */
export interface UpdateGoalRequest {
  goal: Goal | null
  goalTargetPct?: number | null
}

export interface UpdateSettingsRequest {
  languagePreference?: string | null
  mealPlanPreferences?: UserMealPreferences | null
  dietaryPreferences?: DietaryPreferences | null
  prefersFreezing?: boolean
  preferredPrepDayOfWeek?: number | null
  carbsTargetG?: number | null
  fatTargetG?: number | null
  /** When true, the solver steers the plan toward locally sourced ingredients. KALMIO-352. */
  preferLocallySourced?: boolean
}

export interface UpdateProfileRequest {
  firstName?: string | null
  lastName?: string | null
  avatarUrl?: string | null
  username?: string | null
}

/** Canonical TanStack Query key for GET /api/users/me */
export const USERS_ME_QUERY_KEY = ['users', 'me'] as const

/** Canonical TanStack Query key for GET /api/users/me/stage */
export const USERS_STAGE_QUERY_KEY = ['users', 'stage'] as const

export const usersService = {
  getMe: () => api.get<UserSettings>('/api/users/me').then(r => r.data),
  updateSettings: (body: UpdateSettingsRequest) =>
    api.put<UserSettings>('/api/users/me/settings', body).then(r => r.data),
  updateProfile: (body: UpdateProfileRequest) =>
    api.put<UserSettings>('/api/users/me/profile', body).then(r => r.data),
  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<UserSettings>('/api/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
  getTimePreferences: (): Promise<TimePreferencesDto> =>
    api.get<TimePreferencesDto>('/api/users/me/time-preferences').then(r => r.data),
  patchTimePreferences: (req: Partial<TimePreferencesDto>): Promise<TimePreferencesDto> =>
    api.patch<TimePreferencesDto>('/api/users/me/time-preferences', req).then(r => r.data),
  patchBodyData: (body: BodyDataRequest): Promise<UserSettings> =>
    api.patch<UserSettings>('/api/users/me/body-data', body).then(r => r.data),
  deleteBodyData: (): Promise<UserSettings> =>
    api.delete<UserSettings>('/api/users/me/body-data').then(r => r.data),
  /** GET /api/users/me/stage — returns current growth stage + transition history. */
  getMyStage: (): Promise<UserStageResponse> =>
    api.get<UserStageResponse>('/api/users/me/stage').then(r => r.data),
  /** GET /api/users/me/dashboard-state — returns current Diófa stage + visible module list. */
  getMyDashboardState: (): Promise<DashboardStateResponse> =>
    api.get<DashboardStateResponse>('/api/users/me/dashboard-state').then(r => r.data),
  /** PUT /api/users/me/diofa-name — set or update the user's diófa tree name (FIATAL+ only). */
  updateDiofaName: (name: string): Promise<void> =>
    api.put('/api/users/me/diofa-name', { name }).then(() => undefined),
  /**
   * GET /api/users/me/targets — returns computed TDEE + macro targets.
   * Returns null (204) when body data is incomplete or goal is not set.
   * KALMIO-223 / A1.
   */
  getTargets: (): Promise<TargetSetResponse | null> =>
    api.get<TargetSetResponse>('/api/users/me/targets').then(r =>
      r.status === 204 || !r.data ? null : r.data
    ),
  /**
   * GET /api/users/me/tdee — goal-independent TDEE from body data alone.
   * Returns null (204) when body data is incomplete.
   */
  getTdee: (): Promise<TdeeResponse | null> =>
    api.get<TdeeResponse>('/api/users/me/tdee').then(r =>
      r.status === 204 || !r.data ? null : r.data
    ),
  /**
   * GET /api/users/me/goal-feedback — returns list of health-feedback items.
   * Returns empty array when no warnings apply or body data / goal is absent.
   * KALMIO-224 / A2.
   */
  getGoalFeedback: (): Promise<HealthFeedbackItem[]> =>
    api.get<HealthFeedbackItem[]>('/api/users/me/goal-feedback').then(r => r.data),
  /**
   * PATCH /api/users/me/body-data — update user goal.
   * NOTE: The backend UpdateBodyDataRequest needs a `goal` field added (tracked in KALMIO-230 comment).
   * This call will silently succeed once the backend accepts the `goal` field.
   */
  updateGoal: (req: UpdateGoalRequest): Promise<UserSettings> =>
    api.patch<UserSettings>('/api/users/me/body-data', req).then(r => r.data),

  /**
   * POST /api/users/me/coachmarks/{name} — record that the user has dismissed a named
   * coachmark. Idempotent: calling it twice returns the same result.
   * Returns the updated UserSettings including the new coachmarksSeen list.
   * KALMIO-326.
   */
  markCoachmarkSeen: (name: string): Promise<UserSettings> =>
    api.post<UserSettings>(`/api/users/me/coachmarks/${encodeURIComponent(name)}`).then(r => r.data),
}
