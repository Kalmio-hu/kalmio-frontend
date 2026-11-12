import type { CharacterDto } from '../types'

const AGE_BAND_HU: Record<string, string> = {
  EARLY_60S: '60-as évei eleje',
  AROUND_40: '40 körül',
  AROUND_45: '45 körül',
  LATE_60S: '60-as évei vége',
  LATE_20S: '20-as évei vége',
}
const SHEET_VIEW_ORDER = ['front', 'threeQuarter', 'side', 'back', 'seated', 'counter']

/**
 * The backend row carries `firstName`, `palette.accent`, `forChildren`, `register` and the sheet views as an
 * array in upload order; the UI contract uses `name`, `accentColor`, `childFriendly`, `defaultRegister` and a
 * view-keyed map. Accept both shapes so either side can move first.
 */
export function normaliseCharacter(raw: Record<string, unknown>): CharacterDto {
  const sheets = raw.sheetUrls
  let sheetUrls: Record<string, string> = {}
  if (Array.isArray(sheets)) {
    sheets.forEach((url, i) => {
      const u = String(url)
      const byName = SHEET_VIEW_ORDER.find((v) => u.toLowerCase().includes(`%2f${v.replace('threeQuarter', 'three-quarter')}.`) || u.toLowerCase().includes(`/${v.replace('threeQuarter', 'three-quarter')}.`))
      sheetUrls[byName ?? SHEET_VIEW_ORDER[i] ?? `view${i}`] = u
    })
  } else if (sheets && typeof sheets === 'object') {
    sheetUrls = sheets as Record<string, string>
  }
  const palette = (raw.palette ?? {}) as Record<string, string>
  const ageBandRaw = String(raw.ageBand ?? '')
  return {
    code: String(raw.code),
    name: String(raw.name ?? raw.firstName ?? raw.code),
    ageBand: AGE_BAND_HU[ageBandRaw] ?? (ageBandRaw && !/^[A-Z0-9_]+$/.test(ageBandRaw) ? ageBandRaw : ''),
    accentColor: String(raw.accentColor ?? palette.accent ?? '#2A9D8F'),
    defaultRegister: (raw.defaultRegister ?? raw.register ?? 'INFORMAL') as CharacterDto['defaultRegister'],
    sheetUrls,
    sheetVersion: Number(raw.sheetVersion ?? 0),
    childFriendly: Boolean(raw.childFriendly ?? raw.forChildren ?? false),
  }
}

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
