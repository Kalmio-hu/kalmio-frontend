/**
 * ConversationalEditCard — premium "tell me what to change" entry on the Dashboard.
 *
 * POST /api/plans/{id}/conversational-edit returns a solver diff plus a narrative;
 * the proposalId is the cached replan diff id, so accepting goes through the
 * ordinary planService.acceptReplan path and refreshes the same queries the
 * ReplanDiffCard does.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MessagesSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { planService } from '@/services/plans'
import { capture } from '@/lib/analytics'
import { aiErrorKind } from '@/lib/aiErrors'
import { todayIsoLocal } from '@/lib/utils'
import type { AiPlanEditResponse } from '@/types'

const MAX_LEN = 500

export interface EditPrefill {
  text: string
  /** Changes on every hand-off so the same text can be proposed twice. */
  nonce: number
}

interface Props {
  planId: string
  /** Text to prefill (e.g. the cravings coach's proposed intent). */
  prefill?: EditPrefill | null
}

export function ConversationalEditCard({ planId, prefill }: Props) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const today = todayIsoLocal()

  const [message, setMessage] = useState('')
  const [proposal, setProposal] = useState<AiPlanEditResponse | null>(null)

  // Adopt a new prefill during render (React "state from previous render" pattern) —
  // no effect, no cascading render.
  const [adoptedNonce, setAdoptedNonce] = useState<number | null>(null)
  if (prefill && prefill.nonce !== adoptedNonce) {
    setAdoptedNonce(prefill.nonce)
    setMessage(prefill.text.slice(0, MAX_LEN))
    setProposal(null)
  }

  const editMutation = useMutation({
    mutationFn: () => planService.conversationalEdit(planId, message.trim()),
    onSuccess: (res) => {
      setProposal(res)
      capture('conversational_edit_proposed', { changes: res.diff?.changes?.length ?? 0, kind: res.editIntent?.kind })
    },
    onError: (err) => {
      toast({ title: t(`dashboard.aiEdit.errors.${aiErrorKind(err)}`), variant: 'destructive' })
    },
  })

  const acceptMutation = useMutation({
    mutationFn: () => planService.acceptReplan(planId, proposal!.proposalId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan', 'active'] })
      qc.invalidateQueries({ queryKey: ['dashboard', today] })
      qc.invalidateQueries({ queryKey: ['planned-meals'] })
      qc.invalidateQueries({ queryKey: ['replanDiff', planId] })
      qc.invalidateQueries({ queryKey: ['points'] })
      capture('conversational_edit_accepted', {})
      toast({ title: t('dashboard.aiEdit.accepted') })
      setProposal(null)
      setMessage('')
    },
    onError: () => toast({ title: t('dashboard.replan.acceptError'), variant: 'destructive' }),
  })

  const changes = proposal?.diff?.changes ?? []
  const canSubmit = message.trim().length > 0 && !editMutation.isPending

  return (
    <Card>
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-start gap-2">
          <MessagesSquare className="h-4 w-4 mt-0.5 text-[#F28C28] shrink-0" aria-hidden />
          <div>
            <h3 className="text-sm font-semibold text-[#1A1A1A]">{t('dashboard.aiEdit.title')}</h3>
            <p className="text-xs text-[#6b7280]">{t('dashboard.aiEdit.subtitle')}</p>
          </div>
        </div>

        {!proposal && (
          <form
            onSubmit={e => { e.preventDefault(); if (canSubmit) editMutation.mutate() }}
            className="space-y-2"
          >
            <Textarea
              value={message}
              maxLength={MAX_LEN}
              onChange={e => setMessage(e.target.value)}
              placeholder={t('dashboard.aiEdit.placeholder')}
              aria-label={t('dashboard.aiEdit.title')}
              disabled={editMutation.isPending}
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#9ca3af]">{message.length}/{MAX_LEN}</span>
              <Button type="submit" size="sm" disabled={!canSubmit}>
                {editMutation.isPending ? t('dashboard.aiEdit.submitting') : t('dashboard.aiEdit.submit')}
              </Button>
            </div>
          </form>
        )}

        {proposal && (
          <div className="space-y-3">
            {(proposal.narrative || proposal.editIntent?.narrative) && (
              <p className="text-sm text-[#1A1A1A] leading-relaxed">
                {proposal.narrative ?? proposal.editIntent?.narrative}
              </p>
            )}

            {changes.length === 0 ? (
              <p className="text-sm text-[#6b7280]">{t('dashboard.aiEdit.noChanges')}</p>
            ) : (
              <ul className="space-y-1.5" aria-label={t('dashboard.aiEdit.changesTitle')}>
                {changes.map(c => (
                  <li key={c.mealId} className="rounded-lg bg-[#f9f7f2] px-3 py-2 text-xs">
                    <span className="font-medium text-[#6b7280]">
                      {c.date} · {t(`plan.mealTypes.${c.mealType}`, c.mealType)}
                    </span>
                    <p className="text-sm text-[#1A1A1A] mt-0.5">
                      <span className="line-through text-[#9ca3af]">{c.oldRecipeName}</span>
                      {' '}
                      <span className="font-medium">{c.newRecipeName}</span>
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setProposal(null)} disabled={acceptMutation.isPending}>
                {t('dashboard.aiEdit.discard')}
              </Button>
              {changes.length > 0 && (
                <Button size="sm" onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isPending}>
                  {acceptMutation.isPending ? t('dashboard.aiEdit.accepting') : t('dashboard.replan.accept')}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
