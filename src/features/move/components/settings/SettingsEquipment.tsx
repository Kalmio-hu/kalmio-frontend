/**
 * Settings — equipment with real weight steps, grouped: gym access, home basics,
 * home gym (barbell, rack, bench, high/low pulley, dip bars, TRX), cardio
 * machines. Weights: dumbbell and kettlebell kg lists, the smallest barbell
 * plate pair, the pulley stack step and start, band strengths.
 * `GET/PUT /api/move/equipment`.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { moveService } from '../../services/moveService'
import { moveKeys } from '../../lib/queryKeys'
import { useMoveT } from '../../lib/register'
import type { BandLevel, EquipmentCode, EquipmentDto } from '../../types'

const GROUPS: { key: string; items: EquipmentCode[] }[] = [
  { key: 'basics', items: ['NONE', 'DUMBBELLS', 'KETTLEBELLS', 'BANDS', 'CHAIR', 'MAT', 'STEP', 'PULL_UP_BAR', 'SUSPENSION', 'BALL', 'CONES'] },
  { key: 'homeGym', items: ['BARBELL', 'SQUAT_RACK', 'BENCH', 'CABLE_HIGH', 'CABLE_LOW', 'DIP_BARS'] },
  { key: 'cardio', items: ['TREADMILL', 'BIKE', 'ROWER'] },
]
const DUMBBELL_KG = [1, 1.5, 2, 3, 4, 5, 6, 7.5, 8, 10, 12, 12.5, 14, 15, 16, 17.5, 20, 22.5, 24, 25, 30, 32.5, 35, 40]
const KETTLEBELL_KG = [4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 36, 40]
const PLATE_PAIR_KG = [0.5, 1, 2, 2.5, 5]
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
      ...eq,
      items,
      dumbbellsKg: items.includes('DUMBBELLS') ? eq.dumbbellsKg : [],
      bandLevels: items.includes('BANDS') ? eq.bandLevels : [],
      kettlebellsKg: items.includes('KETTLEBELLS') ? eq.kettlebellsKg ?? [] : [],
    })
  }

  const itemButton = (code: EquipmentCode) => {
    const on = eq.items.includes(code)
    return (
      <li key={code}>
        <button type="button" role="checkbox" aria-checked={on} disabled={pending} className={cn(chip(on), 'w-full text-left flex items-center gap-2')} onClick={() => toggleItem(code)}>
          {on && <Check className="h-4 w-4 shrink-0" aria-hidden />}
          {t(`start.equipment.items.${code}`)}
        </button>
      </li>
    )
  }

  const kgChips = (values: number[], selected: number[], onToggle: (kg: number, on: boolean) => void) => (
    <div className="flex flex-wrap gap-2">
      {values.map((kg) => {
        const on = selected.includes(kg)
        return (
          <button key={kg} type="button" role="checkbox" aria-checked={on} disabled={pending} className={cn(chip(on), 'min-w-14 tabular-nums')} onClick={() => onToggle(kg, on)}>
            {kg} kg
          </button>
        )
      })}
    </div>
  )

  const cable = eq.items.includes('CABLE_HIGH') || eq.items.includes('CABLE_LOW')
  const gymAccess = eq.items.includes('GYM_ACCESS')

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">{t('settings.equipment.hint')}</p>
      <div className="space-y-1">
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">{itemButton('GYM_ACCESS')}</ul>
        <p className="text-sm text-gray-500">{t('settings.equipment.gymAccessHint')}</p>
      </div>
      {GROUPS.map((g) => (
        <fieldset key={g.key} className="space-y-2">
          <legend className="text-sm font-semibold text-[#1A1A1A]">{t(`settings.equipment.groups.${g.key}`)}</legend>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">{g.items.map(itemButton)}</ul>
        </fieldset>
      ))}

      {eq.items.includes('BARBELL') && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-[#1A1A1A]">{t('settings.equipment.plates')}</legend>
          <p className="text-sm text-gray-500">{t('settings.equipment.platesHint')}</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('settings.equipment.plates')}>
            {PLATE_PAIR_KG.map((kg) => {
              const on = (eq.barbellIncrementKg ?? 2.5) === kg
              return (
                <button key={kg} type="button" role="radio" aria-checked={on} disabled={pending} className={cn(chip(on), 'min-w-14 tabular-nums')} onClick={() => put.mutate({ ...eq, barbellIncrementKg: kg })}>
                  +{kg} kg
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      {cable && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-[#1A1A1A]">{t('settings.equipment.cable')}</legend>
          <p className="text-sm text-gray-500">{t('settings.equipment.cableHint')}</p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="space-y-1 text-sm text-gray-700">
              <span className="block">{t('settings.equipment.cableStart')}</span>
              <Input key={`start-${eq.cableStartKg ?? ''}`} type="number" inputMode="decimal" min={0} step={0.5} defaultValue={eq.cableStartKg ?? ''} disabled={pending} className="h-12 w-24"
                onBlur={(e) => e.target.value !== String(eq.cableStartKg ?? '') && Number(e.target.value) > 0 && put.mutate({ ...eq, cableStartKg: Number(e.target.value) })} />
            </label>
            <label className="space-y-1 text-sm text-gray-700">
              <span className="block">{t('settings.equipment.cableStep')}</span>
              <Input key={`step-${eq.cableStepKg ?? ''}`} type="number" inputMode="decimal" min={0} step={0.5} defaultValue={eq.cableStepKg ?? ''} disabled={pending} className="h-12 w-24"
                onBlur={(e) => e.target.value !== String(eq.cableStepKg ?? '') && Number(e.target.value) > 0 && put.mutate({ ...eq, cableStepKg: Number(e.target.value) })} />
            </label>
          </div>
        </fieldset>
      )}

      {eq.items.includes('KETTLEBELLS') && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-[#1A1A1A]">{t('settings.equipment.kettlebells')}</legend>
          {kgChips(KETTLEBELL_KG, eq.kettlebellsKg ?? [], (kg, on) =>
            put.mutate({ ...eq, kettlebellsKg: on ? (eq.kettlebellsKg ?? []).filter((x) => x !== kg) : [...(eq.kettlebellsKg ?? []), kg].sort((a, b) => a - b) }),
          )}
        </fieldset>
      )}
      {gymAccess && !eq.items.includes('DUMBBELLS') && <p className="text-sm text-gray-500">{t('settings.equipment.gymWeightsHint')}</p>}

      {eq.items.includes('DUMBBELLS') && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-[#1A1A1A]">{t('settings.equipment.dumbbells')}</legend>
          <p className="text-sm text-gray-500">{t('settings.equipment.dumbbellsHint')}</p>
          {kgChips(DUMBBELL_KG, eq.dumbbellsKg, (kg, on) =>
            put.mutate({ ...eq, dumbbellsKg: on ? eq.dumbbellsKg.filter((x) => x !== kg) : [...eq.dumbbellsKg, kg].sort((a, b) => a - b) }),
          )}
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
