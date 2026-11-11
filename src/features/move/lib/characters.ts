import type { CharacterDto } from '../types'

/** Sheet view preferred as the picker thumbnail, in order. */
const SHEET_PREFERENCE = ['front', 'threeQuarter', 'three_quarter', 'side', 'seated', 'counter', 'back'] as const

/** First available sheet image of a character, or null when none was uploaded yet. */
export function sheetThumbnail(c: Pick<CharacterDto, 'sheetUrls'>): string | null {
  for (const key of SHEET_PREFERENCE) {
    const url = c.sheetUrls?.[key]
    if (url) return url
  }
  const first = Object.values(c.sheetUrls ?? {})[0]
  return first ?? null
}
