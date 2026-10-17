import { api } from '@/lib/api'
import type {
  RetailProvider,
  RetailProduct,
  RetailConnectStart,
  RetailConnectionStatus,
  CreateRetailProductRequest,
  UpdateRetailProductRequest,
} from '@/types'

export const RETAIL_PROVIDERS_QUERY_KEY = ['retail-providers'] as const

export const retailService = {
  listProviders: () => api.get<RetailProvider[]>('/api/retail/providers').then(r => r.data),

  /** The caller's own switch for a provider (cart pricing honours it). */
  updatePreference: (providerId: string, enabled: boolean) =>
    api
      .patch<RetailProvider>(`/api/retail/providers/${providerId}/preference`, { enabled }, { requestIdempotencyKey: true })
      .then(r => r.data),

  /** Start linking the caller's partner account; returns the partner's authorize URL. */
  connect: (providerId: string) =>
    api.post<RetailConnectStart>(`/api/retail/providers/${providerId}/connect`).then(r => r.data),

  /** Finish linking with the code + state the partner redirected back with. */
  connectCallback: (code: string, state: string) =>
    api.post<RetailConnectionStatus>('/api/retail/providers/connect/callback', { code, state }).then(r => r.data),

  disconnect: (providerId: string) =>
    api.delete(`/api/retail/providers/${providerId}/connection`).then(() => undefined),

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
