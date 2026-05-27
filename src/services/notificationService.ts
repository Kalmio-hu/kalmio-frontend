import { api } from '@/lib/api'

/**
 * Notification preference state returned by the backend.
 * null fields mean "not set / not active".
 */
export interface NotificationPreferences {
  quietUntilDate: string | null  // ISO date "YYYY-MM-DD"
  lastSnoozedSlotId: string | null
  lastSnoozedUntil: string | null  // ISO-8601 instant
}

export const NOTIFICATION_PREFS_QUERY_KEY = ['notifications', 'preferences'] as const

export const notificationService = {
  /**
   * GET /api/notifications/preferences
   * Returns current quiet-today and snooze state.
   * Empty-defaults when no row exists.
   */
  getPreferences: (): Promise<NotificationPreferences> =>
    api.get<NotificationPreferences>('/api/notifications/preferences').then(r => r.data),

  /**
   * POST /api/notifications/snooze/{slotId}
   * Snoozes the given prep-task notification for 1 hour. Max once per slot.
   */
  snooze: (slotId: string): Promise<NotificationPreferences> =>
    api.post<NotificationPreferences>(`/api/notifications/snooze/${slotId}`, null, { requestIdempotencyKey: true }).then(r => r.data),

  /**
   * POST /api/notifications/quiet-today
   * Suppresses all prep notifications for the rest of today.
   */
  quietToday: (): Promise<NotificationPreferences> =>
    api.post<NotificationPreferences>('/api/notifications/quiet-today', null, { requestIdempotencyKey: true }).then(r => r.data),

  /**
   * DELETE /api/notifications/quiet-today
   * Resumes notifications (clears quiet-today flag).
   */
  resumeNotifications: (): Promise<void> =>
    api.delete('/api/notifications/quiet-today', { requestIdempotencyKey: true }).then(() => undefined),

  /**
   * POST /api/push/subscribe
   * Registers the browser push subscription with the backend after the user
   * grants notification permission.
   */
  registerSubscription: (req: { endpoint: string; p256dh: string; auth: string }): Promise<void> =>
    api.post('/api/push/subscribe', req, { requestIdempotencyKey: true }).then(() => undefined),

  /**
   * POST /api/notifications/permission-outcome
   * Records the browser notification permission outcome for product analytics via the
   * standard EventPublisher path (KALMIO-315). Do not call posthog.capture directly —
   * this routes through the backend EventPublisher → PostHogEventForwarder pipeline.
   *
   * No idempotency key: this is a fire-and-forget analytics event. Each browser
   * permission decision is a distinct event; re-sending the same outcome is
   * intentional when the user re-visits the permission prompt after a prior grant/deny.
   */
  recordPermissionOutcome: (outcome: 'GRANTED' | 'DENIED' | 'DISMISSED'): Promise<void> =>
    api.post('/api/notifications/permission-outcome', { outcome }).then(() => undefined),
}
