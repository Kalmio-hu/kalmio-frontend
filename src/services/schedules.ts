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
    api.post<Schedule>('/api/schedules', req).then(r => r.data),

  /** PATCH /api/schedules/{id} — partial update. */
  update: (id: string, req: UpdateScheduleRequest): Promise<Schedule> =>
    api.patch<Schedule>(`/api/schedules/${id}`, req).then(r => r.data),

  /** DELETE /api/schedules/{id} — soft-end the schedule. */
  delete: (id: string): Promise<void> =>
    api.delete(`/api/schedules/${id}`).then(() => undefined),

  /** POST /api/schedules/{id}/pause */
  pause: (id: string): Promise<Schedule> =>
    api.post<Schedule>(`/api/schedules/${id}/pause`).then(r => r.data),

  /** POST /api/schedules/{id}/resume */
  resume: (id: string): Promise<Schedule> =>
    api.post<Schedule>(`/api/schedules/${id}/resume`).then(r => r.data),

  /**
   * POST /api/schedules/{id}/materialize
   * Triggers immediate materialization through the given date.
   */
  materialize: (id: string, throughDate: string): Promise<void> =>
    api.post(`/api/schedules/${id}/materialize`, { throughDate }).then(() => undefined),
}
