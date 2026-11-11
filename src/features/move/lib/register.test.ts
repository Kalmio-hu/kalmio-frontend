/**
 * Register helper — picks `${key}_formal` only when the register is FORMAL and
 * the formal key exists (contract §13, §14).
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest'
import { resolveRegisterKey } from './register'
import hu from '../i18n/move.hu.json'
import en from '../i18n/move.en.json'

function flatten(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flatten(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`],
  )
}

const huKeys = new Set(flatten(hu as Record<string, unknown>))
const exists = (k: string) => huKeys.has(k)

describe('resolveRegisterKey', () => {
  it('returns the plain key for INFORMAL', () => {
    expect(resolveRegisterKey('today.start', 'INFORMAL', exists)).toBe('today.start')
  })

  it('returns the plain key when the register is unknown', () => {
    expect(resolveRegisterKey('today.start', null, exists)).toBe('today.start')
    expect(resolveRegisterKey('today.start', undefined, exists)).toBe('today.start')
  })

  it('returns the _formal sibling for FORMAL when it exists', () => {
    expect(resolveRegisterKey('today.empty', 'FORMAL', exists)).toBe('today.empty_formal')
  })

  it('falls back to the plain key for FORMAL when no sibling exists', () => {
    expect(resolveRegisterKey('nav.today', 'FORMAL', exists)).toBe('nav.today')
  })
})

describe('move namespace parity', () => {
  it('hu and en carry the same keys', () => {
    const enKeys = flatten(en as Record<string, unknown>).sort()
    expect([...huKeys].sort()).toEqual(enKeys)
  })

  it('every _formal key has an informal base key', () => {
    for (const key of huKeys) {
      if (key.endsWith('_formal')) {
        expect(huKeys.has(key.slice(0, -'_formal'.length)), `${key} has no base key`).toBe(true)
      }
    }
  })

  it('uses none of the banned words (PRD §16)', () => {
    const banned = [
      'esésmegelőzés', 'eséskockázat', 'égess el', 'ledolgozod', 'személyi edző', 'edződ',
      'rehabilitáció', 'terápia', 'kezelés', 'lemaradtál', 'pótold be', 'idősek tornája', 'szenior', 'kalória',
    ]
    const text = JSON.stringify(hu).toLowerCase()
    for (const word of banned) {
      expect(text.includes(word), `banned word "${word}" found in move.hu.json`).toBe(false)
    }
    // "gyógytorna" is banned as a label; the only sanctioned use is the reviewer line.
    const stripped = text.replaceAll('gyógytornász ellenőrizte', '')
    expect(stripped.includes('gyógytorna')).toBe(false)
  })
})
