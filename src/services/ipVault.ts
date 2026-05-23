import { api } from '@/lib/api'

export interface IpDocument {
  id: string
  slug: string
  title: string
  category: 'ALGORITHM' | 'ARCHITECTURE' | 'BUSINESS_MODEL' | 'DESIGN' | 'ASSET'
  summary: string
  content: string
  tags: string[]
  published: boolean
  version: number
  createdAt: string
  updatedAt: string
}

export interface IpDocumentVersion {
  id: string
  versionNumber: number
  title: string
  summary: string
  content: string
  changeNote: string | null
  createdAt: string
}

export interface InvestorToken {
  id: string
  token: string
  label: string
  expiresAt: string | null
  lastUsedAt: string | null
  createdAt: string
}

export const ipVaultService = {
  // Admin
  listAll: () => api.get<IpDocument[]>('/api/admin/ip-vault/documents').then(r => r.data),
  getById: (id: string) => api.get<IpDocument>(`/api/admin/ip-vault/documents/${id}`).then(r => r.data),
  create: (data: { slug: string; title: string; category: string; summary: string; content: string; tags: string[] }) =>
    api.post<IpDocument>('/api/admin/ip-vault/documents', data).then(r => r.data),
  update: (id: string, data: { title: string; summary: string; content: string; tags: string[]; changeNote?: string }) =>
    api.put<IpDocument>(`/api/admin/ip-vault/documents/${id}`, data).then(r => r.data),
  togglePublish: (id: string) =>
    api.patch<IpDocument>(`/api/admin/ip-vault/documents/${id}/publish`).then(r => r.data),
  delete: (id: string) => api.delete(`/api/admin/ip-vault/documents/${id}`),
  getVersions: (id: string) =>
    api.get<IpDocumentVersion[]>(`/api/admin/ip-vault/documents/${id}/versions`).then(r => r.data),

  // Tokens
  listTokens: () => api.get<InvestorToken[]>('/api/admin/ip-vault/tokens').then(r => r.data),
  createToken: (data: { label: string; expiresAt?: string }) =>
    api.post<InvestorToken>('/api/admin/ip-vault/tokens', data).then(r => r.data),
  revokeToken: (id: string) => api.delete(`/api/admin/ip-vault/tokens/${id}`),

  // Public investor view (no auth, token param)
  listPublished: (token: string) =>
    api.get<IpDocument[]>('/api/ip-vault/public', { params: { token } }).then(r => r.data),
  getPublished: (slug: string, token: string) =>
    api.get<IpDocument>(`/api/ip-vault/public/${slug}`, { params: { token } }).then(r => r.data),
  verifyToken: (token: string) =>
    api.get<{ valid: boolean }>('/api/ip-vault/public/verify', { params: { token } }).then(r => r.data),
  fetchValuationHtml: (token: string) =>
    api.get<string>('/api/ip-vault/public/valuation', {
      params: { token },
      responseType: 'text',
      transformResponse: (data) => data,
    }).then(r => r.data),
}
