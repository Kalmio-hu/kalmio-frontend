/**
 * Register-aware translation for Kalmio Move (PRD §16, contract §13).
 *
 * The supported-exercise pack and helper-set-up profiles address the member
 * formally ("Ön"); everything else is informal like the rest of Kalmio. Keys
 * that differ carry a `_formal` sibling in `move.hu.json` / `move.en.json`.
 * `useMoveT()` returns a `t` bound to the `move` namespace that picks
 * `${key}_formal` when the profile register is FORMAL and that key exists.
 */
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { Register } from '../types'
import { useMoveStatus } from './useMoveStatus'

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

export type MoveTFunction = (key: string, options?: Record<string, unknown>) => string

export interface MoveTHandle {
  t: MoveTFunction
  register: Register | null
  i18n: ReturnType<typeof useTranslation>['i18n']
}

/**
 * @param registerOverride  use when the page knows a register the status does
 *                          not (e.g. the start flow before a profile exists).
 */
export function useMoveT(registerOverride?: Register | null): MoveTHandle {
  const { t: raw, i18n } = useTranslation(MOVE_NS)
  const { status } = useMoveStatus()
  const register = registerOverride ?? status.register ?? null

  const t = useCallback<MoveTFunction>(
    (key, options) => {
      const resolved = resolveRegisterKey(key, register, (k) => i18n.exists(k, { ns: MOVE_NS }))
      return raw(resolved, options as never) as unknown as string
    },
    [raw, i18n, register],
  )

  return { t, register, i18n }
}
