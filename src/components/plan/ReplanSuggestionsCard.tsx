/**
 * ReplanSuggestionsCard — pending HOUSEHOLD-scope replan diffs awaiting the planner.
 *
 * GET /api/plans/{id}/replan-suggestions, POST .../replan-suggestions/{id}/accept|reject.
 * Personal-scope diffs are auto-applied server-side and never show up here.
 * Renders nothing while there is nothing pending.
 */
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { multiMemberPlanService } from '@/services/plans'

interface Props {
  planId: string
}

export function ReplanSuggestionsCard({ planId }: Props) {
  const { t, i18n } = useTranslation()
  const qc = useQueryClient()

  const { data: suggestions = [] } = useQuery({
    queryKey: ['replan-suggestions', planId],
    queryFn: () => multiMemberPlanService.listPendingSuggestions(planId),
    staleTime: 30_000,
    retry: false,
  })

  const decide = useMutation({
    mutationFn: (vars: { id: string; accept: boolean }) =>
      vars.accept
        ? multiMemberPlanService.acceptSuggestion(vars.id)
        : multiMemberPlanService.rejectSuggestion(vars.id),
    onSuccess: (_res, vars) => {
      void qc.invalidateQueries({ queryKey: ['replan-suggestions', planId] })
      void qc.invalidateQueries({ queryKey: ['planned-meals'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: vars.accept ? t('plan.suggestions.accepted') : t('plan.suggestions.rejected') })
    },
    onError: () => toast({ title: t('plan.suggestions.error'), variant: 'destructive' }),
  })

  if (suggestions.length === 0) return null

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(i18n.resolvedLanguage === 'hu' ? 'hu-HU' : 'en-GB', {
      month: 'short', day: 'numeric',
    }).format(new Date(iso))

  return (
    <Card className="mb-4 border-[#F28C28]/40 bg-[#FEF3E7]">
      <CardContent className="pt-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-[#1A1A1A]">{t('plan.suggestions.title')}</h3>
          <p className="text-xs text-[#6b7280]">{t('plan.suggestions.subtitle', { count: suggestions.length })}</p>
        </div>
        <ul className="space-y-3">
          {suggestions.map(s => (
            <li key={s.id} className="rounded-xl bg-white border border-[#e5e7eb] px-3 py-3 space-y-2">
              <p className="text-[11px] text-[#9ca3af]">{formatDate(s.createdAt)}</p>
              {s.diff.changes.length === 0 ? (
                <p className="text-sm text-[#6b7280]">{t('plan.suggestions.noDiff')}</p>
              ) : (
                <ul className="space-y-1">
                  {s.diff.changes.map(c => (
                    <li key={c.mealId} className="text-xs">
                      <span className="text-[#6b7280]">
                        {c.date} · {t(`plan.mealTypes.${c.mealType}`, c.mealType)}:
                      </span>{' '}
                      <span className="line-through text-[#9ca3af]">{c.oldRecipeName}</span>{' '}
                      <span className="font-medium text-[#1A1A1A]">{c.newRecipeName}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" size="sm" disabled={decide.isPending} onClick={() => decide.mutate({ id: s.id, accept: false })}>
                  {t('plan.suggestions.reject')}
                </Button>
                <Button size="sm" disabled={decide.isPending} onClick={() => decide.mutate({ id: s.id, accept: true })}>
                  {t('plan.suggestions.accept')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
