import { api } from '@/lib/api'
import type {
  FamilyResponse,
  AddManagedProfileRequest,
  AddManagedProfileResponse,
  SendInviteRequest,
  SendInviteResponse,
  AcceptInviteRequest,
  MergePreviewResponse,
  ImpersonateResponse,
  UserPreferencesDto,
  SentInviteDto,
} from '@/types'

export const familyService = {
  /** POST /api/families — create a new family (caller becomes PLANNER). */
  createFamily: (): Promise<FamilyResponse> =>
    api.post<FamilyResponse>('/api/families').then((r) => r.data),

  /** GET /api/families/{id} — fetch family with member list. */
  getFamily: (id: string): Promise<FamilyResponse> =>
    api.get<FamilyResponse>(`/api/families/${id}`).then((r) => r.data),

  /** POST /api/families/{id}/managed-profiles — add a managed profile. */
  addManagedProfile: (
    familyId: string,
    body: AddManagedProfileRequest,
  ): Promise<AddManagedProfileResponse> =>
    api
      .post<AddManagedProfileResponse>(`/api/families/${familyId}/managed-profiles`, body)
      .then((r) => r.data),

  /** PATCH /api/families/{id}/managed-profiles/{profileId} — edit preferences. */
  editManagedProfile: (
    familyId: string,
    profileId: string,
    body: AddManagedProfileRequest,
  ): Promise<void> =>
    api
      .patch(`/api/families/${familyId}/managed-profiles/${profileId}`, body)
      .then(() => undefined),

  /** DELETE /api/families/{id}/managed-profiles/{profileId} — remove a managed profile. */
  removeManagedProfile: (familyId: string, profileId: string): Promise<void> =>
    api
      .delete(`/api/families/${familyId}/managed-profiles/${profileId}`)
      .then(() => undefined),

  /**
   * DELETE /api/families/{id}/members/{userId} — detach a real (non-managed) member.
   * Handles both planner-removes-other (caller != userId) and member-leaves (caller == userId).
   * Refuses managed profiles (use removeManagedProfile) and the last remaining planner.
   */
  removeMember: (familyId: string, userId: string): Promise<void> =>
    api
      .delete(`/api/families/${familyId}/members/${userId}`)
      .then(() => undefined),

  /** POST /api/families/{id}/invites — generate a claim code. */
  sendInvite: (
    familyId: string,
    body: SendInviteRequest,
  ): Promise<SendInviteResponse> =>
    api
      .post<SendInviteResponse>(`/api/families/${familyId}/invites`, body)
      .then((r) => r.data),

  /** POST /api/invites/{code}/accept — accept an invite (claim or join-only). */
  acceptInvite: (code: string, body: AcceptInviteRequest): Promise<void> =>
    api.post(`/api/invites/${code}/accept`, body).then(() => undefined),

  /** POST /api/invites/{code}/merge-preview — get the merge diff before accepting. */
  mergePreview: (code: string): Promise<MergePreviewResponse> =>
    api
      .post<MergePreviewResponse>(`/api/invites/${code}/merge-preview`)
      .then((r) => r.data),

  /** PATCH /api/families/{id}/members/{userId}/role — change a member's role. */
  changeMemberRole: (
    familyId: string,
    userId: string,
    role: 'PLANNER' | 'MEMBER',
  ): Promise<void> =>
    api
      .patch(`/api/families/${familyId}/members/${userId}/role`, { role })
      .then(() => undefined),

  /** POST /api/families/{id}/impersonate/{userId} — start an impersonation session. */
  impersonate: (familyId: string, userId: string): Promise<ImpersonateResponse> =>
    api
      .post<ImpersonateResponse>(`/api/families/${familyId}/impersonate/${userId}`)
      .then((r) => r.data),

  /** [PENDING_BE] POST /api/families/{id}/impersonate/{userId}/request-permission — request impersonation permission for a real account. */
  requestImpersonationPermission: (familyId: string, userId: string): Promise<void> =>
    api
      .post(`/api/families/${familyId}/impersonate/${userId}/request-permission`)
      .then(() => undefined),

  /** [PENDING_BE] GET /api/families/{id}/invites — list sent invites (planner only). */
  listInvites: (familyId: string): Promise<SentInviteDto[]> =>
    api.get<SentInviteDto[]>(`/api/families/${familyId}/invites`).then((r) => r.data),

  /** [PENDING_BE] DELETE /api/families/{id}/invites/{inviteId} — revoke a pending invite. */
  revokeInvite: (familyId: string, inviteId: string): Promise<void> =>
    api.delete(`/api/families/${familyId}/invites/${inviteId}`).then(() => undefined),
}

/** Blank preferences template for the managed-profile editor. */
export function blankPreferences(): UserPreferencesDto {
  return {
    allergens: [],
    dislikedIngredientIds: [],
    vegetarian: false,
    vegan: false,
    pescatarian: false,
    glutenFree: false,
    dairyFree: false,
    lactoseFree: false,
    milkProteinFree: false,
    eggFree: false,
    nutFree: false,
    peanutFree: false,
    soyFree: false,
    fishFree: false,
    shellfishFree: false,
    sesameFree: false,
    halal: false,
    kosher: false,
    keto: false,
    lowGi: false,
    lowFodmap: false,
    paleo: false,
    kcalTarget: null,
    proteinTargetG: null,
    carbsTargetG: null,
    fatTargetG: null,
    portionSizeMultiplier: null,
    prepToleranceMinutes: null,
  }
}
