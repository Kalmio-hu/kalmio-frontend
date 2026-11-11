/**
 * MoveTodayBlock — the one Move card on the shared "Ma" dashboard (PRD §10).
 *
 * `Dashboard.tsx` passes `dashboard.movement` through untyped (the backend port
 * returns it as Object for the same reason: the nutrition side stays free of
 * movement types). The block renders nothing when the DTO is absent, and the
 * implementation chunk is only loaded when there is something to show, so the
 * nutrition bundle does not grow (D8 rule 10).
 */
import { lazy, Suspense } from 'react'
import type { MovementTodayBlockDto } from '../types'

const Inner = lazy(() => import('./MoveTodayBlockInner').then((m) => ({ default: m.MoveTodayBlockInner })))

function isMovementBlock(value: unknown): value is MovementTodayBlockDto {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return typeof v.date === 'string' && typeof v.restDay === 'boolean' && typeof v.checkIn === 'object'
}

export function MoveTodayBlock({ movement }: { movement: unknown }) {
  if (!isMovementBlock(movement)) return null
  return (
    <Suspense fallback={null}>
      <Inner movement={movement} />
    </Suspense>
  )
}
