/**
 * Picking the exercises of a session by hand (founder, 2026-11-12). The
 * candidates come from the library filtered to the activity type
 * (`GET /api/move/library?modality=`); the chosen list keeps its order, and a
 * Card session takes sets × reps × kg per exercise, a Flow session seconds.
 * Empty targets fall back to the member's progress on the server.
 */
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { useMoveT } from '../lib/register'
import type { ExercisePickDto } from '../types'

export interface PickedExercise extends ExercisePickDto {
  name: string
}

interface ExercisePickerProps {
  modalityCode: string
  format: 'CARD' | 'FLOW'
  value: PickedExercise[]
  onChange: (next: PickedExercise[]) => void
}

export function ExercisePicker({ modalityCode, format, value, onChange }: ExercisePickerProps) {
  const { t } = useMoveT()
  const [search, setSearch] = useState('')
  const library = useQuery({
    queryKey: moveKeys.library(undefined, undefined, modalityCode),
    queryFn: () => moveService.getLibrary({ modality: modalityCode }),
    staleTime: 5 * 60_000,
  })
  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase()
    const chosen = new Set(value.map((v) => v.exerciseId))
    return (library.data?.exercises ?? []).filter((e) => !chosen.has(e.id) && (!q || e.name.toLowerCase().includes(q))).slice(0, 30)
  }, [library.data, search, value])

  const update = (i: number, patch: Partial<PickedExercise>) => onChange(value.map((v, j) => (j === i ? { ...v, ...patch } : v)))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= value.length) return
    const next = value.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  const num = (v: string) => (v === '' ? null : Number(v))

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <p className="text-sm text-gray-500">{t('picker.empty')}</p>
      ) : (
        <ol className="space-y-2">
          {value.map((v, i) => (
            <li key={v.exerciseId} className="rounded-[12px] border border-[#e5e4e7] bg-white p-2 space-y-2">
              <div className="flex items-center gap-1">
                <span className="w-6 text-sm font-bold text-[#2A9D8F]">{i + 1}.</span>
                <span className="flex-1 min-w-0 text-sm font-medium text-[#1A1A1A] break-words">{v.name}</span>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t('picker.up')} className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-gray-600 hover:bg-black/5 disabled:opacity-30">
                  <ArrowUp className="h-4 w-4" aria-hidden />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label={t('picker.down')} className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-gray-600 hover:bg-black/5 disabled:opacity-30">
                  <ArrowDown className="h-4 w-4" aria-hidden />
                </button>
                <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={t('picker.remove')} className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-gray-600 hover:bg-black/5">
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pl-7">
                {format === 'CARD' ? (
                  <>
                    <label className="text-xs text-gray-600 space-y-0.5">
                      <span className="block">{t('picker.sets')}</span>
                      <Input type="number" inputMode="numeric" min={1} max={10} value={v.sets ?? ''} placeholder="3" onChange={(e) => update(i, { sets: num(e.target.value) })} className="h-10 w-16" />
                    </label>
                    <label className="text-xs text-gray-600 space-y-0.5">
                      <span className="block">{t('picker.reps')}</span>
                      <Input type="number" inputMode="numeric" min={1} max={100} value={v.reps ?? ''} placeholder="–" onChange={(e) => update(i, { reps: num(e.target.value) })} className="h-10 w-16" />
                    </label>
                    <label className="text-xs text-gray-600 space-y-0.5">
                      <span className="block">{t('picker.kg')}</span>
                      <Input type="number" inputMode="decimal" min={0} step={0.5} value={v.weightKg ?? ''} placeholder="–" onChange={(e) => update(i, { weightKg: num(e.target.value) })} className="h-10 w-20" />
                    </label>
                  </>
                ) : (
                  <label className="text-xs text-gray-600 space-y-0.5">
                    <span className="block">{t('picker.seconds')}</span>
                    <Input type="number" inputMode="numeric" min={10} max={900} value={v.seconds ?? ''} placeholder="60" onChange={(e) => update(i, { seconds: num(e.target.value) })} className="h-10 w-20" />
                  </label>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="space-y-2">
        <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('picker.search')} aria-label={t('picker.search')} className="h-11" />
        {library.isPending ? (
          <p className="text-sm text-gray-500">{t('common.loading')}</p>
        ) : candidates.length === 0 ? (
          <p className="text-sm text-gray-500">{t('picker.noMatch')}</p>
        ) : (
          <ul className="max-h-64 overflow-y-auto space-y-1 rounded-[12px] border border-[#e5e4e7] bg-[#F9F7F2] p-1">
            {candidates.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onChange([...value, { exerciseId: e.id, name: e.name }])}
                  className="w-full min-h-11 flex items-center gap-2 rounded-lg px-2 text-left text-sm text-[#1A1A1A] hover:bg-white"
                >
                  <Plus className="h-4 w-4 shrink-0 text-[#2A9D8F]" aria-hidden />
                  <span className="flex-1 min-w-0 break-words">{e.name}</span>
                  {e.equipment.length > 0 && !e.equipment.every((x) => x === 'NONE') && (
                    <span className="text-xs text-gray-500">{e.equipment.map((x) => t(`start.equipment.items.${x}`)).join(', ')}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
