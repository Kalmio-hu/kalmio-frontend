/**
 * "Letöltés az órára (.FIT)" — GET /api/move/sessions/{id}/export.fit with the
 * auth header (Axios blob), handed to the browser as a download (PRD §7.11).
 * Only Card and Target sessions export; the caller decides whether to render it.
 */
import { useMutation } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { moveService } from '../services/moveService'
import { useMoveT } from '../lib/register'
import { saveBlob } from '../lib/offline'

interface FitDownloadButtonProps extends Pick<ButtonProps, 'variant' | 'size' | 'className'> {
  sessionId: string
  date?: string
}

export function FitDownloadButton({ sessionId, date, variant = 'secondary', size = 'md', className }: FitDownloadButtonProps) {
  const { t } = useMoveT()
  const dl = useMutation({
    mutationFn: () => moveService.exportFit(sessionId),
    onSuccess: (blob) => saveBlob(blob, `kalmio-move-${date ?? sessionId}.fit`),
    onError: () => toast({ title: t('player.fit.error'), variant: 'destructive' }),
  })
  return (
    <Button type="button" variant={variant} size={size} className={className} onClick={() => dl.mutate()} disabled={dl.isPending}>
      <Download className="h-4 w-4" aria-hidden />
      {t('player.fit.download')}
    </Button>
  )
}
