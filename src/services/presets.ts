import { api } from '@/lib/api'
import type { EatingPatternPreset, EatingPatternPresetId } from '@/types'
import type { UserSettings } from '@/services/users'

/** Canonical TanStack Query key for GET /api/preferences/presets */
export const PRESETS_QUERY_KEY = ['preferences', 'presets'] as const

/**
 * Eating-pattern presets (docs/product/composable-meals.md §5). Applying one is the same
 * settings write the preferences form does — the backend wraps PUT /api/users/me/settings.
 */
export const presetsService = {
  list: () => api.get<EatingPatternPreset[]>('/api/preferences/presets').then(r => r.data),
  apply: (id: EatingPatternPresetId) =>
    api.post<UserSettings>(`/api/preferences/presets/${id}/apply`, null, { requestIdempotencyKey: true })
      .then(r => r.data),
}
