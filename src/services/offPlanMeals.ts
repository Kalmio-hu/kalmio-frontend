import { api } from '@/lib/api'
import type {
  OffPlanMealCard,
  LogOffPlanMealRequest,
  AiOffPlanLogTextRequest,
  AiOffPlanLogResponse,
  MealType,
} from '@/types'

export const offPlanMealsService = {
  log: (req: LogOffPlanMealRequest): Promise<OffPlanMealCard> =>
    api.post<OffPlanMealCard>('/api/dashboard/off-plan-meals', req).then(r => r.data),

  list: (date: string): Promise<OffPlanMealCard[]> =>
    api.get<OffPlanMealCard[]>('/api/dashboard/off-plan-meals', { params: { date } }).then(r => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/api/dashboard/off-plan-meals/${id}`).then(() => undefined),

  /**
   * Sets or clears (with null) the timeline scheduled time for an off-plan meal.
   * Time is HH:mm; null restores the createdAt-derived slot.
   */
  patchScheduledTime: (id: string, scheduledTime: string | null): Promise<void> =>
    api
      .patch(`/api/dashboard/off-plan-meals/${id}/scheduled-time`, { scheduledTime })
      .then(() => undefined),

  /**
   * Premium: parse a free-text meal description via gpt-4o-mini and persist it.
   * 402 = not premium, 429 = rate-limited (10/min).
   */
  logFromText: (req: AiOffPlanLogTextRequest): Promise<AiOffPlanLogResponse> =>
    api.post<AiOffPlanLogResponse>('/api/off-plan-meals/from-text', req).then(r => r.data),

  /**
   * Premium: transcribe a voice memo via Whisper, parse, and persist.
   * Max 25 MB; accepted MIME: audio/m4a, audio/mp4, audio/wav, audio/webm,
   * audio/ogg, audio/mpeg, audio/x-m4a.
   * 402 = not premium, 413 = too large, 415 = unsupported type, 429 = rate-limited.
   */
  logFromVoice: (
    audio: File,
    opts?: { mealType?: MealType; eatenAt?: string },
  ): Promise<AiOffPlanLogResponse> => {
    const form = new FormData()
    form.append('audio', audio)
    if (opts?.mealType) form.append('mealType', opts.mealType)
    if (opts?.eatenAt) form.append('eatenAt', opts.eatenAt)
    return api
      .post<AiOffPlanLogResponse>('/api/off-plan-meals/from-voice', form)
      .then(r => r.data)
  },

  /**
   * Premium: identify a meal in a photo via gpt-4o vision and persist.
   * Max 5 MB; accepted MIME: image/jpeg, image/png, image/webp.
   * Hourly bucket of 5; monthly soft cap of 30.
   * 402 = not premium / monthly cap reached, 413 = too large, 415 = unsupported,
   * 429 = hourly limit hit.
   */
  logFromPhoto: (
    image: File,
    opts?: { mealType?: MealType; eatenAt?: string },
  ): Promise<AiOffPlanLogResponse> => {
    const form = new FormData()
    form.append('image', image)
    if (opts?.mealType) form.append('mealType', opts.mealType)
    if (opts?.eatenAt) form.append('eatenAt', opts.eatenAt)
    return api
      .post<AiOffPlanLogResponse>('/api/off-plan-meals/from-photo', form)
      .then(r => r.data)
  },
}
