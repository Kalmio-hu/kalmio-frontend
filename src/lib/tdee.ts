/**
 * Frontend mirror of backend GoalTargetService.computeTdee — used to render a
 * live preview in forms before the body data has been persisted. Once saved,
 * `/api/users/me/tdee` is the source of truth.
 *
 * Formula: Mifflin-St Jeor BMR × ActivityLevel multiplier. Multipliers and
 * sex offsets must stay in lockstep with the backend
 * (see ActivityLevel.java, GoalTargetService.computeBmr).
 */

import type { BiologicalSex, ActivityLevel } from '@/types'

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
}

const SEX_OFFSET: Record<BiologicalSex, number> = {
  MALE: 5,
  FEMALE: -161,
  PREFER_NOT_TO_SAY: -78,
}

export interface BodyDataInput {
  weightKg: number | null
  heightCm: number | null
  ageYears: number | null
  biologicalSex: BiologicalSex | null
  activityLevel: ActivityLevel | null
}

/**
 * Returns TDEE in kcal/day rounded to the nearest integer, or null if any
 * input is missing or out of a sane physiological range.
 */
export function computeTdeePreview(body: BodyDataInput): number | null {
  const { weightKg, heightCm, ageYears, biologicalSex, activityLevel } = body
  if (
    weightKg == null || heightCm == null || ageYears == null ||
    biologicalSex == null || activityLevel == null
  ) {
    return null
  }
  if (
    !Number.isFinite(weightKg) || weightKg <= 0 ||
    !Number.isFinite(heightCm) || heightCm <= 0 ||
    !Number.isFinite(ageYears) || ageYears <= 0
  ) {
    return null
  }
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + SEX_OFFSET[biologicalSex]
  return Math.round(bmr * ACTIVITY_MULTIPLIER[activityLevel])
}
