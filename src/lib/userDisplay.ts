/**
 * userDisplay.ts — member label resolution helpers for plan-related UI.
 *
 * Fallback chain (ordered):
 *   1. Full name    — firstName + lastName (both must be non-empty)
 *   2. First name   — firstName alone
 *   3. Email local-part — ONLY when it looks name-like (lowercase letters,
 *                          optional accents, optional single dot), first
 *                          letter capitalised. Synthetic / system emails
 *                          (`teszt+staff-qa-...`, `nora.kovacs+work@...`,
 *                          long hyphenated IDs, digits) skip this rung.
 *   4. Positional label — provided by the caller via `fallbackLabel`
 *                         (e.g. t('plan.detail.memberMe') or
 *                              t('plan.detail.memberFallback', { index: n }))
 *
 * Raw email is NEVER shown directly in a user-facing label.
 */

/**
 * Returns true when an email's local-part is plausibly a real name we can
 * show as a fallback. Accepts simple forms like `nora`, `nora.kovacs`,
 * `peter`, `peter.szabo`. Rejects anything containing `+`, digits, more
 * than one dot, hyphens, or a length suggesting a system identifier
 * (>24 chars).
 */
function isNameLikeLocalPart(local: string): boolean {
  if (!local || local.length > 24) return false
  if (/[+\-_0-9]/.test(local)) return false
  // Hungarian + ASCII letters, optional single dot between two words.
  return /^[a-záéíóöőúüű]+(?:\.[a-záéíóöőúüű]+)?$/i.test(local)
}

/**
 * Resolves a display name from potentially sparse user identity fields.
 *
 * @param opts.firstName    - User's first name (nullable)
 * @param opts.lastName     - User's last name (nullable)
 * @param opts.email        - User's email address (always set on UserSettings)
 * @param opts.fallbackLabel - i18n-resolved absolute last resort (e.g. "Én" / "Me"
 *                             or "2. tag" / "Member 2")
 */
export function resolveDisplayName(opts: {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  fallbackLabel: string
}): string {
  const { firstName, lastName, email, fallbackLabel } = opts

  // (a) + (b) — full name or first name only
  const first = firstName?.trim() ?? ''
  const last = lastName?.trim() ?? ''
  if (first && last) return `${first} ${last}`
  if (first) return first

  // (c) — email local-part, only when it looks name-like
  if (email) {
    const localPart = email.split('@')[0]
    if (localPart && isNameLikeLocalPart(localPart)) {
      return localPart.charAt(0).toUpperCase() + localPart.slice(1)
    }
  }

  // (d) — absolute last resort
  return fallbackLabel
}
