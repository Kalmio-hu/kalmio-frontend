import { api } from '@/lib/api'
import type { CravingsCoachResponse } from '@/types'

/**
 * Cravings coach — single-turn eating-pattern observation (premium).
 * POST /api/coach/observe. Medical-sounding prompts are redirected server-side
 * without an LLM call. 402 non-premium, 429 rate limit (2/min) or monthly cap.
 */
export const coachService = {
  observe: (userPrompt: string): Promise<CravingsCoachResponse> =>
    api.post<CravingsCoachResponse>('/api/coach/observe', { userPrompt }).then(r => r.data),
}
