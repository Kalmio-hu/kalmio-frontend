/**
 * WeeklyRecapCard — premium narrative recap for the active plan.
 *
 * GET /api/plans/{id}/recap is rate-limited (1/min, 8/month) and generates on a
 * cache miss, so it is fetched on demand — never on page load.
 */
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { CalendarCheck, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { planService } from '@/services/plans'
import { aiErrorKind } from '@/lib/aiErrors'

interface Props {
  planId: string
}

export function WeeklyRecapCard({ planId }: Props) {
  const { t, i18n } = useTranslation()

  const recapQuery = useQuery({
    queryKey: ['weekly-recap', planId],
    queryFn: () => planService.getWeeklyRecap(planId),
    enabled: false,
    staleTime: 60 * 60_000,
    retry: false,
  })

  const recap = recapQuery.data
  const narrative =
    i18n.resolvedLanguage !== 'hu' && recap?.narrativeEn ? recap.narrativeEn : recap?.narrative
  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(i18n.resolvedLanguage === 'hu' ? 'hu-HU' : 'en-GB', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso))

  return (
    <Card>
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <CalendarCheck className="h-4 w-4 mt-0.5 text-[#F28C28] shrink-0" aria-hidden />
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A1A]">{t('dashboard.recap.title')}</h3>
              <p className="text-xs text-[#6b7280]">{t('dashboard.recap.subtitle')}</p>
            </div>
          </div>
          {recap && (
            <button
              type="button"
              onClick={() => void recapQuery.refetch()}
              disabled={recapQuery.isFetching}
              aria-label={t('dashboard.recap.refresh')}
              className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#1A1A1A] hover:bg-gray-100 disabled:opacity-40"
            >
              <RefreshCw className={`h-4 w-4 ${recapQuery.isFetching ? 'animate-spin' : ''}`} aria-hidden />
            </button>
          )}
        </div>

        {!recap && !recapQuery.isFetching && (
          <Button size="sm" variant="outline" onClick={() => void recapQuery.refetch()}>
            {t('dashboard.recap.cta')}
          </Button>
        )}

        {recapQuery.isFetching && !recap && (
          <div className="flex items-center gap-2 text-sm text-[#6b7280]">
            <Spinner className="h-4 w-4" /> {t('dashboard.recap.loading')}
          </div>
        )}

        {recapQuery.isError && !recap && (
          <p className="text-sm text-red-600" role="alert">
            {t(`dashboard.recap.errors.${aiErrorKind(recapQuery.error)}`)}
          </p>
        )}

        {recap && (
          <div className="space-y-3">
            <p className="text-sm text-[#1A1A1A] leading-relaxed">{narrative}</p>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <Metric label={t('dashboard.recap.metrics.meals')} value={`${recap.headlineMetrics.mealsCompleted}/${recap.headlineMetrics.mealsPlanned}`} />
              <Metric label={t('dashboard.recap.metrics.recipesTried')} value={String(recap.headlineMetrics.recipesTried)} />
              <Metric label={t('dashboard.recap.metrics.kcalDeviation')} value={`${recap.headlineMetrics.avgKcalDeviation > 0 ? '+' : ''}${recap.headlineMetrics.avgKcalDeviation} kcal`} />
              <Metric label={t('dashboard.recap.metrics.points')} value={String(recap.headlineMetrics.pointsEarned)} />
            </dl>
            <p className="text-[11px] text-[#9ca3af]">{t('dashboard.recap.generatedAt', { time: formatDate(recap.generatedAt) })}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#f9f7f2] px-3 py-2">
      <dt className="text-[#6b7280]">{label}</dt>
      <dd className="text-sm font-semibold text-[#1A1A1A] mt-0.5">{value}</dd>
    </div>
  )
}
