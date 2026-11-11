/**
 * Life-state banner on the today page (PRD §7.7). SICK / INJURED: the weekly
 * optional question "Hogy van? Visszatérjünk?" with the return action; a
 * fever, chest symptoms or an injury go through the health questions first.
 * BREAK / TRAVEL: the return date, and the no-equipment note for travel.
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { useMoveT } from '../lib/register'
import { dayMonthLabel } from '../lib/dates'
import { HealthRescreenDialog } from './HealthRescreenDialog'
import type { LifeStateKind } from '../types'

interface LifeStateBannerProps {
  lifeState: LifeStateKind
  until?: string | null
  returnQuestionDue?: boolean
}

const ACCENT_BUTTON = 'bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F]'

export function LifeStateBanner({ lifeState, until, returnQuestionDue }: LifeStateBannerProps) {
  const { t, i18n, register } = useMoveT()
  const qc = useQueryClient()
  const [asking, setAsking] = useState(false)
  const [feverAsked, setFeverAsked] = useState(false)
  const [rescreenOpen, setRescreenOpen] = useState(false)

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: moveKeys.all })
    void qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const clear = useMutation({
    mutationFn: () => moveService.clearLifeState(),
    onSuccess: () => {
      toast({ title: t('lifeState.returned'), variant: 'success' })
      setAsking(false)
      setFeverAsked(false)
      invalidate()
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  if (lifeState === 'ACTIVE') return null

  const paused = lifeState === 'SICK' || lifeState === 'INJURED'

  return (
    <section className="move-block bg-white rounded-[16px] border border-[#e5e4e7] shadow-sm p-5 space-y-3" aria-live="polite">
      <p className="text-base text-[#1A1A1A] move-body">{t(`today.lifeState.${lifeState}`)}</p>
      {until && <p className="text-sm text-gray-600">{t('lifeState.until', { date: dayMonthLabel(until, i18n.language) })}</p>}
      {lifeState === 'TRAVEL' && <p className="text-sm text-gray-600">{t('lifeState.travelNote')}</p>}

      {paused && (returnQuestionDue ?? true) && !asking && (
        <div className="space-y-2">
          <p className="text-base text-[#1A1A1A]">{t('lifeState.question')}</p>
          <div className="flex flex-wrap gap-2">
            <Button className={ACCENT_BUTTON} onClick={() => (lifeState === 'INJURED' ? setRescreenOpen(true) : setAsking(true))}>
              {t('lifeState.return')}
            </Button>
            <Button variant="ghost">{t('lifeState.notYet')}</Button>
          </div>
        </div>
      )}

      {paused && asking && !feverAsked && (
        <fieldset className="space-y-2">
          <legend className="text-base text-[#1A1A1A]">{t('lifeState.feverQuestion')}</legend>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setFeverAsked(true)
                setRescreenOpen(true)
              }}
            >
              {t('fall.yes')}
            </Button>
            <Button className={ACCENT_BUTTON} onClick={() => clear.mutate()} disabled={clear.isPending}>
              {t('fall.no')}
            </Button>
          </div>
        </fieldset>
      )}

      {!paused && (
        <Button className={ACCENT_BUTTON} onClick={() => clear.mutate()} disabled={clear.isPending}>
          {t('lifeState.clear')}
        </Button>
      )}

      <HealthRescreenDialog
        open={rescreenOpen}
        onOpenChange={setRescreenOpen}
        register={register}
        description={t('lifeState.rescreenFirst')}
        onSaved={() => clear.mutate()}
      />
    </section>
  )
}
