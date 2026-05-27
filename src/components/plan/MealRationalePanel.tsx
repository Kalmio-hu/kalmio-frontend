/**
 * MealRationalePanel — inline expandable "Why this meal?" rationale.
 *
 * Lives directly under a planned-meal row (PlannerMealRow, MemberMealSlot,
 * DailyTimeline's meal card). Parent owns the open/close state and renders
 * the sparkle trigger; this component renders the panel body when open.
 *
 * The backend caches the rationale per planned meal — so re-opening a panel
 * the user already saw is free (cache hits bypass the monthly cap). We also
 * gate the network call on `open` so closed panels never fetch.
 *
 * Premium-gated:
 *   - 402 → paywall banner with Founding Member link
 *   - 429 → "try again in a minute / monthly cap reached" hint
 *   - other → generic error with retry
 */
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ChefHat, Sparkles } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { mealRationaleService } from '@/services/mealRationale'
import type { MealRationaleResponse } from '@/types'

interface MealRationalePanelProps {
  plannedMealId: string
  /** When null/undefined the "Start cooking" CTA is hidden. */
  recipeId?: string | null
  open: boolean
  /** Optional callback for a contextual "Start cooking" deep link. */
  onStartCooking?: (recipeId: string) => void
}

type ErrorKey = 'premium' | 'rateLimit' | 'notFound' | 'generic'

function mapError(err: unknown): ErrorKey {
  const status = (err as { response?: { status?: number } })?.response?.status
  if (status === 402) return 'premium'
  if (status === 404) return 'notFound'
  if (status === 429) return 'rateLimit'
  return 'generic'
}

export function MealRationalePanel({
  plannedMealId,
  recipeId,
  open,
  onStartCooking,
}: MealRationalePanelProps) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? i18n.language ?? 'hu').startsWith('hu')
    ? 'hu'
    : 'en'

  const query = useQuery<MealRationaleResponse, unknown>({
    queryKey: ['mealRationale', plannedMealId],
    queryFn: () => mealRationaleService.explain(plannedMealId),
    enabled: open,
    // The backend caches indefinitely, so we treat client-side data as fresh
    // for an hour to avoid re-fetching as the user toggles the panel.
    staleTime: 60 * 60 * 1000,
    retry: false,
  })

  if (!open) return null

  return (
    <div
      role="region"
      aria-label={t('plan.rationale.title')}
      className="mt-1 mb-2 ml-2 mr-1 rounded-xl border border-[#F1E4D2] bg-gradient-to-br from-[#FFF8EF] to-[#FFFAF3] px-4 py-3 text-sm shadow-[0_1px_0_rgba(0,0,0,0.02)]"
    >
      <header className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#B86C1B]">
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        {t('plan.rationale.title')}
      </header>

      {query.isPending ? (
        <div className="flex items-center gap-2 py-2 text-[#6b7280]">
          <Spinner className="h-3.5 w-3.5" />
          <span className="text-xs">{t('plan.rationale.loading')}</span>
        </div>
      ) : query.isError ? (
        <RationaleError errorKey={mapError(query.error)} onRetry={() => query.refetch()} />
      ) : query.data ? (
        <RationaleBody
          data={query.data}
          lang={lang}
          recipeId={recipeId ?? null}
          onStartCooking={onStartCooking}
        />
      ) : null}
    </div>
  )
}

// ── Body ──────────────────────────────────────────────────────────────────

function RationaleBody({
  data,
  lang,
  recipeId,
  onStartCooking,
}: {
  data: MealRationaleResponse
  lang: 'hu' | 'en'
  recipeId: string | null
  onStartCooking?: (recipeId: string) => void
}) {
  const { t } = useTranslation()
  const text = lang === 'hu' ? data.rationale : data.rationaleEn

  return (
    <div className="mt-1.5 space-y-2">
      <p className="leading-relaxed text-[#1A1A1A]">{text}</p>

      {data.citedFacts.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {data.citedFacts.map((fact, i) => (
            <li
              key={i}
              className="inline-flex items-center rounded-full bg-white/70 px-2 py-0.5 text-[11px] text-[#6b4a1a] ring-1 ring-[#F1E4D2]"
            >
              {fact}
            </li>
          ))}
        </ul>
      )}

      {recipeId && onStartCooking && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => onStartCooking(recipeId)}
            className="
              inline-flex items-center gap-1.5 rounded-lg
              bg-[#F28C28] px-3 py-1.5 text-xs font-semibold text-white
              transition-colors hover:bg-[#d9761e] active:bg-[#c06917]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-1
            "
          >
            <ChefHat className="h-3.5 w-3.5" aria-hidden />
            {t('plan.rationale.startCooking')}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Error states ──────────────────────────────────────────────────────────

function RationaleError({
  errorKey,
  onRetry,
}: {
  errorKey: ErrorKey
  onRetry: () => void
}) {
  const { t } = useTranslation()

  if (errorKey === 'premium') {
    return (
      <div className="mt-1.5 space-y-1.5">
        <p className="text-xs leading-relaxed text-[#6b4a1a]">
          {t('plan.rationale.errors.premium')}
        </p>
        <Link
          to="/app/founding-member"
          className="inline-flex items-center rounded-lg bg-[#F28C28] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#d9761e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-1"
        >
          {t('plan.rationale.errors.premiumCta')}
        </Link>
      </div>
    )
  }

  if (errorKey === 'rateLimit') {
    return (
      <p className="mt-1.5 text-xs leading-relaxed text-[#6b4a1a]">
        {t('plan.rationale.errors.rateLimit')}
      </p>
    )
  }

  if (errorKey === 'notFound') {
    return (
      <p className="mt-1.5 text-xs leading-relaxed text-[#6b4a1a]">
        {t('plan.rationale.errors.notFound')}
      </p>
    )
  }

  return (
    <div className="mt-1.5 flex items-center gap-2">
      <p className="flex-1 text-xs leading-relaxed text-[#6b4a1a]">
        {t('plan.rationale.errors.generic')}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="text-xs font-semibold text-[#B86C1B] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-1 rounded"
      >
        {t('plan.rationale.errors.retry')}
      </button>
    </div>
  )
}
