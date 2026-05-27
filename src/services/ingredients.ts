import { api } from '@/lib/api'
import type { Ingredient, CreateIngredientRequest, UpdateIngredientRequest, IngredientTranslations } from '@/types'

export const ingredientsService = {
  list: () => api.get<Ingredient[]>('/api/ingredients').then(r => r.data),
  get: (id: string) => api.get<Ingredient>(`/api/ingredients/${id}`).then(r => r.data),
  mine: () => api.get<Ingredient[]>('/api/ingredients/mine').then(r => r.data),
  create: (body: CreateIngredientRequest) => api.post<Ingredient>('/api/ingredients', body, { requestIdempotencyKey: true }).then(r => r.data),
  update: (id: string, body: UpdateIngredientRequest) => api.put<Ingredient>(`/api/ingredients/${id}`, body, { requestIdempotencyKey: true }).then(r => r.data),
  delete: (id: string) => api.delete(`/api/ingredients/${id}`, { requestIdempotencyKey: true }),
  approveTranslation: (id: string) => api.post<Ingredient>(`/api/ingredients/${id}/approve-translation`, null, { requestIdempotencyKey: true }).then(r => r.data),
  updateTranslation: (id: string, body: IngredientTranslations) => api.put<Ingredient>(`/api/ingredients/${id}/translation`, body, { requestIdempotencyKey: true }).then(r => r.data),
  submitForReview: (id: string) => api.post<Ingredient>(`/api/ingredients/${id}/submit-for-review`, null, { requestIdempotencyKey: true }).then(r => r.data),
  withdrawFromReview: (id: string) => api.post<Ingredient>(`/api/ingredients/${id}/withdraw-review`, null, { requestIdempotencyKey: true }).then(r => r.data),

  /**
   * Premium one-shot AI ingredient creation from a raw recipe-import line.
   *
   * Error mapping the UI relies on:
   *   - 402 = not premium (paywall)
   *   - 429 = per-minute rate limit or monthly soft cap
   *   - 502 = LLM returned unusable response
   *   - 503 = OpenAI not configured
   *
   * No idempotency key: this is a generative AI call — re-submitting the same
   * raw text intentionally creates a fresh parse attempt (the user may have
   * corrected the text). Backend has no deduplication constraint for this path.
   */
  createFromText: (rawText: string) =>
    api.post<Ingredient>('/api/ingredients/from-text', { rawText }).then(r => r.data),
}
