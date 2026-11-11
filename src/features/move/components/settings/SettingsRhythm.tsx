/**
 * Settings — weekly rhythm: modalities with rank (reorder), days per week,
 * preferred weekdays, minutes, fixed classes CRUD. Writes through
 * `PATCH /api/move/profile` and `/api/move/fixed-classes`.
 */
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { moveService } from '../../services/moveService'
import { moveKeys } from '../../lib/queryKeys'
import { useMoveT } from '../../lib/register'
import { MINUTE_OPTIONS } from '../../lib/startFlow'
import { weekdayName } from '../../lib/dates'
import { ModalityPicture, pictureKeyFor } from '../../lib/modalityPictures'
import type { CreateFixedClassRequest, ModalityDto, ModalityPick, MoveProfileDto, UpdateMoveProfileRequest } from '../../types'

interface SettingsRhythmProps {
  profile: MoveProfileDto
  modalities: ModalityDto[]
  onPatch: (req: UpdateMoveProfileRequest) => void
  pending: boolean
}

const chip = (selected: boolean) =>
  cn(
    'min-h-12 px-4 rounded-[12px] border text-sm font-medium transition-colors',
    selected ? 'border-[#2A9D8F] bg-[#2A9D8F] text-white' : 'border-[#e5e4e7] bg-white text-[#1A1A1A] hover:bg-[#2A9D8F]/10',
  )

function rerank(picks: ModalityPick[]): ModalityPick[] {
  return picks.map((p, i) => ({ code: p.code, rank: i + 1 }))
}

export function SettingsRhythm({ profile, modalities, onPatch, pending }: SettingsRhythmProps) {
  const { t, i18n } = useMoveT()
  const qc = useQueryClient()
  const picks = profile.modalities.slice().sort((a, b) => a.rank - b.rank)
  const byCode = new Map(modalities.map((m) => [m.code, m]))
  const available = modalities.filter((m) => !picks.some((p) => p.code === m.code))

  const movePick = (index: number, dir: -1 | 1) => {
    const next = picks.slice()
    const j = index + dir
    if (j < 0 || j >= next.length) return
    ;[next[index], next[j]] = [next[j], next[index]]
    onPatch({ modalities: rerank(next) })
  }

  const fixed = useQuery({ queryKey: moveKeys.fixedClasses, queryFn: moveService.getFixedClasses, staleTime: 60_000 })
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<CreateFixedClassRequest>({ modalityCode: '', weekday: 1, startTime: '18:00', durationMin: 60 })
  const addFixed = useMutation({
    mutationFn: (req: CreateFixedClassRequest) => moveService.addFixedClass(req),
    onSuccess: () => {
      setAdding(false)
      setDraft({ modalityCode: '', weekday: 1, startTime: '18:00', durationMin: 60 })
      void qc.invalidateQueries({ queryKey: moveKeys.fixedClasses })
      toast({ title: t('settings.saved'), variant: 'success' })
    },
    onError: () => toast({ title: t('settings.error'), variant: 'destructive' }),
  })
  const removeFixed = useMutation({
    mutationFn: (id: string) => moveService.removeFixedClass(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: moveKeys.fixedClasses }),
    onError: () => toast({ title: t('settings.error'), variant: 'destructive' }),
  })

  return (
    <div className="space-y-6">
      {/* Modalities with rank */}
      <section className="space-y-2" aria-labelledby="move-settings-modalities">
        <h3 id="move-settings-modalities" className="text-sm font-semibold text-[#1A1A1A]">
          {t('settings.rhythm.modalities')}
        </h3>
        <p className="text-sm text-gray-500">{t('settings.rhythm.modalitiesHint')}</p>
        <ol className="space-y-2">
          {picks.map((p, i) => {
            const m = byCode.get(p.code)
            return (
              <li key={p.code} className="flex items-center gap-2 rounded-[12px] border border-[#e5e4e7] bg-white px-3 py-1.5">
                <span className="w-6 text-sm font-bold text-[#2A9D8F]">{i + 1}.</span>
                <ModalityPicture pictureKey={pictureKeyFor(m ?? { code: p.code })} className="h-8 w-8 text-[#2A9D8F]" />
                <span className="flex-1 text-sm text-[#1A1A1A]">{m?.name ?? p.code}</span>
                <button type="button" onClick={() => movePick(i, -1)} disabled={pending || i === 0} aria-label={t('settings.rhythm.up')} className="inline-flex items-center justify-center rounded-lg text-gray-600 hover:bg-black/5 disabled:opacity-30">
                  <ArrowUp className="h-4 w-4" aria-hidden />
                </button>
                <button type="button" onClick={() => movePick(i, 1)} disabled={pending || i === picks.length - 1} aria-label={t('settings.rhythm.down')} className="inline-flex items-center justify-center rounded-lg text-gray-600 hover:bg-black/5 disabled:opacity-30">
                  <ArrowDown className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onPatch({ modalities: rerank(picks.filter((x) => x.code !== p.code)) })}
                  disabled={pending || picks.length <= 1}
                  aria-label={t('settings.rhythm.remove')}
                  className="inline-flex items-center justify-center rounded-lg text-gray-600 hover:bg-black/5 disabled:opacity-30"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </li>
            )
          })}
        </ol>
        {available.length > 0 && (
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="move-settings-add-modality">{t('settings.rhythm.addLabel')}</Label>
              <Select
                id="move-settings-add-modality"
                className="h-12"
                value=""
                disabled={pending}
                onChange={(e) => e.target.value && onPatch({ modalities: rerank([...picks, { code: e.target.value, rank: picks.length + 1 }]) })}
              >
                <option value="">{t('settings.rhythm.add')}…</option>
                {available.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}
      </section>

      {/* Days per week */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-[#1A1A1A]">{t('settings.rhythm.days')}</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('settings.rhythm.days')}>
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={profile.daysPerWeek === n} disabled={pending} className={cn(chip(profile.daysPerWeek === n), 'min-w-12')} onClick={() => onPatch({ daysPerWeek: n })}>
              {n}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Preferred weekdays */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-[#1A1A1A]">{t('settings.rhythm.weekdays')}</legend>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((d) => {
            const on = profile.weekdays.includes(d)
            return (
              <button
                key={d}
                type="button"
                role="checkbox"
                aria-checked={on}
                disabled={pending}
                className={cn(chip(on), 'capitalize')}
                onClick={() => onPatch({ weekdays: on ? profile.weekdays.filter((x) => x !== d) : [...profile.weekdays, d].sort() })}
              >
                {on && <Check className="inline h-3.5 w-3.5 mr-1 -mt-0.5" aria-hidden />}
                {weekdayName(d, i18n.language, 'short')}
              </button>
            )
          })}
        </div>
        <p className="text-sm text-gray-500">{t('settings.rhythm.weekdaysHint')}</p>
      </fieldset>

      {/* Minutes */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-[#1A1A1A]">{t('settings.rhythm.minutes')}</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('settings.rhythm.minutes')}>
          {MINUTE_OPTIONS.map((m) => (
            <button key={m} type="button" role="radio" aria-checked={profile.minutes === m} disabled={pending} className={chip(profile.minutes === m)} onClick={() => onPatch({ minutes: m })}>
              {t('common.minutes', { count: m })}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Fixed classes */}
      <section className="space-y-2" aria-labelledby="move-settings-fixed">
        <h3 id="move-settings-fixed" className="text-sm font-semibold text-[#1A1A1A]">
          {t('settings.rhythm.fixed')}
        </h3>
        {fixed.data && fixed.data.length === 0 && <p className="text-sm text-gray-500">{t('settings.rhythm.fixedEmpty')}</p>}
        {fixed.data && fixed.data.length > 0 && (
          <ul className="space-y-2">
            {fixed.data.map((fc) => (
              <li key={fc.id} className="flex items-center justify-between gap-3 rounded-[12px] border border-[#e5e4e7] bg-white px-4 py-2">
                <span className="text-sm text-[#1A1A1A]">
                  {t('start.schedule.fixedLine', {
                    name: fc.label || byCode.get(fc.modalityCode)?.name || fc.modalityCode,
                    weekday: weekdayName(fc.weekday, i18n.language, 'short'),
                    time: fc.startTime,
                    minutes: fc.durationMin,
                  })}
                </span>
                <Button variant="ghost" size="sm" className="min-h-12" disabled={removeFixed.isPending} onClick={() => removeFixed.mutate(fc.id)}>
                  {t('start.schedule.fixedRemove')}
                </Button>
              </li>
            ))}
          </ul>
        )}
        {!adding ? (
          <Button variant="secondary" onClick={() => setAdding(true)} className="min-h-12">
            {t('start.schedule.fixedAdd')}
          </Button>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-[12px] bg-[#F9F7F2] p-4">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="move-settings-fixed-modality">{t('start.schedule.fixedName')}</Label>
              <Select id="move-settings-fixed-modality" className="h-12" value={draft.modalityCode} onChange={(e) => setDraft({ ...draft, modalityCode: e.target.value })}>
                <option value="">—</option>
                {[...modalities.filter((m) => m.entryOnly), ...modalities.filter((m) => !m.entryOnly)].map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="move-settings-fixed-weekday">{t('start.schedule.fixedWeekday')}</Label>
              <Select id="move-settings-fixed-weekday" className="h-12" value={draft.weekday} onChange={(e) => setDraft({ ...draft, weekday: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <option key={d} value={d}>
                    {weekdayName(d, i18n.language)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="move-settings-fixed-time">{t('start.schedule.fixedTime')}</Label>
              <Input id="move-settings-fixed-time" type="time" className="h-12" value={draft.startTime} onChange={(e) => setDraft({ ...draft, startTime: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="move-settings-fixed-duration">{t('start.schedule.fixedDuration')}</Label>
              <Select id="move-settings-fixed-duration" className="h-12" value={draft.durationMin} onChange={(e) => setDraft({ ...draft, durationMin: Number(e.target.value) })}>
                {[30, 45, 60, 90].map((d) => (
                  <option key={d} value={d}>
                    {t('common.minutes', { count: d })}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button className="bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F] min-h-12" disabled={!draft.modalityCode || addFixed.isPending} onClick={() => addFixed.mutate(draft)}>
                {t('start.schedule.fixedSave')}
              </Button>
              <Button variant="ghost" className="min-h-12" onClick={() => setAdding(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}
      </section>

      <p className="text-sm text-gray-500">{t('settings.rhythm.regenerateHint')}</p>
    </div>
  )
}
