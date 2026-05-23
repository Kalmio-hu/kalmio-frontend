import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { familyService } from '@/services/family'
import type { FamilyMemberDto } from '@/types'

type Step = 'cap-binding' | 'cap-exceeded' | 'code-ready'

interface Props {
  familyId: string
  /** All current members — used to render managed-profile suggestions. */
  members: FamilyMemberDto[]
  /** Display names keyed by userId */
  displayNames: Record<string, string>
  /** True when the family is at the 5-member cap */
  atCap: boolean
  /** Managed-profile user IDs (no real account) */
  managedProfileIds: string[]
  onClose: () => void
}

export function InviteFlow({
  familyId,
  members,
  displayNames,
  atCap,
  managedProfileIds,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const qc = useQueryClient()

  const [step, setStep] = useState<Step>(
    managedProfileIds.length > 0 ? 'cap-binding' : atCap ? 'cap-exceeded' : 'cap-binding',
  )
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [claimCode, setClaimCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const autoFiredRef = useRef(false)
  const [removeConfirmMember, setRemoveConfirmMember] = useState<{ id: string; name: string } | null>(null)

  // Used on step "cap-exceeded" — remove profile before creating a fresh invite
  const removeMutation = useMutation({
    mutationFn: (profileId: string) =>
      familyService.removeManagedProfile(familyId, profileId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family', familyId] })
    },
    onError: () => toast({ title: t('common.errorGeneric'), variant: 'destructive' }),
  })

  const inviteMutation = useMutation({
    mutationFn: (body: { boundManagedProfileId: string | null; freshSlot: boolean }) =>
      familyService.sendInvite(familyId, body),
    onSuccess: (data) => {
      setClaimCode(data.claimCode)
      setStep('code-ready')
      qc.invalidateQueries({ queryKey: ['family', familyId] })
    },
    onError: () => toast({ title: t('common.errorGeneric'), variant: 'destructive' }),
  })

  // No managed profiles to bind to — skip the binding question and generate a fresh-slot
  // code immediately (unless we're at the family cap, in which case the cap-exceeded step
  // already lets the planner free a slot first).
  useEffect(() => {
    if (autoFiredRef.current) return
    if (managedProfileIds.length === 0 && !atCap && step === 'cap-binding') {
      autoFiredRef.current = true
      inviteMutation.mutate({ boundManagedProfileId: null, freshSlot: true })
    }
  }, [managedProfileIds.length, atCap, step, inviteMutation])

  function handleBindChoice(profileId: string | null) {
    setSelectedProfileId(profileId)
    if (profileId) {
      // Bound invite — uses the managed profile's slot, no cap check needed here
      inviteMutation.mutate({ boundManagedProfileId: profileId, freshSlot: false })
    } else {
      // Fresh slot — check cap first
      if (atCap) {
        setStep('cap-exceeded')
      } else {
        inviteMutation.mutate({ boundManagedProfileId: null, freshSlot: true })
      }
    }
  }

  async function handleCopy() {
    if (!claimCode) return
    await navigator.clipboard.writeText(claimCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Step: cap-binding ──────────────────────────────────────────────────────
  if (step === 'cap-binding') {
    const managedMembers = members.filter((m) => managedProfileIds.includes(m.userId))

    // No managed profiles to bind to → useEffect above has already kicked off a fresh-slot
    // invite. Render a spinner instead of the binding prompt so the user never sees it.
    if (managedMembers.length === 0 && !atCap) {
      return (
        <div className="py-8 flex justify-center" aria-busy="true">
          <Spinner />
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-[#6b6b6b]">{t('family.invite.capBindingIntro')}</p>

        {managedMembers.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#1A1A1A]">
              {t('family.invite.capBindingPrompt')}
            </p>
            <ul className="space-y-2" role="list">
              {managedMembers.map((m) => {
                const name = displayNames[m.userId] ?? m.userId
                return (
                  <li key={m.userId}>
                    <button
                      type="button"
                      onClick={() => handleBindChoice(m.userId)}
                      disabled={inviteMutation.isPending}
                      className="w-full text-left px-4 py-3 rounded-xl border border-[#e5e4e7] hover:border-[#F28C28] hover:bg-[#F28C28]/5 transition-colors disabled:opacity-40"
                    >
                      <span className="text-sm font-medium text-[#1A1A1A]">
                        {t('family.invite.bindToProfile', { name })}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <Button
          type="button"
          variant="secondary"
          onClick={() => handleBindChoice(null)}
          disabled={inviteMutation.isPending}
          className="w-full"
        >
          {inviteMutation.isPending && selectedProfileId === null
            ? t('family.invite.generating')
            : t('family.invite.freshSlotCta')}
        </Button>

        <Button type="button" variant="ghost" onClick={onClose} className="w-full">
          {t('common.cancel')}
        </Button>
      </div>
    )
  }

  // ── Step: cap-exceeded ─────────────────────────────────────────────────────
  if (step === 'cap-exceeded') {
    const managedMembers = members.filter((m) => managedProfileIds.includes(m.userId))

    return (
      <div className="space-y-4">
        <p className="text-sm font-medium text-red-700 bg-red-50 rounded-lg px-4 py-3">
          {t('family.invite.capExceededMessage')}
        </p>
        <p className="text-sm text-[#6b6b6b]">{t('family.invite.removeProfilePrompt')}</p>

        <ul className="space-y-2" role="list">
          {managedMembers.map((m) => {
            const name = displayNames[m.userId] ?? m.userId
            return (
              <li key={m.userId} className="flex items-center gap-2">
                <span className="flex-1 text-sm text-[#1A1A1A]">{name}</span>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={removeMutation.isPending}
                  onClick={() => setRemoveConfirmMember({ id: m.userId, name })}
                >
                  {t('common.delete')}
                </Button>
              </li>
            )
          })}
        </ul>

        <Button type="button" variant="ghost" onClick={onClose} className="w-full">
          {t('common.cancel')}
        </Button>

        <ConfirmDialog
          open={removeConfirmMember !== null}
          onOpenChange={open => { if (!open) setRemoveConfirmMember(null) }}
          title={t('confirm.family.removeFromInvite.title', { name: removeConfirmMember?.name ?? '' })}
          description={t('confirm.family.removeFromInvite.body')}
          destructiveLabel={t('confirm.family.removeFromInvite.confirm')}
          cancelLabel={t('confirm.family.removeFromInvite.cancel')}
          onConfirm={() => {
            if (removeConfirmMember) removeMutation.mutate(removeConfirmMember.id)
          }}
          isPending={removeMutation.isPending}
        />
      </div>
    )
  }

  // ── Step: code-ready ───────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#6b6b6b]">{t('family.invite.codeReadyIntro')}</p>

      <div className="bg-[#F9F7F2] rounded-xl px-4 py-4 flex items-center gap-3">
        <code className="flex-1 text-lg font-mono font-bold text-[#1A1A1A] tracking-widest select-all">
          {claimCode}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={t('family.invite.copyCode')}
          className="p-2 rounded-lg hover:bg-white transition-colors"
        >
          {copied ? (
            <Check className="h-5 w-5 text-green-600" aria-hidden="true" />
          ) : (
            <Copy className="h-5 w-5 text-[#6b6b6b]" aria-hidden="true" />
          )}
        </button>
      </div>

      <p className="text-xs text-[#6b6b6b]">{t('family.invite.codeExpiry')}</p>

      <Button type="button" onClick={onClose} className="w-full">
        {t('common.close')}
      </Button>
    </div>
  )
}
