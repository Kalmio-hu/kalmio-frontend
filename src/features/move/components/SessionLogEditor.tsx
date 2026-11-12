/**
 * Correcting a logged session (founder, 2026-11-12): effort, minutes and the
 * set log (reps × kg) of a completed session → `PATCH …/sessions/{id}/log`;
 * "Mégsem volt meg" → `DELETE …/sessions/{id}/log` opens the session again.
 * The backend replays the strength progression from the stored "before" when
 * no later session built on it, so a typo never moves the load twice.
 */
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toast'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { useMoveT } from '../lib/register'
import { EffortScale } from './EffortScale'
import type { SessionLogDto, SetLogDto } from '../types'

interface SessionLogEditorProps {
  sessionId: string
  /** Called after a save or an undo, e.g. to close the surrounding dialog. */
  onDone?: () => void
}

export function SessionLogEditor({ sessionId, onDone }: SessionLogEditorProps) {
  const { t } = useMoveT()
  const q = useQuery({ queryKey: moveKeys.sessionLog(sessionId), queryFn: () => moveService.getSessionLog(sessionId) })
  if (q.isPending) return <p className="text-sm text-gray-500">{t('common.loading')}</p>
  if (q.isError || !q.data) return null
  // keyed by the last edit so a saved correction re-seeds the form
  return <LogForm key={q.data.editedAt ?? q.data.completedAt} log={q.data} onDone={onDone} />
}

function LogForm({ log, onDone }: { log: SessionLogDto; onDone?: () => void }) {
  const { t } = useMoveT()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [confirmUndo, setConfirmUndo] = useState(false)
  const [effort, setEffort] = useState<number | null>(log.effort)
  const [minutes, setMinutes] = useState(String(log.durationMin))
  const [sets, setSets] = useState(() => log.setLogs.map((s) => ({ ...s, reps: s.reps ?? null, weightKg: s.weightKg ?? null })))

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: moveKeys.all })
    void qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const save = useMutation({
    mutationFn: () =>
      moveService.updateSessionLog(log.sessionId, {
        ...(effort !== null && effort !== log.effort ? { effort } : {}),
        ...(Number(minutes) !== log.durationMin ? { durationMin: Number(minutes) } : {}),
        ...(sets.length > 0
          ? { setLogs: sets.map<SetLogDto>(({ exerciseId, setIndex, reps, weightKg, seconds }) => ({ exerciseId, setIndex, reps, weightKg, seconds })) }
          : {}),
      }),
    onSuccess: () => {
      toast({ title: t('logEdit.saved'), variant: 'success' })
      setEditing(false)
      invalidate()
      onDone?.()
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  const undo = useMutation({
    mutationFn: () => moveService.undoSessionLog(log.sessionId),
    onSuccess: () => {
      toast({ title: t('logEdit.undone'), variant: 'success' })
      invalidate()
      onDone?.()
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  const minutesValid = Number.isInteger(Number(minutes)) && Number(minutes) > 0 && Number(minutes) <= 600
  const setRow = (i: number, patch: Partial<(typeof sets)[number]>) => setSets((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)))
  const num = (v: string) => (v === '' ? null : Number(v))

  if (!editing) {
    return (
      <section className="space-y-2" aria-labelledby={`log-${log.sessionId}`}>
        <h3 id={`log-${log.sessionId}`} className="text-sm font-semibold text-[#1A1A1A]">
          {t('logEdit.title')}
        </h3>
        <p className="text-sm text-gray-700">
          {[
            t('common.minutes', { count: log.durationMin }),
            log.effort !== null ? t('logEdit.effortValue', { effort: log.effort }) : null,
            log.editedAt ? t('logEdit.edited') : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        {log.setLogs.length > 0 && (
          <ul className="text-sm text-gray-700 space-y-0.5">
            {log.setLogs.map((s, i) => (
              <li key={`${s.exerciseId}-${s.setIndex}-${i}`}>
                {s.exerciseName ?? '—'} · {t('logEdit.setLine', { set: s.setIndex + 1, reps: s.reps ?? '–', kg: s.weightKg ?? '–' })}
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="secondary" className="min-h-12" onClick={() => setEditing(true)}>
            {t('logEdit.edit')}
          </Button>
          {!confirmUndo ? (
            <Button variant="ghost" className="min-h-12" onClick={() => setConfirmUndo(true)}>
              {t('logEdit.undo')}
            </Button>
          ) : (
            <span className="inline-flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-700">{t('logEdit.undoConfirm')}</span>
              <Button variant="secondary" className="min-h-12" disabled={undo.isPending} onClick={() => undo.mutate()}>
                {t('logEdit.undoYes')}
              </Button>
              <Button variant="ghost" className="min-h-12" onClick={() => setConfirmUndo(false)}>
                {t('common.cancel')}
              </Button>
            </span>
          )}
        </div>
      </section>
    )
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (minutesValid) save.mutate()
      }}
    >
      <h3 className="text-sm font-semibold text-[#1A1A1A]">{t('logEdit.editTitle')}</h3>
      <div className="space-y-1">
        <Label htmlFor={`log-min-${log.sessionId}`}>{t('logEdit.minutes')}</Label>
        <Input id={`log-min-${log.sessionId}`} type="number" inputMode="numeric" min={1} max={600} value={minutes} onChange={(e) => setMinutes(e.target.value)} className="h-12 w-28" />
      </div>
      <div className="space-y-1">
        <span className="text-sm font-medium text-[#1A1A1A]">{t('logEdit.effort')}</span>
        <EffortScale value={effort} onChange={setEffort} />
      </div>
      {sets.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-[#1A1A1A]">{t('logEdit.sets')}</legend>
          {sets.map((s, i) => (
            <div key={`${s.exerciseId}-${s.setIndex}-${i}`} className="flex flex-wrap items-end gap-2">
              <span className="min-w-0 flex-1 text-sm text-gray-700">
                {s.exerciseName ?? '—'} · {t('logEdit.setNo', { set: s.setIndex + 1 })}
              </span>
              <label className="text-xs text-gray-600 space-y-0.5">
                <span className="block">{t('logEdit.reps')}</span>
                <Input type="number" inputMode="numeric" min={0} value={s.reps ?? ''} onChange={(e) => setRow(i, { reps: num(e.target.value) })} className="h-12 w-20" />
              </label>
              <label className="text-xs text-gray-600 space-y-0.5">
                <span className="block">{t('logEdit.kg')}</span>
                <Input type="number" inputMode="decimal" min={0} step={0.5} value={s.weightKg ?? ''} onChange={(e) => setRow(i, { weightKg: num(e.target.value) })} className="h-12 w-24" />
              </label>
            </div>
          ))}
        </fieldset>
      )}
      <div className="flex gap-2">
        <Button type="submit" className="min-h-12 bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F]" disabled={!minutesValid || save.isPending}>
          {t('common.save')}
        </Button>
        <Button type="button" variant="ghost" className="min-h-12" onClick={() => setEditing(false)}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  )
}
