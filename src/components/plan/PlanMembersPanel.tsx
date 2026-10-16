/**
 * PlanMembersPanel — family membership and co-planner delegation for a plan.
 *
 * Membership: PATCH /api/plans/{id}/members (adds/removes in both the plan column
 * and plan_members; removal also drops the member's future planned meals).
 * Co-planners: POST/DELETE /api/plans/{id}/co-planners/{userId} — planner only.
 * Every mutation returns the updated PlanTemplate (with coPlannerIds).
 * Only rendered for family-owned plans.
 */
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toast'
import { multiMemberPlanService } from '@/services/plans'
import type { FamilyResponse, PlanTemplate } from '@/types'

interface Props {
  plan: PlanTemplate
  family: FamilyResponse
  currentUserId: string
}

export function PlanMembersPanel({ plan, family, currentUserId }: Props) {
  const { t } = useTranslation()
  const qc = useQueryClient()

  const coPlannerIds = plan.coPlannerIds ?? []
  const isPlanner = currentUserId === plan.ownerUserId
  const canEditMembers = isPlanner || coPlannerIds.includes(currentUserId)

  function applyUpdated(updated: PlanTemplate) {
    qc.setQueryData(['plan-template', plan.id], updated)
    void qc.invalidateQueries({ queryKey: ['plans'] })
  }

  const membersMutation = useMutation({
    mutationFn: (vars: { userId: string; add: boolean }) =>
      multiMemberPlanService.updateMembers(
        plan.id,
        vars.add ? { addUserIds: [vars.userId] } : { removeUserIds: [vars.userId] },
      ),
    onSuccess: (updated) => { applyUpdated(updated); toast({ title: t('plan.members.updated') }) },
    onError: (err) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      toast({
        title: status === 409 ? t('plan.members.conflict') : t('plan.members.updateError'),
        variant: 'destructive',
      })
    },
  })

  const coPlannerMutation = useMutation({
    mutationFn: (vars: { userId: string; promote: boolean }) =>
      vars.promote
        ? multiMemberPlanService.promoteCoPlanner(plan.id, vars.userId)
        : multiMemberPlanService.demoteCoPlanner(plan.id, vars.userId),
    onSuccess: (updated) => applyUpdated(updated),
    onError: () => toast({ title: t('plan.members.updateError'), variant: 'destructive' }),
  })

  const busy = membersMutation.isPending || coPlannerMutation.isPending

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-1.5">
          <Users className="h-4 w-4 text-[#4F7942]" aria-hidden />
          {t('plan.members.title')}
        </CardTitle>
        <p className="text-xs text-[#6b7280]">
          {canEditMembers ? t('plan.members.subtitle') : t('plan.members.readOnly')}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="divide-y divide-[#f0efe9]" aria-label={t('plan.members.title')}>
          {family.members.map(member => {
            const inPlan = plan.memberIds.includes(member.userId)
            const isOwner = member.userId === plan.ownerUserId
            const isCoPlanner = coPlannerIds.includes(member.userId)
            const lastMember = inPlan && plan.memberIds.length === 1
            return (
              <li key={member.userId} className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#4F7942]"
                  checked={inPlan}
                  disabled={!canEditMembers || busy || lastMember}
                  onChange={e => membersMutation.mutate({ userId: member.userId, add: e.target.checked })}
                  aria-label={t('plan.members.inPlanAria', { name: member.displayName })}
                  title={lastMember ? t('plan.members.lastMember') : undefined}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#1A1A1A] truncate">
                    {member.displayName}
                    {member.userId === currentUserId && (
                      <span className="ml-1 text-xs text-[#6b7280]">({t('family.memberRow.you')})</span>
                    )}
                  </p>
                  <p className="text-[11px] text-[#9ca3af]">
                    {isOwner
                      ? t('plan.members.plannerBadge')
                      : isCoPlanner
                        ? t('plan.members.coPlannerBadge')
                        : inPlan
                          ? t('plan.members.memberBadge')
                          : t('plan.members.notInPlan')}
                  </p>
                </div>
                {isPlanner && !isOwner && !member.isManaged && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => coPlannerMutation.mutate({ userId: member.userId, promote: !isCoPlanner })}
                    className="text-xs px-2 py-1 rounded-lg border border-[#e5e4e7] text-[#6b6b6b] hover:text-[#1A1A1A] hover:border-[#1A1A1A] transition-colors disabled:opacity-40"
                  >
                    {isCoPlanner ? t('plan.members.removeCoPlanner') : t('plan.members.makeCoPlanner')}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
