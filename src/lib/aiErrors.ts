/**
 * Maps the HTTP failure of a premium AI endpoint to a stable key the caller
 * turns into copy. Every @RequiresPremium controller follows the same contract:
 * 402 non-premium, 422 precondition (e.g. plan not ACTIVE), 429 per-minute or
 * monthly cap, 503 OpenAI unconfigured.
 */
export type AiErrorKind = 'premium' | 'precondition' | 'rateLimited' | 'unavailable' | 'generic'

export function aiErrorKind(err: unknown): AiErrorKind {
  const status = (err as { response?: { status?: number } })?.response?.status
  switch (status) {
    case 402: return 'premium'
    case 422: return 'precondition'
    case 429: return 'rateLimited'
    case 503: return 'unavailable'
    default: return 'generic'
  }
}
