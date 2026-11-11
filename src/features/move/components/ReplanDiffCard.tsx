/**
 * The one movement diff card (PRD §3 principle 3, §7.6): narrative line, the
 * reason behind "Miért?", the session changes as plain lines, and
 * Rendben / Inkább hagyjuk ki. Used by the today page, the week page
 * ("Újratervezés") and the missed-session morning card.
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { useMoveT } from '../lib/register'
import type { MoveReplanDiffDto } from '../types'

interface ReplanDiffCardProps {
  diff: MoveReplanDiffDto
  onResolved?: () => void
}

const ACCENT_BUTTON = 'bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F]'

export function ReplanDiffCard({ diff, onResolved }: ReplanDiffCardProps) {
  const { t } = useMoveT()
  const qc = useQueryClient()
  const [showWhy, setShowWhy] = useState(false)

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: moveKeys.all })
    void qc.invalidateQueries({ queryKey: ['dashboard'] })
    onResolved?.()
  }

  const accept = useMutation({
    mutationFn: () => moveService.acceptReplan(diff.id),
    onSuccess: () => {
      toast({ title: t('today.diff.accepted'), variant: 'success' })
      invalidate()
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })
  const decline = useMutation({
    mutationFn: () => moveService.declineReplan(diff.id),
    onSuccess: () => {
      toast({ title: t('today.diff.declined'), variant: 'success' })
      invalidate()
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })
  const busy = accept.isPending || decline.isPending

  return (
    <section
      aria-labelledby={`move-diff-${diff.id}`}
      className="move-block bg-white rounded-[16px] border border-[#e5e4e7] shadow-sm p-5 space-y-3"
      aria-live="polite"
    >
      <h2 id={`move-diff-${diff.id}`} className="text-sm font-semibold text-gray-500">
        {t('today.diff.title')}
      </h2>
      <p className="text-base text-[#1A1A1A]">{diff.narrative}</p>
      {diff.changes.length > 0 && (
        <ul className="space-y-1 text-sm text-gray-700 list-disc pl-5">
          {diff.changes.map((c, i) => (
            <li key={`${c.sessionId ?? 'x'}-${i}`}>{c.line}</li>
          ))}
        </ul>
      )}
      {showWhy && diff.reason && <p className="text-sm text-gray-600">{diff.reason}</p>}
      <div className="flex flex-wrap gap-2">
        <Button className={ACCENT_BUTTON} onClick={() => accept.mutate()} disabled={busy}>
          {t('today.diff.ok')}
        </Button>
        <Button variant="secondary" onClick={() => decline.mutate()} disabled={busy}>
          {t('today.diff.decline')}
        </Button>
        {diff.reason && (
          <Button variant="ghost" onClick={() => setShowWhy((v) => !v)} aria-expanded={showWhy}>
            {t('today.diff.why')}
          </Button>
        )}
      </div>
    </section>
  )
}
