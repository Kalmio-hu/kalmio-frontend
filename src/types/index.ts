// ── Enums ─────────────────────────────────────────────────────────────────

export type BiologicalSex = 'MALE' | 'FEMALE' | 'PREFER_NOT_TO_SAY'

// ── Recipe Families (W7) ──────────────────────────────────────────────────

/**
 * The "strictness" tier of a recipe's dietary profile — derived server-side
 * from ingredient flags. VEGAN is strictest, OMNIVORE is least strict.
 *
 * Compatibility table for the swap UI:
 *   VEGAN user     → VEGAN only
 *   VEGETARIAN     → VEGAN + VEGETARIAN
 *   PESCATARIAN    → VEGAN + VEGETARIAN + PESCATARIAN
 *   OMNIVORE       → all four
 */
export type DietTier = 'VEGAN' | 'VEGETARIAN' | 'PESCATARIAN' | 'OMNIVORE'

/**
 * Per-tier compatibility: returns the set of tiers a user of the given
 * effectiveDietTier can eat. Defense-in-depth; the server also enforces this.
 */
export function compatibleDietTiers(userTier: DietTier): DietTier[] {
  switch (userTier) {
    case 'VEGAN':        return ['VEGAN']
    case 'VEGETARIAN':   return ['VEGAN', 'VEGETARIAN']
    case 'PESCATARIAN':  return ['VEGAN', 'VEGETARIAN', 'PESCATARIAN']
    case 'OMNIVORE':     return ['VEGAN', 'VEGETARIAN', 'PESCATARIAN', 'OMNIVORE']
  }
}

/** Sort order for diet tiers — VEGAN first (strictest). */
export const DIET_TIER_ORDER: Record<DietTier, number> = {
  VEGAN: 0,
  VEGETARIAN: 1,
  PESCATARIAN: 2,
  OMNIVORE: 3,
}

/**
 * A sibling variant within a recipe family.
 * Returned as part of GET /api/recipes/{id} siblings array.
 */
export interface RecipeSibling {
  id: string
  variantLabel: string | null
  dietTier: DietTier | null
  kcal: number | null
  protein: number | null
}

/**
 * A recipe family grouping. Returned from GET /api/recipe-families/{id}.
 * Translations follow the same JSONB pattern as RecipeTranslations.
 */
export interface RecipeFamilyLocaleTranslation {
  name: string
  description?: string | null
}

export interface RecipeFamilyTranslations {
  en: RecipeFamilyLocaleTranslation | null
  hu: RecipeFamilyLocaleTranslation | null
}

export interface RecipeFamilyMember {
  id: string
  name: string
  variantLabel: string | null
  dietTier: DietTier | null
  kcal: number | null
  protein: number | null
}

export interface RecipeFamily {
  id: string
  name: string
  description: string | null
  translations: RecipeFamilyTranslations | null
  members?: RecipeFamilyMember[]
}

/** Request bodies for admin family CRUD */
export interface CreateRecipeFamilyRequest {
  name: string
  description?: string | null
  translations?: RecipeFamilyTranslations | null
}

export type UpdateRecipeFamilyRequest = Partial<CreateRecipeFamilyRequest>

/** Request body for POST /api/recipes/{recipeId}/family */
export interface AssignRecipeFamilyRequest {
  familyId: string
  variantLabel: string | null
}
export type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE'

/** User fitness/nutrition goal — drives TDEE-based macro targets. KALMIO-223. */
export type Goal =
  | 'MAINTAIN'
  | 'MILD_LOSS'
  | 'AGGRESSIVE_LOSS'
  | 'RECOMPOSITION'
  | 'CLEAN_BULK'
  | 'DIRTY_BULK'

/** Severity level returned by GET /api/users/me/goal-feedback. KALMIO-224. */
export type HealthFeedbackSeverity = 'WARN' | 'STRONG_WARN'

/** One health-feedback item from GET /api/users/me/goal-feedback. */
export interface HealthFeedbackItem {
  severity: HealthFeedbackSeverity
  messageKey: string
  params: Record<string, unknown>
}

/** Response shape from GET /api/users/me/targets. 204 = null (body data incomplete or no goal set). */
export interface TargetSetResponse {
  tdeeKcal: number
  targetKcal: number
  proteinG: number
  carbsG: number
  fatG: number
}

/** Response shape from GET /api/users/me/tdee. 204 = null (body data incomplete). Goal-independent. */
export interface TdeeResponse {
  tdeeKcal: number
}

export type IngredientCategory = 'PROTEIN' | 'CARB' | 'FAT' | 'VEGGIE' | 'SPICE'
export type Unit = 'G' | 'ML' | 'PIECE'
export type MealType = 'BREAKFAST' | 'MORNING_SNACK' | 'LUNCH' | 'AFTERNOON_SNACK' | 'DINNER' | 'SNACK'
export type RecipeTag = 'QUICK' | 'CHEAP' | 'MEALPREP' | 'HIGH_PROTEIN' | 'HEALTHY' | 'VEGETARIAN' | 'VEGAN' | 'COMFORT' | 'KID_FRIENDLY' | 'BREAKFAST' | 'MORNING_SNACK' | 'LUNCH' | 'AFTERNOON_SNACK' | 'DINNER' | 'SNACK'

// ── Recipe Filter (KALMIO-353) ──────────────────────────────────────────────

/**
 * Pre-solve candidate-recipe filter.
 *
 * Dimensions are ANDed across rows; values within a row are ORed.
 * An empty/null filter means all accessible recipes are candidates.
 */
export interface RecipeFilter {
  /** When true, only recipes the current user created are included. */
  ownOnly?: boolean
  /** Recipe must carry at least one of these RecipeTag values. */
  tags?: string[]
  /** Recipe must carry at least one matching cultural tag value. */
  culturalTags?: string[]
}

// ── Macros ────────────────────────────────────────────────────────────────

export interface Macros {
  kcal: number
  protein: number
  fat: number
  carbs: number
}

// ── Ingredients ───────────────────────────────────────────────────────────

export interface DietaryConstraints {
  vegetarian: boolean
  vegan: boolean
  pescatarian: boolean
  glutenFree: boolean
  dairyFree: boolean
  lactoseFree: boolean
  milkProteinFree: boolean
  eggFree: boolean
  nutFree: boolean
  peanutFree: boolean
  soyFree: boolean
  fishFree: boolean
  shellfishFree: boolean
  sesameFree: boolean
  halal: boolean
  kosher: boolean
  keto: boolean
  lowGi: boolean
  lowFodmap: boolean
  paleo: boolean
}

export type DietaryRestrictionKey = keyof DietaryConstraints

export interface IngredientLocaleTranslation {
  name: string
  aliases: string[]
}

export interface IngredientTranslations {
  en: IngredientLocaleTranslation | null
  hu: IngredientLocaleTranslation | null
}

export type ContentVisibility = 'PUBLIC' | 'PRIVATE' | 'PENDING_REVIEW' | 'PRIVATE_TO_IMPORTER'

export interface Ingredient {
  id: string
  name: string
  aliases: string[]
  category: IngredientCategory
  macros: Macros
  constraints: DietaryConstraints
  density: number | null
  /** Canonical grams per piece — required if any recipe uses this ingredient in PIECE units. */
  gramsPerPiece: number | null
  translations: IngredientTranslations | null
  machineTranslated: boolean
  /** Shelf-stable pantry staple — excluded from leftover calculations. */
  pantryItem: boolean
  visibility: ContentVisibility
  createdByUserId: string | null
  createdByUsername: string | null
}

export interface CreateIngredientRequest {
  name: string
  aliases: string[]
  category: IngredientCategory
  macros: { kcal: number; protein: number; fat: number; carbs: number }
  constraints: DietaryConstraints
  density?: number | null
  gramsPerPiece?: number | null
  pantryItem: boolean
}

export type UpdateIngredientRequest = CreateIngredientRequest

// ── Recipes ───────────────────────────────────────────────────────────────

export interface RecipeIngredientRef {
  id: string
  ingredientId: string
  amount: number
  unit: Unit
}

export interface RecipeLocaleTranslation {
  name: string
  steps: string[]
}

export interface RecipeTranslations {
  en: RecipeLocaleTranslation | null
  hu: RecipeLocaleTranslation | null
}

export interface Recipe {
  id: string
  name: string
  steps: string[]
  prepTimeMinutes: number
  cookTimeMinutes: number
  servings: number
  macros: Macros | null
  estimatedCostPerServing: number | null
  ingredients: RecipeIngredientRef[]
  tags: RecipeTag[]
  translations: RecipeTranslations | null
  machineTranslated: boolean
  /** Days the prepared recipe stays consumable in the fridge after cooking. 0 = eat fresh. */
  holdDaysRefrigerated: number
  /** Whether the prepared portions tolerate freezing after cooking. */
  freezableAfterPrep: boolean
  /** Days the prepared recipe stays consumable when frozen. Null when not freezable. */
  holdDaysFrozen: number | null
  /** Hours between starting prep and being ready to eat (overnight oats = ~8). */
  prepLeadTimeHours: number
  /** Cultural / cuisine classification labels. */
  culturalTags: string[]
  /** Minutes of hands-on active preparation work. */
  activePrepMinutes: number | null
  /** Minutes of passive waiting time. */
  passivePrepMinutes: number | null
  visibility: ContentVisibility
  createdByUserId: string | null
  createdByUsername: string | null
  imageUrl: string | null
  /** Optional finishing/plating note shown after steps. Not in macros or shopping list. */
  garnish: string | null
  // ── Recipe family fields (W7) ─────────────────────────────────────────────
  /** UUID of the recipe family this recipe belongs to. Null = standalone. */
  familyId: string | null
  /** Localised family name (e.g. "Zöldborsófőzelék"). Null when no family. */
  familyName: string | null
  /** Localised variant label (e.g. "tofuval", "tükörtojással"). Null when no family. */
  variantLabel: string | null
  /** Dietary tier derived from ingredient flags. Always present once W3 runner runs. */
  dietTier: DietTier | null
  /**
   * All family siblings (unfiltered by diet) — present when familyId is set.
   * Null when this is a standalone recipe.
   */
  siblings: RecipeSibling[] | null
}

export interface CreateRecipeRequest {
  name: string
  steps: string[]
  prepTimeMinutes: number
  cookTimeMinutes: number
  servings: number
  ingredients: { ingredientId: string; amount: number; unit: Unit; id?: string }[]
  tags: RecipeTag[]
  /** Optional prep prefs — backend backfills defaults when omitted. */
  holdDaysRefrigerated?: number
  freezableAfterPrep?: boolean
  holdDaysFrozen?: number | null
  prepLeadTimeHours?: number
  culturalTags?: string[]
  activePrepMinutes?: number | null
  passivePrepMinutes?: number | null
}

export type UpdateRecipeRequest = CreateRecipeRequest

// ── AI recipe import (KALMIO-181 / E11.2 + KALMIO-187 / E11.8) ────────────

export interface HealthifySuggestion {
  /** What to swap, e.g. "Tejföl → görög joghurt (10% zsír)". */
  swap: string
  /** Short rationale in Hungarian, e.g. "Ugyanolyan krémes, de 40 kcal-lal kevesebb adagonként." */
  reason: string
  /** Estimated per-serving calorie change (negative = fewer kcal). */
  kcalDelta: number
  /** Estimated per-serving protein change in grams. */
  proteinDelta: number
}

/**
 * Response from `POST /api/recipes/from-text` and `POST /api/recipes/from-handwriting`.
 * The recipe is a draft — nothing is persisted until the user calls
 * `POST /api/recipes/from-text/confirm`.
 */
export interface RecipeImportPreview {
  recipe: Recipe
  /** Fraction of ingredient lines the parser matched against the Kalmio catalog (0.0–1.0). */
  ingredientMatchConfidence: number
  /** Raw ingredient lines the parser could not match. The user resolves them client-side. */
  unmatchedLines: string[]
  /** Up to three Hungarian-cuisine-aware swap suggestions. */
  healthifySuggestions: HealthifySuggestion[]
}

/** Which AI-import path produced the preview being confirmed. */
export type RecipeImportSource = 'PASTE_TEXT' | 'HANDWRITING'

/** Body for `POST /api/recipes/from-text/confirm`. */
export interface RecipeImportConfirmRequest {
  name: string
  steps: string[]
  prepTimeMinutes: number
  cookTimeMinutes: number
  servings: number
  ingredients: { ingredientId: string; amount: number; unit: Unit; id?: string }[]
  tags: RecipeTag[]
  /** Cultural / cuisine tags to persist on the recipe (preview seeds `USER_IMPORTED`). */
  culturalTags: string[]
  source: RecipeImportSource
  /** Optional source URL for paste-text imports — stored on the event payload for attribution. */
  sourceUrl?: string | null
  /** Number of healthify suggestions the user accepted before saving (for AI ROI metrics). */
  appliedHealthifyCount?: number
}

// ── Retail ────────────────────────────────────────────────────────────────

export interface RetailProvider {
  id: string
  name: string
  country: string
  currency: string
  baseUrl: string | null
  active: boolean
}

export interface RetailIngredientMapping {
  ingredientId: string
  matchConfidence: number
}

export interface RetailProduct {
  id: string
  providerId: string
  externalProductId: string
  name: string
  brand: string | null
  packageSize: number
  unit: Unit
  price: number
  remoteUrl: string | null
  active: boolean
  ingredientMappings: RetailIngredientMapping[]
}

export interface CreateRetailProductRequest {
  providerId: string
  externalProductId: string
  name: string
  brand?: string | null
  packageSize: number
  unit: Unit
  price: number
  remoteUrl?: string | null
  ingredientMappings: { ingredientId: string; matchConfidence: number }[]
}

export interface UpdateRetailProductRequest {
  externalProductId: string
  name: string
  brand?: string | null
  packageSize: number
  unit: Unit
  price: number
  remoteUrl?: string | null
  ingredientMappings: { ingredientId: string; matchConfidence: number }[]
}

// ── Fridge ────────────────────────────────────────────────────────────────

export interface FridgeItem {
  id: string
  ingredientId: string
  ingredientName: string
  ingredientCategory: IngredientCategory | null
  pantryItem: boolean
  amount: number
  unit: Unit
  addedAt: string
  expiryDate: string | null   // ISO date string "YYYY-MM-DD"
  source: string              // "MANUAL" | "SHOPPING" | "GROOMING"
}

export interface AddFridgeItemRequest {
  ingredientId: string
  amount: number
  unit: Unit
  expiryDate?: string         // optional ISO date string
}

export interface UpdateFridgeItemRequest {
  expiryDate?: string
  amount?: number
}

export interface ConstraintWeights {
  leftovers: number
  budget: number
  prepTime: number
  recipeRepeat: number
}

export interface GenerateMealPlanRequest {
  days: number
  selectedMeals: MealType[]
  constraints: {
    kcalTarget: number
    proteinTarget?: number | null
    budgetMax?: number | null
    prepTimeMax?: number | null
    forbiddenIngredientIds?: string[]
    maxRecipeRepetitions?: number | null
    constraintWeights?: ConstraintWeights | null
    mealCalorieTargets?: Record<string, number> | null
    fridgeIngredientIds?: string[] | null
    dietaryRestrictions?: string[] | null
    carbsTargetG?: number | null
    fatTargetG?: number | null
  }
  servingConfig?: {
    minMultiplier: number
    maxMultiplier: number
    step: number
  } | null
}

// ── Calendar Plans ────────────────────────────────────────────────────────

export type PlanStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
export type PlannedMealStatus = 'PLANNED' | 'EATEN' | 'SKIPPED' | 'REPLACED'

export interface PlannedMeal {
  id: string
  planId: string
  date: string              // ISO date "YYYY-MM-DD"
  mealType: MealType
  recipeId: string
  recipeName: string
  macros: Macros | null
  estimatedCostPerServing: number | null
  servingMultiplier: number
  status: PlannedMealStatus
  replacedWithRecipeId: string | null
  eatenAt: string | null
  notes: string | null
  isBatchCookLeftover?: boolean
  /** The family member this slot was solved for. Null on solo / legacy plans. */
  memberId?: string | null
}

export interface Plan {
  id: string
  userId: string
  startDate: string         // "YYYY-MM-DD"
  endDate: string           // "YYYY-MM-DD"
  status: PlanStatus
  shoppingCycleDays: number
  createdAt: string
  meals: PlannedMeal[]
  /** Pre-solve candidate-recipe filter stored on this plan. Null = no filter. KALMIO-353. */
  recipeFilter?: RecipeFilter | null
}

export interface CreatePlanRequest {
  startDate: string
  cycleDays: number
  constraints: GenerateMealPlanRequest
  /** Optional pre-solve candidate-recipe filter (KALMIO-353). Null = all recipes. */
  recipeFilter?: RecipeFilter | null
}

export interface UpdatePlannedMealRequest {
  status?: PlannedMealStatus
  replacedWithRecipeId?: string
  notes?: string
  servingMultiplier?: number
}

// ── User Stage (E1 / gamification) ───────────────────────────────────────

/** Growth stages for the Diófa progression system. */
export type UserStageValue = 'MAG' | 'CSEMETE' | 'SUHANG' | 'FIATAL' | 'TERMO'

export interface StageTransition {
  fromStage: UserStageValue
  toStage: UserStageValue
  occurredAt: string   // ISO-8601
  triggerEvent: string
}

/** Response from GET /api/users/me/stage */
export interface UserStageResponse {
  currentStage: UserStageValue
  enteredAt: string    // ISO-8601
  transitions: StageTransition[]
}

// ── Feedback ──────────────────────────────────────────────────────────────

export type FeedbackType = 'BUG' | 'SUGGESTION' | 'OTHER'
export type FeedbackStatus = 'OPEN' | 'FIXED' | 'REJECTED'

export interface FeedbackMessage {
  id: string
  senderId: string
  admin: boolean
  body: string
  createdAt: string
}

export interface FeedbackSummary {
  id: string
  userId: string
  userEmail: string | null
  type: FeedbackType
  title: string
  status: FeedbackStatus
  createdAt: string
  updatedAt: string
  messageCount: number
}

export interface FeedbackDetail extends FeedbackSummary {
  description: string
  page: string | null
  messages: FeedbackMessage[]
  screenshotUrl: string | null
}

export interface CreateFeedbackRequest {
  type: FeedbackType
  title: string
  description: string
  page?: string
}

// ── Grooming ──────────────────────────────────────────────────────────────

export type GroomingAction = 'KEEP' | 'DISCARD' | 'ADJUST_QUANTITY'

export interface GroomingDecision {
  itemId: string
  action: GroomingAction
  newAmount?: number
}

export interface StartGroomingResponse {
  sessionId: string
  fridgeItems: FridgeItem[]
}

export interface GroomingSession {
  id: string
  userId: string
  startedAt: string
  completedAt: string | null
  planId: string | null
  itemsKept: number
  itemsDiscarded: number
  itemsExpired: number
}

// ── Dashboard ─────────────────────────────────────────────────────────────

export type PlannedMealStatusExtended = 'PLANNED' | 'EATEN' | 'SKIPPED' | 'REPLACED'
/**
 * Prep classification emitted by the scheduler.
 *
 * - `OVERNIGHT`: lead-time-only recipes (e.g. overnight oats) — one task per meal.
 * - `BATCH`: same-recipe meals batched within the fridge hold window.
 * - `FREEZE_BATCH`: batch whose later slots are served from the freezer.
 */
export type PrepType = 'OVERNIGHT' | 'BATCH' | 'FREEZE_BATCH' | 'FRESH'
export type PrepWindow = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT'

export interface TodaysMealCard {
  mealId: string
  recipeId: string
  recipeName: string
  /** Locale-keyed translations from the backend. Present when the backend populates it. */
  recipeTranslations?: RecipeTranslations | null
  mealType: string
  macros: { kcal: number; protein: number; fat: number; carbs: number } | null
  status: PlannedMealStatusExtended
  scheduledTime?: string | null
  // ── Recipe family fields (W8) — present once W4 backend ships ─────────────
  /** UUID of the recipe family. Null = standalone recipe. */
  familyId?: string | null
  /** All siblings in the family (unfiltered). Null when no family. */
  siblings?: RecipeSibling[] | null
  /** Dietary tier of this recipe. */
  dietTier?: DietTier | null
}

export interface OffPlanMealCard {
  id: string
  mealType?: string
  displayName: string
  macros: { kcal: number; protein: number; fat: number; carbs: number } | null
  /** ISO Instant — when the user pressed log. Used to place the card on the timeline. */
  createdAt: string
  /** HH:mm user-overridden timeline slot. Null means infer from createdAt. */
  scheduledTime?: string | null
}

export interface PrepTaskCard {
  id?: string
  planId: string
  recipeId: string
  recipeName: string
  /** Locale-keyed translations from the backend. Present when the backend populates it. */
  recipeTranslations?: RecipeTranslations | null
  prepType: PrepType
  window: PrepWindow
  scheduledDate: string
  durationMin: number | null
  status?: string
  scheduledTime?: string | null
  /** Total servings the user should cook for this batch. */
  servingsToMake?: number | null
  /** Subset of servings_to_make to freeze at prep time. */
  servingsToFreeze?: number | null
  /** Planned meal IDs this prep task feeds. */
  feedsPlannedMealIds?: string[]
  /**
   * When true this task must be executed immediately before the meal it feeds
   * (e.g. fresh assembly, last-minute cook). Rendered inside the meal card;
   * its timeline circle is hidden. KALMIO-317.
   */
  executeImmediatelyBefore?: boolean
}

export interface PlanGlanceDto {
  planId: string
  startDate: string
  endDate: string
  daysRemaining: number
  totalDays: number
}

export interface DashboardDto {
  todaysMeals: TodaysMealCard[]
  offPlanMeals: OffPlanMealCard[]
  todaysPrepTasks: PrepTaskCard[]
  tomorrowsPrepTasks: PrepTaskCard[]
  planGlance: PlanGlanceDto | null
  pointsTotal: number
  activeFlags: {
    hasActivePlan: boolean
    needsGrooming: boolean
    hasReplanDiff: boolean
  }
}

export interface DailyMacroDto {
  date: string
  consumed: { kcal: number; protein: number; fat: number; carbs: number }
  target: { kcal: number; protein: number; fat: number; carbs: number }
}

export interface LogOffPlanMealRequest {
  date: string
  mealType?: string
  displayName: string
  kcal: number
  proteinG?: number
  fatG?: number
  carbG?: number
}

/**
 * Request body for editing an existing off-plan meal entry
 * (`PATCH /api/off-plan-meals/{id}`). The date and source are immutable.
 */
export interface UpdateOffPlanMealRequest {
  mealType?: string
  displayName: string
  kcal: number
  proteinG?: number
  fatG?: number
  carbG?: number
}

/**
 * Request body for the AI text-to-meal endpoint
 * (`POST /api/off-plan-meals/from-text`).
 *
 * Premium-gated. The backend parses `text` via gpt-4o-mini, persists the
 * result with `source = LLM_TEXT`, and returns the persisted row.
 */
export interface AiOffPlanLogTextRequest {
  /** Free-text meal description, max 1000 chars. */
  text: string
  /** Optional override; if omitted the model infers it. */
  mealType?: MealType
  /** Optional ISO date; defaults to today server-side. */
  eatenAt?: string
}

/**
 * Persisted AI-logged off-plan meal — response from all three AI endpoints:
 * `/from-text`, `/from-voice`, `/from-photo`.
 */
export interface AiOffPlanLogResponse {
  id: string
  userId: string
  date: string
  mealType: string | null
  displayName: string
  kcal: number
  proteinG: number
  fatG: number
  carbG: number
  /** `LLM_TEXT` | `LLM_VOICE` | `LLM_PHOTO` for AI logs; `MANUAL` for the form path. */
  source: string
  createdAt: string
  /** Model confidence [0.0–1.0]; null for non-AI paths. */
  confidence: number | null
}

// ── AI meal rationale (KALMIO-185 / E11.6) ────────────────────────────────

/**
 * Response from `POST /api/planned-meals/{plannedMealId}/explain`.
 *
 * 2–3 sentence "Why this?" rationale grounded in structured facts (no invented
 * data). Cached server-side per planned meal — re-calls are free and instant.
 *
 * Premium-gated. HTTP 402 = not premium, 429 = rate limit (5/min) or monthly
 * cap reached.
 */
export interface MealRationaleResponse {
  plannedMealId: string
  rationale: string
  rationaleEn: string
  citedFacts: string[]
  generatedAt: string
}

// ── AI cook mode (KALMIO-188 / E11.9) ─────────────────────────────────────

/**
 * Request body for `POST /api/recipes/{recipeId}/cook-mode/ask`.
 *
 * `previousQuestions` is a rolling window (max 5) of the user's prior questions
 * — oldest first. The backend is stateless; we send context every turn.
 */
export interface AiCookModeRequest {
  question: string
  previousQuestions?: string[]
  /** 0-based index of the step the user is currently on. */
  currentStepIndex?: number
}

/**
 * Response from the cook-mode Q&A endpoint — a short (1–3 sentence) Hungarian
 * answer grounded in the recipe context.
 */
export interface AiCookModeResponse {
  answer: string
}

// ── Shopping List ─────────────────────────────────────────────────────────

export interface RetailProductInfo {
  id: string
  name: string
  brand: string | null
  price: number
  packageSize: number
  unit: Unit
  remoteUrl: string | null
  estimatedCost: number | null
  leftoverAmount: number | null
  leftoverCost: number | null
}

export interface ShoppingListItem {
  ingredientId: string
  ingredientName: string
  ingredientCategory: IngredientCategory | null
  totalAmount: number
  unit: Unit
  pantryItem: boolean
  fridgeAmount: number | null
  retailProduct: RetailProductInfo | null
}

export interface ShoppingList {
  items: ShoppingListItem[]
  totalEstimatedCost: number | null
  totalLeftoverCost: number | null
  currency: string
}

// ── Taste Signals ─────────────────────────────────────────────────────────

/** Maps to the backend enum — keep in sync with TasteSignal.Signal (E9.1). */
export type TasteSignalValue = 'LOVE' | 'OK' | 'HATE'

/** Maps to the backend enum — keep in sync with TasteSignal.TargetType (E9.1). */
export type TasteTargetType = 'INGREDIENT' | 'RECIPE'

/** Maps to the backend enum — keep in sync with TasteSignal.Source (E9.1). */
export type TasteSignalSource = 'ONBOARDING' | 'IN_APP' | 'POST_MEAL_PROMPT'

/**
 * Request body for POST /api/users/me/taste-signals.
 * Backend endpoint provided by KALMIO-153 / E9.1 — may 404 until that ticket ships.
 */
export interface TasteSignalRequest {
  targetType: TasteTargetType
  targetId: string
  signal: TasteSignalValue
  source: TasteSignalSource
}

/** Ingredient macro category — mirrors backend IngredientCategory enum. */
export type IngredientCategoryCode = 'PROTEIN' | 'CARB' | 'FAT' | 'VEGGIE' | 'SPICE'

/** A single card shown in the taste-swipe deck. */
export interface TasteCard {
  id: string
  targetType: TasteTargetType
  /** Display name in the active locale. */
  name: string
  /** Optional subtitle (recipe: macros blurb; ingredient: category). */
  subtitle?: string
  /** Optional image URL. */
  imageUrl?: string | null
  /**
   * Ingredient macro category (KALMIO-432). Server-provided for ingredient
   * cards so the frontend can pick a category-appropriate icon when no
   * photo is available. Null/undefined for recipes.
   */
  category?: IngredientCategoryCode | null
}

// ── Dashboard State (E2 — module gating) ─────────────────────────────────

/**
 * All possible module identifiers returned by GET /api/users/me/dashboard-state.
 * 13 identifiers cover all Diófa stages (MAG → TERMO).
 */
export type DashboardModuleId =
  | 'current-plan'
  | 'shopping-list'
  | 'fridge-basic'
  | 'diofa-widget'
  | 'macro-tracker'
  | 'prep-tasks'
  | 'weekly-summary'
  | 'taste-signals'
  | 'replan-diff'
  | 'grooming-prompt'
  | 'off-plan-meals'
  | 'points-counter'
  | 'achievements'

/** Response from GET /api/users/me/dashboard-state */
export interface DashboardStateResponse {
  stage: string
  visibleModules: DashboardModuleId[]
}

// ── Points ────────────────────────────────────────────────────────────────

export interface PointEventDto {
  eventType: string
  points: number
  occurredAt: string
}

export interface PointsResponse {
  total: number
  recentEvents: PointEventDto[]
  earnedFirstAchievements: string[]
}

// ── Replan Diff ───────────────────────────────────────────────────────────

export interface MealChange {
  mealId: string
  date: string        // ISO date "YYYY-MM-DD"
  mealType: string    // "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK"
  oldRecipeId: string
  oldRecipeName: string
  newRecipeId: string
  newRecipeName: string
}

export interface IngredientChange {
  ingredientId: string
  name: string
  changeType: 'ADDED' | 'REMOVED'
  amount: number
  unit: string
}

export interface WastedMeal {
  recipeId: string
  recipeName: string
  estimatedCost: number | null
}

export interface ReplanDiff {
  diffId: string
  planId: string
  changes: MealChange[]
  ingredientChanges: IngredientChange[]
  costDelta: number | null      // negative = savings
  narrative: string[]
  wastedMeals: WastedMeal[]
}

// ── Calendar / Timeline ───────────────────────────────────────────────────

export interface CalendarDayDto {
  date: string
  hasMeals: boolean
  hasPrepTasks: boolean
  hasShoppingDay: boolean
  needsGrooming: boolean
  isPlanRenewalReminder: boolean
}

export interface TimePreferencesDto {
  wakeTime: string        // "HH:mm"
  sleepTime: string       // "HH:mm"
  mealTimePrefs: Record<string, string> | null
}

// ── Momentum / Moisture History ───────────────────────────────────────────────

/**
 * Named moisture band returned by the backend MomentumService.
 * Maps to MomentumService.MoistureBand enum on the backend.
 */
export type MoistureBand = 'DRY' | 'DRYING' | 'MOIST' | 'SATURATED'

/**
 * One entry in GET /api/users/me/momentum/history response.
 * Ordered oldest-first (index 0 = N-1 days ago, last index = today).
 */
export interface MomentumHistoryEntry {
  date: string        // ISO-8601 "YYYY-MM-DD"
  current: number     // moisture score 0–100
  band: MoistureBand
}

// ── Grove (E6.5 — KALMIO-144) ─────────────────────────────────────────────

/**
 * A single graduated user's tree pin on the grove map.
 * x/y are percentages (0–100) within the SVG viewBox.
 */
export interface GrovePin {
  /** Backend user ID — used as the React key. */
  userId: string
  /** Short display name (e.g. initials or first name). */
  displayName: string
  /** Horizontal position, 0–100 (% of SVG viewBox width). */
  x: number
  /** Vertical position, 0–100 (% of SVG viewBox height). */
  y: number
  /** Certificate ID if the user has one; null until the backend populates it. */
  certificateId: string | null
}

/** Response from GET /api/grove/pins */
export interface GrovePinsResponse {
  pins: GrovePin[]
}

// ── Founding Member ───────────────────────────────────────────────────────

/** Response from GET /api/founding-member/availability */
export interface FoundingMemberAvailability {
  cap: number
  soldCount: number
  remaining: number
  price: number
  currency: string
}

/**
 * Request body for POST /api/founding-member/checkout.
 *
 * @property redirectUrl Public URL Barion redirects the buyer to after payment.
 *                       Must point at the FE success page.
 */
export interface FoundingMemberCheckoutRequest {
  redirectUrl: string
}

/**
 * Response from POST /api/founding-member/checkout.
 *
 * @property paymentId  Barion payment identifier (UUID) — kept for webhook correlation.
 * @property gatewayUrl Barion-hosted payment-page URL the FE must redirect the buyer to.
 */
export interface FoundingMemberCheckoutResponse {
  paymentId: string
  gatewayUrl: string
}

// ── Premium Grants (KALMIO-169 / KALMIO-173) ─────────────────────────────────

/**
 * Grant source values that correspond to stage-based premium tasters.
 * Maps to the backend PremiumGrantEntity.source field.
 */
export type PremiumGrantSource = 'STAGE_SUHANG' | 'STAGE_FIATAL' | 'STAGE_TERMO' | 'MANUAL'

/**
 * A single premium entitlement window for the current user.
 * Returned by GET /api/users/me/premium-grants (KALMIO-173 follow-up endpoint).
 */
export interface PremiumGrant {
  id: string
  source: PremiumGrantSource
  validFrom: string    // ISO-8601
  validUntil: string | null  // ISO-8601; null = no expiry
  createdAt: string   // ISO-8601
}

// ── Weekly Summary ─────────────────────────────────────────────────────────

export interface WeeklyDayDto {
  date: string          // "YYYY-MM-DD"
  kcal: number
  protein: number
  fat: number
  carbs: number
  target: {
    kcal: number
    protein: number
    fat: number
    carbs: number
  }
}

export interface WeeklySummaryDto {
  dayCount: number
  /** null when there are not enough logged days to compute */
  compliancePct: number | null
  averageActual: {
    kcal: number
    protein: number
    fat: number
    carbs: number
  }
  averageTarget: {
    kcal: number
    protein: number
    fat: number
    carbs: number
  }
  daily: WeeklyDayDto[]
  /** null when no prior week data exists */
  weekOverWeekDeltaKcal: number | null
}

// ── Family ────────────────────────────────────────────────────────────────

export type FamilyRole = 'PLANNER' | 'MEMBER'

export interface FamilyMemberDto {
  userId: string
  role: FamilyRole
  joinedAt: string  // ISO-8601
  /** Human-readable label resolved on the backend (first/last name → username → email local-part → short UUID). */
  displayName: string
  /** True for managed profiles (a users row with managed_by_user_id set). */
  isManaged: boolean
  /** True when the caller (a family PLANNER) currently holds a GRANTED impersonation permission for this member. */
  impersonationPermissionGranted?: boolean
  /**
   * Meal-type identifiers the member has marked as preferred in their meal-plan
   * preferences (e.g. ["LUNCH", "DINNER"]). Empty list = no preference set
   * (treated as "all slots are fine" by the wizard, solver, and grid dim).
   */
  preferredMealTypes: MealType[]
}

/**
 * Planner-requested, member-granted permission to impersonate a real (non-managed)
 * family member. Returned from the request/grant/deny endpoints and from the
 * pending-list endpoint. See `familyService.requestImpersonationPermission` etc.
 */
export interface ImpersonationPermissionDto {
  id: string
  familyId: string
  requesterId: string
  /**
   * Resolved display name of the requester. Populated by the pending-list endpoint
   * (where the UI needs to show a human label); null on request/grant/deny responses
   * where the caller already knows the actor.
   */
  requesterName: string | null
  targetId: string
  status: 'PENDING' | 'GRANTED' | 'DENIED' | 'REVOKED'
  createdAt: string  // ISO-8601
  respondedAt: string | null
}

/** [PENDING_BE] Represents an invite the planner sent — from GET /api/families/{id}/invites. */
export interface SentInviteDto {
  id: string
  claimCode: string
  expiresAt: string  // ISO-8601
  boundProfileName?: string
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED'
}

/** Response from POST /api/families and GET /api/families/{id} */
export interface FamilyResponse {
  id: string
  createdByUserId: string
  createdAt: string  // ISO-8601
  members: FamilyMemberDto[]
}

export interface AddManagedProfileResponse {
  profileId: string
}

export interface UserPreferencesDto {
  allergens: string[]
  dislikedIngredientIds: string[]
  vegetarian: boolean
  vegan: boolean
  pescatarian: boolean
  glutenFree: boolean
  dairyFree: boolean
  lactoseFree: boolean
  milkProteinFree: boolean
  eggFree: boolean
  nutFree: boolean
  peanutFree: boolean
  soyFree: boolean
  fishFree: boolean
  shellfishFree: boolean
  sesameFree: boolean
  halal: boolean
  kosher: boolean
  keto: boolean
  lowGi: boolean
  lowFodmap: boolean
  paleo: boolean
  kcalTarget: number | null
  proteinTargetG: number | null
  carbsTargetG: number | null
  fatTargetG: number | null
  portionSizeMultiplier: number | null
  prepToleranceMinutes: number | null
}

export interface AddManagedProfileRequest {
  displayName: string
  preferences?: Partial<UserPreferencesDto>
}

export interface SendInviteRequest {
  boundManagedProfileId: string | null
  freshSlot: boolean
}

export interface SendInviteResponse {
  claimCode: string
}

export interface AcceptInviteRequest {
  claim: boolean
  /** Allergens the user confirmed from the merge preview. Only sent when claim=true. */
  checkedAllergens?: string[]
}

export interface MacroMergeResultDto {
  kcalTargetSource: string
  proteinTargetSource: string
  carbsTargetSource: string
  fatTargetSource: string
}

export interface MergePreviewResponse {
  mergedAllergens: string[]
  mergedDislikedIngredientIds: string[]
  activeDietaryFlags: string[]
  macros: MacroMergeResultDto
}

export interface ImpersonateResponse {
  sessionToken: string
}

// ── Template Prep Slots (Prep-C / KALMIO-263) ────────────────────────────

/** Source of a template prep slot assignment. */
export type TemplatePrepSlotSource = 'SOLVER' | 'MANUAL'

/**
 * A prep slot attached to a plan template.
 * Mirrors TemplatePrepSlotResponse from the backend (KALMIO-263).
 *
 * The slot is calendar-free — it is anchored to a zero-based day index
 * within the template (not a calendar date).
 */
export interface TemplatePrepSlot {
  id: string
  planId: string
  /** Zero-based day index within the template (0 = day 1). */
  dayIndex: number
  recipeId: string
  /** MORNING = reggel cook session; EVENING = este cook session. */
  scheduledWindow: 'MORNING' | 'EVENING'
  /** Total servings to prepare in this session. */
  servingsToMake: number
  /** Subset of servingsToMake to freeze immediately after prep; 0 = no freeze. */
  servingsToFreeze: number
  source: TemplatePrepSlotSource
  createdAt: string   // ISO-8601
  updatedAt: string   // ISO-8601
}

/** Request body for POST /api/plans/{planId}/template-prep-slots. */
export interface CreateTemplatePrepSlotRequest {
  recipeId: string
  dayIndex: number
  scheduledWindow: 'MORNING' | 'EVENING'
  /** UUIDs of template_meal rows this slot will serve. Required, non-empty. */
  feedsTemplateMealIds: string[]
  servingsToMake: number
  servingsToFreeze?: number
}

/** Request body for PATCH /api/template-prep-slots/{slotId}. */
export interface PatchTemplatePrepSlotRequest {
  dayIndex?: number
  scheduledWindow?: 'MORNING' | 'EVENING'
  servingsToMake?: number
  servingsToFreeze?: number
}

// ── Plan Templates (A4 / KALMIO-226) ─────────────────────────────────────

/** Source of a template meal assignment. */
export type TemplateMealSource = 'SOLVER' | 'MANUAL' | 'COPIED'

/** Plan template status. */
export type PlanTemplateStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

/**
 * Single meal slot within a plan template.
 * Mirrors TemplateMealResponse from the backend.
 */
export interface TemplateMeal {
  id: string
  planId: string
  /** Zero-based day index within the plan (0 = day 1). */
  dayIndex: number
  mealType: MealType
  memberId: string
  recipeId: string | null
  offPlanMealTemplateId: string | null
  servings: number
  source: TemplateMealSource
}

/**
 * A plan template — the primary planning unit in meal-planning-v2.
 * Calendar-free: no startDate/endDate, only lengthDays.
 * Mirrors PlanTemplateResponse from the backend.
 */
export interface PlanTemplate {
  id: string
  ownerUserId: string
  familyId: string | null
  name: string
  memberIds: string[]
  mealSlotsCovered: MealType[]
  lengthDays: number
  shoppingCadenceDays: number
  status: PlanTemplateStatus
  /**
   * True when the backend has flagged this as the user's canonical default plan
   * (seeded by A7 / KALMIO-229). Set server-side; do not infer from the name.
   * KALMIO-233.
   */
  isDefault: boolean
  /** Per-member preference snapshot, keyed by member UUID string. */
  preferencesSnapshot: Record<string, unknown> | null
  templateMeals: TemplateMeal[]
  createdAt: string   // ISO-8601
  updatedAt: string   // ISO-8601
  archivedAt: string | null   // ISO-8601
  /** Pre-solve candidate-recipe filter. Null = no filter. KALMIO-353. */
  recipeFilter?: RecipeFilter | null
}

/** Request body for POST /api/plans (create plan template). */
export interface CreatePlanTemplateRequest {
  name: string
  memberIds: string[]
  mealSlotsCovered: MealType[]
  /** 1–28 days. Default 7 when not supplied. */
  lengthDays: number
  /** Shopping cadence in days. Default 7. */
  shoppingCadenceDays?: number | null
  /** Optional family UUID. */
  familyId?: string | null
}

// ── Shopping Cart (BE2 / KALMIO-217) ─────────────────────────────────────

export interface CartLineItemResponse {
  ingredientId: string
  ingredientName: string
  totalAmount: number
  unit: string
  /** UUIDs of plans that contributed to this line item (for drill-down). */
  sourcePlanIds: string[]
}

export interface ShoppingCartResponse {
  cartId: string
  planIds: string[]
  windowStart: string   // ISO date "YYYY-MM-DD"
  windowEnd: string     // ISO date "YYYY-MM-DD"
  lineItems: CartLineItemResponse[]
  /** Number of fridge items upserted by mark-shopped. Null on generate responses. KALMIO-312. */
  fridgeItemsAdded?: number | null
}

export interface GenerateCartRequest {
  windowStart?: string | null  // ISO date "YYYY-MM-DD"
  windowEnd?: string | null    // ISO date "YYYY-MM-DD"
}

// ── Off-plan disposition (BE4 stubs / KALMIO-217) ─────────────────────────

export type OffPlanDispositionType =
  | 'RETURNED_TO_FRIDGE'
  | 'WASTED'
  | 'GIVEN_TO_FAMILY'
  | 'GIVEN_TO_OTHER'

export interface OffPlanDispositionRequest {
  plannedMealId: string
  disposition: OffPlanDispositionType
  /** Required when disposition === 'GIVEN_TO_FAMILY'. The recipient's userId. */
  recipientUserId?: string | null
  /** True when the caller explicitly acknowledged an allergen risk. BE4 only. */
  allergenAcknowledged?: boolean
}

/** Member view — per-member meal slot in a multi-member plan context. */
export interface MemberMealSlotDto {
  plannedMealId: string
  date: string              // "YYYY-MM-DD"
  mealType: MealType
  recipeId: string | null
  recipeName: string | null
  /** Scaled macros for this member's portion (servingMultiplier applied). */
  portionMacros: Macros | null
  servingMultiplier: number
  status: PlannedMealStatus
  isBatchCookLeftover: boolean
}

// ── Schedules (A5 / KALMIO-227 + C14 / KALMIO-236) ──────────────────────────

/** Mirrors ScheduleResponse.status from the backend. */
export type ScheduleStatus = 'ACTIVE' | 'PAUSED' | 'ENDED'

/**
 * A recurring schedule that materialises one or more plan templates onto the
 * calendar. Mirrors ScheduleResponse from the backend (KALMIO-227).
 */
export interface Schedule {
  id: string
  ownerUserId: string
  familyId: string | null
  name: string
  /** Ordered rotation of plan-template UUIDs. */
  planIds: string[]
  /** Total rotation period in days. */
  cadenceDays: number
  /** First calendar day of the rotation. ISO date "YYYY-MM-DD". */
  startDate: string
  /** Last day (inclusive); null = open-ended. ISO date "YYYY-MM-DD". */
  endDate: string | null
  status: ScheduleStatus
  /** Watermark for the eager materialization job. ISO date "YYYY-MM-DD". */
  lastMaterializedDate: string | null
  createdAt: string   // ISO-8601
  updatedAt: string   // ISO-8601
}

/** Request body for POST /api/schedules. */
export interface CreateScheduleRequest {
  name: string
  /** Ordered rotation (at least one plan-template UUID). */
  planIds: string[]
  /** Total rotation length in days; null → backend derives from plan lengths. */
  cadenceDays?: number | null
  /** ISO date "YYYY-MM-DD". */
  startDate: string
  /** ISO date "YYYY-MM-DD"; null = open-ended. */
  endDate?: string | null
  familyId?: string | null
}

/** Request body for PATCH /api/schedules/{id}. All fields optional. */
export interface UpdateScheduleRequest {
  name?: string
  planIds?: string[]
  cadenceDays?: number
  /** ISO date "YYYY-MM-DD". */
  startDate?: string
  /** ISO date "YYYY-MM-DD"; null = clear end date. */
  endDate?: string | null
}

// ── Run Plan (KALMIO-307 / KALMIO-320) ───────────────────────────────────

/**
 * Request body for POST /api/plans/{id}/run.
 * Creates a Schedule and immediately materialises the plan.
 */
export interface RunPlanBody {
  /** ISO date "YYYY-MM-DD". */
  startDate: string
  /**
   * 1-based day of the plan template to start from (default = 1).
   * Once-mode: literal — only days startDayIndex..lengthDays are scheduled.
   * Recurring-mode: rotated — schedule start shifts so day startDayIndex lands on startDate.
   */
  startDayIndex?: number | null
  /** null = one-off single cycle; provided = recurring. */
  recurrence?: {
    /** Total rotation period in days; null → backend derives from plan length. */
    cadenceDays?: number | null
    /** ISO date "YYYY-MM-DD"; null = open-ended. */
    endDate?: string | null
  } | null
}

/** Response from POST /api/plans/{id}/run. */
export interface RunPlanResponse {
  schedule: Schedule
  rowsWritten: number
  onceMode: boolean
}

// ── Materialized Planned Meals (C15 / KALMIO-237) ────────────────────────

/**
 * Status of a materialized planned_meal row.
 * Mirrors the backend `planned_meal.status` enum.
 */
export type MaterializedPlannedMealStatus = 'PLANNED' | 'EATEN' | 'SKIPPED' | 'REPLACED'

/**
 * Source that created the planned_meal row.
 * Mirrors the backend `planned_meal.source` enum.
 */
export type MaterializedPlannedMealSource = 'SCHEDULED' | 'MANUAL' | 'OFF_PLAN'

/**
 * A materialized calendar entry from the `planned_meal` table.
 * Returned by `GET /api/planned-meals?from=YYYY-MM-DD&to=YYYY-MM-DD`
 * (backend ticket: KALMIO-249).
 *
 * Distinct from the legacy `PlannedMeal` type which reads from the old
 * `planned_meals` table on the calendar-plan path.
 */
export interface MaterializedPlannedMeal {
  id: string
  scheduleId: string | null
  originPlanId: string | null
  memberId: string
  /** ISO date "YYYY-MM-DD". */
  date: string
  mealType: MealType
  recipeId: string | null
  /** Denormalized recipe name — populated by the backend join. */
  recipeName: string | null
  /** Thumbnail URL — populated by the backend join; null when recipe has no image. */
  recipeImageUrl: string | null
  status: MaterializedPlannedMealStatus
  source: MaterializedPlannedMealSource
  generatedAt: string | null   // ISO-8601
  eatenAt: string | null       // ISO-8601
}

/** Request body for PATCH /api/planned-meals/{id}/status (KALMIO-249). */
export interface UpdateMaterializedPlannedMealStatusRequest {
  status: MaterializedPlannedMealStatus
}

// ── Receipt OCR smart-matching (KALMIO-329) ───────────────────────────────

export type ReceiptMatchSource = 'CART_MATCH' | 'CATALOG_MATCH' | 'UNMATCHED'

/**
 * A single OCR-extracted receipt line with smart-match results.
 * Returned as part of ReceiptScanResponse.
 */
export interface ReceiptMatchLine {
  rawText: string
  /** Null when matchSource is UNMATCHED and the user has not resolved it. */
  ingredientId: string | null
  ingredientName: string
  quantity: number
  unit: 'G' | 'ML' | 'PIECE'
  confidence: number
  matchSource: ReceiptMatchSource
  autoConfirmed: boolean
  category: string | null
  defaultExpiry: string | null  // ISO date "YYYY-MM-DD"
}

/** Response from POST /api/shopping-cart/{cartId}/receipt/scan */
export interface ReceiptScanResponse {
  retailer: string
  cartId: string
  lines: ReceiptMatchLine[]
  matchedCount: number
  unmatchedCount: number
}

/** Request body for POST /api/shopping-cart/{cartId}/receipt/confirm */
export interface CartReceiptConfirmRequest {
  retailer: string | null
  lines: ReceiptMatchLine[]
}

// ── Persistent Shopping List (KALMIO-374 / C11) ───────────────────────────

/**
 * Supermarket aisle categories — mirrors the backend ShoppingCategory enum.
 * Ordered to match a typical Hungarian supermarket layout.
 */
export type ShoppingCategory =
  | 'PRODUCE'
  | 'BAKERY'
  | 'DAIRY'
  | 'MEAT'
  | 'FISH'
  | 'DELI'
  | 'FROZEN'
  | 'PANTRY'
  | 'CANNED'
  | 'CONDIMENTS'
  | 'BEVERAGES'
  | 'SNACKS'
  | 'HOUSEHOLD'
  | 'PERSONAL_CARE'
  | 'OTHER'

/** Source of a shopping list item. */
export type ShoppingListItemSource = 'PLAN' | 'ADHOC'

/**
 * A single item in the persistent shopping list.
 * Mirrors PersistentShoppingListResponse.ItemResponse from the backend.
 */
export interface PersistentShoppingListItem {
  id: string
  /** Null for ADHOC items with no ingredient catalog match. */
  ingredientId: string | null
  name: string
  amount: number | null
  unit: string | null
  source: ShoppingListItemSource
  /** Null = not yet ticked. ISO-8601 instant when the user ticked off the item. */
  tickedAt: string | null
}

/**
 * Items grouped by supermarket aisle.
 * Mirrors PersistentShoppingListResponse.CategoryGroup from the backend.
 */
export interface PersistentShoppingListCategoryGroup {
  category: ShoppingCategory
  /** i18n key used as the category header label (e.g. "shopNow.categories.PRODUCE"). */
  categoryDisplayKey: string
  items: PersistentShoppingListItem[]
}

/**
 * Full persistent shopping list for a plan.
 * Mirrors PersistentShoppingListResponse from the backend.
 */
export interface PersistentShoppingListResponse {
  id: string
  planId: string
  generatedAt: string   // ISO-8601 instant
  groups: PersistentShoppingListCategoryGroup[]
}

/**
 * Request body for POST /api/plans/{planId}/shopping-list/items.
 * Either ingredientId or adhocName must be supplied.
 */
export interface AdHocShoppingListItemRequest {
  /** Optional: resolved ingredient ID from catalog search. */
  ingredientId?: string | null
  /** Required when ingredientId is null — free-text item name. */
  adhocName?: string | null
  amount?: number | null
  unit?: string | null
}

// ── Shopping Category Order (KALMIO-373 / C10) ───────────────────────────────

/**
 * Response body for GET /api/users/me/shopping-category-order.
 * Always returns exactly 15 ShoppingCategory names in the user's preferred order.
 * Falls back to enum natural order (PRODUCE first, OTHER last) if never customised.
 */
export interface ShoppingCategoryOrderResponse {
  order: ShoppingCategory[]
}

/**
 * Request body for PUT /api/users/me/shopping-category-order.
 * Must contain all 15 ShoppingCategory names exactly once.
 * Backend rejects partial lists, unknown names, and duplicates with HTTP 400.
 */
export interface UpdateShoppingCategoryOrderRequest {
  order: ShoppingCategory[]
}
