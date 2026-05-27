import { api } from '@/lib/api'
import type { Recipe, Ingredient } from '@/types'

export const adminContentService = {
  pendingRecipes: () => api.get<Recipe[]>('/api/admin/recipes/pending').then(r => r.data),
  approveRecipe: (id: string) => api.post<Recipe>(`/api/admin/recipes/${id}/approve`, null, { requestIdempotencyKey: true }).then(r => r.data),
  rejectRecipe: (id: string) => api.post<Recipe>(`/api/admin/recipes/${id}/reject`, null, { requestIdempotencyKey: true }).then(r => r.data),
  pendingIngredients: () => api.get<Ingredient[]>('/api/admin/ingredients/pending').then(r => r.data),
  approveIngredient: (id: string) => api.post<Ingredient>(`/api/admin/ingredients/${id}/approve`, null, { requestIdempotencyKey: true }).then(r => r.data),
  rejectIngredient: (id: string) => api.post<Ingredient>(`/api/admin/ingredients/${id}/reject`, null, { requestIdempotencyKey: true }).then(r => r.data),
}
