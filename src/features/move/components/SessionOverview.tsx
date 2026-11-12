/**
 * One session at a glance (founder, 2026-11-12): what to expect, its exercises
 * (`GET …/sessions/{id}/exercises`), and what can be done with it — start,
 * pick the exercises by hand (`PUT …/exercises`), hand them back to the
 * planner, remove a session added by hand, or correct the log once done.
 */
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { useMoveT } from '../lib/register'
import { ModalityPicture, pictureKeyFor } from '../lib/modalityPictures'
import { dayMonthLabel, weekdayLabel } from '../lib/dates'
import { intensityKey } from '../lib/weekView'
import { ExercisePicker, type PickedExercise } from './ExercisePicker'
import { SessionLogEditor } from './SessionLogEditor'
import type { SessionDto, SessionExerciseDto } from '../types'

const LENGTHS = [15, 20, 30, 45, 60, 90]

interface SessionOverviewProps {
  session: SessionDto
  onStart: () => void
  onActions: () => void
  onClose: () => void
}

export function SessionOverview({ session, onStart, onActions, onClose }: SessionOverviewProps) {
  const { t, i18n } = useMoveT()
  const qc = useQueryClient()
  const [editing, setEditing] = useState<PickedExercise[] | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const exercises = useQuery({ queryKey: moveKeys.sessionExercises(session.id), queryFn: () => moveService.getSessionExercises(session.id) })
  const planned = session.status === 'PLANNED'
  const done = session.status === 'DONE' || session.status === 'PLAN_B' || session.status === 'ADDED'
  const pickable = planned && (session.format === 'CARD' || session.format === 'FLOW')
  const main = (exercises.data ?? []).filter((e) => e.block === 'MAIN')

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: moveKeys.all })
    void qc.invalidateQueries({ queryKey: ['dashboard'] })
  }
  const save = useMutation({
    mutationFn: (picks: PickedExercise[]) =>
      moveService.setSessionExercises(session.id, picks.map(({ exerciseId, sets, reps, seconds, weightKg }) => ({ exerciseId, sets, reps, seconds, weightKg }))),
    onSuccess: (next) => {
      qc.setQueryData(moveKeys.sessionExercises(session.id), next)
      setEditing(null)
      toast({ title: t('overview.saved'), variant: 'success' })
      invalidate()
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })
  const [minutes, setMinutes] = useState(session.durationMin)
  const resize = useMutation({
    mutationFn: (durationMin: number) => moveService.updateSession(session.id, { durationMin }),
    onSuccess: (next) => {
      setMinutes(next.durationMin)
      void qc.invalidateQueries({ queryKey: moveKeys.sessionExercises(session.id) })
      invalidate()
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })
  const remove = useMutation({
    mutationFn: () => moveService.deleteSession(session.id),
    onSuccess: () => {
      toast({ title: t('overview.deleted'), variant: 'success' })
      invalidate()
      onClose()
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  const line = (e: SessionExerciseDto) =>
    [
      e.sets && e.reps ? `${e.sets} × ${e.reps}` : e.reps ? t('overview.reps', { count: e.reps }) : null,
      e.weightKg ? `${e.weightKg} kg` : null,
      e.seconds ? t('overview.seconds', { count: e.seconds }) : null,
    ]
      .filter(Boolean)
      .join(' · ')

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <ModalityPicture pictureKey={pictureKeyFor({ code: session.modalityCode })} className="h-12 w-12 shrink-0 text-[#2A9D8F]" />
          <div className="min-w-0">
            <DialogTitle className="break-words">{session.modalityName}</DialogTitle>
            <DialogDescription className="first-letter:uppercase">
              {[
                `${weekdayLabel(session.date, i18n.language, 'long')} ${dayMonthLabel(session.date, i18n.language)}`,
                t('common.minutes', { count: minutes }),
                t(`week.intensity.${intensityKey(session.intensity)}`),
                ...(session.status !== 'PLANNED' ? [t(`week.status.${session.status}`)] : []),
              ].join(' · ')}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <div className="space-y-4">
        {session.expectLine && <p className="text-base text-[#1A1A1A]">{session.expectLine}</p>}

        {planned && !editing && (
          <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label={t('overview.length')}>
            <span className="text-sm text-gray-600 mr-1">{t('overview.length')}</span>
            {Array.from(new Set([...LENGTHS, minutes])).sort((a, b) => a - b).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={m === minutes}
                disabled={resize.isPending}
                onClick={() => m !== minutes && resize.mutate(m)}
                className={m === minutes
                  ? 'min-h-10 px-3 rounded-full text-sm font-semibold text-white bg-[#2A9D8F]'
                  : 'min-h-10 px-3 rounded-full text-sm font-medium border border-[#e5e4e7] bg-white text-[#1A1A1A] hover:bg-[#F9F7F2]'}
              >
                {t('common.minutes', { count: m })}
              </button>
            ))}
          </div>
        )}

        {editing ? (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-[#1A1A1A]">{t('overview.editTitle')}</h3>
            <ExercisePicker modalityCode={session.modalityCode} format={session.format as 'CARD' | 'FLOW'} value={editing} onChange={setEditing} />
            <div className="flex flex-wrap gap-2">
              <Button className="min-h-12 bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F]" disabled={editing.length === 0 || save.isPending} onClick={() => save.mutate(editing)}>
                {t('common.save')}
              </Button>
              <Button variant="ghost" className="min-h-12" onClick={() => setEditing(null)}>
                {t('common.cancel')}
              </Button>
            </div>
          </section>
        ) : exercises.isPending ? (
          <p className="text-sm text-gray-500">{t('common.loading')}</p>
        ) : (exercises.data ?? []).length > 0 ? (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-[#1A1A1A]">{t('week.overviewExercises')}</h3>
            <ol className="space-y-1.5">
              {(exercises.data ?? []).map((e, i) => (
                <li
                  key={`${e.exerciseId}-${i}`}
                  className={e.block === 'MAIN' ? 'rounded-[12px] border border-[#e5e4e7] px-3 py-2' : 'px-3 text-sm text-gray-600'}
                >
                  <span className={e.block === 'MAIN' ? 'font-medium text-[#1A1A1A]' : ''}>{e.name}</span>
                  {line(e) && <span className="text-gray-600"> · {line(e)}</span>}
                  {e.block !== 'MAIN' && <span className="text-xs text-gray-400"> · {t(`overview.block.${e.block}`)}</span>}
                </li>
              ))}
            </ol>
            {session.customExercises && <p className="text-xs text-gray-500">{t('overview.custom')}</p>}
          </section>
        ) : session.format === 'ENTRY' ? null : (
          <p className="text-sm text-gray-600">{t('week.overviewNoExercises')}</p>
        )}

        {done && (
          <div className="border-t border-[#e5e4e7] pt-3">
            <SessionLogEditor sessionId={session.id} onDone={onClose} />
          </div>
        )}

        {!editing && (
          <div className="flex flex-col gap-2">
            {planned && (
              <Button size="lg" className="w-full bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F]" onClick={onStart}>
                {t('week.start')}
              </Button>
            )}
            {pickable && (
              <Button size="lg" variant="secondary" className="w-full" onClick={() => setEditing(main.map((e) => ({ exerciseId: e.exerciseId, name: e.name, sets: e.sets, reps: e.reps, weightKg: e.weightKg, seconds: e.seconds })))}>
                {t('overview.edit')}
              </Button>
            )}
            {pickable && session.customExercises && (
              <Button size="lg" variant="ghost" className="w-full" disabled={save.isPending} onClick={() => save.mutate([])}>
                {t('overview.reset')}
              </Button>
            )}
            <Button size="lg" variant="secondary" className="w-full" onClick={onActions}>
              {t('week.actions')}
            </Button>
            {planned && session.userAdded &&
              (!confirmDelete ? (
                <Button size="lg" variant="ghost" className="w-full" onClick={() => setConfirmDelete(true)}>
                  {t('overview.delete')}
                </Button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-700">{t('overview.deleteConfirm')}</span>
                  <Button variant="secondary" className="min-h-12" disabled={remove.isPending} onClick={() => remove.mutate()}>
                    {t('overview.deleteYes')}
                  </Button>
                  <Button variant="ghost" className="min-h-12" onClick={() => setConfirmDelete(false)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              ))}
          </div>
        )}
      </div>
    </>
  )
}
