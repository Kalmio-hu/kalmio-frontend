/**
 * CookMode — fullscreen, phone-in-the-kitchen cooking surface (KALMIO-188 / E11.9).
 *
 * Route: `/app/recipes/:id/cook` (mounted OUTSIDE the AppShell sidebar/header so
 * the user gets every pixel for the current step while cooking).
 *
 * Layout (mobile-first):
 *   ┌─────────────────────────────────────────────┐
 *   │  ← Recipe name              Step N / M      │  Header
 *   ├─────────────────────────────────────────────┤
 *   │  Big, readable step text                    │
 *   │  · ~7 min · 🥩 csirkemell                   │  Step body
 *   ├─────────────────────────────────────────────┤
 *   │  Q&A transcript (scrollable)                │
 *   │  ┌─ input ────────────────────────────┐ [↑] │  Ask bar
 *   │  ◀ Previous step      Next step ▶            │  Step nav
 *   └─────────────────────────────────────────────┘
 *
 * Wake Lock API keeps the screen on while the user is in the route; we release
 * it on unmount and on visibilitychange. Browsers that don't support the API
 * silently no-op.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  ArrowUp,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Timer,
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { recipesService } from '@/services/recipes'
import { cookModeService } from '@/services/cookMode'
import { getRecipeName, getRecipeSteps, getRecipeGarnish } from '@/lib/i18nRecipe'
import { RecipeFamilyHint } from '@/components/recipe/RecipeFamilyHint'
import { parseTimerWindow } from '@/lib/parseTimerWindow'
import { CookTimer } from '@/components/cook/CookTimer'
import { CookTimerStrip } from '@/components/cook/CookTimerStrip'
import { useCookTimersStore, maybeNotify, type CookTimer as CookTimerType } from '@/store/cookTimers'
import { useIsUserPremium } from '@/hooks/useIsUserPremium'

const CONTEXT_WINDOW = 5

type ErrorKey = 'premium' | 'rateLimit' | 'configuration' | 'generic'

function mapAskError(err: unknown): ErrorKey {
  const status = (err as { response?: { status?: number } })?.response?.status
  if (status === 402) return 'premium'
  if (status === 429) return 'rateLimit'
  if (status === 503) return 'configuration'
  return 'generic'
}

interface Exchange {
  id: string
  question: string
  answer: string | null
  error: ErrorKey | null
  pending: boolean
}

// ── Wake Lock hook ────────────────────────────────────────────────────────

function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    type WakeLockSentinel = { release: () => Promise<void> }
    const nav = navigator as Navigator & {
      wakeLock?: { request: (kind: 'screen') => Promise<WakeLockSentinel> }
    }
    if (!nav.wakeLock) return

    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const acquire = async () => {
      try {
        const s = await nav.wakeLock!.request('screen')
        if (cancelled) {
          await s.release().catch(() => undefined)
          return
        }
        sentinel = s
      } catch {
        // Permission denied or unsupported — silently no-op.
      }
    }
    void acquire()

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void acquire()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibility)
      if (sentinel) void sentinel.release().catch(() => undefined)
    }
  }, [active])
}

// ── Page ──────────────────────────────────────────────────────────────────

export function CookMode() {
  const { id: recipeId } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isPremium = useIsUserPremium()
  const lang = i18n.resolvedLanguage?.startsWith('hu') ? 'hu' : 'en'

  const { data: recipe, isPending, isError } = useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: () => recipesService.get(recipeId!),
    enabled: !!recipeId,
    staleTime: 60_000,
  })

  const steps = useMemo(() => getRecipeSteps(recipe ?? null, lang), [recipe, lang])
  const recipeName = recipe ? getRecipeName(recipe, lang) : ''
  const garnishText = getRecipeGarnish(recipe ?? null, lang)

  const [stepIdx, setStepIdx] = useState(0)
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [question, setQuestion] = useState('')
  const transcriptRef = useRef<HTMLDivElement>(null)

  // ── Timer state ───────────────────────────────────────────────────────────
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null)
  const startTimer = useCookTimersStore(s => s.startTimer)
  const registerAlertCallbacks = useCookTimersStore(s => s.registerAlertCallbacks)

  // Register alert callbacks once. We use refs to avoid a re-registration loop.
  useEffect(() => {
    registerAlertCallbacks(
      (timer: CookTimerType) => {
        // Soft alert: min reached. Recipe name in the body so the user can
        // tell which dish the timer belongs to when several recipes cook
        // simultaneously.
        const minMin = Math.round(timer.window.minSeconds / 60)
        const maxMin = Math.round(timer.window.maxSeconds / 60)
        maybeNotify(
          t('cook.timer.softAlertTitle'),
          t('cook.timer.softAlertBody', { min: minMin, max: maxMin, recipe: timer.recipeName }),
        )
      },
      (timer: CookTimerType) => {
        // Hard alert: max reached.
        const maxMin = Math.round(timer.window.maxSeconds / 60)
        maybeNotify(
          t('cook.timer.hardAlertTitle'),
          t('cook.timer.hardAlertBody', { max: maxMin, recipe: timer.recipeName }),
        )
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTimerAffordance = useCallback((step: string, idx: number) => {
    const win = parseTimerWindow(step)
    if (!win || !recipeId) return
    const id = `${recipeId}-step-${idx}`
    const minMin = Math.round(win.minSeconds / 60)
    const maxMin = Math.round(win.maxSeconds / 60)
    startTimer({
      id,
      recipeId,
      recipeName,
      stepIdx: idx,
      stepLabel: t('cook.timer.stepLabel', { step: idx + 1, min: minMin, max: maxMin }),
      window: win,
    })
    setActiveTimerId(id)
  }, [recipeId, recipeName, startTimer, t])

  useWakeLock(!!recipeId)

  // Scroll transcript to bottom on update.
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [exchanges])

  // Keyboard arrows for step nav (desktop convenience).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' ||
          (e.target as HTMLElement)?.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowRight') setStepIdx(i => Math.min(steps.length - 1, i + 1))
      if (e.key === 'ArrowLeft') setStepIdx(i => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [steps.length])

  const askMutation = useMutation({
    mutationFn: async ({ q, prev }: { id: string; q: string; prev: string[] }) => {
      return cookModeService.ask(recipeId!, {
        question: q,
        previousQuestions: prev.length > 0 ? prev : undefined,
        currentStepIndex: stepIdx,
      })
    },
    onSuccess: (res, { id }) => {
      setExchanges(xs =>
        xs.map(e =>
          e.id === id
            ? { ...e, pending: false, answer: res.answer }
            : e,
        ),
      )
    },
    onError: (err, { id }) => {
      const key = isPremium && mapAskError(err) === 'premium' ? 'generic' : mapAskError(err)
      setExchanges(xs =>
        xs.map(e =>
          e.id === id
            ? { ...e, pending: false, error: key }
            : e,
        ),
      )
    },
  })

  const handleSubmit = useCallback(() => {
    const trimmed = question.trim()
    if (!trimmed || trimmed.length > 500) return
    const id = crypto.randomUUID()
    // Build previousQuestions from current exchanges BEFORE appending the new one,
    // so the backend does not receive the current question as its own context.
    const prev = exchanges
      .map(e => e.question)
      .slice(-CONTEXT_WINDOW)
    setExchanges(xs => [
      ...xs,
      { id, question: trimmed, answer: null, error: null, pending: true },
    ])
    setQuestion('')
    askMutation.mutate({ id, q: trimmed, prev })
  }, [question, exchanges, askMutation])

  // ── Early states ────────────────────────────────────────────────────────

  if (isPending) {
    return (
      <div className="min-h-dvh bg-[#FAFAF6] flex items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }
  if (isError || !recipe) {
    return (
      <div className="min-h-dvh bg-[#FAFAF6] flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-[#6b7280]">{t('recipes.cookMode.notFound')}</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg bg-[#1A1A1A] px-4 py-2 text-sm font-semibold text-white"
        >
          {t('common.back')}
        </button>
      </div>
    )
  }

  const totalSteps = steps.length
  const hasSteps = totalSteps > 0
  const currentStep = hasSteps ? steps[stepIdx] : null
  const stepLabel = hasSteps
    ? t('recipes.cookMode.stepOf', { current: stepIdx + 1, total: totalSteps })
    : t('recipes.cookMode.noSteps')

  return (
    <div className="min-h-dvh bg-[#FAFAF6] w-full">
    <div className="min-h-dvh bg-[#FAFAF6] flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-2 bg-white border-b border-[#EDEAE2] px-3 py-2.5">
        <button
          type="button"
          aria-label={t('common.back')}
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg text-[#6b7280] hover:bg-[#F9F7F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1A1A1A] truncate leading-tight">
            {recipeName}
          </p>
          {/* Family/variant hint — so the user can verify they're cooking
              the right variant. Detail dialog handles full variant navigation;
              here we just show the variant label + tier badge. */}
          {recipe?.familyId && (
            <div className="mt-0.5">
              <RecipeFamilyHint
                familyId={recipe.familyId}
                variantLabel={recipe.variantLabel}
                dietTier={recipe.dietTier}
              />
            </div>
          )}
          <p className="text-[11px] text-[#6b7280] tabular-nums">{stepLabel}</p>
        </div>
        <ChefHat className="h-5 w-5 text-[#F28C28]" aria-hidden />
      </header>

      {/* Timer strip */}
      <CookTimerStrip
        selectedTimerId={activeTimerId}
        onSelect={id => setActiveTimerId(prev => prev === id ? null : id)}
      />

      {/* Active clock face */}
      {activeTimerId && (
        <CookTimer
          timerId={activeTimerId}
          onClose={() => setActiveTimerId(null)}
        />
      )}

      {/* Progress bar */}
      {hasSteps && (
        <div
          className="h-1 bg-[#EDEAE2]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalSteps}
          aria-valuenow={stepIdx + 1}
        >
          <div
            className="h-full bg-[#F28C28] transition-all"
            style={{ width: `${((stepIdx + 1) / totalSteps) * 100}%` }}
          />
        </div>
      )}

      {/* Step body */}
      <section className="flex-1 px-5 py-6 sm:py-10 flex flex-col">
        {hasSteps ? (
          <article className="mx-auto w-full max-w-2xl">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#F28C28] mb-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#F28C28] text-white text-xs">
                {stepIdx + 1}
              </span>
              {t('recipes.cookMode.stepLabel')}
            </div>
            <p className="text-lg sm:text-xl text-[#1A1A1A] leading-relaxed whitespace-pre-line">
              {currentStep}
            </p>

            {/* Garnish note — shown only on the final step */}
            {garnishText && stepIdx === totalSteps - 1 && (
              <p className="mt-4 text-sm text-[#6b7280] italic leading-relaxed">
                {garnishText}
              </p>
            )}

            {/* Timer affordance — shown when the step body contains a parseable time window */}
            {currentStep && (() => {
              const win = parseTimerWindow(currentStep)
              if (!win) return null
              const timerId = recipeId ? `${recipeId}-step-${stepIdx}` : null
              const minMin = Math.round(win.minSeconds / 60)
              const maxMin = Math.round(win.maxSeconds / 60)
              return (
                <button
                  type="button"
                  onClick={() => handleTimerAffordance(currentStep, stepIdx)}
                  className="
                    mt-4 inline-flex items-center gap-2 rounded-xl border border-[#EDEAE2]
                    bg-[#F9F7F2] px-3 py-2 text-sm font-semibold text-[#4F7942]
                    hover:bg-[#EFF5EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7942]
                    transition-colors
                  "
                  aria-label={t('cook.timer.startAriaLabel', { min: minMin, max: maxMin })}
                >
                  <Timer className="h-4 w-4" aria-hidden />
                  {minMin === maxMin
                    ? t('cook.timer.affordanceSingle', { min: minMin })
                    : t('cook.timer.affordanceRange', { min: minMin, max: maxMin })}
                  {timerId && activeTimerId === timerId && (
                    <span className="inline-block h-2 w-2 rounded-full bg-[#4F7942] animate-pulse" aria-hidden />
                  )}
                </button>
              )
            })()}
          </article>
        ) : (
          <p className="m-auto text-sm text-[#6b7280]">
            {t('recipes.cookMode.noSteps')}
          </p>
        )}
      </section>

      {/* Q&A transcript + input */}
      <section className="bg-white border-t border-[#EDEAE2] px-3 pt-3 pb-2">
        <div className="mx-auto w-full max-w-2xl">
          <header className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#B86C1B] mb-2">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {t('recipes.cookMode.askTitle')}
          </header>

          {exchanges.length > 0 && (
            <div
              ref={transcriptRef}
              className="max-h-44 overflow-y-auto pr-1 mb-2 space-y-2"
            >
              {exchanges.map((ex, i) => (
                <ExchangeBubble key={i} exchange={ex} />
              ))}
            </div>
          )}

          <form
            onSubmit={e => {
              e.preventDefault()
              handleSubmit()
            }}
            className="flex items-end gap-2"
          >
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder={t('recipes.cookMode.askPlaceholder')}
              maxLength={500}
              rows={1}
              className="
                flex-1 resize-none rounded-xl border border-[#EDEAE2] bg-[#FAFAF6]
                px-3 py-2 text-sm leading-snug
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]
              "
            />
            <button
              type="submit"
              disabled={!question.trim() || askMutation.isPending}
              aria-label={t('recipes.cookMode.askSubmit')}
              className="
                shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-xl
                bg-[#F28C28] text-white hover:bg-[#d9761e] disabled:opacity-50 disabled:cursor-not-allowed
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-1
              "
            >
              {askMutation.isPending ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      </section>

      {/* Step navigation */}
      <nav className="bg-white border-t border-[#EDEAE2] px-3 py-2.5 sticky bottom-0">
        <div className="mx-auto w-full max-w-2xl flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setStepIdx(i => Math.max(0, i - 1))}
            disabled={stepIdx === 0 || !hasSteps}
            className="
              inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold
              text-[#1A1A1A] hover:bg-[#F9F7F2] disabled:text-[#c4c4c4] disabled:hover:bg-transparent
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]
            "
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            {t('recipes.cookMode.prevStep')}
          </button>

          {hasSteps && stepIdx === totalSteps - 1 ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="
                inline-flex items-center gap-1.5 rounded-lg bg-[#4F7942] px-4 py-2 text-sm font-semibold text-white
                hover:bg-[#3d6132] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7942] focus-visible:ring-offset-1
              "
            >
              {t('recipes.cookMode.finish')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStepIdx(i => Math.min(totalSteps - 1, i + 1))}
              disabled={!hasSteps || stepIdx >= totalSteps - 1}
              className="
                inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-4 py-2 text-sm font-semibold text-white
                hover:bg-[#000000] disabled:opacity-40 disabled:cursor-not-allowed
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-1
              "
            >
              {t('recipes.cookMode.nextStep')}
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      </nav>
    </div>
    </div>
  )
}

// ── Bubble ────────────────────────────────────────────────────────────────

function ExchangeBubble({ exchange }: { exchange: Exchange }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-1">
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-[#1A1A1A] px-3 py-1.5 text-xs text-white">
          {exchange.question}
        </p>
      </div>
      <div className="flex justify-start">
        {exchange.pending ? (
          <p className="max-w-[85%] rounded-2xl rounded-bl-md bg-[#FFF8EF] px-3 py-1.5 text-xs text-[#6b7280] inline-flex items-center gap-1.5 ring-1 ring-[#F1E4D2]">
            <Spinner className="h-3 w-3" />
            {t('recipes.cookMode.thinking')}
          </p>
        ) : exchange.error ? (
          <ErrorBubble errorKey={exchange.error} />
        ) : (
          <p className="max-w-[85%] rounded-2xl rounded-bl-md bg-[#FFF8EF] px-3 py-1.5 text-xs leading-relaxed text-[#1A1A1A] ring-1 ring-[#F1E4D2] whitespace-pre-line">
            {exchange.answer}
          </p>
        )}
      </div>
    </div>
  )
}

function ErrorBubble({ errorKey }: { errorKey: ErrorKey }) {
  const { t } = useTranslation()

  if (errorKey === 'premium') {
    return (
      <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-[#FFF3E5] px-3 py-2 text-xs text-[#6b4a1a] ring-1 ring-[#F1E4D2]">
        <p className="leading-relaxed">{t('recipes.cookMode.errors.premium')}</p>
        <Link
          to="/app/founding-member"
          className="mt-1 inline-block font-semibold text-[#B86C1B] underline-offset-2 hover:underline"
        >
          {t('recipes.cookMode.errors.premiumCta')} →
        </Link>
      </div>
    )
  }
  const messageKey =
    errorKey === 'rateLimit'
      ? 'recipes.cookMode.errors.rateLimit'
      : errorKey === 'configuration'
        ? 'recipes.cookMode.errors.configuration'
        : 'recipes.cookMode.errors.generic'
  return (
    <p className="max-w-[85%] rounded-2xl rounded-bl-md bg-[#FFF3E5] px-3 py-1.5 text-xs leading-relaxed text-[#6b4a1a] ring-1 ring-[#F1E4D2]">
      {t(messageKey)}
    </p>
  )
}
