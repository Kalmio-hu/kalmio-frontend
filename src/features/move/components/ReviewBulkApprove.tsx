/**
 * Bulk approval in the review queue (founder, 2026-11-12): the pending assets
 * grouped by pack and demonstrator (`GET /api/admin/move/review/pending-groups`),
 * each group approved in one go after an inline confirm
 * (`POST /api/admin/move/review/bulk`). Every asset still gets its own review
 * row; the single-asset queue below stays for rejections.
 */
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { useCharacterNames } from '../lib/useCharacterNames'

export function ReviewBulkApprove() {
  const { t } = useTranslation('move')
  const qc = useQueryClient()
  const characterName = useCharacterNames()
  const [confirming, setConfirming] = useState<string | null>(null)
  const groups = useQuery({ queryKey: ['move', 'admin', 'pending-groups'], queryFn: moveService.admin.pendingGroups, staleTime: 15_000 })
  const approve = useMutation({
    mutationFn: ({ pack, character }: { pack: string; character: string }) => moveService.admin.approveAll(pack, character),
    onSuccess: (res) => {
      toast({ title: t('review.bulk.done', { count: res.approved }), variant: 'success' })
      setConfirming(null)
      void qc.invalidateQueries({ queryKey: ['move', 'admin'] })
      void qc.invalidateQueries({ queryKey: moveKeys.demonstrators })
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  if (!groups.data || groups.data.length === 0) return null
  return (
    <section className="rounded-[16px] border border-[#e5e4e7] bg-white p-4 space-y-3" aria-labelledby="review-bulk-title">
      <div>
        <h2 id="review-bulk-title" className="text-sm font-semibold text-[#1A1A1A]">{t('review.bulk.title')}</h2>
        <p className="text-sm text-gray-500">{t('review.bulk.hint')}</p>
      </div>
      <ul className="space-y-2">
        {groups.data.map((g) => {
          const key = `${g.packCode}|${g.characterCode}`
          return (
            <li key={key} className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 flex-1 text-sm text-[#1A1A1A]">
                {g.packCode} · {characterName(g.characterCode)} · {t('review.bulk.pending', { count: g.count })}
              </span>
              {confirming === key ? (
                <span className="inline-flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-700">{t('review.bulk.confirm', { count: g.count })}</span>
                  <Button size="sm" className="min-h-10 bg-[#4F7942] hover:bg-[#3f6135]" disabled={approve.isPending}
                    onClick={() => approve.mutate({ pack: g.packCode, character: g.characterCode })}>
                    {t('review.bulk.yes')}
                  </Button>
                  <Button size="sm" variant="ghost" className="min-h-10" onClick={() => setConfirming(null)}>
                    {t('common.cancel')}
                  </Button>
                </span>
              ) : (
                <Button size="sm" variant="secondary" className="min-h-10" onClick={() => setConfirming(key)}>
                  {t('review.bulk.approve')}
                </Button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
