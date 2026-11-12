/**
 * "Edzés hozzáadása" (founder, 2026-11-12): any activity type on a day from
 * today, minutes and intensity, and for Card and Flow types optionally the
 * exercises picked by hand → `POST /api/move/sessions`. Without picks the
 * planner fills the session as it would. Past activity stays with "Mást mozogtam".
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { useMoveT } from '../lib/register'
import { todayIso } from '../lib/dates'
import { ExercisePicker, type PickedExercise } from './ExercisePicker'
import type { Intensity, ModalityDto } from '../types'

const MINUTES = [15, 20, 30, 45, 60, 90]
const INTENSITIES: Intensity[] = ['EASY', 'MODERATE', 'HARD']

interface AddSessionDialogProps {
  /** ISO date the dialog opens on; null closes it. */
  date: string | null
  modalities: ModalityDto[]
  onClose: () => void
}

export function AddSessionDialog({ date, modalities, onClose }: AddSessionDialogProps) {
  const { t } = useMoveT()
  return (
    <Dialog open={!!date} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="move-block max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('addSession.title')}</DialogTitle>
          <DialogDescription>{t('addSession.hint')}</DialogDescription>
        </DialogHeader>
        {date && <AddSessionForm key={date} initialDate={date} modalities={modalities} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function AddSessionForm({ initialDate, modalities, onClose }: { initialDate: string; modalities: ModalityDto[]; onClose: () => void }) {
  const { t } = useMoveT()
  const qc = useQueryClient()
  const [date, setDate] = useState(initialDate)
  const [modalityCode, setModalityCode] = useState('')
  const [minutes, setMinutes] = useState(30)
  const [intensity, setIntensity] = useState<Intensity>('MODERATE')
  const [own, setOwn] = useState(false)
  const [picks, setPicks] = useState<PickedExercise[]>([])
  const modality = modalities.find((m) => m.code === modalityCode)
  const pickable = modality?.format === 'CARD' || modality?.format === 'FLOW'

  const create = useMutation({
    mutationFn: () =>
      moveService.createSession({
        date,
        modalityCode,
        durationMin: minutes,
        intensity,
        exercises: own && pickable ? picks.map(({ exerciseId, sets, reps, seconds, weightKg }) => ({ exerciseId, sets, reps, seconds, weightKg })) : [],
      }),
    onSuccess: () => {
      toast({ title: t('addSession.saved'), variant: 'success' })
      void qc.invalidateQueries({ queryKey: moveKeys.all })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  const chip = (on: boolean) =>
    cn(
      'min-h-11 px-3 rounded-[12px] border text-sm font-medium transition-colors',
      on ? 'border-[#2A9D8F] bg-[#2A9D8F] text-white' : 'border-[#e5e4e7] bg-white text-[#1A1A1A] hover:bg-[#2A9D8F]/10',
    )
  const valid = !!modalityCode && date >= todayIso() && (!own || !pickable || picks.length > 0)

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid) create.mutate()
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="add-session-date">{t('addSession.date')}</Label>
          <Input id="add-session-date" type="date" min={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} className="h-12" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="add-session-modality">{t('addSession.modality')}</Label>
          <Select
            id="add-session-modality"
            className="h-12"
            value={modalityCode}
            onChange={(e) => {
              setModalityCode(e.target.value)
              setPicks([])
            }}
          >
            <option value="">{t('addSession.choose')}</option>
            {modalities.map((m) => (
              <option key={m.code} value={m.code}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-[#1A1A1A]">{t('addSession.minutes')}</legend>
        <div className="flex flex-wrap gap-2">
          {MINUTES.map((m) => (
            <button key={m} type="button" aria-pressed={minutes === m} className={chip(minutes === m)} onClick={() => setMinutes(m)}>
              {t('common.minutes', { count: m })}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-[#1A1A1A]">{t('addSession.intensity')}</legend>
        <div className="flex flex-wrap gap-2">
          {INTENSITIES.map((i) => (
            <button key={i} type="button" aria-pressed={intensity === i} className={chip(intensity === i)} onClick={() => setIntensity(i)}>
              {t(`week.intensity.${i === 'EASY' ? 'easy' : i === 'MODERATE' ? 'moderate' : 'hard'}`)}
            </button>
          ))}
        </div>
      </fieldset>

      {pickable && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-[#1A1A1A]">{t('addSession.exercises')}</legend>
          <div className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={!own} className={chip(!own)} onClick={() => setOwn(false)}>
              {t('addSession.plannerPicks')}
            </button>
            <button type="button" aria-pressed={own} className={chip(own)} onClick={() => setOwn(true)}>
              {t('addSession.ownPicks')}
            </button>
          </div>
          {own && modality && <ExercisePicker modalityCode={modality.code} format={modality.format as 'CARD' | 'FLOW'} value={picks} onChange={setPicks} />}
        </fieldset>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="lg" className="bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F]" disabled={!valid || create.isPending}>
          {t('addSession.submit')}
        </Button>
        <Button type="button" size="lg" variant="ghost" onClick={onClose}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  )
}
