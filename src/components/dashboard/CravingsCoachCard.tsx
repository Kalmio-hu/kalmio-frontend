/**
 * CravingsCoachCard — premium single-turn eating-pattern observation.
 *
 * POST /api/coach/observe. Food patterns only: medical-sounding input is redirected
 * server-side. When the coach proposes a plan edit, the card hands the intent to the
 * conversational edit card via onProposeEdit.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { HeartHandshake } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { coachService } from '@/services/coach'
import { capture } from '@/lib/analytics'
import { aiErrorKind } from '@/lib/aiErrors'
import type { CravingsCoachResponse } from '@/types'

const MAX_LEN = 400

interface Props {
  /** Present when there is an active plan the proposed edit can be applied to. */
  onProposeEdit?: (intent: string) => void
}

export function CravingsCoachCard({ onProposeEdit }: Props) {
  const { t, i18n } = useTranslation()
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<CravingsCoachResponse | null>(null)

  const observeMutation = useMutation({
    mutationFn: () => coachService.observe(prompt.trim()),
    onSuccess: (res) => {
      setResult(res)
      capture('cravings_coach_observed', { hasProposal: !!res.proposedPlanEditIntent })
    },
    onError: (err) => toast({ title: t(`dashboard.coach.errors.${aiErrorKind(err)}`), variant: 'destructive' }),
  })

  const observation =
    i18n.resolvedLanguage !== 'hu' && result?.observationEn ? result.observationEn : result?.observation
  const canSubmit = prompt.trim().length > 0 && !observeMutation.isPending

  return (
    <Card>
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-start gap-2">
          <HeartHandshake className="h-4 w-4 mt-0.5 text-[#F28C28] shrink-0" aria-hidden />
          <div>
            <h3 className="text-sm font-semibold text-[#1A1A1A]">{t('dashboard.coach.title')}</h3>
            <p className="text-xs text-[#6b7280]">{t('dashboard.coach.subtitle')}</p>
          </div>
        </div>

        <form onSubmit={e => { e.preventDefault(); if (canSubmit) observeMutation.mutate() }} className="space-y-2">
          <Textarea
            value={prompt}
            maxLength={MAX_LEN}
            onChange={e => setPrompt(e.target.value)}
            placeholder={t('dashboard.coach.placeholder')}
            aria-label={t('dashboard.coach.title')}
            disabled={observeMutation.isPending}
            className="min-h-[64px]"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#9ca3af]">{prompt.length}/{MAX_LEN}</span>
            <Button type="submit" size="sm" disabled={!canSubmit}>
              {observeMutation.isPending ? t('dashboard.coach.submitting') : t('dashboard.coach.submit')}
            </Button>
          </div>
        </form>

        {result && observation && (
          <div className="rounded-xl bg-[#f9f7f2] px-3 py-3 space-y-2" role="status">
            <p className="text-sm text-[#1A1A1A] leading-relaxed">{observation}</p>
            {result.proposedPlanEditIntent && onProposeEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onProposeEdit(result.proposedPlanEditIntent!)}
              >
                {t('dashboard.coach.applyToPlan')}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
