/**
 * Limits in the user's words (PRD §3 principle 10) — "térdelni fáj" style
 * statements mapped to contraindication tags. The sentence is the UI; the tag
 * is what the engines filter on. Wording lives in i18n under `settings.limits.statements.<key>`.
 */
import type { ContraindicationTag } from '../types'

export interface LimitStatement {
  key: string
  tag: ContraindicationTag
}

export const LIMIT_STATEMENTS: readonly LimitStatement[] = [
  { key: 'kneeling', tag: 'knee_deep_flexion' },
  { key: 'floor', tag: 'floor_transfer' },
  { key: 'overhead', tag: 'overhead' },
  { key: 'bending', tag: 'spinal_flexion' },
  { key: 'jumping', tag: 'impact' },
  { key: 'oneLeg', tag: 'single_leg_balance' },
  { key: 'grip', tag: 'grip' },
  { key: 'wrist', tag: 'wrist_load' },
  { key: 'neck', tag: 'neck_rotation' },
  { key: 'breath', tag: 'breath_hold' },
]

export function statementForTag(tag: ContraindicationTag): LimitStatement | undefined {
  return LIMIT_STATEMENTS.find((s) => s.tag === tag)
}
