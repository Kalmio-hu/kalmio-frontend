/**
 * "Másik gyakorlatot" — substitutes in the engine's order (PRD §8.2) via
 * POST /api/move/sessions/{id}/exercise-swap: {exerciseId} lists, then
 * {exerciseId, substituteId} applies and returns the rebuilt PlayerSessionDto.
 */
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { moveService } from '../../services/moveService'
import { useMoveT } from '../../lib/register'
import { chooseLibraryMedia } from '../../lib/mediaFallback'
import type { PlayerSessionDto, Register } from '../../types'
import { PersonPictogram } from './Figures'

interface ExerciseSwapSheetProps {
  sessionId: string
  exerciseId: string | null
  characterCode: string
  register: Register
  onClose: () => void
  onApplied: (session: PlayerSessionDto) => void
}

export function ExerciseSwapSheet({ sessionId, exerciseId, characterCode, register, onClose, onApplied }: ExerciseSwapSheetProps) {
  const { t } = useMoveT(register)
  const open = !!exerciseId

  const list = useQuery({
    queryKey: ['move', 'session', sessionId, 'exercise-swap', exerciseId ?? ''],
    queryFn: () => moveService.exerciseSwap(sessionId, { exerciseId: exerciseId! }),
    enabled: open,
    staleTime: 60_000,
  })

  const apply = useMutation({
    mutationFn: (substituteId: string) => moveService.exerciseSwap(sessionId, { exerciseId: exerciseId!, substituteId }),
    onSuccess: (res) => {
      if (res.applied) {
        onApplied(res.applied)
        toast({ title: t('player.card.swapped'), variant: 'success' })
      }
      onClose()
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="move-block" data-space="move">
        <DialogHeader>
          <DialogTitle>{t('player.card.swapTitle')}</DialogTitle>
        </DialogHeader>
        {list.isPending ? (
          <div className="flex justify-center py-6" role="status">
            <Spinner className="border-[#2A9D8F]" />
          </div>
        ) : list.isError ? (
          <div className="space-y-3 text-center">
            <p className="text-base text-gray-700">{t('common.error')}</p>
            <Button variant="secondary" onClick={() => void list.refetch()}>{t('common.retry')}</Button>
          </div>
        ) : (list.data?.substitutes.length ?? 0) === 0 ? (
          <p className="text-base text-gray-700 py-4">{t('player.card.swapEmpty')}</p>
        ) : (
          <ul className="space-y-2">
            {list.data!.substitutes.map((s) => {
              const media = chooseLibraryMedia(s.media, characterCode, null, s.pictogramUrl ?? null)
              const url = media.kind === 'PAIR' ? media.start.url : media.kind === 'STILL' ? media.still.url : media.pictogramUrl
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => apply.mutate(s.id)}
                    disabled={apply.isPending}
                    className="w-full min-h-12 flex items-center gap-3 rounded-[12px] border border-[#e5e4e7] bg-white p-2 text-left hover:bg-[#F9F7F2]"
                  >
                    {url ? (
                      <img src={url} alt="" className="h-14 w-14 object-cover rounded-[8px]" />
                    ) : (
                      <PersonPictogram className="h-14 w-14" />
                    )}
                    <span className="text-base font-medium text-[#1A1A1A]">{s.name}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
