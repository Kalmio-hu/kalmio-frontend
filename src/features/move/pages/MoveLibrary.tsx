/**
 * "Gyakorlatok" (PRD §12.1, contract §8): GET /api/move/library?pack=&level=&modality=
 * → pack tabs, activity-type filter, level filter, cards with the approved start still for the
 * member's demonstrator (fallback: pack default character, then pictogram +
 * text). The detail sheet shows the still pair, cues, faults, the
 * "gyógytornász ellenőrizte" line only for approved items, and the report
 * button. Unapproved media never renders — the chooser drops it even if the
 * API sent it.
 */
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MovePageFrame } from '../components/MovePageFrame'
import { MediaView } from '../components/player/StepMedia'
import { PersonPictogram } from '../components/player/Figures'
import { AiLabel } from '../components/AiLabel'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { useMoveT } from '../lib/register'
import { useCharacterNames } from '../lib/useCharacterNames'
import { MOVE_ACCENT } from '../lib/constants'
import { chooseLibraryMedia, type MediaChoice } from '../lib/mediaFallback'
import type { LibraryExerciseDto, LibraryPackDto } from '../types'

export function MoveLibrary() {
  const { t } = useMoveT()
  const [params, setParams] = useSearchParams()
  const pack = params.get('pack') ?? undefined
  const level = params.get('level') ?? undefined
  const modality = params.get('modality') ?? undefined
  const characterName = useCharacterNames()
  const [openId, setOpenId] = useState<string | null>(null)

  const q = useQuery({
    queryKey: moveKeys.library(pack, level, modality),
    queryFn: () => moveService.getLibrary({ pack, level, modality }),
    staleTime: 5 * 60_000,
  })

  const packs = useMemo(() => q.data?.packs ?? [], [q.data?.packs])
  const packByCode = useMemo(() => new Map(packs.map((p) => [p.code, p])), [packs])
  const exercises = q.data?.exercises ?? []
  const characterCode = q.data?.characterCode ?? null

  const setFilter = (next: { pack?: string; level?: string; modality?: string }) => {
    const p = new URLSearchParams(params)
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v)
      else p.delete(k)
    }
    setParams(p, { replace: true })
  }

  const choiceFor = (e: LibraryExerciseDto): MediaChoice =>
    chooseLibraryMedia(e.media, characterCode, packByCode.get(e.pack)?.defaultCharacterCode ?? null, e.pictogramUrl ?? null)

  const open = exercises.find((e) => e.id === openId) ?? null

  const tab = (on: boolean) =>
    cn(
      'min-h-12 px-4 rounded-[12px] text-base font-medium border transition-colors whitespace-nowrap',
      on ? 'text-white border-transparent' : 'bg-white text-[#1A1A1A] border-[#e5e4e7] hover:bg-[#F9F7F2]',
    )

  return (
    <MovePageFrame
      title={t('library.title')}
      subtitle={t('library.subtitle')}
      isLoading={q.isPending}
      isError={q.isError}
      onRetry={() => void q.refetch()}
    >
      <div className="space-y-5">
        {packs.length > 0 && (
          <div role="tablist" aria-label={t('library.filterPack')} className="flex gap-2 overflow-x-auto pb-1">
            <button role="tab" type="button" aria-selected={!pack} className={tab(!pack)} style={!pack ? { backgroundColor: MOVE_ACCENT } : undefined} onClick={() => setFilter({ pack: undefined, level: undefined, modality: undefined })}>
              {t('library.all')}
            </button>
            {packs.map((p: LibraryPackDto) => (
              <button key={p.code} role="tab" type="button" aria-selected={pack === p.code} className={tab(pack === p.code)} style={pack === p.code ? { backgroundColor: MOVE_ACCENT } : undefined} onClick={() => setFilter({ pack: p.code, level: undefined, modality: undefined })}>
                {p.name}
              </button>
            ))}
          </div>
        )}

        {(q.data?.modalities?.length ?? 0) > 0 && (
          <div className="flex flex-wrap items-center gap-2" aria-label={t('library.filterModality')}>
            <span className="text-sm text-gray-600 mr-1">{t('library.filterModality')}:</span>
            <button type="button" aria-pressed={!modality} className={tab(!modality)} style={!modality ? { backgroundColor: MOVE_ACCENT } : undefined} onClick={() => setFilter({ modality: undefined, pack: undefined, level: undefined })}>
              {t('library.all')}
            </button>
            {q.data!.modalities.map((m) => (
              <button key={m.code} type="button" aria-pressed={modality === m.code} className={tab(modality === m.code)} style={modality === m.code ? { backgroundColor: MOVE_ACCENT } : undefined} onClick={() => setFilter({ modality: m.code, pack: m.pack, level: undefined })}>
                {m.name}
              </button>
            ))}
            {(() => {
              const selected = q.data!.modalities.find((m) => m.code === modality)
              return selected?.defaultCharacterCode ? (
                <span className="basis-full text-sm text-gray-600">{t('library.demonstrator', { name: characterName(selected.defaultCharacterCode) })}</span>
              ) : null
            })()}
          </div>
        )}

        {(q.data?.levels.length ?? 0) > 0 && (
          <div className="flex flex-wrap items-center gap-2" aria-label={t('library.filterLevel')}>
            <span className="text-sm text-gray-600 mr-1">{t('library.filterLevel')}:</span>
            <button type="button" aria-pressed={!level} className={tab(!level)} style={!level ? { backgroundColor: MOVE_ACCENT } : undefined} onClick={() => setFilter({ level: undefined })}>
              {t('library.all')}
            </button>
            {q.data!.levels.map((l) => (
              <button key={l} type="button" aria-pressed={level === l} className={tab(level === l)} style={level === l ? { backgroundColor: MOVE_ACCENT } : undefined} onClick={() => setFilter({ level: l })}>
                {l}
              </button>
            ))}
          </div>
        )}

        {exercises.length === 0 ? (
          <p className="rounded-[16px] bg-white border border-[#e5e4e7] py-10 text-center text-base text-gray-600">{t('library.empty')}</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {exercises.map((e) => {
              const c = choiceFor(e)
              const url = c.kind === 'PAIR' ? c.start.url : c.kind === 'STILL' ? c.still.url : c.pictogramUrl
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(e.id)}
                    className="w-full text-left bg-white rounded-[16px] border border-[#e5e4e7] shadow-sm p-3 flex gap-3 items-center hover:bg-[#F9F7F2] min-h-12"
                    aria-label={`${e.name} — ${t('library.open')}`}
                  >
                    {url ? (
                      <img src={url} alt="" className="h-24 w-24 object-cover rounded-[12px] shrink-0 bg-[#F9F7F2]" loading="lazy" />
                    ) : (
                      <PersonPictogram className="h-24 w-24 shrink-0" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block font-headline font-bold text-[#1A1A1A]">{e.name}</span>
                      {e.cue && <span className="block text-base text-gray-700 line-clamp-2">{e.cue}</span>}
                      <span className="block text-sm text-gray-600 mt-1">
                        {t('library.levelLabel', { level: e.level })}
                        {' · '}
                        {e.equipment.length === 0 || e.equipment.every((x) => x === 'NONE') ? t('library.noEquipment') : e.equipment.map((x) => t(`player.dials.equipmentOptions.${x}`)).join(', ')}
                      </span>
                      {c.kind !== 'TEXT' ? <AiLabel className="mt-1" /> : <span className="block text-xs text-gray-500 mt-1">{t('library.textOnly')}</span>}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="move-block max-w-2xl" data-space="move">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle>{open.name}</DialogTitle>
                <DialogDescription>
                  {t('library.levelLabel', { level: open.level })}
                  {open.cue ? ` · ${open.cue}` : ''}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <MediaView choice={choiceFor(open)} title={open.name} cues={open.cues} />
                {open.cues.length > 0 && choiceFor(open).kind !== 'TEXT' && (
                  <div>
                    <p className="text-base font-medium text-[#1A1A1A]">{t('library.cues')}</p>
                    <ul className="list-disc pl-5 text-base text-gray-700 space-y-0.5">{open.cues.map((c) => <li key={c}>{c}</li>)}</ul>
                  </div>
                )}
                {open.faults.length > 0 && (
                  <div>
                    <p className="text-base font-medium text-[#1A1A1A]">{t('library.faults')}</p>
                    <ul className="list-disc pl-5 text-base text-gray-700 space-y-0.5">{open.faults.map((c) => <li key={c}>{c}</li>)}</ul>
                  </div>
                )}
                {open.approved && <p className="text-sm text-gray-600 border-t border-[#e5e4e7] pt-3">{t('brand.reviewedLine')}</p>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MovePageFrame>
  )
}
