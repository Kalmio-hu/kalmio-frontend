/**
 * Devices (PRD §7.11, D4): Garmin (unofficial, allow-listed test accounts)
 * connect with email + password → POST /api/move/devices/garmin/connect; on
 * MFA_REQUIRED a second step with the code. The password never stays in state
 * after submit. Status, last sync, "Szinkronizálás most", disconnect. Calendar
 * feed: GET /api/move/calendar/token shows the .ics URL with copy and "Új link"
 * (POST …/rotate). FIT export is per session (player pre-start, week chips).
 * A device is never required — the page says so first.
 */
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Copy, Download, RefreshCw, Watch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toast'
import { MovePageFrame } from '../components/MovePageFrame'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { useMoveT } from '../lib/register'
import { MOVE_ACCENT } from '../lib/constants'
import type { DeviceDto } from '../types'

const ACCENT_BUTTON = 'bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F]'

export function MoveDevices() {
  const { t } = useMoveT()
  const q = useQuery({ queryKey: moveKeys.devices, queryFn: moveService.getDevices, staleTime: 60_000 })
  const garmin = q.data?.devices.find((d) => d.provider === 'GARMIN') ?? null

  return (
    <MovePageFrame
      title={t('devices.title')}
      subtitle={t('devices.subtitle')}
      isLoading={q.isPending}
      isError={q.isError}
      onRetry={() => void q.refetch()}
    >
      <div className="space-y-6">
        <p className="rounded-[16px] bg-white border border-[#e5e4e7] p-4 text-base text-[#1A1A1A]">{t('devices.neverRequired')}</p>
        <GarminCard device={garmin} />
        <CalendarCard />
        <section className="bg-white rounded-[16px] border border-[#e5e4e7] p-5 space-y-2" aria-labelledby="move-fit-title">
          <h2 id="move-fit-title" className="flex items-center gap-2 font-headline font-bold text-[#1A1A1A]">
            <Download className="h-5 w-5" aria-hidden style={{ color: MOVE_ACCENT }} />
            {t('devices.fit.title')}
          </h2>
          <p className="text-base text-gray-700">{t('devices.fit.hint')}</p>
        </section>
      </div>
    </MovePageFrame>
  )
}

function GarminCard({ device }: { device: DeviceDto | null }) {
  const { t } = useMoveT()
  const qc = useQueryClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaStep, setMfaStep] = useState(false)
  const invalidate = () => void qc.invalidateQueries({ queryKey: moveKeys.devices })

  const connect = useMutation({
    mutationFn: (req: { email: string; password: string; mfaCode?: string }) => moveService.connectGarmin(req),
    onSuccess: (res) => {
      // The password never stays in memory after the request left.
      setPassword('')
      if (res.status === 'MFA_REQUIRED') {
        setMfaStep(true)
        return
      }
      setMfaStep(false)
      setMfaCode('')
      setEmail('')
      toast({ title: t('devices.garmin.connected'), variant: 'success' })
      invalidate()
    },
    onError: () => {
      setPassword('')
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })
  const sync = useMutation({
    mutationFn: moveService.syncGarmin,
    onSuccess: () => {
      toast({ title: t('devices.garmin.synced'), variant: 'success' })
      invalidate()
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })
  const disconnect = useMutation({
    mutationFn: moveService.disconnectGarmin,
    onSuccess: () => {
      toast({ title: t('devices.garmin.disconnected'), variant: 'success' })
      invalidate()
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  const connected = device?.status === 'CONNECTED'
  const needsMfa = mfaStep || device?.status === 'MFA_REQUIRED'

  return (
    <section className="bg-white rounded-[16px] border border-[#e5e4e7] p-5 space-y-4" aria-labelledby="move-garmin-title">
      <div className="flex items-start justify-between gap-3">
        <h2 id="move-garmin-title" className="flex items-center gap-2 font-headline font-bold text-[#1A1A1A]">
          <Watch className="h-5 w-5" aria-hidden style={{ color: MOVE_ACCENT }} />
          {t('devices.garmin.title')}
        </h2>
        {device && (
          <span className="text-sm text-gray-700 rounded-full border border-[#e5e4e7] px-3 py-1">
            {t(`devices.garmin.status.${device.status}`)}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600">{t('devices.garmin.testersLine')}</p>

      {connected ? (
        <div className="space-y-3">
          <p className="text-base text-gray-700">
            {device?.displayName ? `${device.displayName} · ` : ''}
            {device?.lastSyncAt ? t('devices.garmin.lastSync', { when: new Date(device.lastSyncAt).toLocaleString() }) : t('devices.garmin.neverSynced')}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button className={ACCENT_BUTTON} onClick={() => sync.mutate()} disabled={sync.isPending}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              {t('devices.garmin.syncNow')}
            </Button>
            <Button variant="secondary" onClick={() => disconnect.mutate()} disabled={disconnect.isPending}>
              {t('devices.garmin.disconnect')}
            </Button>
          </div>
        </div>
      ) : needsMfa ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (mfaCode.trim()) connect.mutate({ email, password, mfaCode: mfaCode.trim() })
          }}
        >
          <p className="font-medium text-[#1A1A1A]">{t('devices.garmin.mfaTitle')}</p>
          <p className="text-base text-gray-700">{t('devices.garmin.mfaHint')}</p>
          <div className="space-y-1.5">
            <Label htmlFor="move-garmin-mfa">{t('devices.garmin.mfaCode')}</Label>
            <Input id="move-garmin-mfa" inputMode="numeric" autoComplete="one-time-code" value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} className="min-h-12 text-base max-w-xs" />
          </div>
          <Button type="submit" className={ACCENT_BUTTON} disabled={!mfaCode.trim() || connect.isPending}>
            {t('devices.garmin.confirm')}
          </Button>
        </form>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (email && password) connect.mutate({ email: email.trim(), password })
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="move-garmin-email">{t('devices.garmin.email')}</Label>
              <Input id="move-garmin-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="min-h-12 text-base" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="move-garmin-password">{t('devices.garmin.password')}</Label>
              <Input id="move-garmin-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="min-h-12 text-base" />
            </div>
          </div>
          <p className="text-sm text-gray-600">{t('devices.garmin.passwordNote')}</p>
          <Button type="submit" className={ACCENT_BUTTON} disabled={!email || !password || connect.isPending}>
            {t('devices.garmin.connect')}
          </Button>
        </form>
      )}
    </section>
  )
}

function CalendarCard() {
  const { t } = useMoveT()
  const qc = useQueryClient()
  const token = useQuery({ queryKey: moveKeys.calendarToken, queryFn: moveService.getCalendarToken, staleTime: 5 * 60_000, retry: false })
  const rotate = useMutation({
    mutationFn: moveService.rotateCalendarToken,
    onSuccess: (next) => {
      qc.setQueryData(moveKeys.calendarToken, next)
      toast({ title: t('devices.calendar.rotated'), variant: 'success' })
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  const url = token.data?.url ?? null
  const copy = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: t('devices.calendar.copied'), variant: 'success' })
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' })
    }
  }

  return (
    <section className="bg-white rounded-[16px] border border-[#e5e4e7] p-5 space-y-3" aria-labelledby="move-cal-title">
      <h2 id="move-cal-title" className="flex items-center gap-2 font-headline font-bold text-[#1A1A1A]">
        <CalendarDays className="h-5 w-5" aria-hidden style={{ color: MOVE_ACCENT }} />
        {t('devices.calendar.title')}
      </h2>
      <p className="text-base text-gray-700">{t('devices.calendar.hint')}</p>
      {url ? (
        <>
          <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="min-h-12 text-base font-mono" aria-label={t('devices.calendar.title')} />
          <div className="flex flex-wrap gap-2">
            <Button className={ACCENT_BUTTON} onClick={() => void copy()}>
              <Copy className="h-4 w-4" aria-hidden />
              {t('devices.calendar.copy')}
            </Button>
            <Button variant="secondary" onClick={() => rotate.mutate()} disabled={rotate.isPending}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              {t('devices.calendar.rotate')}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-base text-gray-700">{t('devices.calendar.none')}</p>
          <Button variant="secondary" onClick={() => rotate.mutate()} disabled={rotate.isPending || token.isPending}>
            {t('devices.calendar.create')}
          </Button>
        </div>
      )}
    </section>
  )
}
