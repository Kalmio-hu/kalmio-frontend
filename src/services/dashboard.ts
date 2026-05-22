import { api } from '@/lib/api'
import type {
  CalendarDayDto,
  DailyMacroDto,
  DashboardDto,
  LogOffPlanMealRequest,
  UpdateOffPlanMealRequest,
  WeeklySummaryDto,
} from '@/types'

export const dashboardService = {
  get: (date?: string): Promise<DashboardDto> => {
    const params = date ? { date } : {}
    return api.get<DashboardDto>('/api/dashboard', { params }).then(r => r.data)
  },

  getMacros: (date: string): Promise<DailyMacroDto> =>
    api.get<DailyMacroDto>('/api/macros/daily', { params: { date } }).then(r => r.data),

  logOffPlanMeal: (req: LogOffPlanMealRequest): Promise<unknown> =>
    api.post('/api/off-plan-meals', req).then(r => r.data),

  updateOffPlanMeal: (id: string, req: UpdateOffPlanMealRequest): Promise<unknown> =>
    api.patch(`/api/off-plan-meals/${id}`, req).then(r => r.data),

  deleteOffPlanMeal: (id: string): Promise<void> =>
    api.delete(`/api/off-plan-meals/${id}`).then(r => r.data),

  getCalendar: (from: string, to: string): Promise<CalendarDayDto[]> =>
    api.get<CalendarDayDto[]>('/api/dashboard/calendar', { params: { from, to } }).then(r => r.data),

  getWeeklySummary: (days = 7): Promise<WeeklySummaryDto> =>
    api.get<WeeklySummaryDto>('/api/dashboard/weekly-summary', { params: { days } }).then(r => r.data),
}

export const prepTaskService = {
  updateStatus: (id: string, status: string): Promise<unknown> =>
    api.patch(`/api/prep-tasks/${id}/status`, { status }).then(r => r.data),
}
