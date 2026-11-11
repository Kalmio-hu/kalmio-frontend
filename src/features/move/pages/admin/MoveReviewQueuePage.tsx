/**
 * Review queue (PRD §12.4, build brief B): one asset per screen beside its shot
 * card, pass / reject with reason codes, keyboard-only operation, a running
 * count, filters by pack and character. Mounted at /app/admin/move/review via
 * src/pages/admin/MoveReviewQueue.tsx (AdminRoute).
 *
 * Keys: A approve · R reject → 1–6 reason · Enter confirm · N skip · ← back · Esc cancel.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { AiLabel } from '../../components/AiLabel'
import { moveService } from '../../services/moveService'
import { moveKeys } from '../../lib/queryKeys'
import { MOVE_ACCENT } from '../../lib/constants'
import { REASON_CODES, shotCardRows } from '../../lib/reviewQueue'
import type { ReviewQueueItemDto, ReviewReasonCode, ReviewVerdictRequest } from '../../types'
import '../../move.css'

type Mode = 'idle' | 'rejecting'

export function MoveReviewQueuePage() {
  const { t } = useTranslation('move')
  const qc = useQueryClient()
  const [pack, setPack] = useState('')
  const [character, setCharacter] = useState('')
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>('idle')
  const [reason, setReason] = useState<ReviewReasonCode | null>(null)
  const [note, setNote] = useState('')
  const [reviewed, setReviewed] = useState<Set<string>>(() => new Set())
  const noteRef = useRef<HTMLInputElement>(null)

  const queueKey = moveKeys.admin.queue('PENDING', pack, character)
  const queue = useQuery({
    queryKey: queueKey,
    queryFn: () => moveService.admin.reviewQueue({ status: 'PENDING', pack: pack || undefined, character: character || undefined }),
    staleTime: 15_000,
  })

  const items = useMemo(() => (queue.data?.items ?? []).filter((i) => !reviewed.has(i.mediaId)), [queue.data, reviewed])
  const total = queue.data?.counts.pending ?? items.length
  const current: ReviewQueueItemDto | undefined = items[Math.min(index, Math.max(items.length - 1, 0))]
  const position = Math.min(index, Math.max(items.length - 1, 0)) + 1 + reviewed.size

  const packs = queue.data?.packs ?? Array.from(new Set((queue.data?.items ?? []).map((i) => i.pack)))
  const characters = queue.data?.characters ?? Array.from(new Map((queue.data?.items ?? []).map((i) => [i.characterCode, { code: i.characterCode, name: i.characterName }])).values())

  const resetVerdict = useCallback(() => {
    setMode('idle')
    setReason(null)
    setNote('')
  }, [])

  const verdict = useMutation({
    mutationFn: ({ mediaId, req }: { mediaId: string; req: ReviewVerdictRequest }) => moveService.admin.review(mediaId, req),
    onSuccess: (_res, vars) => {
      setReviewed((prev) => new Set(prev).add(vars.mediaId))
      toast({ title: vars.req.verdict === 'APPROVE' ? t('review.approved') : t('review.rejected'), variant: 'success' })
      resetVerdict()
      void qc.invalidateQueries({ queryKey: ['move', 'admin'] })
    },
    onError: () => toast({ title: t('review.error'), variant: 'destructive' }),
  })

  const approve = useCallback(() => {
    if (!current || verdict.isPending) return
    verdict.mutate({ mediaId: current.mediaId, req: { verdict: 'APPROVE' } })
  }, [current, verdict])

  const confirmReject = useCallback(() => {
    if (!current || !reason || verdict.isPending) return
    verdict.mutate({ mediaId: current.mediaId, req: { verdict: 'REJECT', reasonCode: reason, note: note.trim() || undefined } })
  }, [current, reason, note, verdict])

  const skip = useCallback(() => {
    resetVerdict()
    setIndex((i) => (items.length === 0 ? 0 : (i + 1) % items.length))
  }, [items.length, resetVerdict])

  const back = useCallback(() => {
    resetVerdict()
    setIndex((i) => (items.length === 0 ? 0 : (i - 1 + items.length) % items.length))
  }, [items.length, resetVerdict])

  // Keyboard-only operation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const inNote = e.target === noteRef.current
      if (e.key === 'Escape') {
        resetVerdict()
        return
      }
      if (e.key === 'Enter') {
        if (mode === 'rejecting') {
          e.preventDefault()
          confirmReject()
        }
        return
      }
      if (inNote) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) return
      const k = e.key.toLowerCase()
      if (k === 'a') { e.preventDefault(); approve(); return }
      if (k === 'r') { e.preventDefault(); setMode('rejecting'); return }
      if (k === 'n') { e.preventDefault(); skip(); return }
      if (e.key === 'ArrowLeft') { e.preventDefault(); back(); return }
      if (mode === 'rejecting' && /^[1-6]$/.test(e.key)) {
        e.preventDefault()
        setReason(REASON_CODES[Number(e.key) - 1])
        noteRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, approve, confirmReject, skip, back, resetVerdict])

  const rows = current ? shotCardRows(current.shotCard ?? {}, t) : []

  return (
    <div className="move-block" style={{ ['--move-accent' as string]: MOVE_ACCENT }}>
      <Header
        title={t('review.title')}
        subtitle={t('review.subtitle')}
        actions={
          <span className="font-mono tabular-nums text-sm font-semibold text-[#1A1A1A]" aria-live="polite" aria-atomic>
            {t('review.count', { index: items.length ? position : reviewed.size, total: Math.max(total, reviewed.size) })}
          </span>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <label className="text-sm text-gray-600 flex flex-col gap-1">
          {t('review.filters.pack')}
          <select
            value={pack}
            onChange={(e) => { setPack(e.target.value); setIndex(0); setReviewed(new Set()) }}
            className="min-h-12 rounded-[12px] border border-[#e5e4e7] bg-white px-3 text-sm text-[#1A1A1A]"
          >
            <option value="">{t('review.filters.all')}</option>
            {packs.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className="text-sm text-gray-600 flex flex-col gap-1">
          {t('review.filters.character')}
          <select
            value={character}
            onChange={(e) => { setCharacter(e.target.value); setIndex(0); setReviewed(new Set()) }}
            className="min-h-12 rounded-[12px] border border-[#e5e4e7] bg-white px-3 text-sm text-[#1A1A1A]"
          >
            <option value="">{t('review.filters.all')}</option>
            {characters.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </label>
        <p className="text-xs text-gray-500 ml-auto">{t('review.keyboardHint')}</p>
      </div>

      {queue.isPending ? (
        <div className="flex justify-center py-12" role="status"><Spinner className="border-[#2A9D8F]" /></div>
      ) : queue.isError ? (
        <Card><CardContent className="py-8 text-center space-y-3">
          <p className="text-sm text-gray-600">{t('review.error')}</p>
          <Button variant="secondary" onClick={() => void queue.refetch()}>{t('common.retry')}</Button>
        </CardContent></Card>
      ) : !current ? (
        <Card><CardContent className="py-10 text-center text-sm text-gray-500">{t('review.empty')}</CardContent></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Asset */}
          <Card>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-headline text-lg font-bold text-[#1A1A1A] mr-auto">{current.exerciseName}</h2>
                <Badge variant="gray">{current.pack}</Badge>
                <Badge variant="black">{current.characterName}</Badge>
                <Badge variant="gray">{current.mediaType}</Badge>
                {current.reportCount > 0 && (
                  <Badge variant="red"><Flag className="h-3 w-3 mr-1" aria-hidden />{t('review.meta.reports', { count: current.reportCount })}</Badge>
                )}
              </div>
              <div className={cn('grid gap-3', current.pairUrl ? 'grid-cols-2' : 'grid-cols-1')}>
                <figure className="space-y-1">
                  <img src={current.url} alt={`${current.exerciseName} — ${current.pairUrl ? t('review.startStill') : current.mediaType}`} className="w-full rounded-[12px] bg-[#F9F7F2] object-contain max-h-[70vh]" />
                  <figcaption className="text-xs text-gray-500">{current.pairUrl ? t('review.startStill') : current.mediaType}</figcaption>
                  <AiLabel />
                </figure>
                {current.pairUrl && (
                  <figure className="space-y-1">
                    <img src={current.pairUrl} alt={`${current.exerciseName} — ${t('review.endStill')}`} className="w-full rounded-[12px] bg-[#F9F7F2] object-contain max-h-[70vh]" />
                    <figcaption className="text-xs text-gray-500">{t('review.endStill')}</figcaption>
                    <AiLabel />
                  </figure>
                )}
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                <dt>{t('review.meta.version', { version: current.shotCardVersion })}</dt>
                <dd>{t('review.meta.attempt', { count: current.attempt })}</dd>
                {current.model && (<><dt>{t('review.meta.model')}</dt><dd>{current.provider ? `${current.provider} · ` : ''}{current.model}</dd></>)}
              </dl>

              {/* Verdict controls */}
              <div className="pt-2 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={approve} disabled={verdict.isPending} className="bg-[#4F7942] hover:bg-[#3f6135] focus-visible:ring-[#4F7942]" aria-keyshortcuts="A">
                    <CheckCircle2 className="h-4 w-4" aria-hidden />{t('review.approve')} <kbd className="ml-1 text-[10px] opacity-70">A</kbd>
                  </Button>
                  <Button variant="danger" onClick={() => setMode('rejecting')} disabled={verdict.isPending} aria-keyshortcuts="R" aria-expanded={mode === 'rejecting'}>
                    <XCircle className="h-4 w-4" aria-hidden />{t('review.reject')} <kbd className="ml-1 text-[10px] opacity-70">R</kbd>
                  </Button>
                  <Button variant="secondary" onClick={back} aria-keyshortcuts="ArrowLeft"><ChevronLeft className="h-4 w-4" aria-hidden />{t('review.back')}</Button>
                  <Button variant="secondary" onClick={skip} aria-keyshortcuts="N">{t('review.skip')}<ChevronRight className="h-4 w-4" aria-hidden /><kbd className="ml-1 text-[10px] opacity-70">N</kbd></Button>
                </div>

                {mode === 'rejecting' && (
                  <fieldset className="rounded-[12px] border border-[#EF4444]/40 bg-[#EF4444]/5 p-3 space-y-3" aria-live="polite">
                    <legend className="text-sm font-semibold text-[#8f1d1d] px-1">{t('review.reasonTitle')}</legend>
                    <div className="grid sm:grid-cols-2 gap-2" role="radiogroup" aria-label={t('review.reasonTitle')}>
                      {REASON_CODES.map((code, i) => (
                        <button
                          key={code}
                          type="button"
                          role="radio"
                          aria-checked={reason === code}
                          onClick={() => setReason(code)}
                          className={cn(
                            'min-h-12 text-left px-3 rounded-[10px] border text-sm flex items-center gap-2',
                            reason === code ? 'border-[#B91C1C] bg-white font-semibold' : 'border-[#e5e4e7] bg-white hover:bg-[#F9F7F2]',
                          )}
                        >
                          <kbd className="inline-flex h-6 w-6 items-center justify-center rounded bg-[#1A1A1A] text-white text-xs">{i + 1}</kbd>
                          {t(`review.reasons.${code}`)}
                          {reason === code && <CheckCircle2 className="h-4 w-4 ml-auto text-[#B91C1C]" aria-hidden />}
                        </button>
                      ))}
                    </div>
                    <input
                      ref={noteRef}
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={t('review.notePlaceholder')}
                      className="w-full min-h-12 rounded-[12px] border border-[#e5e4e7] bg-white px-3 text-sm"
                    />
                    <div className="flex gap-2">
                      <Button variant="danger" onClick={confirmReject} disabled={!reason || verdict.isPending} aria-keyshortcuts="Enter">
                        {t('review.confirm')} <kbd className="ml-1 text-[10px] opacity-70">↵</kbd>
                      </Button>
                      <Button variant="ghost" onClick={resetVerdict} aria-keyshortcuts="Escape">{t('review.cancel')}</Button>
                    </div>
                  </fieldset>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shot card */}
          <Card>
            <CardContent>
              <h2 className="font-headline text-lg font-bold text-[#1A1A1A] mb-3">{t('review.shotCard.title')}</h2>
              {rows.length === 0 ? (
                <p className="text-sm text-gray-400">—</p>
              ) : (
                <dl className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-4 gap-y-3 text-sm">
                  {rows.map((row) => (
                    <div key={row.label} className="contents">
                      <dt className="font-semibold text-gray-600">{row.label}</dt>
                      <dd className="text-[#1A1A1A]">
                        {row.values.length === 1 ? row.values[0] : (
                          <ul className="list-disc pl-4 space-y-0.5">{row.values.map((v, i) => <li key={i}>{v}</li>)}</ul>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
