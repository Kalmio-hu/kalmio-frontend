import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, ShieldX } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { familyService } from '@/services/family'

/**
 * Banner card shown when the caller has pending impersonation-permission requests
 * targeted at them — i.e. another family member (a PLANNER) has asked to be allowed
 * to impersonate this user, and is waiting for grant or deny.
 *
 * Renders nothing when there are no pending requests, so it's safe to mount
 * unconditionally on the Family page (and anywhere else we want this surface).
 */
export function PendingImpersonationRequests() {
  const { t } = useTranslation()
  const qc = useQueryClient()

  const { data: pending } = useQuery({
    queryKey: ['impersonation-permissions', 'pending'],
    queryFn: familyService.listPendingImpersonationRequests,
    staleTime: 30_000,
  })

  const grantMutation = useMutation({
    mutationFn: (id: string) => familyService.grantImpersonationPermission(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['impersonation-permissions', 'pending'] })
      qc.invalidateQueries({ queryKey: ['family'] })
      toast({ title: t('family.impersonation.permissionGranted') })
    },
    onError: () => toast({
      title: t('family.impersonation.permissionDecisionError'),
      variant: 'destructive',
    }),
  })

  const denyMutation = useMutation({
    mutationFn: (id: string) => familyService.denyImpersonationPermission(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['impersonation-permissions', 'pending'] })
      toast({ title: t('family.impersonation.permissionDenied') })
    },
    onError: () => toast({
      title: t('family.impersonation.permissionDecisionError'),
      variant: 'destructive',
    }),
  })

  if (!pending || pending.length === 0) return null

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="py-4 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-amber-900">
            {t('family.impersonation.pendingTitle')}
          </h2>
          <p className="text-xs text-amber-800 mt-1">
            {t('family.impersonation.pendingHint')}
          </p>
        </div>
        <ul role="list" className="space-y-2">
          {pending.map((req) => (
            <li
              key={req.id}
              className="flex flex-wrap items-center gap-3 rounded-lg bg-white px-3 py-2"
            >
              <span className="text-sm text-[#1A1A1A] flex-1 min-w-0 truncate">
                {t('family.impersonation.pendingItem', {
                  requesterId: req.requesterId.slice(0, 8),
                })}
              </span>
              <Button
                size="sm"
                onClick={() => grantMutation.mutate(req.id)}
                disabled={grantMutation.isPending || denyMutation.isPending}
                aria-label={t('family.impersonation.grantAriaLabel')}
                className="gap-1.5"
              >
                <ShieldCheck size={14} />
                {t('family.impersonation.grantCta')}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => denyMutation.mutate(req.id)}
                disabled={grantMutation.isPending || denyMutation.isPending}
                aria-label={t('family.impersonation.denyAriaLabel')}
                className="gap-1.5"
              >
                <ShieldX size={14} />
                {t('family.impersonation.denyCta')}
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
