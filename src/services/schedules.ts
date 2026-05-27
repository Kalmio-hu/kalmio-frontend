/**
 * schedules.ts — service for POST/GET/PATCH/DELETE /api/schedules
 * and the pause / resume / materialize sub-routes.
 *
 * Every exported function uses the shared Axios instance from lib/api.ts
 * (Bearer-token interceptor is already wired).
 */
import { api } from '@/lib/api'
import type { Schedule, CreateScheduleRequest, UpdateScheduleRequest } from '@/types'

export const schedulesService = {
  /** GET /api/schedules — list all schedules for the current user. */
  list: (): Promise<Schedule[]> =>
    api.get<Schedule[]>('/api/schedules').then(r => r.data),

  /** GET /api/schedules/{id} — single schedule. */
  getById: (id: string): Promise<Schedule> =>
    api.get<Schedule>(`/api/schedules/${id}`).then(r => r.data),

  /** POST /api/schedules — create a new schedule. */
  create: (req: CreateScheduleRequest): Promise<Schedule> =>
    api.post<Schedule>('/api/schedules', req, { requestIdempotencyKey: true }).then(r => r.data),

  /** PATCH /api/schedules/{id} — partial update. */
  update: (id: string, req: UpdateScheduleRequest): Promise<Schedule> =>
    api.patch<Schedule>(`/api/schedules/${id}`, req, { requestIdempotencyKey: true }).then(r => r.data),

  /** DELETE /api/schedules/{id} — soft-end the schedule. */
  delete: (id: string): Promise<void> =>
    api.delete(`/api/schedules/${id}`, { requestIdempotencyKey: true }).then(() => undefined),

  /** POST /api/schedules/{id}/pause */
  pause: (id: string): Promise<Schedule> =>
    api.post<Schedule>(`/api/schedules/${id}/pause`, null, { requestIdempotencyKey: true }).then(r => r.data),

  /** POST /api/schedules/{id}/resume */
  resume: (id: string): Promise<Schedule> =>
    api.post<Schedule>(`/api/schedules/${id}/resume`, null, { requestIdempotencyKey: true }).then(r => r.data),

  /**
   * POST /api/schedules/{id}/materialize
   * Triggers immediate materialization through the given date.
   */
  materialize: (id: string, throughDate: string): Promise<void> =>
    api.post(`/api/schedules/${id}/materialize`, { throughDate }, { requestIdempotencyKey: true }).then(() => undefined),

  // ── Template drift detection + re-run (KALMIO-323) ────────────────────────

  /**
   * GET /api/schedules/{id}/template-drift
   * Returns whether the plan template has changed since the schedule was created or
   * last re-run (diverge model). Used to show the TemplateDriftBanner.
   */
  checkTemplateDrift: (id: string): Promise<TemplateDriftResponse> =>
    api.get<TemplateDriftResponse>(`/api/schedules/${id}/template-drift`).then(r => r.data),

  /**
   * POST /api/schedules/{id}/re-run
   * Atomically ends the current schedule and creates a fresh one from the now-current
   * template. Implements the "Re-run" CTA on the TemplateDriftBanner.
   */
  reRun: (id: string): Promise<ReRunScheduleResponse> =>
    api.post<ReRunScheduleResponse>(`/api/schedules/${id}/re-run`, null, { requestIdempotencyKey: true }).then(r => r.data),
}

// ── Drift detection types (KALMIO-323) ────────────────────────────────────

export interface TemplateDriftResponse {
  scheduleId: string
  drifted: boolean
  currentSignature: string | null
  snapshotSignature: string | null
}

export interface ReRunScheduleResponse {
  endedScheduleId: string
  newSchedule: import('@/types').Schedule
}
