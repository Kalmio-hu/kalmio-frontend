/**
 * Settings — health: the current track and supported level in plain words,
 * "Megbeszéltem az orvosommal" for track B (`POST /api/move/screening/doctor-confirmed`),
 * and re-answering the ten questions (`POST /api/move/screening`), which moves
 * the level both ways and can take the member off the supported programme.
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { moveService } from '../../services/moveService'
import { moveKeys } from '../../lib/queryKeys'
import { useMoveT } from '../../lib/register'
import { HealthRescreenDialog } from '../HealthRescreenDialog'
import type { MoveProfileDto } from '../../types'

export function SettingsHealth({ profile }: { profile: MoveProfileDto }) {
  const { t, register } = useMoveT()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const screening = profile.screening
  const confirm = useMutation({
    mutationFn: () => moveService.screeningDoctorConfirmed({ confirmed: true }),
    onSuccess: () => {
      toast({ title: t('settings.health.doctorDone'), variant: 'success' })
      void qc.invalidateQueries({ queryKey: moveKeys.profile })
      void qc.invalidateQueries({ queryKey: moveKeys.today })
      void qc.invalidateQueries({ queryKey: moveKeys.week() })
    },
    onError: () => toast({ title: t('settings.error'), variant: 'destructive' }),
  })

  return (
    <div className="space-y-4">
      {screening ? (
        <p className="text-base text-[#1A1A1A]">{t('settings.health.track', { track: t(`settings.health.trackName.${screening.track}`) })}</p>
      ) : (
        <p className="text-base text-[#1A1A1A]">{t('today.screeningPending.body')}</p>
      )}
      <p className="text-base text-[#1A1A1A]">
        {profile.supportedLevel
          ? t('settings.health.programme', { level: t(`progress.levels.supported.${profile.supportedLevel}`) })
          : t('settings.health.programmeNone')}
      </p>
      {screening?.hrTargetsOff && <p className="text-sm text-gray-600">{t('settings.health.hrOff')}</p>}

      {screening?.track === 'B' && (
        <div className="space-y-1">
          {screening.doctorConfirmed ? (
            <p className="inline-flex items-center gap-1 text-sm font-semibold text-[#2A9D8F]">
              <Check className="h-4 w-4" aria-hidden />
              {t('settings.health.doctor')} — {t('settings.health.doctorDone')}
            </p>
          ) : (
            <>
              <Button className="bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F] min-h-12" disabled={confirm.isPending} onClick={() => confirm.mutate()}>
                {t('settings.health.doctor')}
              </Button>
              <p className="text-sm text-gray-500">{t('settings.health.doctorHint')}</p>
            </>
          )}
        </div>
      )}

      <div className="space-y-1">
        <Button variant="secondary" className="min-h-12" onClick={() => setOpen(true)}>
          {t('settings.health.reanswer')}
        </Button>
        <p className="text-sm text-gray-500">{t('settings.health.reanswerHint')}</p>
      </div>

      <HealthRescreenDialog open={open} onOpenChange={setOpen} register={register} />
    </div>
  )
}
