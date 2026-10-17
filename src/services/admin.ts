import { api } from '@/lib/api'
import type { RetailProvider } from '@/types'

export interface RetailSyncStatus {
  running: boolean
  report: {
    startedAt?: string
    finishedAt?: string | null
    running?: boolean
    ingredients?: number
    matched?: number
    created?: number
    updated?: number
    unmatched?: number
    failed?: number
    error?: string | null
  }
}

export interface AdminUser {
  id: string
  email: string
  role: 'USER' | 'ADMIN'
  createdAt: string
  premiumEnabled: boolean
}

export interface ImpersonateResponse {
  accessToken: string
  userId: string
  email: string
}

/** Response from GET /api/admin/stats — DB-side health snapshot for the founders dashboard. */
export interface AdminStatsResponse {
  totalRealUsers: number
  foundingMembers: number
  totalFridgeItems: number
  /** Map of Diófa stage name to user count; missing key means zero. */
  stageDistribution: Record<string, number>
}

export const adminService = {
  listUsers: () => api.get<AdminUser[]>('/api/admin/users').then(r => r.data),
  updateRole: (userId: string, role: 'USER' | 'ADMIN') =>
    api.put<AdminUser>(`/api/admin/users/${userId}/role`, { role }, { requestIdempotencyKey: true }).then(r => r.data),
  togglePremium: (userId: string, enabled: boolean) =>
    api.patch<AdminUser>(`/api/admin/users/${userId}/premium-enabled`, { enabled }, { requestIdempotencyKey: true }).then(r => r.data),
  // No idempotency key: admin impersonation issues a new short-lived JWT each call.
  // Same reasoning as familyService.impersonate — a deduplicated stale token
  // is a worse outcome than a double-fire producing a fresh one.
  impersonate: (userId: string) =>
    api.post<ImpersonateResponse>(`/api/admin/impersonate/${userId}`).then(r => r.data),
  /** GET /api/admin/stats — DB-row-count metrics not available in PostHog event stream. */
  getStats: () => api.get<AdminStatsResponse>('/api/admin/stats').then(r => r.data),
  /** POST /api/admin/partner/export — runs the partner export now; returns a summary string. */
  triggerPartnerExport: () =>
    api.post<string>('/api/admin/partner/export', null, { requestIdempotencyKey: true }).then(r => r.data),

  /** Global on/off for a retail provider. */
  setRetailProviderActive: (providerId: string, active: boolean) =>
    api.patch<RetailProvider>(`/api/admin/retail/providers/${providerId}`, { active }, { requestIdempotencyKey: true }).then(r => r.data),

  /** Start the partner catalogue sync in the background. */
  syncRetailProvider: (providerId: string, force = false) =>
    api.post<{ started: boolean; running: boolean }>(`/api/admin/retail/providers/${providerId}/sync`, null, { params: { force } }).then(r => r.data),

  refreshRetailPrices: (providerId: string) =>
    api.post<{ updated: number }>(`/api/admin/retail/providers/${providerId}/refresh-prices`).then(r => r.data),

  retailSyncStatus: (providerId: string) =>
    api.get<RetailSyncStatus>(`/api/admin/retail/providers/${providerId}/sync-status`).then(r => r.data),
}
