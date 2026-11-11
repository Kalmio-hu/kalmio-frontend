/**
 * Pictures for the modality grid (PRD §7.1 step 2): one small inline SVG per
 * `pictureKey`, no emoji, no fitness vocabulary in the drawing. The backend
 * sends `pictureKey` on `ModalityDto`; unknown keys fall back to the modality
 * code and then to a plain footprint mark.
 */
import type { ReactElement } from 'react'

export type PictureKey =
  | 'walk'
  | 'run'
  | 'cycle'
  | 'strength'
  | 'band'
  | 'dumbbell'
  | 'chair'
  | 'mobility'
  | 'family'
  | 'yoga'
  | 'dance'
  | 'water'
  | 'ball'
  | 'gym'
  | 'hike'
  | 'garden'
  | 'balance'
  | 'other'

const BY_CODE: Record<string, PictureKey> = {
  WALK: 'walk',
  NORDIC_WALK: 'walk',
  RUN_WALK: 'run',
  RUN: 'run',
  CYCLE: 'cycle',
  STRENGTH_BODYWEIGHT: 'strength',
  STRENGTH_DUMBBELL: 'dumbbell',
  STRENGTH_BAND: 'band',
  SUPPORTED_EXERCISE: 'chair',
  MOBILITY: 'mobility',
  FAMILY_SESSION: 'family',
  YOGA_CLASS: 'yoga',
  PILATES: 'yoga',
  TAI_CHI: 'balance',
  DANCE_CLASS: 'dance',
  AQUA_FITNESS: 'water',
  SWIM: 'water',
  FOOTBALL_TRAINING: 'ball',
  TEAM_SPORT: 'ball',
  GYM_CLASS: 'gym',
  TRX: 'band',
  HIKE: 'hike',
  GARDENING: 'garden',
  OTHER: 'other',
}

// eslint-disable-next-line react-refresh/only-export-components
export function pictureKeyFor(m: { pictureKey?: string | null; code: string }): PictureKey {
  const k = (m.pictureKey ?? '').toLowerCase() as PictureKey
  if (k && k in PICTURES) return k
  return BY_CODE[m.code] ?? 'other'
}

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

const PICTURES: Record<PictureKey, ReactElement> = {
  walk: (
    <g {...S}>
      <circle cx="26" cy="9" r="3.5" />
      <path d="M22 20l4-5 5 3 3 5M26 15l-3 10-5 7M23 25l5 4 2 8M30 23l5 3" />
      <path d="M8 40h32" strokeDasharray="3 4" />
    </g>
  ),
  run: (
    <g {...S}>
      <circle cx="28" cy="8" r="3.5" />
      <path d="M24 18l5-4 6 3 4 4M29 14l-4 9-7 4M25 23l6 4-1 9M35 21l-4 6" />
      <path d="M6 36h6M4 30h8" />
    </g>
  ),
  cycle: (
    <g {...S}>
      <circle cx="12" cy="32" r="7" />
      <circle cx="36" cy="32" r="7" />
      <path d="M12 32l8-12h10l6 12M20 20l6 12h-6M28 20l-3-6h5" />
      <circle cx="31" cy="8" r="3" />
    </g>
  ),
  strength: (
    <g {...S}>
      <circle cx="24" cy="8" r="3.5" />
      <path d="M24 12v10M24 22l-8 7v9M24 22l8 7v9M14 18l10 4 10-4" />
    </g>
  ),
  dumbbell: (
    <g {...S}>
      <path d="M8 20v8M12 17v14M36 17v14M40 20v8M12 24h24" />
    </g>
  ),
  band: (
    <g {...S}>
      <circle cx="24" cy="8" r="3.5" />
      <path d="M24 12v12M24 24l-7 12M24 24l7 12M24 16l-12 4M24 16l12 4" />
      <path d="M12 20c-4 6-4 10 0 14M36 20c4 6 4 10 0 14" strokeDasharray="2 3" />
    </g>
  ),
  chair: (
    <g {...S}>
      <path d="M10 10v30M10 26h16v14M10 26l-4 0M6 18h4" />
      <circle cx="30" cy="12" r="3.5" />
      <path d="M30 16v10l6 6v8M30 26l-4 6M30 18l-10 2" />
    </g>
  ),
  mobility: (
    <g {...S}>
      <circle cx="18" cy="8" r="3.5" />
      <path d="M18 12c0 8-2 14 6 18l10 4M18 20l-10 6M24 30l-8 10M8 40h32" />
    </g>
  ),
  family: (
    <g {...S}>
      <circle cx="14" cy="10" r="3.5" />
      <circle cx="34" cy="16" r="2.5" />
      <path d="M14 14v12l-4 12M14 26l5 12M14 18l10 4M34 19v9l-3 10M34 28l3 10M34 22l-10 0" />
    </g>
  ),
  yoga: (
    <g {...S}>
      <circle cx="24" cy="8" r="3.5" />
      <path d="M24 12v14M24 26l-12 8M24 26l12 8M10 20l14 4 14-4M8 40h32" />
    </g>
  ),
  dance: (
    <g {...S}>
      <circle cx="26" cy="8" r="3.5" />
      <path d="M26 12l-6 10 4 8-6 10M24 20l10-6M24 30l10 6M20 22l-8-4" />
    </g>
  ),
  water: (
    <g {...S}>
      <circle cx="30" cy="18" r="3.5" />
      <path d="M8 26l6-4 8 4 8-4M4 34c4 0 4 3 8 3s4-3 8-3 4 3 8 3 4-3 8-3 4 3 8 3" />
    </g>
  ),
  ball: (
    <g {...S}>
      <circle cx="18" cy="8" r="3.5" />
      <path d="M18 12v12l-4 14M18 24l8 4 2 10M18 16l10 2" />
      <circle cx="36" cy="36" r="5" />
    </g>
  ),
  gym: (
    <g {...S}>
      <circle cx="24" cy="8" r="3.5" />
      <path d="M24 12v10M24 22l-6 14M24 22l6 14M10 16h28M10 13v6M38 13v6M24 16v-4" />
    </g>
  ),
  hike: (
    <g {...S}>
      <circle cx="22" cy="8" r="3.5" />
      <path d="M22 12v10l-6 14M22 22l6 6v8M22 16l8 2 4-8M34 10v26" />
      <path d="M4 40l10-12 8 6 10-14 12 20" />
    </g>
  ),
  garden: (
    <g {...S}>
      <circle cx="16" cy="10" r="3.5" />
      <path d="M16 14v12l-4 12M16 26l6 4 2 8M16 18l12 6 6-4" />
      <path d="M34 34c0-6 4-10 8-10 0 6-4 10-8 10zM34 34v6" />
    </g>
  ),
  balance: (
    <g {...S}>
      <circle cx="24" cy="8" r="3.5" />
      <path d="M24 12v16l-5 12M24 28l5-6M12 20l12 2 12-2M8 40h32" />
    </g>
  ),
  other: (
    <g {...S}>
      <path d="M16 12c3 0 5 3 5 7s-2 8-5 8-5-4-5-8 2-7 5-7zM32 20c3 0 5 3 5 7s-2 8-5 8-5-4-5-8 2-7 5-7zM13 30h6M29 38h6" />
    </g>
  ),
}

export interface ModalityPictureProps {
  pictureKey: PictureKey
  className?: string
  /** Decorative by default — the modality name sits beside it. */
  title?: string
}

export function ModalityPicture({ pictureKey, className, title }: ModalityPictureProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width="48"
      height="48"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {PICTURES[pictureKey] ?? PICTURES.other}
    </svg>
  )
}
