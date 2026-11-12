/**
 * Cookie consent storage — necessary / statistics / marketing.
 *
 *   necessary  — always on (sign-in, language, this record, the Barion Base Pixel's fraud-prevention cookies).
 *   statistics — PostHog product analytics.
 *   marketing  — Barion Full Pixel marketing use (bp('consent', 'grantConsent' | 'rejectConsent')).
 *
 * The choice is stored in localStorage with the moment it was made. The banner asks again when
 * a category is still undecided or the decision is older than 12 months; the saved choices stay
 * in effect and are preselected until the visitor answers.
 *
 * Migration: the previous banner stored a single analytics value under `kalmio-analytics-consent`.
 * "accepted" becomes statistics on, "declined" statistics off; marketing stays undecided so the
 * banner shows once more, with statistics preselected.
 *
 * Every function takes an optional storage so the logic is testable without a browser.
 */

export const CONSENT_STORAGE_KEY = 'kalmio-cookie-consent'
export const LEGACY_CONSENT_KEY = 'kalmio-analytics-consent'

/** A decision is re-asked after 12 months. */
export const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000

export interface ConsentChoices {
  statistics: boolean
  marketing: boolean
}

export interface ConsentRecord {
  version: 1
  /** null = never decided. */
  statistics: boolean | null
  /** null = never decided. */
  marketing: boolean | null
  /** ISO timestamp of the last explicit decision; null for a migrated record. */
  decidedAt: string | null
}

export type ConsentStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function defaultStorage(): ConsentStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

function isTriState(v: unknown): v is boolean | null {
  return v === true || v === false || v === null
}

function parseRecord(raw: string | null): ConsentRecord | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw) as Partial<ConsentRecord> | null
    if (!v || typeof v !== 'object') return null
    const statistics = v.statistics ?? null
    const marketing = v.marketing ?? null
    const decidedAt = typeof v.decidedAt === 'string' ? v.decidedAt : null
    if (!isTriState(statistics) || !isTriState(marketing)) return null
    return { version: 1, statistics, marketing, decidedAt }
  } catch {
    return null
  }
}

/**
 * Reads the stored record, migrating the legacy single-value analytics consent on first read.
 * Returns null when nothing was ever decided.
 */
export function readConsentRecord(storage: ConsentStorage | null = defaultStorage()): ConsentRecord | null {
  if (!storage) return null
  try {
    const current = parseRecord(storage.getItem(CONSENT_STORAGE_KEY))
    if (current) return current

    const legacy = storage.getItem(LEGACY_CONSENT_KEY)
    if (legacy === 'accepted' || legacy === 'declined') {
      const migrated: ConsentRecord = {
        version: 1,
        statistics: legacy === 'accepted',
        marketing: null,
        decidedAt: null,
      }
      storage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(migrated))
      storage.removeItem(LEGACY_CONSENT_KEY)
      return migrated
    }
    return null
  } catch {
    return null
  }
}

/** True when the banner must ask: a category is undecided or the decision is older than 12 months. */
export function needsConsentDecision(record: ConsentRecord | null, now: number = Date.now()): boolean {
  if (!record) return true
  if (record.statistics === null || record.marketing === null) return true
  if (!record.decidedAt) return true
  const decided = Date.parse(record.decidedAt)
  if (Number.isNaN(decided)) return true
  return now - decided >= CONSENT_MAX_AGE_MS
}

/** The toggles the settings panel opens with: saved choices, undecided as off. */
export function preselectedChoices(record: ConsentRecord | null): ConsentChoices {
  return {
    statistics: record?.statistics === true,
    marketing: record?.marketing === true,
  }
}

export function hasStatisticsConsent(storage: ConsentStorage | null = defaultStorage()): boolean {
  return readConsentRecord(storage)?.statistics === true
}

export function hasMarketingConsent(storage: ConsentStorage | null = defaultStorage()): boolean {
  return readConsentRecord(storage)?.marketing === true
}

// ── Change notifications ──────────────────────────────────────────────────────

type ConsentListener = (choices: ConsentChoices) => void
const consentListeners = new Set<ConsentListener>()

/** Subscribes to saved decisions. Returns the unsubscribe function. */
export function subscribeConsent(listener: ConsentListener): () => void {
  consentListeners.add(listener)
  return () => {
    consentListeners.delete(listener)
  }
}

/** Stores an explicit decision with the current timestamp and notifies subscribers. */
export function saveConsent(
  choices: ConsentChoices,
  storage: ConsentStorage | null = defaultStorage(),
  now: Date = new Date(),
): ConsentRecord {
  const record: ConsentRecord = {
    version: 1,
    statistics: choices.statistics,
    marketing: choices.marketing,
    decidedAt: now.toISOString(),
  }
  try {
    storage?.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record))
    storage?.removeItem(LEGACY_CONSENT_KEY)
  } catch {
    // Storage blocked (private mode): the choice still applies for this page view.
  }
  consentListeners.forEach((l) => l({ ...choices }))
  return record
}

// ── Reopening the banner ("Sütibeállítások" in the footer) ─────────────────────

type OpenListener = () => void
const openListeners = new Set<OpenListener>()

export function onCookieSettingsRequested(listener: OpenListener): () => void {
  openListeners.add(listener)
  return () => {
    openListeners.delete(listener)
  }
}

/** Opens the cookie banner on its detailed settings view. */
export function openCookieSettings(): void {
  openListeners.forEach((l) => l())
}
