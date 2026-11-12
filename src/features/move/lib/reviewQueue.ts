/**
 * Review queue helpers (PRD §12.4): reason codes in keyboard order 1–6 and the
 * shot-card → readable rows projection. Kept out of the page for fast refresh
 * and so they can be unit-tested.
 */
import type { MediaType, PendingGroupDto, ReviewQueueDto, ReviewReasonCode, ReviewStatus, ShotCardDto } from '../types'

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

/** The backend's queue wire format (MovementContentDtos.ReviewQueueResponse). */
interface RawMedia {
  id: string; exerciseId: string; characterCode: string; mediaType: MediaType; style: string | null; url: string
  shotCardVersion: number; provider: string | null; model: string | null; attempt: number; reportCount: number
  reviewStatus: ReviewStatus; createdAt: string
}
export interface RawReviewQueue {
  items: { media: RawMedia; exercise: { id: string; code: string; packCode: string; nameHu: string; nameEn: string | null }
    shotCard: Record<string, unknown> | null; pairedStill: RawMedia | null }[]
  pending: number; approved: number; rejected: number; unpublished: number
}

/** Shot cards are stored snake_case by the content pipeline; the review page reads the camelCase shape. */
function toShotCard(raw: Record<string, unknown> | null): ShotCardDto {
  if (!raw) return {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the id and name repeat the page header
  const { start_pose, end_pose, common_faults, cues_hu, exercise_id, name, ...rest } = raw
  const card: ShotCardDto = { ...rest }
  if (start_pose || end_pose) card.poses = { start: start_pose as string | undefined, end: end_pose as string | undefined }
  if (common_faults) card.faults = common_faults as string[]
  if (cues_hu) card.cues = cues_hu as string[]
  return card
}

export function toReviewQueue(raw: RawReviewQueue, groups: PendingGroupDto[], lang: string,
                              characterName: (code: string) => string): ReviewQueueDto {
  return {
    items: raw.items.map(({ media, exercise, shotCard, pairedStill }) => ({
      mediaId: media.id,
      exerciseId: media.exerciseId,
      exerciseCode: exercise.code,
      exerciseName: (lang.startsWith('en') ? exercise.nameEn : null) ?? exercise.nameHu,
      pack: exercise.packCode,
      characterCode: media.characterCode,
      characterName: characterName(media.characterCode),
      mediaType: media.mediaType,
      url: media.url,
      pairUrl: pairedStill?.url ?? null,
      style: media.style,
      shotCardVersion: media.shotCardVersion,
      provider: media.provider,
      model: media.model,
      attempt: media.attempt,
      reportCount: media.reportCount,
      status: media.reviewStatus,
      createdAt: media.createdAt,
      shotCard: toShotCard(shotCard),
    })),
    counts: { pending: raw.pending, approved: raw.approved, rejected: raw.rejected, unpublished: raw.unpublished },
    packs: Array.from(new Set(groups.map((g) => g.packCode))).sort(),
    characters: Array.from(new Set(groups.map((g) => g.characterCode))).sort()
      .map((code) => ({ code, name: characterName(code) })),
  }
}
