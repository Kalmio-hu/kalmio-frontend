import { api } from '@/lib/api'

export interface ApiKey {
  id: number
  name: string
  keyPrefix: string
  createdAt: string
  lastUsedAt: string | null
}

export interface ApiKeyCreated {
  id: number
  name: string
  keyPrefix: string
  plaintext: string
}

export const apiKeysService = {
  list: () => api.get<ApiKey[]>('/api/user/api-keys').then(r => r.data),

  // No idempotency key: API key creation generates a new secret on every call.
  // A deduplicated response would re-return the plaintext of an already-issued key,
  // which is a security risk. The backend must always mint a fresh credential.
  create: (name: string) =>
    api.post<ApiKeyCreated>('/api/user/api-keys', { name }).then(r => r.data),

  revoke: (id: number) => api.delete(`/api/user/api-keys/${id}`, { requestIdempotencyKey: true }),

  revokeAll: () => api.delete('/api/user/api-keys', { requestIdempotencyKey: true }),
}
