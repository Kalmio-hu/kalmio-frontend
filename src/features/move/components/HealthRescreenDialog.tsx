/**
 * Re-answer the health questions (after a fall, a sickness, or when they were
 * skipped at start) → `POST /api/move/screening`. Answers stay in memory until
 * the POST and are dropped with the dialog.
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { useMoveT } from '../lib/register'
import { allAnswered, HEALTH_QUESTION_COUNT } from '../lib/startFlow'
import { HealthQuestions } from './HealthQuestions'
import type { Register, ScreeningResultDto } from '../types'

interface HealthRescreenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  register?: Register | null
  description?: string
  onSaved?: (result: ScreeningResultDto) => void
}

export function HealthRescreenDialog({ open, onOpenChange, register, description, onSaved }: HealthRescreenDialogProps) {
  const { t } = useMoveT(register)
  const qc = useQueryClient()
  const [answers, setAnswers] = useState<(boolean | null)[]>(() => Array<boolean | null>(HEALTH_QUESTION_COUNT).fill(null))

  const save = useMutation({
    mutationFn: () => moveService.screening({ answers: answers as boolean[] }),
    onSuccess: (res) => {
      toast({ title: t('settings.health.saved'), variant: 'success' })
      void qc.invalidateQueries({ queryKey: moveKeys.all })
      setAnswers(Array<boolean | null>(HEALTH_QUESTION_COUNT).fill(null))
      onOpenChange(false)
      onSaved?.(res)
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setAnswers(Array<boolean | null>(HEALTH_QUESTION_COUNT).fill(null))
        onOpenChange(o)
      }}
    >
      <DialogContent className="move-block max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('start.steps.health')}</DialogTitle>
          <DialogDescription>{description ?? t('start.health.intro')}</DialogDescription>
        </DialogHeader>
        <HealthQuestions
          compact
          register={register}
          answers={answers}
          onAnswer={(i, v) =>
            setAnswers((prev) => {
              const next = prev.slice()
              next[i] = v
              return next
            })
          }
        />
        <div className="flex gap-2 pt-4">
          <Button
            className="bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F]"
            disabled={!allAnswered(answers) || save.isPending}
            onClick={() => save.mutate()}
          >
            {t('common.save')}
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            {t('common.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
