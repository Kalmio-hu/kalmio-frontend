/**
 * TemplateDriftBanner — KALMIO-323 (diverge model)
 *
 * Shows a sticky amber banner on the Plan detail page whenever a running
 * schedule's snapshot signature diverges from the current template.
 *
 * Props:
 *   planId     — the plan template UUID (used to invalidate plan-template queries on re-run)
 *   scheduleId — the schedule UUID to check for drift
 *
 * The component is intentionally self-contained: it fetches drift status itself
 * so the parent (PlanDetail) only needs one mount line.
 *
 * i18n namespace: plan.detail.templateDrift.*
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { schedulesService } from '@/services/schedules'

interface TemplateDriftBannerProps {
  planId: string
  scheduleId: string
}

export function TemplateDriftBanner({ planId, scheduleId }: TemplateDriftBannerProps) {
  const { t } = useTranslation()
  const qc = useQueryClient()

  // Fetch drift status — polls every 60 s (staleTime = 0 so the banner reflects
  // immediate template edits on next focus). Only active schedules are checked by
  // the parent; if this component is mounted, drift is worth checking.
  const { data: drift } = useQuery({
    queryKey: ['schedule-drift', scheduleId],
    queryFn: () => schedulesService.checkTemplateDrift(scheduleId),
    staleTime: 0,
    refetchOnWindowFocus: true,
    // Silently swallow errors — if the schedule is gone or forbidden, just hide the banner.
    retry: false,
  })

  const reRunMutation = useMutation({
    mutationFn: () => schedulesService.reRun(scheduleId),
    onSuccess: () => {
      // Invalidate the drift query (new schedule won't be drifted)
      void qc.invalidateQueries({ queryKey: ['schedule-drift'] })
      // Invalidate schedule list so the new schedule appears
      void qc.invalidateQueries({ queryKey: ['schedules'] })
      // The plan template itself didn't change, but invalidate to keep UI consistent
      void qc.invalidateQueries({ queryKey: ['plan-template', planId] })
      toast({ title: t('plan.detail.templateDrift.reRunSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('plan.detail.templateDrift.reRunError'), variant: 'destructive' })
    },
  })

  // Only render when drift is confirmed true
  if (!drift?.drifted) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="
        flex items-center gap-3 px-4 py-3 mb-5
        rounded-[12px] border border-amber-300 bg-amber-50
        text-sm text-amber-900
      "
    >
      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" aria-hidden />
      <span className="flex-1">{t('plan.detail.templateDrift.banner')}</span>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => reRunMutation.mutate()}
        disabled={reRunMutation.isPending}
        className="shrink-0"
      >
        {reRunMutation.isPending ? (
          <>
            <Spinner className="h-4 w-4 mr-1.5" />
            {t('plan.detail.templateDrift.reRunning')}
          </>
        ) : (
          t('plan.detail.templateDrift.reRunCta')
        )}
      </Button>
    </div>
  )
}
