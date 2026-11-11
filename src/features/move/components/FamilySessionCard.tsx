/**
 * "Közös 10 perc" (PRD §7.9): today's family session for the parent's ages
 * from GET /api/move/family-session. Demonstrated by the stylised figure
 * (BOGYO) only; no numbers about children anywhere on the card. "Kezdjük"
 * opens the same player as a Flow with the BOGYO figure.
 */
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Users, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { useMoveT } from '../lib/register'
import { MOVE_ACCENT, MOVE_SESSION } from '../lib/constants'
import { isApproved } from '../lib/mediaFallback'
import { AiLabel } from './AiLabel'
import { BogyoFigure } from './player/Figures'

interface FamilySessionCardProps {
  className?: string
  /** Render nothing while false (e.g. the profile has no family-session ages). */
  enabled?: boolean
}

export function FamilySessionCard({ className, enabled = true }: FamilySessionCardProps) {
  const { t } = useMoveT()
  const navigate = useNavigate()
  const q = useQuery({ queryKey: moveKeys.familySession, queryFn: moveService.getFamilySession, staleTime: 60_000, enabled, retry: false })

  if (!enabled || q.isPending || q.isError) return null
  const fs = q.data
  if (!fs || fs.units.length === 0) return null

  const total = fs.units.reduce((sum, u) => sum + (u.minutes || 0), 0)
  const hero = fs.units.find((u) => isApproved(u.media))?.media ?? null

  return (
    <article className={cn('move-block bg-white rounded-[16px] border border-[#e5e4e7] shadow-sm p-5 space-y-4', className)} aria-labelledby="move-family-title">
      <div className="flex items-start gap-4">
        <div className="shrink-0 rounded-[12px] bg-[#F9F7F2] p-2">
          {hero ? (
            <img src={hero.url} alt="" className="h-24 w-24 object-contain" />
          ) : (
            <BogyoFigure className="h-24 w-24" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 id="move-family-title" className="flex items-center gap-2 font-headline text-lg font-bold text-[#1A1A1A]">
            <Users className="h-5 w-5" aria-hidden style={{ color: MOVE_ACCENT }} />
            {fs.title || t('family.title')}
          </h3>
          <p className="text-base text-gray-700">{t('family.subtitle')}</p>
          <p className="text-sm text-gray-600 mt-1">{t('family.figureLine')}</p>
          {hero && <AiLabel className="mt-1" />}
        </div>
      </div>

      <ol className="space-y-1">
        {fs.units.map((u) => (
          <li key={u.id} className="flex items-center justify-between gap-3 text-base text-[#1A1A1A]">
            <span>
              <span className="text-sm text-gray-600 mr-2">{t(`family.kind.${u.kind}`)}</span>
              {u.name}
            </span>
            <span className="text-sm text-gray-600 tabular-nums shrink-0">{t('family.unitMinutes', { count: u.minutes })}</span>
          </li>
        ))}
      </ol>

      {fs.sessionId && (
        <Button size="lg" className="bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F] w-full sm:w-auto" onClick={() => navigate(MOVE_SESSION(fs.sessionId!))}>
          <Play className="h-5 w-5" aria-hidden />
          {t('family.start')} · {t('common.minutes', { count: total || 10 })}
        </Button>
      )}
    </article>
  )
}
