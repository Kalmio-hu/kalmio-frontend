/**
 * Settings — life states (PRD §7.7): Beteg vagyok / Megsérültem pause at once;
 * Szünetet tartok / Elutazom take dates. `POST /api/move/life-state`,
 * `DELETE /api/move/life-state` to return.
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { moveService } from '../../services/moveService'
import { moveKeys } from '../../lib/queryKeys'
import { useMoveT } from '../../lib/register'
import { dayMonthLabel, todayIso } from '../../lib/dates'
import type { LifeStateDto, LifeStateKind, LifeStateRequest } from '../../types'

interface SettingsLifeStateProps {
  lifeState: LifeStateDto | null | undefined
}

const DATED: LifeStateKind[] = ['BREAK', 'TRAVEL']
const KINDS: Exclude<LifeStateKind, 'ACTIVE'>[] = ['SICK', 'INJURED', 'BREAK', 'TRAVEL']

export function SettingsLifeState({ lifeState }: SettingsLifeStateProps) {
  const { t, i18n } = useMoveT()
  const qc = useQueryClient()
  const current = lifeState?.state ?? 'ACTIVE'
  const [picked, setPicked] = useState<Exclude<LifeStateKind, 'ACTIVE'> | null>(null)
  const [fromDate, setFromDate] = useState(todayIso())
  const [toDate, setToDate] = useState('')

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: moveKeys.all })
    void qc.invalidateQueries({ queryKey: ['dashboard'] })
  }
  const set = useMutation({
    mutationFn: (req: LifeStateRequest) => moveService.setLifeState(req),
    onSuccess: () => {
      toast({ title: t('lifeState.saved'), variant: 'success' })
      setPicked(null)
      invalidate()
    },
    onError: () => toast({ title: t('settings.error'), variant: 'destructive' }),
  })
  const clear = useMutation({
    mutationFn: () => moveService.clearLifeState(),
    onSuccess: () => {
      toast({ title: t('lifeState.cleared'), variant: 'success' })
      invalidate()
    },
    onError: () => toast({ title: t('settings.error'), variant: 'destructive' }),
  })
  const busy = set.isPending || clear.isPending

  const chip = (selected: boolean) =>
    cn(
      'min-h-12 px-4 rounded-[12px] border text-sm font-medium transition-colors',
      selected ? 'border-[#2A9D8F] bg-[#2A9D8F] text-white' : 'border-[#e5e4e7] bg-white text-[#1A1A1A] hover:bg-[#2A9D8F]/10',
    )

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{t('lifeState.hint')}</p>
      <p className="text-base text-[#1A1A1A]">
        {t('lifeState.current', { state: t(`lifeState.${current}`) })}
        {lifeState?.toDate && current !== 'ACTIVE' && <span className="text-gray-600"> · {t('lifeState.until', { date: dayMonthLabel(lifeState.toDate, i18n.language) })}</span>}
      </p>

      {current !== 'ACTIVE' ? (
        <Button className="bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F] min-h-12" disabled={busy} onClick={() => clear.mutate()}>
          {t('lifeState.clear')}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('lifeState.title')}>
            {KINDS.map((k) => (
              <button key={k} type="button" role="radio" aria-checked={picked === k} className={chip(picked === k)} disabled={busy} onClick={() => setPicked(k)}>
                {t(`lifeState.${k}`)}
              </button>
            ))}
          </div>
          {picked && DATED.includes(picked) && (
            <div className="grid grid-cols-2 gap-3 max-w-sm">
              <div className="space-y-1">
                <Label htmlFor="move-life-from">{t('lifeState.from')}</Label>
                <Input id="move-life-from" type="date" className="h-12" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="move-life-to">{t('lifeState.to')}</Label>
                <Input id="move-life-to" type="date" className="h-12" value={toDate} min={fromDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
            </div>
          )}
          {picked === 'TRAVEL' && <p className="text-sm text-gray-600">{t('lifeState.travelNote')}</p>}
          {picked && (
            <Button
              className="bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F] min-h-12"
              disabled={busy || (DATED.includes(picked) && (!fromDate || !toDate))}
              onClick={() => set.mutate(DATED.includes(picked) ? { state: picked, fromDate, toDate } : { state: picked })}
            >
              {t('lifeState.set')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
