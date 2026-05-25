/**
 * validators.ts — shared input-validation helpers.
 *
 * Design notes
 * ──────────────
 * RFC 5321 §4.1.2 permits a wide set of characters in the local part
 * of an email address.  The following are all valid:
 *
 *   plus alias   — teszt+tag@example.com
 *   dots         — nora.kovacs@example.com
 *   underscores  — user_name@example.com
 *   hyphens      — user-name@example.com
 *   percent      — user%tag@example.com
 *
 * Supabase's GoTrue service (the backend that processes magic-link
 * requests) accepts all of the above.  Any validator that rejects them
 * is a bug from the user's perspective.
 *
 * The regex below is a *pragmatic* subset of RFC 5321, biased toward
 * real-world email addresses.  It is intentionally NOT the full RFC
 * grammar (which permits quoted strings, IP literals, etc.) — those
 * forms are vanishingly rare and Supabase itself does not accept them.
 *
 * Guarantees:
 *   ✔ accepts local parts containing +  .  _  -  %
 *   ✔ rejects leading/trailing dots in the local part
 *   ✔ rejects consecutive dots in the local part
 *   ✔ requires exactly one @
 *   ✔ requires a domain with at least one dot and a 2+ char TLD
 *   ✔ rejects whitespace anywhere
 */

/**
 * Pragmatic RFC-5321-friendly email regex.
 * Character class for local part: A-Za-z0-9  .  _  %  +  -
 * (single quote ' is omitted — exotic and confuses users)
 */
export const EMAIL_RE =
  /^(?!\.)(?!.*\.\.)[A-Za-z0-9._%+-]+(?<!\.)@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

/**
 * Returns true if `value` is a syntactically valid email address for
 * use with Supabase magic-link / OTP authentication.
 *
 * This is the single source of truth for client-side email format
 * checks.  Use it in Zod schemas via `.refine(isValidEmail, …)` or
 * directly for imperative guards.
 */
export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}
