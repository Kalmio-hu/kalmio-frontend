/**
 * "Elestem" (PRD §7.8): two questions — hurt? doctor seen? — then
 * `POST /api/move/fall`. The backend drops one level and asks for the health
 * questions again; a fall with injury pauses the plan until medical advice.
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { useMoveT } from '../lib/register'
import type { FallReportResponse } from '../types'

interface FallDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after the report; the page opens the health questions. */
  onReported: (res: FallReportResponse) => void
}

export function FallDialog({ open, onOpenChange, onReported }: FallDialogProps) {
  const { t } = useMoveT()
  const qc = useQueryClient()
  const [hurt, setHurt] = useState<boolean | null>(null)
  const [doctorSeen, setDoctorSeen] = useState<boolean | null>(null)
  const [result, setResult] = useState<FallReportResponse | null>(null)

  const report = useMutation({
    mutationFn: () => moveService.reportFall({ hurt: hurt === true, doctorSeen: doctorSeen === true }),
    onSuccess: (res) => {
      setResult(res)
      void qc.invalidateQueries({ queryKey: moveKeys.all })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  const reset = () => {
    setHurt(null)
    setDoctorSeen(null)
    setResult(null)
  }

  const chip = (selected: boolean) =>
    cn(
      'min-h-12 min-w-[5.5rem] px-4 rounded-[12px] border text-base font-medium transition-colors',
      selected ? 'border-[#2A9D8F] bg-[#2A9D8F] text-white' : 'border-[#e5e4e7] bg-white text-[#1A1A1A] hover:bg-[#2A9D8F]/10',
    )

  const yesNo = (label: string, value: boolean | null, onPick: (v: boolean) => void) => (
    <fieldset className="space-y-2">
      <legend className="text-base text-[#1A1A1A] move-body">{label}</legend>
      <div className="flex gap-2" role="radiogroup" aria-label={label}>
        <button type="button" role="radio" aria-checked={value === true} className={chip(value === true)} onClick={() => onPick(true)}>
          {t('fall.yes')}
        </button>
        <button type="button" role="radio" aria-checked={value === false} className={chip(value === false)} onClick={() => onPick(false)}>
          {t('fall.no')}
        </button>
      </div>
    </fieldset>
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className="move-block">
        <DialogHeader>
          <DialogTitle>{t('fall.title')}</DialogTitle>
          <DialogDescription>{t('fall.intro')}</DialogDescription>
        </DialogHeader>
        {!result ? (
          <div className="space-y-5">
            {yesNo(t('fall.hurt'), hurt, setHurt)}
            {yesNo(t('fall.doctor'), doctorSeen, setDoctorSeen)}
            <div className="flex gap-2 pt-2">
              <Button
                className="bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F]"
                disabled={hurt === null || doctorSeen === null || report.isPending}
                onClick={() => report.mutate()}
              >
                {t('fall.send')}
              </Button>
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={report.isPending}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4" aria-live="polite">
            <p className="text-base text-[#1A1A1A] move-body">{t('fall.done')}</p>
            {result.paused && <p className="text-base text-gray-700">{t('fall.paused')}</p>}
            <Button
              className="bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F]"
              onClick={() => {
                const res = result
                reset()
                onOpenChange(false)
                onReported(res)
              }}
            >
              {t('fall.rescreenCta')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
