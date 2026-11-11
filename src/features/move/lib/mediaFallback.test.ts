/**
 * Fallback chooser: approved pair → single approved still → pictogram + text;
 * never anything unapproved (PRD §12.1, contract §1).
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest'
import { chooseLibraryMedia, chooseStepMedia, isApproved } from './mediaFallback'
import type { MediaRefDto, ReviewStatus } from '../types'

function m(type: MediaRefDto['type'], characterCode: string, reviewStatus: ReviewStatus = 'APPROVED', extra: Partial<MediaRefDto> = {}): MediaRefDto {
  return { mediaId: `${type}-${characterCode}-${reviewStatus}`, type, url: `https://x/${type}-${characterCode}.png`, characterCode, generated: true, reviewStatus, ...extra }
}

describe('chooseLibraryMedia', () => {
  it('prefers the approved pair of the member demonstrator', () => {
    const media = [m('STILL_START', 'ILDIKO'), m('STILL_END', 'ILDIKO'), m('STILL_START', 'FERI'), m('STILL_END', 'FERI')]
    const c = chooseLibraryMedia(media, 'FERI', 'ILDIKO')
    expect(c.kind).toBe('PAIR')
    if (c.kind === 'PAIR') expect(c.start.characterCode).toBe('FERI')
  })

  it('falls back to the pack default character, then any character', () => {
    const media = [m('STILL_START', 'ILDIKO'), m('STILL_END', 'ILDIKO')]
    expect(chooseLibraryMedia(media, 'FERI', 'ILDIKO').kind).toBe('PAIR')
    const any = chooseLibraryMedia([m('STILL_START', 'KATA')], 'FERI', 'ILDIKO')
    expect(any.kind).toBe('STILL')
    if (any.kind === 'STILL') expect(any.still.characterCode).toBe('KATA')
  })

  it('uses a single approved still when the end still is missing or unapproved', () => {
    const c = chooseLibraryMedia([m('STILL_START', 'ILDIKO'), m('STILL_END', 'ILDIKO', 'PENDING')], 'ILDIKO', null)
    expect(c.kind).toBe('STILL')
  })

  it('never shows unapproved media — pending, rejected and unpublished all fall through to text', () => {
    const media = [m('STILL_START', 'ILDIKO', 'PENDING'), m('STILL_START', 'FERI', 'REJECTED'), m('STILL_END', 'FERI', 'UNPUBLISHED')]
    const c = chooseLibraryMedia(media, 'ILDIKO', 'FERI', 'https://x/picto.svg')
    expect(c).toEqual({ kind: 'TEXT', pictogramUrl: 'https://x/picto.svg' })
  })

  it('prefers an approved PICTOGRAM asset over the exercise pictogram in the text fallback', () => {
    const c = chooseLibraryMedia([m('PICTOGRAM', 'ILDIKO')], 'ILDIKO', null, 'https://x/own.svg')
    expect(c).toEqual({ kind: 'TEXT', pictogramUrl: 'https://x/PICTOGRAM-ILDIKO.png' })
    expect(chooseLibraryMedia([], null, null)).toEqual({ kind: 'TEXT', pictogramUrl: null })
    expect(chooseLibraryMedia(undefined, null, null)).toEqual({ kind: 'TEXT', pictogramUrl: null })
  })
})

describe('chooseStepMedia', () => {
  it('pair when both stills are approved, still when only the start is, text otherwise', () => {
    expect(chooseStepMedia({ media: m('STILL_START', 'ILDIKO'), endMedia: m('STILL_END', 'ILDIKO') }).kind).toBe('PAIR')
    expect(chooseStepMedia({ media: m('STILL_START', 'ILDIKO'), endMedia: m('STILL_END', 'ILDIKO', 'PENDING') }).kind).toBe('STILL')
    expect(chooseStepMedia({ media: m('STILL_START', 'ILDIKO', 'PENDING'), endMedia: null, pictogramUrl: 'p.svg' })).toEqual({ kind: 'TEXT', pictogramUrl: 'p.svg' })
    expect(chooseStepMedia({ media: null, endMedia: null })).toEqual({ kind: 'TEXT', pictogramUrl: null })
  })

  it('shows a loop through its still fallback only', () => {
    const c = chooseStepMedia({ media: m('LOOP', 'KATA', 'APPROVED', { fallbackUrl: 'https://x/still.png' }), endMedia: null })
    expect(c.kind).toBe('STILL')
    if (c.kind === 'STILL') expect(c.still.url).toBe('https://x/still.png')
    expect(chooseStepMedia({ media: m('LOOP', 'KATA'), endMedia: null }).kind).toBe('TEXT')
  })

  it('isApproved needs APPROVED and a url', () => {
    expect(isApproved(m('STILL_START', 'KATA'))).toBe(true)
    expect(isApproved(m('STILL_START', 'KATA', 'APPROVED', { url: '' }))).toBe(false)
    expect(isApproved(null)).toBe(false)
  })
})
