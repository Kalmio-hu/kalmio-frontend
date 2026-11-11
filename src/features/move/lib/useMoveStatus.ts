/**
 * useMoveStatus — the one call the shell makes before deciding what to show
 * (build contract §3). `GET /api/move/status` answers 200 with
 * `{ enabled: false, … }` when the gate is off, and any transport error falls
 * back to the same defaults, so callers never need 404/500 handling.
 *
 * Only runs with a session: the Axios 401 handler would otherwise sign the
 * visitor out of public pages that render the Header.
 */
import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { moveService } from '../services/moveService'
import { moveKeys } from './queryKeys'
import { DEFAULT_MOVE_STATUS, type MoveStatusDto, type Space } from '../types'

export interface MoveStatusHandle {
  status: MoveStatusDto
  /** True while the first answer is still on its way (and a session exists). */
  isLoading: boolean
  /** Records the space the member is using; optimistic on the cached status. */
  setLastSpace: (space: Space) => Promise<void>
}

export function useMoveStatus(): MoveStatusHandle {
  const hasSession = useAuthStore((s) => !!s.session || !!s.impersonationToken)
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: moveKeys.status,
    queryFn: () => moveService.getStatus().catch(() => DEFAULT_MOVE_STATUS),
    staleTime: 60_000,
    retry: false,
    enabled: hasSession,
  })

  const setLastSpace = useCallback(
    async (space: Space) => {
      qc.setQueryData<MoveStatusDto>(moveKeys.status, (old) => ({
        ...(old ?? DEFAULT_MOVE_STATUS),
        lastSpace: space,
      }))
      try {
        await moveService.setLastSpace(space)
      } catch {
        // Best effort — the next status fetch restores the server's view.
      }
    },
    [qc],
  )

  return {
    status: query.data ?? DEFAULT_MOVE_STATUS,
    isLoading: hasSession && query.isPending,
    setLastSpace,
  }
}
