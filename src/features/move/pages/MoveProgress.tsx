/**
 * "Haladás" (PRD §11): "aktív hetek az elmúlt 12-ből" as the one headline
 * figure, the 12-week strip with text labels, self-test history, current
 * levels in capability wording, and the load chart only when the DTO says so.
 * No streaks, no points, no badges, no comparison with others.
 */
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MovePageFrame } from '../components/MovePageFrame'
import { SelfTestHistory } from '../components/SelfTestHistory'
import { LoadChart } from '../components/LoadChart'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { useMoveT } from '../lib/register'
import { activeWeeksOf12, twelveWeekStrip, type WeekMark } from '../lib/progressMath'
import { dayMonthLabel, todayIso } from '../lib/dates'

const MARK_CLASS: Record<WeekMark, string> = {
  ACTIVE: 'bg-[#2A9D8F] text-white',
  RESERVE: 'bg-[#2A9D8F]/35 text-[#1A1A1A] border border-[#2A9D8F]',
  INACTIVE: 'bg-[#F0EEE8] text-gray-500 border border-[#e5e4e7]',
  FUTURE: 'bg-white text-gray-400 border border-dashed border-[#e5e4e7]',
}
const MARK_GLYPH: Record<WeekMark, string> = { ACTIVE: '●', RESERVE: '◐', INACTIVE: '○', FUTURE: '·' }

export function MoveProgress() {
  const { t, i18n } = useMoveT()
  const q = useQuery({ queryKey: moveKeys.progress, queryFn: moveService.getProgress, staleTime: 60_000 })
  const p = q.data
  const empty = !!p && p.weeks.length === 0 && p.selfTests.length === 0

  const headline = p ? activeWeeksOf12(p.weeks, p.activeWeeksOf12) : 0
  const strip = p ? twelveWeekStrip(p.weeks, todayIso()) : []
  const levels = p
    ? ([
        p.levels.supported && t(`progress.levels.supported.${p.levels.supported}`),
        p.levels.endurance && t(`progress.levels.endurance.${p.levels.endurance}`),
        p.levels.strength && t(`progress.levels.strength.${p.levels.strength}`),
      ].filter(Boolean) as string[])
    : []

  return (
    <MovePageFrame
      title={t('progress.title')}
      subtitle={t('progress.subtitle')}
      isLoading={q.isPending}
      isError={q.isError}
      onRetry={() => void q.refetch()}
      isEmpty={empty}
      emptyText={t('progress.empty')}
    >
      {p && (
        <div className="flex flex-col gap-4">
          <section className="move-block bg-white rounded-[16px] border border-[#e5e4e7] shadow-sm p-5 space-y-4" aria-labelledby="move-progress-headline">
            <p id="move-progress-headline" className="font-headline text-2xl font-bold text-[#1A1A1A]">
              {t('progress.activeWeeks', { count: headline })}
            </p>
            <div>
              <h2 className="text-sm font-semibold text-gray-500 mb-2">{t('progress.strip.title')}</h2>
              <ol className="grid grid-cols-6 sm:grid-cols-12 gap-1.5" aria-label={t('progress.strip.title')}>
                {strip.map((c) => (
                  <li
                    key={c.weekStart}
                    className={cn('rounded-[8px] min-h-12 flex flex-col items-center justify-center text-[11px] leading-tight px-0.5', MARK_CLASS[c.mark])}
                    aria-label={t('progress.strip.cell', { date: dayMonthLabel(c.weekStart, i18n.language), mark: t(`progress.strip.${c.mark}`), done: c.done, planned: c.planned })}
                    title={`${dayMonthLabel(c.weekStart, i18n.language)} · ${t(`progress.strip.${c.mark}`)}`}
                  >
                    <span aria-hidden>{MARK_GLYPH[c.mark]}</span>
                    <span aria-hidden className="truncate max-w-full">
                      {t(`progress.strip.${c.mark}`).split(' ')[0]}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-2 text-xs text-gray-500">{t('progress.strip.legend')}</p>
            </div>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>{t('progress.goals.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-base text-[#1A1A1A] move-body">{p.goals?.kind === 'OWN_HISTORY' ? t('progress.goals.own') : t('progress.goals.open')}</p>
              {p.goals?.lines?.map((line, i) => (
                <p key={i} className="text-sm text-gray-700">
                  {line}
                </p>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('progress.levels.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {levels.length === 0 ? (
                <p className="text-sm text-gray-500">{t('progress.levels.none')}</p>
              ) : (
                <ul className="space-y-1">
                  {levels.map((line) => (
                    <li key={line} className="text-base text-[#1A1A1A] move-body">
                      {line}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('progress.selfTests.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <SelfTestHistory tests={p.selfTests} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('progress.load.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {p.loadChartAvailable && p.loadChart && p.loadChart.length > 0 ? <LoadChart points={p.loadChart} /> : <p className="text-sm text-gray-500">{t('progress.load.locked')}</p>}
            </CardContent>
          </Card>
        </div>
      )}
    </MovePageFrame>
  )
}
