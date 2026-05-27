import { api } from '@/lib/api'
import type { Recipe, CreateRecipeRequest, UpdateRecipeRequest, RecipeTranslations } from '@/types'

export const recipesService = {
  list: () => api.get<Recipe[]>('/api/recipes').then(r => r.data),
  get: (id: string) => api.get<Recipe>(`/api/recipes/${id}`).then(r => r.data),
  mine: () => api.get<Recipe[]>('/api/recipes/mine').then(r => r.data),
  create: (body: CreateRecipeRequest) => api.post<Recipe>('/api/recipes', body, { requestIdempotencyKey: true }).then(r => r.data),
  update: (id: string, body: UpdateRecipeRequest) => api.put<Recipe>(`/api/recipes/${id}`, body, { requestIdempotencyKey: true }).then(r => r.data),
  delete: (id: string) => api.delete(`/api/recipes/${id}`, { requestIdempotencyKey: true }),
  approveTranslation: (id: string) => api.post<Recipe>(`/api/recipes/${id}/approve-translation`, null, { requestIdempotencyKey: true }).then(r => r.data),
  updateTranslation: (id: string, body: RecipeTranslations) => api.put<Recipe>(`/api/recipes/${id}/translation`, body, { requestIdempotencyKey: true }).then(r => r.data),
  submitForReview: (id: string) => api.post<Recipe>(`/api/recipes/${id}/submit-for-review`, null, { requestIdempotencyKey: true }).then(r => r.data),
  withdrawFromReview: (id: string) => api.post<Recipe>(`/api/recipes/${id}/withdraw-review`, null, { requestIdempotencyKey: true }).then(r => r.data),
  uploadImage: (recipeId: string, file: File): Promise<Recipe> => {
    const form = new FormData()
    form.append('file', file)
    // No idempotency key: multipart/form-data uploads with binary blobs are not
    // replayable by BackgroundSync (blobs are not serialisable to IndexedDB).
    // The SW excludes binary uploads from the offline queue by default.
    return api.post<Recipe>(`/api/recipes/${recipeId}/image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
}
