/** The pure half of `register.ts`: no React, no API client, so tests and plain modules can import it. */
import type { Register } from '../types'

export const MOVE_NS = 'move'
export const FORMAL_SUFFIX = '_formal'

/**
 * Pure key resolver — exported for tests and for places without React.
 * @param exists  tells whether a key is defined in the `move` namespace
 */
export function resolveRegisterKey(
  key: string,
  register: Register | null | undefined,
  exists: (key: string) => boolean,
): string {
  if (register !== 'FORMAL') return key
  const formal = `${key}${FORMAL_SUFFIX}`
  return exists(formal) ? formal : key
}
