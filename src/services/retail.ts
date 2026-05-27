import { api } from '@/lib/api'
import type {
  RetailProvider,
  RetailProduct,
  CreateRetailProductRequest,
  UpdateRetailProductRequest,
} from '@/types'

export const retailService = {
  listProviders: () => api.get<RetailProvider[]>('/api/retail/providers').then(r => r.data),

  listProducts: (providerId?: string) =>
    api
      .get<RetailProduct[]>('/api/retail/products', { params: providerId ? { providerId } : {} })
      .then(r => r.data),

  create: (body: CreateRetailProductRequest) =>
    api.post<RetailProduct>('/api/retail/products', body, { requestIdempotencyKey: true }).then(r => r.data),

  update: (id: string, body: UpdateRetailProductRequest) =>
    api.put<RetailProduct>(`/api/retail/products/${id}`, body, { requestIdempotencyKey: true }).then(r => r.data),

  delete: (id: string) => api.delete(`/api/retail/products/${id}`, { requestIdempotencyKey: true }),
}
