/**
 * The four dials before a session (PRD §5.2): time available, equipment,
 * focus, demonstrator. Pre-filled from the profile / equipment / today's
 * session; "Jó így, mehet" skips with the engine's defaults. Also hosts the
 * FIT download for Card and Target sessions (PRD §7.11).
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useMoveT } from '../../lib/register'
import { moveService } from '../../services/moveService'
import { moveKeys } from '../../lib/queryKeys'
import { MOVE_ACCENT } from '../../lib/constants'
import { sheetThumbnail } from '../../lib/characters'
import type { EquipmentCode, FocusCode, SessionFormat, StartSessionRequest } from '../../types'
import { FitDownloadButton } from '../FitDownloadButton'
import { exportsFit } from '../../lib/fit'

const EQUIPMENT: EquipmentCode[] = ['NONE', 'CHAIR', 'DUMBBELLS', 'BANDS', 'MAT', 'BIKE']
const FOCUS: FocusCode[] = ['DEFAULT', 'LOWER_BODY', 'UPPER_BODY', 'BALANCE', 'MOBILITY', 'CORE']
const MINUTES = [5, 10, 15, 20, 30, 45, 60]

interface DialsScreenProps {
  sessionId: string
  format: SessionFormat | null
  date?: string
  defaults: { minutes: number | null; equipment: EquipmentCode[]; characterCode: string | null }
  /** The session's activity type: the demonstrators offered are the ones with approved images in its pack. */
  modalityCode?: string | null
  onStart: (req: StartSessionRequest) => void
  busy: boolean
}

export function DialsScreen({ sessionId, format, date, defaults, modalityCode, onStart, busy }: DialsScreenProps) {
  const { t } = useMoveT()
  const [minutes, setMinutes] = useState<number | null>(defaults.minutes)
  const [equipment, setEquipment] = useState<EquipmentCode[]>(defaults.equipment.length ? defaults.equipment : ['NONE'])
  const [focus, setFocus] = useState<FocusCode>('DEFAULT')
  const [picked, setCharacterCode] = useState<string | null>(null)

  const characters = useQuery({ queryKey: moveKeys.characters, queryFn: moveService.getCharacters, staleTime: 10 * 60_000 })
  const rows = useQuery({ queryKey: moveKeys.demonstrators, queryFn: moveService.getDemonstrators, staleTime: 60_000, enabled: !!modalityCode })
  // "Ki mutatja" per activity type (founder, 2026-11-12): only demonstrators with approved images for this type
  const row = rows.data?.find((r) => r.modalityCode === modalityCode)
  const offered = new Set(row?.options.map((o) => o.characterCode) ?? [])
  const demonstrators = (characters.data ?? []).filter((c) => offered.has(c.code))
  const characterCode = picked ?? row?.chosenCharacterCode ?? row?.defaultCharacterCode ?? defaults.characterCode

  const toggleEquipment = (code: EquipmentCode) => {
    setEquipment((cur) => {
      if (code === 'NONE') return ['NONE']
      const without = cur.filter((c) => c !== 'NONE')
      return without.includes(code) ? (without.filter((c) => c !== code).length ? without.filter((c) => c !== code) : ['NONE']) : [...without, code]
    })
  }

  const chip = (selected: boolean) =>
    cn(
      'min-h-12 px-4 rounded-[12px] border text-base font-medium transition-colors',
      selected ? 'text-white border-transparent' : 'bg-white text-[#1A1A1A] border-[#e5e4e7] hover:bg-[#F9F7F2]',
    )
  const chipStyle = (selected: boolean) => (selected ? { backgroundColor: MOVE_ACCENT } : undefined)

  const request = (): StartSessionRequest => ({
    ...(minutes ? { minutes } : {}),
    equipment: equipment.filter((e) => e !== 'NONE'),
    focus,
    ...(characterCode ? { characterCode } : {}),
  })

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-headline font-bold text-[#1A1A1A]">{t('player.dials.title')}</h1>
        <p className="text-base text-gray-600 mt-1">{t('player.dials.hint')}</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-base font-medium text-[#1A1A1A]">{t('player.dials.minutes')}</legend>
        <div className="flex flex-wrap gap-2">
          {MINUTES.map((m) => (
            <button key={m} type="button" className={chip(minutes === m)} style={chipStyle(minutes === m)} onClick={() => setMinutes(m)} aria-pressed={minutes === m}>
              {t('common.minutes', { count: m })}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-base font-medium text-[#1A1A1A]">{t('player.dials.equipment')}</legend>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT.map((e) => {
            const on = equipment.includes(e)
            return (
              <button key={e} type="button" className={chip(on)} style={chipStyle(on)} onClick={() => toggleEquipment(e)} aria-pressed={on}>
                {t(`player.dials.equipmentOptions.${e}`)}
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-base font-medium text-[#1A1A1A]">{t('player.dials.focus')}</legend>
        <div className="flex flex-wrap gap-2">
          {FOCUS.map((f) => (
            <button key={f} type="button" className={chip(focus === f)} style={chipStyle(focus === f)} onClick={() => setFocus(f)} aria-pressed={focus === f}>
              {t(`player.dials.focusOptions.${f}`)}
            </button>
          ))}
        </div>
      </fieldset>

      {demonstrators.length > 1 && (
        <fieldset className="space-y-2">
          <legend className="text-base font-medium text-[#1A1A1A]">{t('player.dials.demonstrator')}</legend>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {demonstrators.map((c) => {
              const on = characterCode === c.code
              const thumb = sheetThumbnail(c)
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCharacterCode(c.code)}
                  aria-pressed={on}
                  className={cn('rounded-[12px] border p-2 flex flex-col items-center gap-1 bg-white min-h-12', on ? 'border-[3px]' : 'border-[#e5e4e7]')}
                  style={on ? { borderColor: MOVE_ACCENT } : undefined}
                >
                  {thumb ? (
                    <img src={thumb} alt="" className="h-24 w-[4.5rem] object-cover object-top rounded-[10px] bg-[#F1EFE9]" />
                  ) : (
                    <span className="h-24 w-[4.5rem] rounded-[10px]" style={{ backgroundColor: c.accentColor }} aria-hidden />
                  )}
                  <span className="text-sm font-semibold text-[#1A1A1A]">{c.name}</span>
                  {c.ageBand && <span className="text-xs text-gray-500">{c.ageBand}</span>}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      <div className="mt-auto flex flex-col sm:flex-row gap-2">
        <Button size="lg" className="bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F] flex-1" onClick={() => onStart(request())} disabled={busy}>
          {t('player.dials.start')}
        </Button>
        <Button size="lg" variant="secondary" onClick={() => onStart({})} disabled={busy}>
          {t('player.dials.skip')}
        </Button>
        {format && exportsFit(format) && <FitDownloadButton sessionId={sessionId} date={date} size="lg" variant="ghost" />}
      </div>
    </div>
  )
}
