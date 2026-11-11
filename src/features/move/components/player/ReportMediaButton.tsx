/**
 * "Hibás a bemutató" — files a review ticket for one generated asset
 * (PRD §12.4) through POST /api/move/media/{id}/report. Offline, the request
 * sits in the service-worker queue and replays later.
 */
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { moveService } from '../../services/moveService'
import { useMoveT } from '../../lib/register'
import { isOfflineError } from '../../lib/offline'

export function ReportMediaButton({ mediaId, className }: { mediaId: string; className?: string }) {
  const { t } = useMoveT()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')

  const report = useMutation({
    mutationFn: () => moveService.reportMedia(mediaId, note.trim() ? { note: note.trim() } : {}),
    onSuccess: () => done(),
    onError: (err) => {
      if (isOfflineError(err)) done()
      else toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  const done = () => {
    toast({ title: t('report.sent'), variant: 'success' })
    setNote('')
    setOpen(false)
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" className={className} onClick={() => setOpen(true)}>
        <Flag className="h-4 w-4" aria-hidden />
        {t('report.button')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="move-block" data-space="move">
          <DialogHeader>
            <DialogTitle>{t('report.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('report.note')}
              aria-label={t('report.note')}
              rows={3}
              maxLength={500}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={report.isPending}>
                {t('common.cancel')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => report.mutate()} disabled={report.isPending}>
                {t('report.submit')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
