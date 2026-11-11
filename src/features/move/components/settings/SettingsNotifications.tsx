/**
 * Settings — register switch (Ön / te), the one daily push time, and the
 * heart-rate targets switch (hidden when screening set `hrTargetsOff`).
 * All through `PATCH /api/move/profile`.
 */
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMoveT } from '../../lib/register'
import { MOVE_ACCENT } from '../../lib/constants'
import type { MoveProfileDto, Register, UpdateMoveProfileRequest } from '../../types'

interface SettingsNotificationsProps {
  profile: MoveProfileDto
  onPatch: (req: UpdateMoveProfileRequest) => void
  pending: boolean
}

function Segmented<T extends string>({ label, value, options, onChange, disabled }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; disabled: boolean }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-[12px] border border-[#e5e4e7] p-1 bg-white">
      {options.map((o) => {
        const selected = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => !selected && onChange(o.value)}
            className={cn('min-h-12 px-5 rounded-[10px] text-sm font-semibold transition-colors', selected ? 'text-white' : 'text-gray-600 hover:bg-black/5')}
            style={selected ? { backgroundColor: MOVE_ACCENT } : undefined}
          >
            {selected && <Check className="inline h-4 w-4 mr-1 -mt-0.5" aria-hidden />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function SettingsNotifications({ profile, onPatch, pending }: SettingsNotificationsProps) {
  const { t } = useMoveT()
  const hrHidden = profile.screening?.hrTargetsOff === true
  const pushOn = profile.pushTime !== null

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">{t('settings.register.title')}</h3>
        <p className="text-sm text-gray-500">{t('settings.register.hint')}</p>
        <Segmented<Register>
          label={t('settings.register.title')}
          value={profile.register}
          disabled={pending}
          options={[
            { value: 'INFORMAL', label: t('settings.register.INFORMAL') },
            { value: 'FORMAL', label: t('settings.register.FORMAL') },
          ]}
          onChange={(v) => onPatch({ register: v })}
        />
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">{t('settings.push.title')}</h3>
        <p className="text-sm text-gray-500">{t('settings.push.hint')}</p>
        <div className="flex flex-wrap items-end gap-3">
          <Segmented<'ON' | 'OFF'>
            label={t('settings.push.title')}
            value={pushOn ? 'ON' : 'OFF'}
            disabled={pending}
            options={[
              { value: 'OFF', label: t('settings.push.off') },
              { value: 'ON', label: t('settings.push.on') },
            ]}
            onChange={(v) => onPatch({ pushTime: v === 'ON' ? '08:00' : null })}
          />
          {pushOn && (
            <div className="space-y-1">
              <Label htmlFor="move-settings-push-time">{t('settings.push.time')}</Label>
              <Input
                id="move-settings-push-time"
                type="time"
                className="h-12 w-36"
                defaultValue={profile.pushTime ?? '08:00'}
                disabled={pending}
                onBlur={(e) => e.target.value && e.target.value !== profile.pushTime && onPatch({ pushTime: e.target.value })}
              />
            </div>
          )}
        </div>
      </section>

      {!hrHidden && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-[#1A1A1A]">{t('settings.hr.title')}</h3>
          <p className="text-sm text-gray-500">{t('settings.hr.hint')}</p>
          <Segmented<'ON' | 'OFF'>
            label={t('settings.hr.title')}
            value={profile.hrTargets ? 'ON' : 'OFF'}
            disabled={pending}
            options={[
              { value: 'OFF', label: t('settings.hr.off') },
              { value: 'ON', label: t('settings.hr.on') },
            ]}
            onChange={(v) => onPatch({ hrTargets: v === 'ON' })}
          />
        </section>
      )}
    </div>
  )
}
