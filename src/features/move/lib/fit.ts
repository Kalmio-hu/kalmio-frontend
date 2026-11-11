import type { SessionFormat } from '../types'

/** Only Card and Target sessions export as .FIT (PRD §7.11). */
export function exportsFit(format: SessionFormat): boolean {
  return format === 'CARD' || format === 'TARGET'
}
