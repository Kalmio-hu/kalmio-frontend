/**
 * Printable weekly sheet (PRD §7.8): GET /api/move/sheet?start=&forUserId= →
 * one A4 page (print CSS in move.css, `@page A4`, 18 px minimum), the session
 * pictogram per day, tick boxes, large type and the stop rule at the bottom.
 * `?for=` lets a consented helper print it for the person they help.
 */
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MovePageFrame } from '../components/MovePageFrame'
import { PersonPictogram } from '../components/player/Figures'
import { MoveWordmark } from '../components/MoveWordmark'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { useMoveT } from '../lib/register'

export function MoveSheet() {
  const [params] = useSearchParams()
  const start = params.get('start') ?? undefined
  const forUserId = params.get('for') ?? undefined
  const q = useQuery({
    queryKey: [...moveKeys.sheet(start), forUserId ?? 'me'],
    queryFn: () => moveService.getSheet({ start, forUserId }),
    staleTime: 60_000,
  })
  const { t } = useMoveT(q.data?.register ?? null)
  const empty = !!q.data && q.data.days.every((d) => d.restDay && d.exercises.length === 0 && !d.title)

  return (
    <MovePageFrame
      title={q.data?.name ? t('sheet.forLabel', { name: q.data.name }) : t('sheet.title')}
      subtitle={t('sheet.subtitle')}
      actions={
        <Button variant="secondary" onClick={() => window.print()} className="move-no-print">
          <Printer className="h-4 w-4" aria-hidden />
          {t('sheet.print')}
        </Button>
      }
      isLoading={q.isPending}
      isError={q.isError}
      onRetry={() => void q.refetch()}
      isEmpty={empty}
      emptyText={t('sheet.empty')}
    >
      {q.data && (
        <section className="move-sheet move-print-card bg-white rounded-[16px] border border-[#e5e4e7] p-5 space-y-4" aria-label={t('sheet.title')}>
          <header className="flex items-baseline justify-between gap-3 border-b-2 border-[#1A1A1A] pb-2">
            <div>
              <MoveWordmark />
              <p className="text-lg font-headline font-bold text-[#1A1A1A] mt-1">
                {q.data.name ? t('sheet.forLabel', { name: q.data.name }) : t('sheet.title')}
              </p>
            </div>
            <p className="text-lg text-[#1A1A1A]">{t('sheet.weekOf', { start: q.data.weekStart })}</p>
          </header>

          <ol className="move-sheet-days">
            {q.data.days.map((d) => (
              <li key={d.date} className="move-sheet-day">
                <div className="flex items-center justify-between gap-2 border-b border-[#e5e4e7] pb-1">
                  <span className="font-headline font-bold text-[#1A1A1A]">{d.label}</span>
                  <span className="text-gray-600 tabular-nums">{d.date.slice(5)}</span>
                </div>
                {d.restDay && !d.title ? (
                  <p className="text-gray-600 mt-2">{t('sheet.restDay')}</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-3">
                      {d.pictogramUrl ? (
                        <img src={d.pictogramUrl} alt="" className="h-12 w-12 object-contain shrink-0" />
                      ) : (
                        <PersonPictogram className="h-12 w-12 shrink-0" />
                      )}
                      <span className="flex-1 font-semibold text-[#1A1A1A]">
                        {d.title}
                        {d.durationMin ? ` · ${t('common.minutes', { count: d.durationMin })}` : ''}
                      </span>
                      <span className="move-sheet-tick" aria-label={t('sheet.tick')} role="img" />
                    </div>
                    {d.exercises.length > 0 ? (
                      <ul className="space-y-1">
                        {d.exercises.map((e, i) => (
                          <li key={`${e.name}-${i}`} className="flex items-start gap-2 text-[#1A1A1A]">
                            {e.pictogramUrl && <img src={e.pictogramUrl} alt="" className="h-8 w-8 object-contain shrink-0" />}
                            <span className="flex-1">
                              <span className="font-medium">{e.name}</span>
                              {e.reps ? <span className="text-gray-700"> · {e.reps}</span> : null}
                              {e.cue ? <span className="block text-gray-700">{e.cue}</span> : null}
                            </span>
                            <span className="move-sheet-tick move-sheet-tick-sm" aria-hidden />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-600">{t('sheet.noExercises')}</p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>

          <footer className="border-t-2 border-[#1A1A1A] pt-3 space-y-1">
            <p className="text-[#1A1A1A] font-semibold">{q.data.stopRule}</p>
            <p className="text-gray-600">{t('sheet.footer')}</p>
          </footer>
        </section>
      )}
    </MovePageFrame>
  )
}
