import { api } from '@/lib/api'
import type { PrepTaskCard } from '@/types'

/** Shape returned by GET /api/plans/{planId}/prep-tasks */
export interface PrepTaskDto {
  id: string
  planId: string
  scheduledDate: string        // ISO date "YYYY-MM-DD"
  scheduledWindow: string      // "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT"
  recipeId: string | null
  recipeName: string | null
  prepType: string             // "BATCH" | "OVERNIGHT" | "FREEZE_BATCH"
  status: string               // "PENDING" | "DONE" | "SKIPPED"
  durationMin: number | null
  completedAt: string | null   // ISO-8601
  scheduledTime: string | null // "HH:mm"
  servingsToMake: number | null
  servingsToFreeze: number | null
  feedsPlannedMealIds: string[]
}

/** Request body for PATCH /api/prep-tasks/{id}/schedule */
export interface UpdatePrepTaskScheduleRequest {
  scheduledDate: string        // ISO date "YYYY-MM-DD"
  scheduledTime?: string | null // "HH:mm" or null
}

export const prepTasksService = {
  /** GET /api/plans/{planId}/prep-tasks — all prep tasks for one plan. */
  listForPlan: (planId: string): Promise<PrepTaskDto[]> =>
    api.get<PrepTaskDto[]>(`/api/plans/${planId}/prep-tasks`).then(r => r.data),

  /**
   * PATCH /api/prep-tasks/{id}/schedule — move a prep task to a new date.
   * Also accepts an optional scheduledTime override.
   */
  patchSchedule: (taskId: string, body: UpdatePrepTaskScheduleRequest): Promise<PrepTaskDto> =>
    api.patch<PrepTaskDto>(`/api/prep-tasks/${taskId}/schedule`, body).then(r => r.data),

  /** PATCH /api/prep-tasks/{id}/scheduled-time — set or clear the time override. */
  patchScheduledTime: (taskId: string, scheduledTime: string | null): Promise<void> =>
    api.patch(`/api/prep-tasks/${taskId}/scheduled-time`, { scheduledTime }).then(() => undefined),

  /**
   * Convert a PrepTaskDto to the PrepTaskCard shape used by the dashboard
   * TodaysPrepModule — lets the PrepLane reuse the same display helpers.
   */
  toCard: (dto: PrepTaskDto): PrepTaskCard => ({
    id: dto.id,
    planId: dto.planId,
    recipeId: dto.recipeId ?? '',
    recipeName: dto.recipeName ?? '',
    prepType: dto.prepType as PrepTaskCard['prepType'],
    window: dto.scheduledWindow as PrepTaskCard['window'],
    scheduledDate: dto.scheduledDate,
    durationMin: dto.durationMin,
    status: dto.status,
    scheduledTime: dto.scheduledTime,
    servingsToMake: dto.servingsToMake,
    servingsToFreeze: dto.servingsToFreeze,
    feedsPlannedMealIds: dto.feedsPlannedMealIds,
  }),
}
