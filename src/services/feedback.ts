import { api } from '@/lib/api'
import type {
  CreateFeedbackRequest,
  FeedbackDetail,
  FeedbackSummary,
} from '@/types'

export const feedbackService = {
  // No idempotency key: POST /api/feedback always creates a new feedback thread.
  // The user intentionally submits distinct reports; deduplication would discard
  // separate submissions about the same topic.
  create: (body: CreateFeedbackRequest) =>
    api.post<FeedbackDetail>('/api/feedback', body).then(r => r.data),

  listMine: () =>
    api.get<FeedbackSummary[]>('/api/feedback/mine').then(r => r.data),

  getMine: (id: string) =>
    api.get<FeedbackDetail>(`/api/feedback/mine/${id}`).then(r => r.data),

  getUnreadCount: () =>
    api.get<{ count: number }>('/api/feedback/unread-count').then(r => r.data.count),

  markRead: (id: string) =>
    api.post(`/api/feedback/${id}/read`, null, { requestIdempotencyKey: true }),

  // No idempotency key: each addMessage call creates a new message row even if
  // the body is identical — the user may intentionally send the same text twice.
  addMessage: (id: string, body: string) =>
    api.post(`/api/feedback/${id}/messages`, { body }).then(r => r.data),

  // Admin
  listAll: () =>
    api.get<FeedbackSummary[]>('/api/admin/feedback').then(r => r.data),

  getDetail: (id: string) =>
    api.get<FeedbackDetail>(`/api/admin/feedback/${id}`).then(r => r.data),

  getAdminUnreadCount: () =>
    api.get<{ count: number }>('/api/admin/feedback/unread-count').then(r => r.data.count),

  updateStatus: (id: string, status: string, replyNote?: string) =>
    api.patch<FeedbackDetail>(`/api/admin/feedback/${id}/status`, { status, replyNote }, { requestIdempotencyKey: true }).then(r => r.data),

  // No idempotency key: each addAdminMessage creates a new message row; same
  // reasoning as addMessage above.
  addAdminMessage: (id: string, body: string) =>
    api.post(`/api/admin/feedback/${id}/messages`, { body }).then(r => r.data),

  deleteFeedback: (id: string) =>
    api.delete(`/api/admin/feedback/${id}`, { requestIdempotencyKey: true }),
}
