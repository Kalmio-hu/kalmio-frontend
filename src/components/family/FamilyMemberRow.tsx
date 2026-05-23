import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, LogOut, Pencil, Trash2, UserCog, UserMinus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from '@/components/ui/toast'
import { ManagedProfileEditor } from './ManagedProfileEditor'
import { familyService } from '@/services/family'
import { useAuthStore } from '@/store/auth'
import type { FamilyMemberDto, FamilyRole } from '@/types'

const FAMILY_ID_KEY = 'kalmio_family_id'

interface Props {
  familyId: string
  member: FamilyMemberDto
  /** Display name — derived from username for managed profiles or email for real accounts */
  displayName: string
  /** True for managed profiles (no real auth account) */
  isManaged: boolean
  /** True if the current session user is the planner */
  isCurrentUserPlanner: boolean
  /** The current session's user ID */
  currentUserId: string
  /** Count of current planners — used to prevent stranding */
  plannerCount: number
}

export function FamilyMemberRow({
  familyId,
  member,
  displayName,
  isManaged,
  isCurrentUserPlanner,
  currentUserId,
  plannerCount,
}: Props) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const startImpersonation = useAuthStore((s) => s.startImpersonation)

  const [editOpen, setEditOpen] = useState(false)
  const [roleMenuOpen, setRoleMenuOpen] = useState(false)
  const [permissionRequested, setPermissionRequested] = useState(false)
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false)
  const [kickConfirmOpen, setKickConfirmOpen] = useState(false)
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)

  const removeMutation = useMutation({
    mutationFn: () => familyService.removeManagedProfile(familyId, member.userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family', familyId] })
      toast({ title: t('family.memberRow.profileRemoved') })
    },
    onError: () => toast({ title: t('common.errorGeneric'), variant: 'destructive' }),
  })

  const kickMutation = useMutation({
    mutationFn: () => familyService.removeMember(familyId, member.userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family', familyId] })
      toast({ title: t('family.memberRow.memberRemoved', { name: displayName }) })
    },
    onError: () => toast({ title: t('common.errorGeneric'), variant: 'destructive' }),
  })

  const leaveMutation = useMutation({
    mutationFn: () => familyService.removeMember(familyId, member.userId),
    onSuccess: () => {
      localStorage.removeItem(FAMILY_ID_KEY)
      qc.invalidateQueries({ queryKey: ['family'] })
      toast({ title: t('family.memberRow.leaveSuccess') })
    },
    onError: () => toast({ title: t('common.errorGeneric'), variant: 'destructive' }),
  })

  const roleMutation = useMutation({
    mutationFn: (newRole: FamilyRole) =>
      familyService.changeMemberRole(familyId, member.userId, newRole),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family', familyId] })
      setRoleMenuOpen(false)
    },
    onError: () => toast({ title: t('common.errorGeneric'), variant: 'destructive' }),
  })

  const impersonateMutation = useMutation({
    mutationFn: () => familyService.impersonate(familyId, member.userId),
    onSuccess: (data) => {
      startImpersonation(data.sessionToken, displayName, 'family')
      qc.clear()
    },
    onError: () => toast({ title: t('common.errorGeneric'), variant: 'destructive' }),
  })

  // [PENDING_BE] Request impersonation permission for real accounts
  const requestPermissionMutation = useMutation({
    mutationFn: () => familyService.requestImpersonationPermission(familyId, member.userId),
    onSuccess: () => {
      setPermissionRequested(true)
      toast({ title: t('family.impersonation.requestPermissionSent', { name: displayName }) })
    },
    onError: () => toast({ title: t('family.impersonation.requestPermissionError'), variant: 'destructive' }),
  })

  const isSelf = member.userId === currentUserId
  const permissionGranted = member.impersonationPermissionGranted ?? false

  // Impersonation permission rules:
  // - Managed profiles: planner can always impersonate
  // - Real accounts: planner can only impersonate if permission is granted
  const canImpersonateManaged = isCurrentUserPlanner && !isSelf && isManaged
  const canImpersonateReal = isCurrentUserPlanner && !isSelf && !isManaged && permissionGranted
  const canImpersonate = canImpersonateManaged || canImpersonateReal

  // Show "Request access" for real accounts where permission is not yet granted (and not already requested)
  const canRequestPermission = isCurrentUserPlanner && !isSelf && !isManaged && !permissionGranted && !permissionRequested

  const canRemove = isCurrentUserPlanner && isManaged
  const canKick = isCurrentUserPlanner && !isSelf && !isManaged
  const canLeave = isSelf && !isManaged
  const canEdit = isCurrentUserPlanner && isManaged
  const canChangeRole = isCurrentUserPlanner
  const isLastPlanner = member.role === 'PLANNER' && plannerCount === 1

  function handleRoleChange(newRole: FamilyRole) {
    // Prevent stranding: cannot demote the last planner
    if (newRole === 'MEMBER' && isSelf && isLastPlanner) {
      toast({ title: t('family.roles.cannotDemoteLastPlanner'), variant: 'destructive' })
      return
    }
    roleMutation.mutate(newRole)
  }

  function handleRemove() {
    setRemoveConfirmOpen(true)
  }

  function handleKick() {
    setKickConfirmOpen(true)
  }

  function handleLeave() {
    if (isLastPlanner) {
      toast({ title: t('family.memberRow.cannotLeaveLastPlanner'), variant: 'destructive' })
      return
    }
    setLeaveConfirmOpen(true)
  }

  return (
    <li className="flex items-center gap-3 py-3 border-b border-[#e5e4e7] last:border-none">
      {/* Avatar / initials */}
      <div
        aria-hidden="true"
        className="h-9 w-9 rounded-full bg-[#F28C28]/15 text-[#F28C28] text-sm font-semibold flex items-center justify-center shrink-0 select-none"
      >
        {displayName.slice(0, 1).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1A1A1A] truncate">
          {displayName}
          {isSelf && (
            <span className="ml-1.5 text-xs text-[#6b6b6b]">({t('family.memberRow.you')})</span>
          )}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {/* Role badge */}
          <span
            className={
              member.role === 'PLANNER'
                ? 'text-[10px] font-semibold uppercase tracking-wide bg-[#F28C28]/15 text-[#F28C28] px-1.5 py-0.5 rounded'
                : 'text-[10px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded'
            }
          >
            {t(`family.roles.${member.role.toLowerCase()}`)}
          </span>
          {/* Profile type badge */}
          {isManaged && (
            <span className="text-[10px] font-medium bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
              {t('family.memberRow.managedBadge')}
            </span>
          )}
          {/* Permission pending badge — shown after request was sent */}
          {permissionRequested && (
            <span className="text-[10px] font-medium bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">
              {t('family.impersonation.permissionPendingLabel')}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {canEdit && (
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            aria-label={t('family.memberRow.editPrefs', { name: displayName })}
            className="p-1.5 rounded-lg text-[#6b6b6b] hover:text-[#1A1A1A] hover:bg-gray-100 transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}

        {canChangeRole && !isManaged && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setRoleMenuOpen((o) => !o)}
              aria-label={t('family.roles.changeRole')}
              aria-expanded={roleMenuOpen}
              aria-haspopup="menu"
              className="p-1.5 rounded-lg text-[#6b6b6b] hover:text-[#1A1A1A] hover:bg-gray-100 transition-colors"
            >
              <UserCog className="h-4 w-4" />
              <ChevronDown className="h-3 w-3 inline" />
            </button>
            {roleMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-1 bg-white border border-[#e5e4e7] rounded-lg shadow-md z-10 min-w-[140px] py-1"
              >
                {(['PLANNER', 'MEMBER'] as FamilyRole[]).map((role) => (
                  <button
                    key={role}
                    role="menuitem"
                    type="button"
                    disabled={roleMutation.isPending || member.role === role}
                    onClick={() => handleRoleChange(role)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {t(`family.roles.${role.toLowerCase()}`)}
                    {member.role === role && (
                      <span className="ml-2 text-xs text-[#F28C28]">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Impersonate — only for managed profiles or real accounts with permission */}
        {canImpersonate && (
          <button
            type="button"
            onClick={() => impersonateMutation.mutate()}
            disabled={impersonateMutation.isPending}
            aria-label={t('family.impersonation.switchTo', { name: displayName })}
            className="text-xs px-2 py-1 rounded-lg border border-[#e5e4e7] text-[#6b6b6b] hover:text-[#1A1A1A] hover:border-[#1A1A1A] transition-colors disabled:opacity-40"
          >
            {t('family.impersonation.switchLabel')}
          </button>
        )}

        {/* Request access — for real accounts without permission */}
        {canRequestPermission && (
          <button
            type="button"
            onClick={() => requestPermissionMutation.mutate()}
            disabled={requestPermissionMutation.isPending}
            aria-label={t('family.impersonation.requestPermissionAriaLabel', { name: displayName })}
            className="text-xs px-2 py-1 rounded-lg border border-[#e5e4e7] text-[#6b6b6b] hover:text-[#1A1A1A] hover:border-[#1A1A1A] transition-colors disabled:opacity-40"
          >
            {t('family.impersonation.requestPermissionCta')}
          </button>
        )}

        {canRemove && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={removeMutation.isPending}
            aria-label={t('family.memberRow.removeProfile', { name: displayName })}
            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}

        {canKick && (
          <button
            type="button"
            onClick={handleKick}
            disabled={kickMutation.isPending}
            aria-label={t('family.memberRow.removeMember', { name: displayName })}
            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
          >
            <UserMinus className="h-4 w-4" />
          </button>
        )}

        {canLeave && (
          <button
            type="button"
            onClick={handleLeave}
            disabled={leaveMutation.isPending || isLastPlanner}
            title={isLastPlanner ? t('family.memberRow.cannotLeaveLastPlanner') : undefined}
            aria-label={t('family.memberRow.leaveAriaLabel')}
            className="text-xs px-2 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t('family.memberRow.leaveCta')}
          </button>
        )}
      </div>

      {/* Edit preferences dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('family.managedProfile.editTitle', { name: displayName })}
            </DialogTitle>
          </DialogHeader>
          <ManagedProfileEditor
            initialDisplayName={displayName}
            showNameField={false}
            isPending={false}
            onSubmit={(_name, prefs) => {
              familyService
                .editManagedProfile(familyId, member.userId, {
                  displayName,
                  preferences: prefs,
                })
                .then(() => {
                  qc.invalidateQueries({ queryKey: ['family', familyId] })
                  setEditOpen(false)
                  toast({ title: t('family.managedProfile.savedPrefs') })
                })
                .catch(() =>
                  toast({ title: t('common.errorGeneric'), variant: 'destructive' }),
                )
            }}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={removeConfirmOpen}
        onOpenChange={setRemoveConfirmOpen}
        title={t('confirm.family.remove.title', { name: displayName })}
        description={t('confirm.family.remove.body')}
        destructiveLabel={t('confirm.family.remove.confirm')}
        cancelLabel={t('confirm.family.remove.cancel')}
        onConfirm={() => removeMutation.mutate()}
        isPending={removeMutation.isPending}
      />

      <ConfirmDialog
        open={kickConfirmOpen}
        onOpenChange={setKickConfirmOpen}
        title={t('confirm.family.kick.title', { name: displayName })}
        description={t('confirm.family.kick.body')}
        destructiveLabel={t('confirm.family.kick.confirm')}
        cancelLabel={t('confirm.family.kick.cancel')}
        onConfirm={() => kickMutation.mutate()}
        isPending={kickMutation.isPending}
      />

      <ConfirmDialog
        open={leaveConfirmOpen}
        onOpenChange={setLeaveConfirmOpen}
        title={t('confirm.family.leave.title')}
        description={t('confirm.family.leave.body')}
        destructiveLabel={t('confirm.family.leave.confirm')}
        cancelLabel={t('confirm.family.leave.cancel')}
        onConfirm={() => leaveMutation.mutate()}
        isPending={leaveMutation.isPending}
      />
    </li>
  )
}
