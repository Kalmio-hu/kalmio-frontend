/**
 * templatePrepSlots service — CRUD for template_prep_slot rows.
 *
 * Backend surface (KALMIO-263):
 *   GET    /api/plans/{planId}/template-prep-slots
 *   POST   /api/plans/{planId}/template-prep-slots
 *   PATCH  /api/template-prep-slots/{slotId}
 *   DELETE /api/template-prep-slots/{slotId}
 *   POST   /api/template-prep-slots/{slotId}/split  (reserved for Prep-H)
 */
import { api } from '@/lib/api'
import type {
  TemplatePrepSlot,
  CreateTemplatePrepSlotRequest,
  PatchTemplatePrepSlotRequest,
} from '@/types'

export const templatePrepSlotsService = {
  /** List all prep slots for a plan template. */
  list(planId: string): Promise<TemplatePrepSlot[]> {
    return api
      .get<TemplatePrepSlot[]>(`/api/plans/${planId}/template-prep-slots`)
      .then(r => r.data)
  },

  /** Manually create a prep slot (source = MANUAL on the backend). */
  upsert(planId: string, body: CreateTemplatePrepSlotRequest): Promise<TemplatePrepSlot> {
    return api
      .post<TemplatePrepSlot>(`/api/plans/${planId}/template-prep-slots`, body)
      .then(r => r.data)
  },

  /**
   * Move or edit an existing prep slot.
   * The backend marks source = MANUAL on the first user-initiated move.
   */
  patch(slotId: string, body: PatchTemplatePrepSlotRequest): Promise<TemplatePrepSlot> {
    return api
      .patch<TemplatePrepSlot>(`/api/template-prep-slots/${slotId}`, body)
      .then(r => r.data)
  },

  /** Delete a prep slot. */
  remove(slotId: string): Promise<void> {
    return api
      .delete(`/api/template-prep-slots/${slotId}`)
      .then(() => undefined)
  },

  /**
   * Split a prep slot into two (reserved for KALMIO-268 / Prep-H).
   * Stubbed here so consumers can import the function signature immediately.
   */
  split(slotId: string): Promise<TemplatePrepSlot[]> {
    return api
      .post<TemplatePrepSlot[]>(`/api/template-prep-slots/${slotId}/split`)
      .then(r => r.data)
  },
}
