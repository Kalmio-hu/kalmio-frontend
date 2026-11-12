/**
 * Settings — "Ki mutatja" per activity type (founder, 2026-11-12): each type
 * offers only the demonstrators who already have approved images in its pack
 * (`GET /api/move/demonstrators`); the pick is saved per type
 * (`PATCH /api/move/profile` `charactersByModality`). The member's own types
 * come first; the rest sit under "Többi mozgásforma".
 */
import { useQuery } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'
import { moveService } from '../../services/moveService'
import { moveKeys } from '../../lib/queryKeys'
import { useMoveT } from '../../lib/register'
import { sheetThumbnail } from '../../lib/characters'
import { useCharacterNames } from '../../lib/useCharacterNames'
import type { ModalityDemonstratorsDto, MoveProfileDto, UpdateMoveProfileRequest } from '../../types'

interface SettingsDemonstratorsProps {
  profile: MoveProfileDto
  onPatch: (req: UpdateMoveProfileRequest) => void
  pending: boolean
}

export function SettingsDemonstrators({ profile, onPatch, pending }: SettingsDemonstratorsProps) {
  const { t } = useMoveT()
  const characterName = useCharacterNames()
  const rows = useQuery({ queryKey: [...moveKeys.demonstrators, profile.charactersByModality ?? {}], queryFn: moveService.getDemonstrators, staleTime: 60_000 })
  const characters = useQuery({ queryKey: moveKeys.characters, queryFn: moveService.getCharacters, staleTime: 10 * 60_000 })
  const thumb = (code: string) => {
    const c = characters.data?.find((x) => x.code === code)
    return c ? sheetThumbnail(c) : null
  }

  if (rows.isPending) {
    return (
      <div className="flex justify-center py-6" role="status">
        <Spinner className="border-[#2A9D8F]" />
      </div>
    )
  }
  const own = new Set(profile.modalities.map((m) => m.code))
  const mine = (rows.data ?? []).filter((r) => own.has(r.modalityCode))
  const others = (rows.data ?? []).filter((r) => !own.has(r.modalityCode))

  const row = (r: ModalityDemonstratorsDto) => {
    const selected = r.chosenCharacterCode ?? r.defaultCharacterCode
    return (
      <li key={r.modalityCode} className="space-y-2">
        <p className="text-sm font-semibold text-[#1A1A1A]">{r.modalityName}</p>
        {r.options.length === 0 ? (
          <p className="text-sm text-gray-500">{t('settings.demonstrator.noImages')}</p>
        ) : (
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('settings.demonstrator.forType', { type: r.modalityName })}>
            {r.options.map((o) => {
              const on = o.characterCode === selected
              const src = thumb(o.characterCode)
              return (
                <button
                  key={o.characterCode}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={pending}
                  onClick={() =>
                    !on && onPatch({ charactersByModality: { [r.modalityCode]: o.characterCode === r.defaultCharacterCode ? '' : o.characterCode } })
                  }
                  className={cn(
                    'flex items-center gap-2 rounded-[12px] border-2 bg-white pl-1 pr-3 py-1 min-h-12 transition-colors',
                    on ? 'border-[var(--move-accent)]' : 'border-[#e5e4e7] hover:border-[var(--move-accent)]/60',
                  )}
                >
                  <span className="h-10 w-10 rounded-[10px] bg-[#F9F7F2] overflow-hidden shrink-0">
                    {src && <img src={src} alt="" className="h-full w-full object-cover object-top" loading="lazy" />}
                  </span>
                  <span className="text-left">
                    <span className="block text-sm font-medium text-[#1A1A1A]">{characterName(o.characterCode)}</span>
                    <span className="block text-xs text-gray-500">
                      {o.characterCode === r.defaultCharacterCode ? `${t('settings.demonstrator.default')} · ` : ''}
                      {t('settings.demonstrator.coverage', { count: o.exercisesWithImages })}
                    </span>
                  </span>
                  {on && <Check className="h-4 w-4 text-[var(--move-accent)]" aria-hidden />}
                </button>
              )
            })}
          </div>
        )}
      </li>
    )
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-4">{mine.map(row)}</ul>
      {others.length > 0 && (
        <details className="rounded-[12px] border border-[#e5e4e7] bg-white px-3 py-2">
          <summary className="cursor-pointer text-sm font-medium text-[#1A1A1A] min-h-10 flex items-center">{t('settings.demonstrator.otherTypes')}</summary>
          <ul className="space-y-4 pt-3">{others.map(row)}</ul>
        </details>
      )}
    </div>
  )
}
