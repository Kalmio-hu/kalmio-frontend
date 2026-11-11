/**
 * Review queue helpers (PRD §12.4): reason codes in keyboard order 1–6 and the
 * shot-card → readable rows projection. Kept out of the page for fast refresh
 * and so they can be unit-tested.
 */
import type { ReviewReasonCode, ShotCardDto } from '../types'

export const REASON_CODES: ReviewReasonCode[] = [
  'WRONG_JOINT_POSITION',
  'WRONG_SUPPORT',
  'ANATOMY_ERROR',
  'EQUIPMENT_ERROR',
  'UNSAFE_RANGE',
  'STYLE_DRIFT',
]

const KNOWN_KEYS = new Set(['poses', 'camera', 'checkpoints', 'faults', 'cues', 'equipment'])


function asList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' ? x : JSON.stringify(x)))
  if (typeof v === 'string') return [v]
  if (v && typeof v === 'object') return Object.entries(v as Record<string, unknown>).map(([k, x]) => `${k}: ${typeof x === 'string' ? x : JSON.stringify(x)}`)
  return v == null ? [] : [String(v)]
}

/** Shot card JSON → readable two-column rows: poses, camera, checkpoints, faults, cues, then the rest. */
export function shotCardRows(card: ShotCardDto, t: (k: string) => string): { label: string; values: string[] }[] {
  const rows: { label: string; values: string[] }[] = []
  const poses = card.poses
  if (poses) {
    if (Array.isArray(poses)) rows.push({ label: t('review.shotCard.poses'), values: asList(poses) })
    else {
      if (poses.start) rows.push({ label: `${t('review.shotCard.poses')} · ${t('review.shotCard.start')}`, values: [poses.start] })
      if (poses.end) rows.push({ label: `${t('review.shotCard.poses')} · ${t('review.shotCard.end')}`, values: [poses.end] })
    }
  }
  if (card.camera) rows.push({ label: t('review.shotCard.camera'), values: asList(card.camera) })
  if (card.checkpoints?.length) rows.push({ label: t('review.shotCard.checkpoints'), values: asList(card.checkpoints) })
  if (card.faults?.length) rows.push({ label: t('review.shotCard.faults'), values: asList(card.faults) })
  const cues = card.cues
  if (cues) {
    if (Array.isArray(cues)) rows.push({ label: t('review.shotCard.cues'), values: asList(cues) })
    else {
      if (cues.formal?.length) rows.push({ label: `${t('review.shotCard.cues')} · ${t('review.shotCard.formal')}`, values: cues.formal })
      if (cues.informal?.length) rows.push({ label: `${t('review.shotCard.cues')} · ${t('review.shotCard.informal')}`, values: cues.informal })
    }
  }
  if (card.equipment?.length) rows.push({ label: t('review.shotCard.equipment'), values: asList(card.equipment) })
  for (const [k, v] of Object.entries(card)) {
    if (KNOWN_KEYS.has(k) || v == null) continue
    rows.push({ label: k, values: asList(v) })
  }
  return rows
}
