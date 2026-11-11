/**
 * The demonstration area of a step (PRD §7.3, §12.1, §17):
 *  - approved still pair → cross-fade start ↔ end, 1 s each way, with a pause control;
 *  - single approved still → the still;
 *  - otherwise → pictogram (or the inline figure) with the text cues.
 * `prefers-reduced-motion` shows the pair as two stills side by side.
 * Every generated image carries the AiLabel and the report button.
 */
import { useEffect, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useMoveT } from '../../lib/register'
import { chooseStepMedia, prefersReducedMotion, type MediaChoice } from '../../lib/mediaFallback'
import type { PlayerStepDto } from '../../types'
import { AiLabel } from '../AiLabel'
import { ReportMediaButton } from './ReportMediaButton'
import { BogyoFigure, PersonPictogram } from './Figures'

interface StepMediaProps {
  step: Pick<PlayerStepDto, 'media' | 'endMedia' | 'pictogramUrl' | 'title' | 'cues'>
  /** Parent-level pause (the session is paused) — the cross-fade stops too. */
  paused?: boolean
  /** BOGYO sessions: the figure replaces the human pictogram in the text fallback. */
  family?: boolean
  className?: string
}

export function StepMedia({ step, paused = false, family = false, className }: StepMediaProps) {
  const choice = chooseStepMedia(step)
  return <MediaView choice={choice} title={step.title} cues={step.cues} paused={paused} family={family} className={className} />
}

interface MediaViewProps {
  choice: MediaChoice
  title: string
  cues: string[]
  paused?: boolean
  family?: boolean
  className?: string
}

export function MediaView({ choice, title, cues, paused = false, family = false, className }: MediaViewProps) {
  const { t } = useMoveT()
  const [reduced, setReduced] = useState(prefersReducedMotion)
  const [ownPaused, setOwnPaused] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  if (choice.kind === 'TEXT') {
    return (
      <figure className={cn('rounded-[16px] bg-white border border-[#e5e4e7] p-4 flex flex-col items-center gap-3', className)}>
        {choice.pictogramUrl ? (
          <img src={choice.pictogramUrl} alt={t('player.media.alt', { title })} className="h-40 w-auto object-contain" />
        ) : family ? (
          <BogyoFigure className="h-40 w-auto" />
        ) : (
          <PersonPictogram className="h-40 w-auto" />
        )}
        <figcaption className="text-sm text-gray-600">{family ? t('player.media.familyFigure') : t('player.media.textOnly')}</figcaption>
        {cues.length > 0 && (
          <ul className="w-full list-disc pl-5 space-y-1 text-base text-[#1A1A1A]">
            {cues.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        )}
      </figure>
    )
  }

  const stopped = paused || ownPaused
  const startAlt = `${t('player.media.alt', { title })} — ${t('player.media.startPose')}`

  if (choice.kind === 'STILL') {
    return (
      <figure className={cn('rounded-[16px] bg-white border border-[#e5e4e7] p-3 flex flex-col gap-2', className)}>
        <img src={choice.still.url} alt={startAlt} className="w-full max-h-[48vh] object-contain rounded-[12px]" />
        <Footer mediaId={choice.still.mediaId} />
      </figure>
    )
  }

  // PAIR
  if (reduced) {
    return (
      <figure className={cn('rounded-[16px] bg-white border border-[#e5e4e7] p-3 flex flex-col gap-2', className)}>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <img src={choice.start.url} alt={startAlt} className="w-full max-h-[40vh] object-contain rounded-[12px]" />
            <span className="text-sm text-gray-600 text-center">{t('player.media.startPose')}</span>
          </div>
          <div className="flex flex-col gap-1">
            <img
              src={choice.end.url}
              alt={`${t('player.media.alt', { title })} — ${t('player.media.endPose')}`}
              className="w-full max-h-[40vh] object-contain rounded-[12px]"
            />
            <span className="text-sm text-gray-600 text-center">{t('player.media.endPose')}</span>
          </div>
        </div>
        <p className="text-sm text-gray-600">{t('player.reducedMotion')}</p>
        <Footer mediaId={choice.start.mediaId} />
      </figure>
    )
  }

  return (
    <figure className={cn('rounded-[16px] bg-white border border-[#e5e4e7] p-3 flex flex-col gap-2', className)}>
      <div className="relative w-full" style={{ aspectRatio: '4 / 5', maxHeight: '48vh' }}>
        <img src={choice.start.url} alt={startAlt} className="absolute inset-0 w-full h-full object-contain rounded-[12px]" />
        <img
          src={choice.end.url}
          alt=""
          aria-hidden
          className={cn('absolute inset-0 w-full h-full object-contain rounded-[12px] move-crossfade', stopped && 'move-crossfade-paused')}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="absolute bottom-2 right-2 min-h-12 min-w-12"
          onClick={() => setOwnPaused((p) => !p)}
          aria-pressed={ownPaused}
          aria-label={ownPaused ? t('player.resume') : t('player.pause')}
        >
          {ownPaused ? <Play className="h-5 w-5" aria-hidden /> : <Pause className="h-5 w-5" aria-hidden />}
        </Button>
      </div>
      <Footer mediaId={choice.start.mediaId} />
    </figure>
  )
}

function Footer({ mediaId }: { mediaId: string }) {
  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <AiLabel />
      <ReportMediaButton mediaId={mediaId} />
    </div>
  )
}
