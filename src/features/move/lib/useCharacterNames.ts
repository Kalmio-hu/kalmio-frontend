/**
 * Demonstrator display names by code, for "Bemutató: Marci" next to an
 * activity type. The characters endpoint wins; the static names cover the
 * seven-character cast while it loads or when it fails.
 */
import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { moveService } from '../services/moveService'
import { moveKeys } from './queryKeys'

const CAST: Record<string, string> = {
  ILDIKO: 'Ildikó', KATA: 'Kata', GABOR: 'Gábor', FERI: 'Feri', DORKA: 'Dorka', MARCI: 'Marci', BOGYO: 'Bogyó',
}

export function useCharacterNames(): (code?: string | null) => string | null {
  const q = useQuery({ queryKey: moveKeys.characters, queryFn: moveService.getCharacters, staleTime: 10 * 60_000 })
  return useCallback(
    (code?: string | null) => {
      if (!code) return null
      return q.data?.find((c) => c.code === code)?.name ?? CAST[code] ?? code
    },
    [q.data],
  )
}
