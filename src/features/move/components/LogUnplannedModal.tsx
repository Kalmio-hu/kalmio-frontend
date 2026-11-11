/**
 * "Mást mozogtam" — log an unplanned activity (PRD §7.4): modality from
 * GET /api/move/modalities, minutes, effort tap, date (defaults to today)
 * → POST /api/move/log. The line under the form says what the planner does
 * with it: it counts toward the week and never raises the following days.
 *
 * Opened from the Today page (C1) and the week view; the modal owns its form
 * state and resets it on close.
 */
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { useMoveT } from '../lib/register'
import { EffortScale } from './EffortScale'

interface LogUnplannedModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** ISO date the form starts with; today when omitted. */
  defaultDate?: string
  onLogged?: () => void
}

function todayIso(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const ACCENT_BUTTON = 'bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F]'

export function LogUnplannedModal({ open, onOpenChange, defaultDate, onLogged }: LogUnplannedModalProps) {
  const { t } = useMoveT()
  const qc = useQueryClient()
  const [pickedModality, setPickedModality] = useState('')
  const [minutes, setMinutes] = useState('30')
  const [effort, setEffort] = useState<number | null>(null)
  const [pickedDate, setPickedDate] = useState<string | null>(null)

  const modalities = useQuery({
    queryKey: moveKeys.modalities,
    queryFn: moveService.getModalities,
    staleTime: 10 * 60_000,
    enabled: open,
  })

  const options = useMemo(() => modalities.data ?? [], [modalities.data])
  // Derived, so no effect has to set state: first modality and today's date are the defaults.
  const modalityCode = pickedModality || options[0]?.code || ''
  const date = pickedDate ?? defaultDate ?? todayIso()

  const reset = () => {
    setMinutes('30')
    setEffort(null)
    setPickedModality('')
    setPickedDate(null)
  }

  const log = useMutation({
    mutationFn: () =>
      moveService.logUnplanned({
        modalityCode,
        minutes: Number(minutes),
        effort: effort ?? 0,
        date,
      }),
    onSuccess: () => {
      toast({ title: t('log.saved'), description: t('log.noRaiseLine'), variant: 'success' })
      void qc.invalidateQueries({ queryKey: moveKeys.all })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      reset()
      onOpenChange(false)
      onLogged?.()
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  const minutesNum = Number(minutes)
  const valid = !!modalityCode && Number.isFinite(minutesNum) && minutesNum > 0 && minutesNum <= 600 && effort !== null && !!date

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="move-block" data-space="move">
        <DialogHeader>
          <DialogTitle>{t('log.title')}</DialogTitle>
          <DialogDescription>{t('log.subtitle')}</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault()
            if (valid && !log.isPending) log.mutate()
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="move-log-modality">{t('log.modality')}</Label>
            {modalities.isPending ? (
              <div className="flex items-center gap-2 text-sm text-gray-600" role="status">
                <Spinner className="border-[#2A9D8F] h-4 w-4" />
                {t('log.loadingModalities')}
              </div>
            ) : (
              <Select
                id="move-log-modality"
                value={modalityCode}
                onChange={(e) => setPickedModality(e.target.value)}
                className="min-h-12"
              >
                {options.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.name}
                  </option>
                ))}
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="move-log-minutes">{t('log.minutes')}</Label>
              <Input
                id="move-log-minutes"
                type="number"
                inputMode="numeric"
                min={1}
                max={600}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="min-h-12 text-base"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="move-log-date">{t('log.date')}</Label>
              <Input
                id="move-log-date"
                type="date"
                max={todayIso()}
                value={date}
                onChange={(e) => setPickedDate(e.target.value)}
                className="min-h-12 text-base"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium text-[#1A1A1A]">{t('log.effort')}</p>
            <EffortScale value={effort} onChange={setEffort} disabled={log.isPending} />
          </div>

          <p className="text-sm text-gray-600">{t('log.noRaiseLine')}</p>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={log.isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" className={ACCENT_BUTTON} disabled={!valid || log.isPending}>
              {t('log.submit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
