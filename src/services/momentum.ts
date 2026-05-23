import { api } from '@/lib/api'
import type { MomentumHistoryEntry } from '@/types'

/** Current momentum snapshot — mirrors MomentumResponse on the backend. */
export interface MomentumSnapshot {
  /** Moisture score 0–100 */
  current: number
  /** DRY | DRYING | MOIST | SATURATED */
  band: 'DRY' | 'DRYING' | 'MOIST' | 'SATURATED'
  /** Fractional well-watered-days sum since sign-up */
  wateredDaysTotal: number
  /** Most recent day with a momentum-bearing event; null if none */
  lastActiveDate: string | null
}

export const momentumService = {
  /**
   * Fetches the current momentum snapshot (score, band, wateredDaysTotal, lastActiveDate).
   * Endpoint: GET /api/users/me/momentum
   */
  getMomentum: (): Promise<MomentumSnapshot> =>
    api.get<MomentumSnapshot>('/api/users/me/momentum').then(r => r.data),

  /**
   * Fetches per-day moisture history for the last N days.
   * Response is ordered oldest-first (index 0 = N-1 days ago, last = today).
   * Endpoint: GET /api/users/me/momentum/history?days={days}
   */
  getHistory: (days = 14): Promise<MomentumHistoryEntry[]> =>
    api
      .get<MomentumHistoryEntry[]>('/api/users/me/momentum/history', {
        params: { days },
      })
      .then(r => r.data),
}
