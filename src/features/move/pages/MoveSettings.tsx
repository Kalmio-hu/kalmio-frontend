/**
 * Move settings (D8 rule 7): rhythm, equipment, limits, notifications and
 * register, family-session ages, life states, health, demonstrator, text size.
 * Devices and the helper live on their own pages; this page links to them.
 */
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { MovePageFrame } from '../components/MovePageFrame'
import { AiLabel } from '../components/AiLabel'
import { SettingsRhythm } from '../components/settings/SettingsRhythm'
import { SettingsEquipment } from '../components/settings/SettingsEquipment'
import { SettingsLimits } from '../components/settings/SettingsLimits'
import { SettingsNotifications } from '../components/settings/SettingsNotifications'
import { SettingsFamilyAges } from '../components/settings/SettingsFamilyAges'
import { SettingsLifeState } from '../components/settings/SettingsLifeState'
import { SettingsHealth } from '../components/settings/SettingsHealth'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { useMoveT } from '../lib/register'
import { MOVE_ACCENT, MOVE_HOME } from '../lib/constants'
import { sheetThumbnail } from '../lib/characters'
import type { TextSize, UpdateMoveProfileRequest } from '../types'

export function MoveSettings() {
  const { t } = useMoveT()
  const qc = useQueryClient()

  const profile = useQuery({ queryKey: moveKeys.profile, queryFn: moveService.getProfile, staleTime: 60_000 })
  const characters = useQuery({ queryKey: moveKeys.characters, queryFn: moveService.getCharacters, staleTime: 10 * 60_000 })
  const modalities = useQuery({ queryKey: moveKeys.modalities, queryFn: moveService.getModalities, staleTime: 10 * 60_000 })

  const patch = useMutation({
    mutationFn: (req: UpdateMoveProfileRequest) => moveService.updateProfile(req),
    onSuccess: (next) => {
      qc.setQueryData(moveKeys.profile, next)
      void qc.invalidateQueries({ queryKey: moveKeys.status })
      void qc.invalidateQueries({ queryKey: moveKeys.today })
      toast({ title: t('settings.saved'), variant: 'success' })
    },
    onError: () => toast({ title: t('settings.error'), variant: 'destructive' }),
  })
  const onPatch = (req: UpdateMoveProfileRequest) => patch.mutate(req)

  const current = profile.data?.characterCode ?? null
  const textSize: TextSize = profile.data?.textSize ?? 'NORMAL'

  const section = (key: string, title: string, body: React.ReactNode, hint?: string) => (
    <Card key={key}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {hint && <p className="text-sm text-gray-500 mt-1">{hint}</p>}
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )

  return (
    <MovePageFrame
      title={t('settings.title')}
      subtitle={t('settings.subtitle')}
      isLoading={profile.isPending}
      isError={profile.isError}
      onRetry={() => void profile.refetch()}
    >
      {profile.data && (
        <div className="flex flex-col gap-4">
          {section('rhythm', t('settings.sections.rhythm'), <SettingsRhythm profile={profile.data} modalities={modalities.data ?? []} onPatch={onPatch} pending={patch.isPending} />)}
          {section('equipment', t('settings.sections.equipment'), <SettingsEquipment />)}
          {section('limits', t('settings.sections.limits'), <SettingsLimits />)}
          {section('lifeState', t('settings.sections.lifeState'), <SettingsLifeState lifeState={profile.data.lifeState} />)}
          {section('health', t('settings.sections.health'), <SettingsHealth profile={profile.data} />)}
          {section('notifications', t('settings.sections.notifications'), <SettingsNotifications profile={profile.data} onPatch={onPatch} pending={patch.isPending} />)}
          {section('family', t('settings.sections.family'), <SettingsFamilyAges profile={profile.data} onPatch={onPatch} pending={patch.isPending} />)}

          {/* Demonstrator picker — GET /api/move/characters */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.demonstrator.title')}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{t('settings.demonstrator.hint')}</p>
            </CardHeader>
            <CardContent>
              {characters.isPending ? (
                <div className="flex justify-center py-6" role="status">
                  <Spinner className="border-[#2A9D8F]" />
                </div>
              ) : !characters.data || characters.data.length === 0 ? (
                <p className="text-sm text-gray-500">{t('settings.demonstrator.empty')}</p>
              ) : (
                <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" role="radiogroup" aria-label={t('settings.demonstrator.title')}>
                  {characters.data.map((c) => {
                    const thumb = sheetThumbnail(c)
                    const selected = c.code === current
                    return (
                      <li key={c.code}>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          disabled={patch.isPending}
                          onClick={() => !selected && patch.mutate({ characterCode: c.code })}
                          className={cn(
                            'w-full text-left rounded-[16px] border-2 bg-white p-3 transition-colors h-full flex flex-col gap-2',
                            selected ? 'border-[var(--move-accent)]' : 'border-[#e5e4e7] hover:border-[var(--move-accent)]/60',
                          )}
                        >
                          <div className="aspect-[3/4] w-full rounded-[12px] bg-[#F9F7F2] overflow-hidden flex items-center justify-center">
                            {thumb ? (
                              <img src={thumb} alt={`${c.name} — ${c.ageBand}`} className="h-full w-full object-cover object-top" loading="lazy" />
                            ) : (
                              <span className="text-xs text-gray-400 px-2 text-center">{t('settings.demonstrator.noSheet')}</span>
                            )}
                          </div>
                          {thumb && <AiLabel />}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-[#1A1A1A]">{c.name}</p>
                              <p className="text-sm text-gray-500">{c.ageBand}</p>
                            </div>
                            {selected && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: MOVE_ACCENT }}>
                                <Check className="h-4 w-4" aria-hidden />
                                {t('settings.demonstrator.chosen')}
                              </span>
                            )}
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Text size — toggles .move-large-text on the shell root */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.textSize.title')}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{t('settings.textSize.hint')}</p>
            </CardHeader>
            <CardContent>
              <div role="radiogroup" aria-label={t('settings.textSize.title')} className="inline-flex rounded-[12px] border border-[#e5e4e7] p-1 bg-white">
                {(['NORMAL', 'LARGE'] as const).map((size) => {
                  const selected = textSize === size
                  return (
                    <button
                      key={size}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={patch.isPending}
                      onClick={() => !selected && patch.mutate({ textSize: size })}
                      className={cn(
                        'min-h-12 px-5 rounded-[10px] text-sm font-semibold transition-colors',
                        selected ? 'text-white' : 'text-gray-600 hover:bg-black/5',
                        size === 'LARGE' && 'text-base',
                      )}
                      style={selected ? { backgroundColor: MOVE_ACCENT } : undefined}
                    >
                      {selected && <Check className="inline h-4 w-4 mr-1 -mt-0.5" aria-hidden />}
                      {t(`settings.textSize.${size}`)}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Devices and helper have their own pages */}
          <Card>
            <CardContent className="py-2 divide-y divide-[#e5e4e7]">
              <Link to={`${MOVE_HOME}/devices`} className="flex items-center justify-between min-h-12 py-2 text-base text-[#1A1A1A] hover:text-[var(--move-accent)]">
                {t('settings.devicesLink')}
                <ChevronRight className="h-5 w-5" aria-hidden />
              </Link>
              <Link to={`${MOVE_HOME}/helper`} className="flex items-center justify-between min-h-12 py-2 text-base text-[#1A1A1A] hover:text-[var(--move-accent)]">
                {t('settings.helperLink')}
                <ChevronRight className="h-5 w-5" aria-hidden />
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </MovePageFrame>
  )
}
