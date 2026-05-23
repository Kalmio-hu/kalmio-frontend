/**
 * ConversationalOnboarding — KALMIO-186
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
 *  5. On confirm, `finalizeOnboarding` is called; on success → navigate('/app').
 *  6. "Vissza az űrlaphoz" link returns to /app/onboarding at any point.
 *
 * Premium guard: the service returns 402 when the user is not premium. The UI
 * catches this and shows a dedicated "premium only" message with a link to the
 * Founding Member page.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ── Inline conversational onboarding service (was services/conversationalOnboarding.ts — deleted KALMIO-293)
// Backend endpoints (/api/onboarding/conversational/turn|finalize) confirmed removed in KALMIO-281.
// Stub-only implementation kept here until the feature is re-scoped.

interface ChatTurn {
  role: 'assistant' | 'user'
  content: string
}

interface PreferencesDraft {
  householdSize: number | null
  kcalTarget: number | null
  dietaryRestrictions: string[]
  shoppingCadenceDays: number | null
  preferredShoppingDay: string | null
  forbiddenIngredientIds: string[]
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

// ── Stub ──────────────────────────────────────────────────────────────────────
const STUB_SESSION_ID = 'stub-session-186'
const STUB_TURNS: string[] = [
  'Szia! Mesélj egy kicsit az étkezési szokásaidról. Hány főre szoktál főzni általában?',
  'Rendben. Mennyi kalóriát szeretnél naponta körülbelül bevinni?',
  'Köszönöm. Van-e valamilyen étrendi megszorításod?',
  'Értem. Milyen sűrűn szoktál bevásárolni?',
  'Melyik nap szokott a legkényelmesebb lenni a bevásárláshoz?',
  'Van-e valamilyen hozzávaló, amit feltétlenül ki szeretnél zárni az étrendedből?',
  'Köszönöm, megvan minden, ami kell. Összesítem a preferenciáidat — egy pillanat.',
]

function buildStubDraft(turnIndex: number): PreferencesDraft | null {
  if (turnIndex < STUB_TURNS.length - 1) return null
  return { householdSize: 2, kcalTarget: 2000, dietaryRestrictions: [], shoppingCadenceDays: 7, preferredShoppingDay: 'SATURDAY', forbiddenIngredientIds: [] }
}

const createStub = () => {
  let turn = 0
  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sendTurn: async (_messages: ChatTurn[]): Promise<TurnResponse> => {
      await new Promise<void>((resolve) => setTimeout(resolve, 800))
      const idx = turn
      const isLast = idx >= STUB_TURNS.length - 1
      const response: TurnResponse = { sessionId: STUB_SESSION_ID, assistantMessage: STUB_TURNS[Math.min(idx, STUB_TURNS.length - 1)], ready: isLast, extracted: buildStubDraft(idx) }
      turn = Math.min(turn + 1, STUB_TURNS.length - 1)
      return response
    },
    finalize: async (): Promise<void> => { turn = 0 },
  }
}

let _stubInstance = createStub()

const USE_STUB = true // flip to false when backend ships

const conversationalOnboardingService = {
  sendTurn: (messages: ChatTurn[]): Promise<TurnResponse> => {
    if (USE_STUB) return _stubInstance.sendTurn(messages)
    return api.post<TurnResponse>('/api/onboarding/conversational/turn', { messages }).then(r => r.data)
  },
  finalizeOnboarding: (req: FinalizeRequest): Promise<{ success: boolean }> => {
    if (USE_STUB) { void _stubInstance.finalize(); return Promise.resolve({ success: true }) }
    return api.post<{ success: boolean }>('/api/onboarding/conversational/finalize', req).then(r => r.data)
  },
  _resetStub: () => { _stubInstance = createStub() },
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

// ── Confirmation card ──────────────────────────────────────────────────────

interface ConfirmCardProps {
  draft: PreferencesDraft
  onChange: (updated: PreferencesDraft) => void
  onConfirm: () => void
  confirming: boolean
}

function ConfirmCard({ draft, onChange, onConfirm, confirming }: ConfirmCardProps) {
  const { t } = useTranslation()

  const handleHouseholdSize = (v: string) => {
    const n = parseInt(v, 10)
    onChange({ ...draft, householdSize: isNaN(n) ? null : n })
  }

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
        {/* Household size */}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#6B6460]">
            {t('onboarding.conversational.confirm.householdSize')}
          </span>
          <input
            type="number"
            min={1}
            max={10}
            value={draft.householdSize ?? ''}
            onChange={(e) => handleHouseholdSize(e.target.value)}
            className="h-9 rounded-lg border border-[#D4CFC8] px-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#F28C28] focus:ring-offset-1"
          />
        </label>

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

        {/* Dietary restrictions — display-only for now */}
        {draft.dietaryRestrictions.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#6B6460]">
              {t('onboarding.conversational.confirm.dietaryRestrictions')}
            </span>
            <p className="text-sm text-[#1A1A1A]">
              {draft.dietaryRestrictions.join(', ')}
            </p>
          </div>
        )}
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

// ── ConversationalOnboarding ───────────────────────────────────────────────

export function ConversationalOnboarding() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [messages, setMessages] = useState<ChatTurn[]>([])
  const [inputValue, setInputValue] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [draft, setDraft] = useState<PreferencesDraft | null>(null)
  const [ready, setReady] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [isPremiumBlocked, setIsPremiumBlocked] = useState(false)
  const [isRateLimited, setIsRateLimited] = useState(false)

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
      if (data.ready && data.extracted) {
        setDraft(data.extracted)
        setReady(true)
      }
      setErrorKey(null)
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 402) {
        setIsPremiumBlocked(true)
      } else if (status === 429) {
        setIsRateLimited(true)
      } else {
        setErrorKey('onboarding.conversational.errorTurn')
      }
    },
  })

  // ── Finalize mutation ──────────────────────────────────────────────────

  const finalizeMutation = useMutation<void, Error, PreferencesDraft>({
    mutationFn: async (confirmedDraft) => {
      if (!sessionId) throw new Error('No session')
      await conversationalOnboardingService.finalizeOnboarding({
        sessionId,
        confirmedDraft,
      })
    },
    onSuccess: () => {
      navigate('/app', { replace: true })
    },
    onError: () => {
      setErrorKey('onboarding.conversational.errorFinalize')
    },
  })

  // ── Open the conversation on mount (first assistant turn) ─────────────

  useEffect(() => {
    // Reset the stub counter so navigating away and back starts from turn 0.
    conversationalOnboardingService._resetStub()
    if (messages.length === 0 && !turnMutation.isPending) {
      turnMutation.mutate([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    const text = inputValue.trim()
    if (!text || turnMutation.isPending || ready) return

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

  // ── Render ─────────────────────────────────────────────────────────────

  if (isPremiumBlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9F7F2] px-6 text-center gap-4">
        <p className="text-base text-[#1A1A1A] max-w-xs leading-relaxed">
          {t('onboarding.conversational.premiumOnly')}
        </p>
        <a
          href="/app/founding-member"
          className="text-sm text-[#F28C28] underline underline-offset-2 hover:text-[#d97a20]"
        >
          {t('onboarding.conversational.premiumLearnMore')}
        </a>
        <button
          type="button"
          onClick={() => navigate('/app/onboarding')}
          className="text-sm text-[#6B6460] underline underline-offset-2 hover:text-[#1A1A1A]"
        >
          {t('onboarding.conversational.switchBack')}
        </button>
      </div>
    )
  }

  if (isRateLimited) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9F7F2] px-6 text-center gap-4">
        <p className="text-base text-[#1A1A1A] max-w-xs leading-relaxed">
          {t('onboarding.conversational.rateLimited')}
        </p>
        <button
          type="button"
          onClick={() => navigate('/app/onboarding')}
          className="text-sm text-[#6B6460] underline underline-offset-2 hover:text-[#1A1A1A]"
        >
          {t('onboarding.conversational.switchBack')}
        </button>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-[#F9F7F2]"
      data-testid="conversational-onboarding"
    >
      {/* ---- Header ---- */}
      <header className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-[#E8E4DC] bg-[#F9F7F2]">
        <h1 className="text-base font-semibold text-[#1A1A1A]">
          {t('onboarding.conversational.title')}
        </h1>
        <button
          type="button"
          onClick={() => navigate('/app/onboarding')}
          className="text-sm text-[#6B6460] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2 rounded"
        >
          {t('onboarding.conversational.switchBack')}
        </button>
      </header>

      {/* ---- Message list ---- */}
      <div
        className="flex-1 overflow-y-auto px-4 pt-4"
        aria-label={t('onboarding.conversational.title')}
        aria-live="polite"
      >
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

      {/* ---- Input area (hidden when ready=true and waiting for confirmation) ---- */}
      {!ready && (
        <div className="px-4 pb-6 pt-2 border-t border-[#E8E4DC] bg-[#F9F7F2]">
          <div className="flex gap-2 items-end max-w-lg mx-auto">
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
      )}
    </div>
  )
}
