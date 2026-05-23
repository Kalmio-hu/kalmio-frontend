import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Users } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from '@/components/ui/toast'
import { FamilyMemberRow } from '@/components/family/FamilyMemberRow'
import { ManagedProfileEditor } from '@/components/family/ManagedProfileEditor'
import { InviteFlow } from '@/components/family/InviteFlow'
import { PendingImpersonationRequests } from '@/components/family/PendingImpersonationRequests'
import { familyService } from '@/services/family'
import { usersService, USERS_ME_QUERY_KEY } from '@/services/users'
import { useAuthStore } from '@/store/auth'
import type { FamilyMemberDto, UserPreferencesDto, MergePreviewResponse, SentInviteDto } from '@/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MergeConfirmation } from '@/components/family/MergeConfirmation'

const FAMILY_CAP = 5
const FAMILY_ID_KEY = 'kalmio_family_id'

function useMyFamilyId(): string | null {
  return localStorage.getItem(FAMILY_ID_KEY)
}

function saveMyFamilyId(id: string) {
  localStorage.setItem(FAMILY_ID_KEY, id)
}

export function Family() {
  const { t, i18n } = useTranslation()
  const qc = useQueryClient()
  const currentUserId = useAuthStore((s) => s.user?.id) ?? ''

  const familyId = useMyFamilyId()

  const [addProfileOpen, setAddProfileOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [claimDialogOpen, setClaimDialogOpen] = useState(false)
  const [revokeConfirmId, setRevokeConfirmId] = useState<string | null>(null)

  // Fetch current user's name for the member row
  const { data: me } = useQuery({
    queryKey: USERS_ME_QUERY_KEY,
    queryFn: usersService.getMe,
    staleTime: 60_000,
  })

  const myDisplayName = me
    ? [me.firstName, me.lastName].filter(Boolean).join(' ') || me.email
    : currentUserId.slice(0, 8)

  // Fetch the family
  const {
    data: family,
    isLoading: familyLoading,
    isError: familyError,
  } = useQuery({
    queryKey: ['family', familyId],
    queryFn: () => familyService.getFamily(familyId!),
    enabled: !!familyId,
    staleTime: 30_000,
  })

  const members: FamilyMemberDto[] = family?.members ?? []
  const memberCount = members.length
  const atCap = memberCount >= FAMILY_CAP

  const plannerCount = members.filter((m) => m.role === 'PLANNER').length
  const myRole = members.find((m) => m.userId === currentUserId)?.role ?? null
  const iAmPlanner = myRole === 'PLANNER'

  // [PENDING_BE] Fetch sent invites — only when we have a family and current user is planner
  const {
    data: sentInvites,
    isLoading: sentInvitesLoading,
    isError: sentInvitesError,
  } = useQuery<SentInviteDto[]>({
    queryKey: ['family-invites', familyId],
    queryFn: () => familyService.listInvites(familyId!),
    enabled: !!familyId && iAmPlanner,
    staleTime: 30_000,
    retry: false,
  })

  // [PENDING_BE] Revoke invite mutation
  const revokeInviteMutation = useMutation({
    mutationFn: (inviteId: string) => familyService.revokeInvite(familyId!, inviteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family-invites', familyId] })
      toast({ title: t('family.invite.revokeInviteSuccess') })
    },
    onError: () => toast({ title: t('family.invite.revokeInviteError'), variant: 'destructive' }),
  })

  // Create family mutation
  const createFamilyMutation = useMutation({
    mutationFn: familyService.createFamily,
    onSuccess: (data) => {
      saveMyFamilyId(data.id)
      qc.invalidateQueries({ queryKey: ['family'] })
      toast({ title: t('family.creation.success') })
    },
    onError: () => toast({ title: t('common.errorGeneric'), variant: 'destructive' }),
  })

  // Add managed profile mutation
  const addProfileMutation = useMutation({
    mutationFn: (body: { displayName: string; preferences: UserPreferencesDto }) =>
      familyService.addManagedProfile(familyId!, {
        displayName: body.displayName,
        preferences: body.preferences,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family', familyId] })
      setAddProfileOpen(false)
      toast({ title: t('family.managedProfile.addSuccess') })
    },
    onError: () => toast({ title: t('common.errorGeneric'), variant: 'destructive' }),
  })

  const managedProfileIds = members.filter((m) => m.isManaged).map((m) => m.userId)

  // Display names: prefer backend-resolved name, but show the current user's own real name
  // (freshly loaded from /me). Fall back to a short UUID slice when the backend hasn't
  // rolled out the enriched DTO yet.
  const displayNames: Record<string, string> = {}
  for (const m of members) {
    displayNames[m.userId] = m.userId === currentUserId
      ? myDisplayName
      : (m.displayName ?? m.userId.slice(0, 8))
  }

  const locale = i18n.resolvedLanguage === 'hu' ? 'hu-HU' : 'en-GB'

  function formatExpiry(iso: string): string {
    return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))
  }

  // ── Render: no family yet ──────────────────────────────────────────────────
  if (!familyId || familyError) {
    return (
      <div>
        <Header title={t('family.title')} subtitle={t('family.subtitleNoFamily')} />
        <Card>
          <CardContent className="py-8 flex flex-col items-center text-center gap-4">
            <Users className="h-10 w-10 text-[#F28C28]" aria-hidden="true" />
            <p className="text-sm text-[#6b6b6b] max-w-xs">{t('family.noFamilyExplainer')}</p>
            <Button
              onClick={() => createFamilyMutation.mutate()}
              disabled={createFamilyMutation.isPending}
            >
              {createFamilyMutation.isPending
                ? t('family.creation.creating')
                : t('family.creation.cta')}
            </Button>
            <div className="border-t border-[#e5e4e7] pt-4 w-full">
              <p className="text-sm text-[#6b6b6b] mb-3">{t('family.invite.claimPrompt')}</p>
              <Button
                variant="secondary"
                onClick={() => setClaimDialogOpen(true)}
              >
                {t('family.invite.enterCodeCta')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <ClaimCodeDialog
          open={claimDialogOpen}
          onOpenChange={setClaimDialogOpen}
          onAccepted={() => {
            setClaimDialogOpen(false)
          }}
        />
      </div>
    )
  }

  // ── Render: loading ────────────────────────────────────────────────────────
  if (familyLoading) {
    return (
      <div>
        <Header title={t('family.title')} />
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </div>
    )
  }

  // ── Render: family settings ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <Header
        title={t('family.title')}
        subtitle={t('family.capacityCounter', { used: memberCount, cap: FAMILY_CAP })}
      />

      {/* Pending impersonation-permission requests — renders nothing if none. */}
      <PendingImpersonationRequests />

      {/* Member list */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#1A1A1A]">{t('family.membersSection')}</h2>
            {iAmPlanner && (
              <div className="flex gap-2">
                {!atCap && (
                  <Button size="sm" variant="secondary" onClick={() => setAddProfileOpen(true)}>
                    {t('family.managedProfile.addCta')}
                  </Button>
                )}
                {atCap && (
                  <p className="text-xs text-red-600 font-medium self-center">
                    {t('family.capReached')}
                  </p>
                )}
                <Button size="sm" onClick={() => setInviteOpen(true)}>
                  {t('family.invite.inviteCta')}
                </Button>
              </div>
            )}
          </div>

          <ul role="list" aria-label={t('family.membersSection')}>
            {members.map((member) => (
              <FamilyMemberRow
                key={member.userId}
                familyId={familyId}
                member={member}
                displayName={displayNames[member.userId] ?? member.userId.slice(0, 8)}
                isManaged={managedProfileIds.includes(member.userId)}
                isCurrentUserPlanner={iAmPlanner}
                currentUserId={currentUserId}
                plannerCount={plannerCount}
              />
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Sent invites — planner only, [PENDING_BE] */}
      {iAmPlanner && (
        <Card>
          <CardContent className="py-4">
            <h2 className="text-sm font-semibold text-[#1A1A1A] mb-3">
              {t('family.invite.sentInvitesSection')}
            </h2>
            {sentInvitesLoading && (
              <div className="flex justify-center py-4" aria-live="polite" aria-busy="true">
                <Spinner />
              </div>
            )}
            {sentInvitesError && (
              <p className="text-xs text-[#6b6b6b]">{t('family.invite.sentInvitesUnavailable')}</p>
            )}
            {!sentInvitesLoading && !sentInvitesError && sentInvites !== undefined && (
              sentInvites.length === 0 ? (
                <p className="text-xs text-[#6b6b6b]">{t('family.invite.sentInvitesEmpty')}</p>
              ) : (
                <ul role="list" className="space-y-2">
                  {sentInvites.filter((inv) => inv.status === 'PENDING').map((inv) => (
                    <li
                      key={inv.id}
                      className="flex items-center justify-between gap-3 py-2 border-b border-[#e5e4e7] last:border-none"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-mono font-medium text-[#1A1A1A]">
                          {t('family.invite.sentInviteCode', { code: inv.claimCode })}
                        </p>
                        <p className="text-xs text-[#6b6b6b]">
                          {t('family.invite.sentInviteExpiry', { date: formatExpiry(inv.expiresAt) })}
                          {inv.boundProfileName && (
                            <span className="ml-2">
                              {t('family.invite.sentInviteBoundTo', { name: inv.boundProfileName })}
                            </span>
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={revokeInviteMutation.isPending}
                        onClick={() => setRevokeConfirmId(inv.id)}
                        className="text-xs px-2 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 shrink-0"
                      >
                        {t('family.invite.revokeInviteCta')}
                      </button>
                    </li>
                  ))}
                </ul>
              )
            )}
          </CardContent>
        </Card>
      )}

      {/* Claim an invite code (for joining another family) */}
      <Card>
        <CardContent className="py-4">
          <h2 className="text-sm font-semibold text-[#1A1A1A] mb-2">
            {t('family.invite.claimSection')}
          </h2>
          <p className="text-xs text-[#6b6b6b] mb-3">{t('family.invite.claimPrompt')}</p>
          <Button variant="secondary" size="sm" onClick={() => setClaimDialogOpen(true)}>
            {t('family.invite.enterCodeCta')}
          </Button>
        </CardContent>
      </Card>

      {/* Add managed profile dialog */}
      <Dialog open={addProfileOpen} onOpenChange={setAddProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('family.managedProfile.addTitle')}</DialogTitle>
          </DialogHeader>
          <ManagedProfileEditor
            showNameField
            isPending={addProfileMutation.isPending}
            onSubmit={(displayName, prefs) =>
              addProfileMutation.mutate({ displayName, preferences: prefs })
            }
            onCancel={() => setAddProfileOpen(false)}
            submitLabel={t('family.managedProfile.addSubmit')}
          />
        </DialogContent>
      </Dialog>

      {/* Invite flow dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('family.invite.dialogTitle')}</DialogTitle>
          </DialogHeader>
          <InviteFlow
            familyId={familyId}
            members={members}
            displayNames={displayNames}
            atCap={atCap}
            managedProfileIds={managedProfileIds}
            onClose={() => setInviteOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Claim code dialog */}
      <ClaimCodeDialog
        open={claimDialogOpen}
        onOpenChange={setClaimDialogOpen}
        onAccepted={() => {
          setClaimDialogOpen(false)
          qc.invalidateQueries({ queryKey: ['family'] })
        }}
      />

      <ConfirmDialog
        open={revokeConfirmId !== null}
        onOpenChange={open => { if (!open) setRevokeConfirmId(null) }}
        title={t('confirm.family.revokeInvite.title')}
        description={t('confirm.family.revokeInvite.body')}
        destructiveLabel={t('confirm.family.revokeInvite.confirm')}
        cancelLabel={t('confirm.family.revokeInvite.cancel')}
        onConfirm={() => {
          if (revokeConfirmId) revokeInviteMutation.mutate(revokeConfirmId)
        }}
        isPending={revokeInviteMutation.isPending}
      />
    </div>
  )
}

// ── Claim Code Dialog ──────────────────────────────────────────────────────

interface ClaimCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAccepted: () => void
}

function ClaimCodeDialog({ open, onOpenChange, onAccepted }: ClaimCodeDialogProps) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const codeRef = useRef<HTMLInputElement>(null)
  const [step, setDialogStep] = useState<'enter' | 'merge-preview'>('enter')
  const [enteredCode, setEnteredCode] = useState('')
  const [preview, setPreview] = useState<MergePreviewResponse | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const acceptMutation = useMutation({
    mutationFn: ({ code, claim, checkedAllergens }: { code: string; claim: boolean; checkedAllergens?: string[] }) =>
      familyService.acceptInvite(code, { claim, checkedAllergens }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family'] })
      onAccepted()
      toast({ title: t('family.invite.acceptSuccess') })
      setDialogStep('enter')
      setEnteredCode('')
      setPreview(null)
    },
    onError: () => toast({ title: t('common.errorGeneric'), variant: 'destructive' }),
  })

  const previewMutation = useMutation({
    mutationFn: (code: string) => familyService.mergePreview(code),
    onSuccess: (data) => {
      setPreview(data)
      setPreviewError(null)
      // If the invite has no bound managed profile the merge preview is empty —
      // skip straight to accepting.
      if (
        data.mergedAllergens.length === 0 &&
        data.activeDietaryFlags.length === 0 &&
        data.mergedDislikedIngredientIds.length === 0
      ) {
        acceptMutation.mutate({ code: enteredCode, claim: false })
      } else {
        setDialogStep('merge-preview')
      }
    },
    onError: () => setPreviewError(t('family.invite.invalidCode')),
  })

  function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = enteredCode.trim()
    if (!code) return
    previewMutation.mutate(code)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {step === 'enter'
              ? t('family.invite.claimDialogTitle')
              : t('family.merge.dialogTitle')}
          </DialogTitle>
        </DialogHeader>

        {step === 'enter' && (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="claim-code">{t('family.invite.codePlaceholder')}</Label>
              <Input
                id="claim-code"
                ref={codeRef}
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
                placeholder={t('family.invite.codePlaceholder')}
                autoComplete="off"
                maxLength={12}
              />
              {previewError && (
                <p className="text-xs text-red-600" role="alert">{previewError}</p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={previewMutation.isPending} className="flex-1">
                {previewMutation.isPending ? t('family.invite.checking') : t('family.invite.submitCodeCta')}
              </Button>
            </div>
          </form>
        )}

        {step === 'merge-preview' && preview && (
          <MergeConfirmation
            preview={preview}
            isPending={acceptMutation.isPending}
            onConfirmClaim={(checkedAllergens) =>
              acceptMutation.mutate({ code: enteredCode, claim: true, checkedAllergens })
            }
            onJoinWithoutClaim={() =>
              acceptMutation.mutate({ code: enteredCode, claim: false })
            }
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
