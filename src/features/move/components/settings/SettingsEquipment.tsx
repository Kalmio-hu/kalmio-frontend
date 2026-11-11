/**
 * Settings — equipment at home with real weight steps: items, dumbbell kg list,
 * band strengths. `GET/PUT /api/move/equipment`.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { moveService } from '../../services/moveService'
import { moveKeys } from '../../lib/queryKeys'
import { useMoveT } from '../../lib/register'
import type { BandLevel, EquipmentCode, EquipmentDto } from '../../types'

const ITEMS: EquipmentCode[] = ['NONE', 'DUMBBELLS', 'BANDS', 'CHAIR', 'MAT', 'STEP', 'BIKE', 'PULL_UP_BAR']
const DUMBBELL_KG = [1, 1.5, 2, 3, 4, 5, 6, 7.5, 8, 10, 12, 12.5, 14, 15, 16, 17.5, 20, 22.5, 24, 25, 30]
const BANDS: BandLevel[] = ['LIGHT', 'MEDIUM', 'HEAVY']

const chip = (selected: boolean) =>
  cn(
    'min-h-12 px-4 rounded-[12px] border text-sm font-medium transition-colors',
    selected ? 'border-[#2A9D8F] bg-[#2A9D8F] text-white' : 'border-[#e5e4e7] bg-white text-[#1A1A1A] hover:bg-[#2A9D8F]/10',
  )

export function SettingsEquipment() {
  const { t } = useMoveT()
  const qc = useQueryClient()
  const q = useQuery({ queryKey: moveKeys.equipment, queryFn: moveService.getEquipment, staleTime: 60_000 })
  const put = useMutation({
    mutationFn: (req: EquipmentDto) => moveService.putEquipment(req),
    onSuccess: (next) => {
      qc.setQueryData(moveKeys.equipment, next)
      toast({ title: t('settings.saved'), variant: 'success' })
    },
    onError: () => toast({ title: t('settings.error'), variant: 'destructive' }),
  })

  if (q.isPending) {
    return (
      <div className="flex justify-center py-4" role="status">
        <Spinner className="border-[#2A9D8F]" />
      </div>
    )
  }
  if (!q.data) return <p className="text-sm text-gray-500">{t('common.error')}</p>
  const eq = q.data
  const pending = put.isPending

  const toggleItem = (code: EquipmentCode) => {
    let items: EquipmentCode[]
    if (code === 'NONE') items = eq.items.includes('NONE') ? [] : ['NONE']
    else {
      const without = eq.items.filter((c) => c !== 'NONE' && c !== code)
      items = eq.items.includes(code) ? without : [...without, code]
    }
    put.mutate({
      items,
      dumbbellsKg: items.includes('DUMBBELLS') ? eq.dumbbellsKg : [],
      bandLevels: items.includes('BANDS') ? eq.bandLevels : [],
    })
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">{t('settings.equipment.hint')}</p>
      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ITEMS.map((code) => {
          const on = eq.items.includes(code)
          return (
            <li key={code}>
              <button type="button" role="checkbox" aria-checked={on} disabled={pending} className={cn(chip(on), 'w-full text-left flex items-center gap-2')} onClick={() => toggleItem(code)}>
                {on && <Check className="h-4 w-4 shrink-0" aria-hidden />}
                {t(`start.equipment.items.${code}`)}
              </button>
            </li>
          )
        })}
      </ul>

      {eq.items.includes('DUMBBELLS') && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-[#1A1A1A]">{t('settings.equipment.dumbbells')}</legend>
          <p className="text-sm text-gray-500">{t('settings.equipment.dumbbellsHint')}</p>
          <div className="flex flex-wrap gap-2">
            {DUMBBELL_KG.map((kg) => {
              const on = eq.dumbbellsKg.includes(kg)
              return (
                <button
                  key={kg}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  disabled={pending}
                  className={cn(chip(on), 'min-w-14 tabular-nums')}
                  onClick={() =>
                    put.mutate({ ...eq, dumbbellsKg: on ? eq.dumbbellsKg.filter((x) => x !== kg) : [...eq.dumbbellsKg, kg].sort((a, b) => a - b) })
                  }
                >
                  {kg} kg
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      {eq.items.includes('BANDS') && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-[#1A1A1A]">{t('settings.equipment.bands')}</legend>
          <div className="flex flex-wrap gap-2">
            {BANDS.map((lvl) => {
              const on = eq.bandLevels.includes(lvl)
              return (
                <button
                  key={lvl}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  disabled={pending}
                  className={chip(on)}
                  onClick={() => put.mutate({ ...eq, bandLevels: on ? eq.bandLevels.filter((x) => x !== lvl) : [...eq.bandLevels, lvl] })}
                >
                  {t(`settings.equipment.band.${lvl}`)}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}
    </div>
  )
}
