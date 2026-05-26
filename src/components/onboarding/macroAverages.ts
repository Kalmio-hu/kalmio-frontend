/**
 * macroAverages — KALMIO-454
 *
 * App-wide average macros per serving, hardcoded from a fleet sample.
 * Computed from /api/recipes responses on 2026-05-26 (50 recipes sampled).
 * Refresh by re-running: docs/dev-team/scripts/compute-macro-averages.md
 */

export const APP_AVG_MACROS = {
  kcal:     480,
  proteinG:  32,
  fatG:      18,
  carbsG:    52,
} as const
