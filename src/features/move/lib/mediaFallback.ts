/**
 * Demonstration fallback chooser (PRD §12.1, contract §1).
 *
 * Order: approved still pair (start + end) → single approved still → pictogram
 * with text cues. Nothing that is not APPROVED is ever chosen, whatever the API
 * sent. Character preference: the member's demonstrator, then the pack default,
 * then any character — but BOGYO never demonstrates adult exercises and no
 * human demonstrates a GAME unit, which the API already enforces.
 */
import type { MediaRefDto, PlayerStepDto } from '../types'

export type MediaChoice =
  | { kind: 'PAIR'; start: MediaRefDto; end: MediaRefDto }
  | { kind: 'STILL'; still: MediaRefDto }
  | { kind: 'TEXT'; pictogramUrl: string | null }

export function isApproved(m: MediaRefDto | null | undefined): m is MediaRefDto {
  return !!m && m.reviewStatus === 'APPROVED' && typeof m.url === 'string' && m.url.length > 0
}

function pick(approved: MediaRefDto[], character: string | null, type: MediaRefDto['type']): MediaRefDto | undefined {
  return approved.find((m) => m.type === type && (character === null || m.characterCode === character))
}

/**
 * For a library entry: all of its media, the preferred and the fallback character.
 * `pictogramUrl` is the exercise's own pictogram when no approved PICTOGRAM media exists.
 */
export function chooseLibraryMedia(
  media: MediaRefDto[] | null | undefined,
  preferredCharacter: string | null,
  fallbackCharacter: string | null,
  pictogramUrl: string | null = null,
): MediaChoice {
  const approved = (media ?? []).filter(isApproved)
  const order: (string | null)[] = []
  for (const c of [preferredCharacter, fallbackCharacter, null]) {
    if (!order.includes(c)) order.push(c)
  }
  for (const character of order) {
    const start = pick(approved, character, 'STILL_START')
    if (!start) continue
    const end = pick(approved, start.characterCode, 'STILL_END')
    if (end) return { kind: 'PAIR', start, end }
    return { kind: 'STILL', still: start }
  }
  const picto = approved.find((m) => m.type === 'PICTOGRAM')
  return { kind: 'TEXT', pictogramUrl: picto?.url ?? pictogramUrl ?? null }
}

/** For a player step: the step carries its start (`media`) and end (`endMedia`) already resolved per character. */
export function chooseStepMedia(step: Pick<PlayerStepDto, 'media' | 'endMedia' | 'pictogramUrl'>): MediaChoice {
  const start = isApproved(step.media) ? step.media : null
  const end = isApproved(step.endMedia) ? step.endMedia : null
  if (start && end && start.type !== 'LOOP') return { kind: 'PAIR', start, end }
  if (start && start.type !== 'LOOP') return { kind: 'STILL', still: start }
  // A loop is not shown in M1 (no reviewed clips yet); its still fallback is.
  if (start && start.type === 'LOOP' && start.fallbackUrl) {
    return { kind: 'STILL', still: { ...start, type: 'STILL_START', url: start.fallbackUrl } }
  }
  const picto = step.pictogramUrl ?? (step.media?.type === 'PICTOGRAM' ? step.media.url : null) ?? step.media?.fallbackUrl ?? null
  return { kind: 'TEXT', pictogramUrl: picto }
}

/** Honour `prefers-reduced-motion`: a pair is shown as two stills, never cross-faded. */
export function prefersReducedMotion(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}
