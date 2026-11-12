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
import { toast } from '@/components/ui/toast'
import { MovePageFrame } from '../components/MovePageFrame'
import { SettingsRhythm } from '../components/settings/SettingsRhythm'
import { SettingsEquipment } from '../components/settings/SettingsEquipment'
import { SettingsLimits } from '../components/settings/SettingsLimits'
import { SettingsNotifications } from '../components/settings/SettingsNotifications'
import { SettingsFamilyAges } from '../components/settings/SettingsFamilyAges'
import { SettingsLifeState } from '../components/settings/SettingsLifeState'
import { SettingsHealth } from '../components/settings/SettingsHealth'
import { SettingsDemonstrators } from '../components/settings/SettingsDemonstrators'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { useMoveT } from '../lib/register'
import { MOVE_ACCENT, MOVE_HOME } from '../lib/constants'
import type { TextSize, UpdateMoveProfileRequest } from '../types'

export function MoveSettings() {
  const { t } = useMoveT()
  const qc = useQueryClient()

  const profile = useQuery({ queryKey: moveKeys.profile, queryFn: moveService.getProfile, staleTime: 60_000 })
  const modalities = useQuery({ queryKey: moveKeys.modalities, queryFn: moveService.getModalities, staleTime: 10 * 60_000 })

  const patch = useMutation({
    mutationFn: (req: UpdateMoveProfileRequest) => moveService.updateProfile(req),
    onSuccess: (next) => {
      qc.setQueryData(moveKeys.profile, next)
      void qc.invalidateQueries({ queryKey: moveKeys.status })
      void qc.invalidateQueries({ queryKey: moveKeys.today })
      void qc.invalidateQueries({ queryKey: moveKeys.demonstrators })
      toast({ title: t('settings.saved'), variant: 'success' })
    },
    onError: () => toast({ title: t('settings.error'), variant: 'destructive' }),
  })
  const onPatch = (req: UpdateMoveProfileRequest) => patch.mutate(req)

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

          {/* "Ki mutatja" per activity type — GET /api/move/demonstrators */}
          {section('demonstrator', t('settings.demonstrator.title'), <SettingsDemonstrators profile={profile.data} onPatch={onPatch} pending={patch.isPending} />, t('settings.demonstrator.hint'))}

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
