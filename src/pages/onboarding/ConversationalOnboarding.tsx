/**
 * ConversationalOnboarding — KALMIO-186 / KALMIO-442
 *
 * Full-screen chat alternative to the 10-step onboarding form.
 * Route: /app/onboarding/conversational  (ProtectedRoute, no AppShell chrome)
 *
 * Flow:
 *  1. User lands here via "Inkább beszéljük meg" toggle on OnboardingShell step 1.
 *  2. AI opens the conversation (first assistant turn sent on mount).
 *  3. User types; each submission sends the full rolling `messages` array to the
 *     service and appends the assistant response.
 *  4. When the backend sets `ready=true`, a confirmation card renders with the
 *     extracted `PreferencesDraft`.  User can edit fields before confirming.
 *  5. On confirm, `finalizeOnboarding` is called; on success the component hands
 *     the user into the same BodyData → TDEE → MealDistribution cascade that the
 *     click-through onboarding uses (KALMIO-442).
 *  6. After the cascade completes (or is skipped), redirect to /app/plans?fresh=1.
 *  7. "Vissza az űrlaphoz" link returns to /app/onboarding at any point.
 *
 * Premium guard: the service returns 402 when the user is not premium. The UI
 * catches this and shows a dedicated "premium only" message with a link to the
 * Founding Member page.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { usersService, USERS_ME_QUERY_KEY } from '@/services/users'
import { writeOnboardingDone, clearOnboardingStep } from '@/hooks/useOnboardingProgress'
import type { DietaryRestrictionKey } from '@/types'
import { BodyDataStep, type BodyDataStepValues } from '@/components/onboarding/BodyDataStep'
import { TdeeSuggestionBanner } from '@/components/shared/TdeeSuggestionBanner'
import { MealDistributionStep, type MealDistributionValues } from '@/components/onboarding/MealDistributionStep'
import { toast } from '@/components/ui/toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

// ── Dietary flag data (KALMIO-448) ────────────────────────────────────────
// Dietary flag groups mirror PreferencesStep.tsx — kept self-contained here
// to avoid cross-component imports. Translation keys are stable under dietary.*.

interface DietaryFlagItem {
  key: DietaryRestrictionKey
}

interface DietaryFlagGroup {
  labelKey: string
  items: DietaryFlagItem[]
}

const DIETARY_FLAG_GROUPS: DietaryFlagGroup[] = [
  {
    labelKey: 'dietary.groups.lifestyle',
    items: [
      { key: 'vegetarian' },
      { key: 'vegan' },
      { key: 'pescatarian' },
    ],
  },
  {
    labelKey: 'dietary.groups.allergens',
    items: [
      { key: 'glutenFree' },
      { key: 'dairyFree' },
      { key: 'lactoseFree' },
      { key: 'milkProteinFree' },
      { key: 'eggFree' },
      { key: 'nutFree' },
      { key: 'peanutFree' },
      { key: 'soyFree' },
      { key: 'fishFree' },
      { key: 'shellfishFree' },
      { key: 'sesameFree' },
    ],
  },
  {
    labelKey: 'dietary.groups.religious',
    items: [
      { key: 'halal' },
      { key: 'kosher' },
    ],
  },
  {
    labelKey: 'dietary.groups.metabolic',
    items: [
      { key: 'keto' },
      { key: 'lowGi' },
      { key: 'lowFodmap' },
      { key: 'paleo' },
    ],
  },
]

/**
 * Convert a list of LLM free-text dietary restriction strings (as extracted by
 * the backend in the conversation) into a set of active DietaryRestrictionKey flag names.
 * Uses the same term recognition logic as backend's DietaryTermMapper (KALMIO-441).
 *
 * Returns a Set<DietaryRestrictionKey> of active flags.
 */
function freeTextToDietaryFlags(terms: string[]): Set<DietaryRestrictionKey> {
  const active = new Set<DietaryRestrictionKey>()
  for (const raw of terms) {
    if (!raw) continue
    const t = raw.trim().toLowerCase()
    // Lifestyle
    if (['vegan', 'vegán', 'vegán étrend', 'vegan diet'].includes(t)) {
      active.add('vegan')
      active.add('vegetarian')
    } else if (['vegetarian', 'vegetáriánus', 'vegetáriánus étrend', 'vegetarian diet', 'vegetárius'].includes(t)) {
      active.add('vegetarian')
    } else if (['pescatarian', 'pescatariánus', 'pescetarian', 'pescetariánus', 'hal fogyasztó vegetáriánus'].includes(t)) {
      active.add('pescatarian')
    }
    // Allergens
    else if (['gluten-free', 'gluten free', 'gluténmentes', 'glutén-mentes', 'gluténérzékeny', 'glutén érzékeny', 'celiac', 'coeliac', 'coeliakia', 'lisztérzékenység', 'lisztérzékeny'].includes(t)) {
      active.add('glutenFree')
    } else if (['dairy-free', 'dairy free', 'tejtermékmentes', 'tejtermék-mentes', 'laktóz és tejtermék mentes'].includes(t)) {
      active.add('dairyFree')
    } else if (['lactose-free', 'lactose free', 'laktózmentes', 'laktóz-mentes', 'laktózérzékeny', 'laktóz érzékeny', 'laktózintolerancia'].includes(t)) {
      active.add('lactoseFree')
    }
    // Religious
    else if (['halal', 'háláál'].includes(t)) {
      active.add('halal')
    } else if (['kosher', 'kóser', 'kósher'].includes(t)) {
      active.add('kosher')
    }
    // Metabolic
    else if (['keto', 'ketogenic', 'ketogén', 'ketogén étrend', 'ketogenic diet'].includes(t)) {
      active.add('keto')
    } else if (['paleo', 'paleolithic diet', 'paleo étrend', 'paleolit', 'paleolit étrend'].includes(t)) {
      active.add('paleo')
    }
    // Also handle camelCase flag keys directly (from round-trip after user edit)
    else {
      const allKeys: DietaryRestrictionKey[] = [
        'vegetarian', 'vegan', 'pescatarian', 'glutenFree', 'dairyFree', 'lactoseFree',
        'milkProteinFree', 'eggFree', 'nutFree', 'peanutFree', 'soyFree', 'fishFree',
        'shellfishFree', 'sesameFree', 'halal', 'kosher', 'keto', 'lowGi', 'lowFodmap', 'paleo',
      ]
      if (allKeys.includes(raw as DietaryRestrictionKey)) {
        active.add(raw as DietaryRestrictionKey)
      }
    }
  }
  return active
}

// ── Inline conversational onboarding service (KALMIO-394: backends restored, USE_STUB flipped to false)
// Backend endpoints: POST /api/onboarding/conversational/turn + /finalize (free for all users).

interface ChatTurn {
  role: 'assistant' | 'user'
  content: string
}

interface PreferencesDraft {
  // KALMIO-451: householdSize removed from collection — kept as optional for
  // backward-compat with the backend DTO (always null now, never collected).
  householdSize?: number | null
  kcalTarget: number | null
  dietaryRestrictions: string[]
  shoppingCadenceDays: number | null
  preferredShoppingDay: string | null
  forbiddenIngredientIds: string[]
}

// ── Required fields for progress tracking (KALMIO-446, updated by KALMIO-451) ─
// KALMIO-451: householdSize removed → 3 required fields (kcal, cadence, day).
const REQUIRED_FIELD_COUNT = 3

function countCollectedFields(draft: PreferencesDraft | null): number {
  if (!draft) return 0
  let count = 0
  if (draft.kcalTarget !== null) count++
  if (draft.shoppingCadenceDays !== null) count++
  if (draft.preferredShoppingDay !== null) count++
  return count
}

interface TurnResponse {
  sessionId: string
  assistantMessage: string
  ready: boolean
  extracted: PreferencesDraft | null
}

interface FinalizeRequest {
  sessionId: string
  confirmedDraft: PreferencesDraft
}


const conversationalOnboardingService = {
  sendTurn: (messages: ChatTurn[]): Promise<TurnResponse> => {
    return api.post<TurnResponse>('/api/onboarding/conversational/turn', { messages }).then(r => r.data)
  },
  finalizeOnboarding: (req: FinalizeRequest): Promise<{ success: boolean }> => {
    return api.post<{ success: boolean }>('/api/onboarding/conversational/finalize', req).then(r => r.data)
  },
}

// ── Sub-components ─────────────────────────────────────────────────────────

interface BubbleProps {
  role: 'assistant' | 'user'
  content: string
}

function Bubble({ role, content }: BubbleProps) {
  const isAssistant = role === 'assistant'
  return (
    <div
      className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-3`}
      aria-label={isAssistant ? 'Kalmio' : undefined}
    >
      <div
        className={[
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isAssistant
            ? 'bg-white text-[#1A1A1A] shadow-sm rounded-bl-sm'
            : 'bg-[#F28C28] text-white rounded-br-sm',
        ].join(' ')}
      >
        {content}
      </div>
    </div>
  )
}

interface TypingIndicatorProps {
  visible: boolean
}

function TypingIndicator({ visible }: TypingIndicatorProps) {
  if (!visible) return null
  return (
    <div className="flex justify-start mb-3" aria-label="Kalmio gépel…">
      <div className="bg-white shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
        <span className="w-2 h-2 bg-[#6B6460] rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 bg-[#6B6460] rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 bg-[#6B6460] rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  )
}

// ── Progress pill (KALMIO-446) ────────────────────────────────────────────

interface ChatProgressPillProps {
  collected: number
  total: number
  visible: boolean
}

function ChatProgressPill({ collected, total, visible }: ChatProgressPillProps) {
  const { t } = useTranslation()
  if (!visible) return null
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="flex items-center justify-end px-1 pb-1"
    >
      <span className="text-[11px] text-[#6B6460] bg-[#F0EDE8] rounded-full px-2.5 py-0.5 tabular-nums">
        {t('onboarding.conversational.progress', { collected, total })}
      </span>
    </div>
  )
}

// ── Confirmation card ──────────────────────────────────────────────────────

interface ConfirmCardProps {
  draft: PreferencesDraft
  onChange: (updated: PreferencesDraft) => void
  onConfirm: () => void
  confirming: boolean
}

function ConfirmCard({ draft, onChange, onConfirm, confirming }: ConfirmCardProps) {
  const { t } = useTranslation()

  // KALMIO-448: internal dietary flag state, initialized from the LLM-extracted
  // free-text terms via freeTextToDietaryFlags().
  const [activeFlags, setActiveFlags] = useState<Set<DietaryRestrictionKey>>(
    () => freeTextToDietaryFlags(draft.dietaryRestrictions)
  )

  const handleFlagToggle = (key: DietaryRestrictionKey) => {
    const next = new Set(activeFlags)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
    }
    setActiveFlags(next)
    // Propagate camelCase flag keys to parent draft for finalize (KALMIO-448).
    onChange({ ...draft, dietaryRestrictions: Array.from(next) })
  }

  // KALMIO-451: handleHouseholdSize removed — field no longer collected.

  const handleKcal = (v: string) => {
    const n = parseInt(v, 10)
    onChange({ ...draft, kcalTarget: isNaN(n) ? null : n })
  }

  const handleCadence = (v: string) => {
    const n = parseInt(v, 10)
    onChange({ ...draft, shoppingCadenceDays: isNaN(n) ? null : n })
  }

  const SHOPPING_DAY_KEYS = [
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY',
  ]

  return (
    <div className="mx-4 mb-4 rounded-2xl bg-white shadow-sm border border-[#E8E4DC] p-4">
      <h2 className="text-base font-semibold text-[#1A1A1A] mb-3">
        {t('onboarding.conversational.confirmTitle')}
      </h2>

      <div className="flex flex-col gap-3">
        {/* Kcal target */}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#6B6460]">
            {t('onboarding.conversational.confirm.kcalTarget')}
          </span>
          <input
            type="number"
            min={1000}
            max={5000}
            step={50}
            value={draft.kcalTarget ?? ''}
            onChange={(e) => handleKcal(e.target.value)}
            className="h-9 rounded-lg border border-[#D4CFC8] px-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#F28C28] focus:ring-offset-1"
          />
        </label>

        {/* Shopping cadence */}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#6B6460]">
            {t('onboarding.conversational.confirm.shoppingCadence')}
          </span>
          <input
            type="number"
            min={1}
            max={14}
            value={draft.shoppingCadenceDays ?? ''}
            onChange={(e) => handleCadence(e.target.value)}
            className="h-9 rounded-lg border border-[#D4CFC8] px-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#F28C28] focus:ring-offset-1"
          />
        </label>

        {/* Preferred shopping day */}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#6B6460]">
            {t('onboarding.conversational.confirm.shoppingDay')}
          </span>
          <select
            value={draft.preferredShoppingDay ?? ''}
            onChange={(e) =>
              onChange({ ...draft, preferredShoppingDay: e.target.value || null })
            }
            className="h-9 rounded-lg border border-[#D4CFC8] px-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#F28C28] focus:ring-offset-1 bg-white"
          >
            <option value="">—</option>
            {SHOPPING_DAY_KEYS.map((day) => (
              <option key={day} value={day}>
                {t(`common.weekdays.${day.toLowerCase()}`)}
              </option>
            ))}
          </select>
        </label>

        {/* Dietary restrictions — KALMIO-448: editable 20-flag toggle grid */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-[#6B6460]">
            {t('onboarding.conversational.confirm.dietaryRestrictions')}
          </span>
          {DIETARY_FLAG_GROUPS.map((group) => (
            <div key={group.labelKey}>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                {t(group.labelKey)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map(({ key }) => {
                  const active = activeFlags.has(key)
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={active}
                      title={t(`dietary.${key}Desc`, { defaultValue: '' })}
                      onClick={() => handleFlagToggle(key)}
                      className={[
                        'h-8 px-3 rounded-full border text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2',
                        active
                          ? 'border-[#E8956D] bg-[#FFF5F0] text-[#C0622A]'
                          : 'border-gray-200 bg-white text-[#6B6460] hover:border-[#E8956D]',
                      ].join(' ')}
                    >
                      {t(`dietary.${key}`)}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={confirming}
        className="mt-4 h-11 w-full rounded-[12px] bg-[#F28C28] text-sm font-semibold text-white transition-colors hover:bg-[#d97a20] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
      >
        {confirming
          ? t('onboarding.conversational.confirming')
          : t('onboarding.conversational.confirmCta')}
      </button>
    </div>
  )
}

// ── Post-chat cascade step type (KALMIO-442) ─────────────────────────────
// After finalize succeeds the user is handed into the same
// BodyData → TDEE → MealDistribution cascade the click-through uses.
// null = still in chat phase.

type PostChatStep = 'body-data' | 'tdee' | 'meal-dist'

// ── ConversationalOnboarding ───────────────────────────────────────────────

export function ConversationalOnboarding() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id ?? '')

  const [messages, setMessages] = useState<ChatTurn[]>([])
  const [inputValue, setInputValue] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [draft, setDraft] = useState<PreferencesDraft | null>(null)
  const [ready, setReady] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false)
  // KALMIO-446: track the latest extracted draft for progress counting.
  // The backend only returns extracted when ready=true; we keep the last seen
  // non-null draft so the pill doesn't reset if the card is interacted with.
  const [latestExtracted, setLatestExtracted] = useState<PreferencesDraft | null>(null)

  // KALMIO-442: post-chat cascade state.
  // null = chat phase; non-null = in the body-data → tdee → meal-dist cascade.
  const [postChatStep, setPostChatStep] = useState<PostChatStep | null>(null)

  // ── User settings — needed for body data pre-fill and TDEE reading ───────
  // Fetched lazily; enabled once we are in the post-chat cascade so we don't
  // add an extra network call while the user is still chatting.
  const { data: user } = useQuery({
    queryKey: USERS_ME_QUERY_KEY,
    queryFn: usersService.getMe,
    staleTime: 30_000,
    enabled: !!userId && postChatStep !== null,
  })

  // ── Body-data mutation (KALMIO-442) ───────────────────────────────────────
  const bodyDataMutation = useMutation({
    mutationFn: (values: BodyDataStepValues) =>
      usersService.patchBodyData({
        weightKg: values.weightKg,
        heightCm: values.heightCm,
        ageYears: values.ageYears,
        biologicalSex: values.biologicalSex,
        activityLevel: values.activityLevel,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(USERS_ME_QUERY_KEY, updated)
      setPostChatStep('tdee')
    },
    onError: () => {
      toast({ title: t('onboarding.bodyDataStep.saveError'), variant: 'destructive' })
    },
  })

  // ── TDEE acceptance mutation (KALMIO-442) ────────────────────────────────
  const tdeeMutation = useMutation({
    mutationFn: (kcalTarget: number) =>
      usersService.updateSettings({
        mealPlanPreferences: {
          ...user?.mealPlanPreferences,
          kcalTarget,
        },
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(USERS_ME_QUERY_KEY, updated)
      toast({ title: t('onboarding.tdeeStep.accepted'), variant: 'success' })
      setPostChatStep('meal-dist')
    },
  })

  // ── Meal distribution mutation (KALMIO-442) ───────────────────────────────
  const mealDistributionMutation = useMutation({
    mutationFn: (values: MealDistributionValues) =>
      usersService.updateSettings({
        mealPlanPreferences: {
          ...user?.mealPlanPreferences,
          mealCalorieTargets: values.mealCalorieTargets,
          selectedMealTypes: Object.keys(values.mealCalorieTargets),
        },
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(USERS_ME_QUERY_KEY, updated)
      handlePostChatComplete()
    },
  })

  // Called once the cascade is done (or any step is skipped past meal-dist).
  const handlePostChatComplete = useCallback(() => {
    if (userId) {
      writeOnboardingDone(userId)
      clearOnboardingStep(userId)
    }
    void queryClient.invalidateQueries({ queryKey: USERS_ME_QUERY_KEY })
    navigate('/app/plans?fresh=1', { replace: true })
  }, [navigate, queryClient, userId])

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom on new messages.
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, ready])

  // ── TanStack Query mutation for sending a turn ─────────────────────────

  const turnMutation = useMutation<TurnResponse, Error, ChatTurn[]>({
    mutationFn: (msgs) => conversationalOnboardingService.sendTurn(msgs),
    onSuccess: (data) => {
      setSessionId(data.sessionId)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.assistantMessage },
      ])
      // KALMIO-451: backend now always returns partial draft (not just on ready=true),
      // so we can track progress incrementally for the KALMIO-446 progress pill.
      if (data.extracted) {
        setLatestExtracted(data.extracted)
      }
      if (data.ready && data.extracted) {
        setDraft(data.extracted)
        setReady(true)
      }
      setErrorKey(null)
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 409) {
        // Already completed — redirect to the plans list (D-FE07 qa-2026-05-26)
        navigate('/app/plans', { replace: true })
      } else {
        setErrorKey('onboarding.conversational.errorTurn')
      }
    },
  })

  // ── Finalize mutation ──────────────────────────────────────────────────
  // KALMIO-442: on success, enter the body-data → tdee → meal-dist cascade
  // instead of navigating directly to /app/plans?fresh=1.

  const finalizeMutation = useMutation<void, Error, PreferencesDraft>({
    mutationFn: async (confirmedDraft) => {
      if (!sessionId) throw new Error('No session')
      await conversationalOnboardingService.finalizeOnboarding({
        sessionId,
        confirmedDraft,
      })
    },
    onSuccess: () => {
      // Invalidate users/me so body data and TDEE values are fresh for the
      // cascade steps — the query is enabled as soon as postChatStep goes non-null.
      void queryClient.invalidateQueries({ queryKey: USERS_ME_QUERY_KEY })
      // Hand the user into the body-data cascade (KALMIO-442).
      // We do NOT write onboardingDone here — that happens after the cascade
      // completes (or is fully skipped) in handlePostChatComplete.
      setPostChatStep('body-data')
    },
    onError: () => {
      setErrorKey('onboarding.conversational.errorFinalize')
    },
  })

  // ── Open the conversation on mount (first assistant turn) ─────────────

  useEffect(() => {
    if (messages.length === 0 && !turnMutation.isPending) {
      turnMutation.mutate([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    const text = inputValue.trim()
    // Edge case (KALMIO-447): empty/whitespace message must not reopen the conversation.
    if (!text || turnMutation.isPending) return

    // KALMIO-447: if the user types after ready=true, reopen the conversation.
    // Flip ready back to false so the confirm card is re-evaluated on the next turn.
    if (ready) {
      setReady(false)
    }

    const userTurn: ChatTurn = { role: 'user', content: text }
    const nextMessages: ChatTurn[] = [...messages, userTurn]
    setMessages(nextMessages)
    setInputValue('')
    turnMutation.mutate(nextMessages)
    inputRef.current?.focus()
  }, [inputValue, messages, ready, turnMutation])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleConfirm = useCallback(() => {
    if (draft) finalizeMutation.mutate(draft)
  }, [draft, finalizeMutation])

  // ── Switch-back handler with confirmation guard ────────────────────────
  // Tapping "Vissza az űrlaphoz" once the user has actually said something
  // would throw the whole conversation away with no warning. Guard it with
  // a confirm dialog from the second turn onward; first turn (assistant
  // greeting only) needs no confirmation.
  const hasUserContent = messages.some((m) => m.role === 'user')

  const handleSwitchBackRequest = useCallback(() => {
    // KALMIO-447: show confirmation dialog whenever user has typed anything,
    // even if ready=true (the card is visible). Removing the !ready guard.
    if (hasUserContent) {
      setExitConfirmOpen(true)
    } else {
      navigate('/app/onboarding')
    }
  }, [hasUserContent, navigate])

  const handleSwitchBackConfirm = useCallback(() => {
    setExitConfirmOpen(false)
    navigate('/app/onboarding')
  }, [navigate])

  // ── Render ─────────────────────────────────────────────────────────────

  // ── Post-chat cascade: BodyData → TDEE → MealDistribution ─────────────
  // Rendered as a full-screen overlay so the chat is fully replaced.
  // The layout mirrors OnboardingShell's content column — single column,
  // max-w-lg centred, same button styles.
  if (postChatStep !== null) {
    return (
      <div
        className="min-h-screen flex flex-col bg-[#F9F7F2]"
        data-testid="conversational-onboarding-cascade"
      >
        <div className="flex-1 flex flex-col px-4 md:px-8 pb-8 max-w-lg mx-auto w-full justify-center">

          {/* Body data step */}
          {postChatStep === 'body-data' && (
            <>
              <div className="text-center px-2 py-6">
                <h2 className="font-headline text-xl font-bold text-[#1A1A1A] leading-snug mb-2">
                  {t('onboarding.conversational.postChat.bodyDataTitle')}
                </h2>
                <p className="text-sm text-[#6B6460] max-w-xs mx-auto leading-relaxed">
                  {t('onboarding.conversational.postChat.bodyDataBody')}
                </p>
              </div>
              <BodyDataStep
                initialValues={{
                  weightKg: user?.weightKg ?? null,
                  heightCm: user?.heightCm ?? null,
                  ageYears: user?.ageYears ?? null,
                  biologicalSex: user?.biologicalSex ?? null,
                  activityLevel: user?.activityLevel ?? null,
                }}
                onAdvance={(values) => {
                  bodyDataMutation.mutate(values)
                }}
                onSkip={() => setPostChatStep('tdee')}
                onBack={() => {
                  // Re-show the chat confirm card. The chat state is still intact.
                  setPostChatStep(null)
                }}
                isSubmitting={bodyDataMutation.isPending}
              />
            </>
          )}

          {/* TDEE step */}
          {postChatStep === 'tdee' && (
            <div className="flex flex-col gap-4 py-6">
              {user?.suggestedKcalTarget == null ? (
                /* Body data missing (user skipped) — offer to go back or skip ahead */
                <>
                  <div className="text-center px-2">
                    <h2 className="font-headline text-xl font-bold text-[#1A1A1A] leading-snug mb-2">
                      {t('onboarding.tdeeStep.noBodyData.title')}
                    </h2>
                    <p className="text-sm text-[#6B6460] max-w-xs mx-auto leading-relaxed">
                      {t('onboarding.tdeeStep.noBodyData.description')}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#E8E4DC] bg-white p-5 flex flex-col gap-4">
                    <button
                      type="button"
                      onClick={() => setPostChatStep('body-data')}
                      className="flex h-12 w-full items-center justify-center rounded-[12px] bg-[#F28C28] px-6 text-base font-semibold text-white transition-colors hover:bg-[#d97a20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
                    >
                      {t('onboarding.tdeeStep.noBodyData.cta')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPostChatStep('meal-dist')}
                      className="h-10 w-full rounded-[12px] text-sm text-[#6B6460] hover:bg-[#F28C28]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
                    >
                      {t('onboarding.tdeeStep.noBodyData.skip')}
                    </button>
                  </div>
                </>
              ) : (
                /* Normal path: body data present, show TDEE suggestion banner */
                <>
                  <div className="text-center px-2">
                    <h2 className="font-headline text-xl font-bold text-[#1A1A1A] leading-snug mb-2">
                      {t('onboarding.conversational.postChat.tdeeTitle')}
                    </h2>
                    <p className="text-sm text-[#6B6460] max-w-xs mx-auto leading-relaxed">
                      {t('onboarding.conversational.postChat.tdeeBody')}
                    </p>
                  </div>
                  <TdeeSuggestionBanner
                    suggestedKcal={user.suggestedKcalTarget}
                    suggestedProtein={user?.suggestedProteinTarget ?? null}
                    accepting={tdeeMutation.isPending}
                    onAccept={({ kcalTarget }) => {
                      if (kcalTarget != null) {
                        tdeeMutation.mutate(kcalTarget)
                      } else {
                        setPostChatStep('meal-dist')
                      }
                    }}
                    onSkip={() => setPostChatStep('meal-dist')}
                  />
                </>
              )}
              <button
                type="button"
                onClick={() => setPostChatStep('body-data')}
                className="h-10 w-full rounded-[12px] text-sm text-[#6B6460] hover:bg-[#F28C28]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
              >
                {t('common.back')}
              </button>
            </div>
          )}

          {/* Meal distribution step */}
          {postChatStep === 'meal-dist' && (
            <MealDistributionStep
              dailyKcal={user?.mealPlanPreferences?.kcalTarget ?? user?.suggestedKcalTarget ?? null}
              initialTargets={user?.mealPlanPreferences?.mealCalorieTargets as Record<string, number> | null | undefined}
              onAdvance={(values) => {
                mealDistributionMutation.mutate(values)
              }}
              onSkip={handlePostChatComplete}
              onBack={() => setPostChatStep('tdee')}
              isSubmitting={mealDistributionMutation.isPending}
            />
          )}

        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-[#F9F7F2]"
      data-testid="conversational-onboarding"
    >
      {/* ---- Header ---- */}
      <header className="border-b border-[#E8E4DC] bg-[#F9F7F2]">
        <div className="flex items-center justify-between px-4 pt-5 pb-3 max-w-2xl mx-auto w-full">
          <h1 className="text-base font-semibold text-[#1A1A1A]">
            {t('onboarding.conversational.title')}
          </h1>
          <button
            type="button"
            onClick={handleSwitchBackRequest}
            className="text-sm text-[#6B6460] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2 rounded"
          >
            {t('onboarding.conversational.switchBack')}
          </button>
        </div>
      </header>

      {/* ---- Message list ---- */}
      <div
        className="flex-1 overflow-y-auto"
        aria-label={t('onboarding.conversational.title')}
        aria-live="polite"
      >
        <div className="max-w-2xl mx-auto px-4 pt-4 w-full">
          {messages.map((msg, i) => (
            <Bubble key={i} role={msg.role} content={msg.content} />
          ))}

          <TypingIndicator visible={turnMutation.isPending} />

          {/* Error inline message */}
          {errorKey && (
            <p className="text-sm text-red-600 text-center my-2">{t(errorKey)}</p>
          )}

          {/* Confirmation card — rendered below messages when ready */}
          {ready && draft && (
            <ConfirmCard
              draft={draft}
              onChange={setDraft}
              onConfirm={handleConfirm}
              confirming={finalizeMutation.isPending}
            />
          )}

          {/* Scroll anchor */}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* ---- Input area — always visible (KALMIO-447: input live after ready=true) ---- */}
      <div className="border-t border-[#E8E4DC] bg-[#F9F7F2]">
        {/* Progress pill — KALMIO-446: shown once the first assistant turn arrives */}
        <ChatProgressPill
          collected={countCollectedFields(latestExtracted)}
          total={REQUIRED_FIELD_COUNT}
          visible={messages.length > 0}
        />
        <div className="px-4 pb-6 pt-1 max-w-2xl mx-auto">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('onboarding.conversational.inputPlaceholder')}
              disabled={turnMutation.isPending}
              aria-label={t('onboarding.conversational.inputPlaceholder')}
              className="flex-1 resize-none rounded-2xl border border-[#D4CFC8] bg-white px-4 py-3 text-sm text-[#1A1A1A] leading-relaxed placeholder:text-[#B0A89F] focus:outline-none focus:ring-2 focus:ring-[#F28C28] focus:ring-offset-1 disabled:opacity-60 max-h-32 overflow-y-auto"
              style={{ fieldSizing: 'content' } as React.CSSProperties}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputValue.trim() || turnMutation.isPending}
              aria-label={t('onboarding.conversational.send')}
              className="h-11 w-11 shrink-0 rounded-full bg-[#F28C28] text-white flex items-center justify-center transition-colors hover:bg-[#d97a20] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
            >
              {/* Arrow-up icon (inline SVG — no extra dep) */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M9 14V4M9 4L4.5 8.5M9 4L13.5 8.5"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ---- Exit-confirm dialog: avoid throwing away the conversation ---- */}
      <Dialog open={exitConfirmOpen} onOpenChange={setExitConfirmOpen}>
        <DialogContent className="max-w-sm" aria-describedby="conv-exit-desc">
          <DialogHeader>
            <DialogTitle>
              {t('onboarding.conversational.exitConfirm.title')}
            </DialogTitle>
            <DialogDescription id="conv-exit-desc">
              {t('onboarding.conversational.exitConfirm.body')}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 mt-4">
            <Button
              variant="primary"
              size="md"
              onClick={handleSwitchBackConfirm}
              className="w-full"
            >
              {t('onboarding.conversational.exitConfirm.confirm')}
            </Button>
            <DialogClose asChild>
              <Button variant="ghost" size="md" className="w-full">
                {t('onboarding.conversational.exitConfirm.cancel')}
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
