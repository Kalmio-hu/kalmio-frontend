import { api } from '@/lib/api'
import type { StartGroomingResponse, GroomingSession, GroomingDecision } from '@/types'

export const groomingService = {
  // No idempotency key: /api/grooming/start creates a new grooming session each time.
  // There is no unique constraint the backend can deduplicate against — each call is
  // intentionally a fresh pantry-review session. Excluded from BackgroundSync by the
  // SW via the /replan exclusion path (grooming sessions are similarly one-shot).
  start: (): Promise<StartGroomingResponse> =>
    api.post<StartGroomingResponse>('/api/grooming/start').then(r => r.data),

  complete: (sessionId: string, decisions: GroomingDecision[]): Promise<GroomingSession> =>
    api.post<GroomingSession>(`/api/grooming/${sessionId}/complete`, { decisions }, { requestIdempotencyKey: true }).then(r => r.data),

  getById: (sessionId: string): Promise<GroomingSession> =>
    api.get<GroomingSession>(`/api/grooming/${sessionId}`).then(r => r.data),
}
