import { describe, it, expect } from 'vitest'
import {
  CONSENT_MAX_AGE_MS,
  CONSENT_STORAGE_KEY,
  LEGACY_CONSENT_KEY,
  hasMarketingConsent,
  hasStatisticsConsent,
  needsConsentDecision,
  onCookieSettingsRequested,
  openCookieSettings,
  preselectedChoices,
  readConsentRecord,
  saveConsent,
  subscribeConsent,
  type ConsentStorage,
} from './consent'

function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial))
  const storage: ConsentStorage = {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  }
  return { map, storage }
}

const NOW = Date.parse('2026-11-12T10:00:00Z')

describe('readConsentRecord', () => {
  it('returns null when nothing was ever decided', () => {
    const { storage } = memoryStorage()
    expect(readConsentRecord(storage)).toBeNull()
    expect(needsConsentDecision(null, NOW)).toBe(true)
  })

  it('migrates a legacy "accepted" to statistics on, marketing undecided — the banner shows once more', () => {
    const { map, storage } = memoryStorage({ [LEGACY_CONSENT_KEY]: 'accepted' })
    const record = readConsentRecord(storage)
    expect(record).toEqual({ version: 1, statistics: true, marketing: null, decidedAt: null })
    expect(map.has(LEGACY_CONSENT_KEY)).toBe(false)
    expect(JSON.parse(map.get(CONSENT_STORAGE_KEY)!)).toEqual(record)
    expect(needsConsentDecision(record, NOW)).toBe(true)
    expect(preselectedChoices(record)).toEqual({ statistics: true, marketing: false })
    expect(hasStatisticsConsent(storage)).toBe(true)
    expect(hasMarketingConsent(storage)).toBe(false)
  })

  it('migrates a legacy "declined" to statistics off', () => {
    const { storage } = memoryStorage({ [LEGACY_CONSENT_KEY]: 'declined' })
    expect(readConsentRecord(storage)).toEqual({ version: 1, statistics: false, marketing: null, decidedAt: null })
    expect(hasStatisticsConsent(storage)).toBe(false)
  })

  it('prefers the new record over a stale legacy value', () => {
    const record = { version: 1, statistics: false, marketing: true, decidedAt: '2026-11-01T00:00:00.000Z' }
    const { storage } = memoryStorage({
      [CONSENT_STORAGE_KEY]: JSON.stringify(record),
      [LEGACY_CONSENT_KEY]: 'accepted',
    })
    expect(readConsentRecord(storage)).toEqual(record)
  })

  it('ignores a corrupt record', () => {
    const { storage } = memoryStorage({ [CONSENT_STORAGE_KEY]: '{not json' })
    expect(readConsentRecord(storage)).toBeNull()
    const { storage: s2 } = memoryStorage({ [CONSENT_STORAGE_KEY]: JSON.stringify({ statistics: 'yes' }) })
    expect(readConsentRecord(s2)).toBeNull()
  })

  it('survives storage that throws (private mode)', () => {
    const throwing: ConsentStorage = {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
      removeItem: () => { throw new Error('blocked') },
    }
    expect(readConsentRecord(throwing)).toBeNull()
    expect(() => saveConsent({ statistics: true, marketing: true }, throwing)).not.toThrow()
  })
})

describe('saveConsent', () => {
  it('stores both categories with a timestamp and drops the legacy key', () => {
    const { map, storage } = memoryStorage({ [LEGACY_CONSENT_KEY]: 'accepted' })
    const record = saveConsent({ statistics: false, marketing: true }, storage, new Date(NOW))
    expect(record).toEqual({ version: 1, statistics: false, marketing: true, decidedAt: '2026-11-12T10:00:00.000Z' })
    expect(map.has(LEGACY_CONSENT_KEY)).toBe(false)
    expect(readConsentRecord(storage)).toEqual(record)
    expect(needsConsentDecision(record, NOW)).toBe(false)
    expect(hasMarketingConsent(storage)).toBe(true)
  })

  it('notifies subscribers until they unsubscribe', () => {
    const { storage } = memoryStorage()
    const seen: unknown[] = []
    const off = subscribeConsent((c) => seen.push(c))
    saveConsent({ statistics: true, marketing: false }, storage)
    off()
    saveConsent({ statistics: false, marketing: false }, storage)
    expect(seen).toEqual([{ statistics: true, marketing: false }])
  })
})

describe('needsConsentDecision', () => {
  const decided = (iso: string) => ({ version: 1 as const, statistics: true, marketing: false, decidedAt: iso })

  it('does not ask again within 12 months', () => {
    expect(needsConsentDecision(decided(new Date(NOW - CONSENT_MAX_AGE_MS + 60_000).toISOString()), NOW)).toBe(false)
  })

  it('asks again after 12 months, preselecting the saved choices', () => {
    const old = decided(new Date(NOW - CONSENT_MAX_AGE_MS).toISOString())
    expect(needsConsentDecision(old, NOW)).toBe(true)
    expect(preselectedChoices(old)).toEqual({ statistics: true, marketing: false })
  })

  it('asks when a category is undecided or the timestamp is unreadable', () => {
    expect(needsConsentDecision({ version: 1, statistics: true, marketing: null, decidedAt: '2026-11-01T00:00:00Z' }, NOW)).toBe(true)
    expect(needsConsentDecision({ version: 1, statistics: true, marketing: true, decidedAt: 'garbage' }, NOW)).toBe(true)
  })
})

describe('openCookieSettings', () => {
  it('reaches the registered banner', () => {
    let opened = 0
    const off = onCookieSettingsRequested(() => { opened++ })
    openCookieSettings()
    off()
    openCookieSettings()
    expect(opened).toBe(1)
  })
})
