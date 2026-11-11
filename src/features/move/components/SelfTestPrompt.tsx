/**
 * 30-second chair stand (PRD §7.8): every four weeks, chair against a wall,
 * one number → `POST /api/move/self-test`. The only number shown as progress:
 * "Négy hete 8-szor állt fel, ma 11-szer."
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toast'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { useMoveT } from '../lib/register'
import { timesWord } from '../lib/progressMath'
import type { SelfTestDto } from '../types'

interface SelfTestPromptProps {
  due: boolean
  latest: SelfTestDto | null
  previous: SelfTestDto | null
}

const DISMISS_PREFIX = 'kalmio_move_selftest_later_'

export function SelfTestPrompt({ due, latest, previous }: SelfTestPromptProps) {
  const { t, i18n } = useMoveT()
  const qc = useQueryClient()
  const [value, setValue] = useState('')
  const [later, setLater] = useState(() => {
    try {
      return sessionStorage.getItem(`${DISMISS_PREFIX}${latest?.date ?? 'first'}`) === '1'
    } catch {
      return false
    }
  })

  const save = useMutation({
    mutationFn: (v: number) => moveService.addSelfTest({ kind: 'SIT_TO_STAND_30S', value: v }),
    onSuccess: () => {
      toast({ title: t('today.selfTest.saved'), variant: 'success' })
      setValue('')
      void qc.invalidateQueries({ queryKey: moveKeys.today })
      void qc.invalidateQueries({ queryKey: moveKeys.progress })
      void qc.invalidateQueries({ queryKey: moveKeys.selfTests })
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  const progressLine =
    latest && previous ? (
      <p className="text-base text-[#1A1A1A] move-body">
        {t('today.selfTest.progressLine', {
          weeks: Math.max(1, Math.round((Date.parse(latest.date) - Date.parse(previous.date)) / (7 * 86_400_000))),
          previous: timesWord(previous.value, i18n.language),
          latest: timesWord(latest.value, i18n.language),
        })}
      </p>
    ) : null

  if (!due || later) {
    return progressLine ? (
      <article className="move-block bg-white rounded-[16px] border border-[#e5e4e7] shadow-sm p-5 space-y-1">
        <h2 className="text-sm font-semibold text-gray-500">{t('today.selfTest.title')}</h2>
        {progressLine}
      </article>
    ) : null
  }

  const n = Number(value)
  const valid = value !== '' && Number.isInteger(n) && n >= 0 && n <= 60

  return (
    <article className="move-block bg-white rounded-[16px] border border-[#e5e4e7] shadow-sm p-5 space-y-3" aria-labelledby="move-selftest-title">
      <h2 id="move-selftest-title" className="font-headline text-lg font-bold text-[#1A1A1A]">
        {t('today.selfTest.title')}
      </h2>
      <p className="text-base text-gray-700 move-body">{t('today.selfTest.how')}</p>
      {progressLine}
      <form
        className="flex flex-col sm:flex-row sm:items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) save.mutate(n)
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="move-selftest-value">{t('today.selfTest.input')}</Label>
          <Input
            id="move-selftest-value"
            type="number"
            inputMode="numeric"
            min={0}
            max={60}
            step={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-12 text-lg w-32"
          />
        </div>
        <Button type="submit" size="lg" className="bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F]" disabled={!valid || save.isPending}>
          {t('today.selfTest.save')}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="ghost"
          onClick={() => {
            try {
              sessionStorage.setItem(`${DISMISS_PREFIX}${latest?.date ?? 'first'}`, '1')
            } catch {
              // best effort
            }
            setLater(true)
          }}
        >
          {t('today.selfTest.later')}
        </Button>
      </form>
    </article>
  )
}
