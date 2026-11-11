/**
 * Settings — "Közös 10 perc": the ages of the children on the parent's plan
 * (PRD §7.9, ages only, nothing else about the child). `PATCH /api/move/profile`.
 */
import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useMoveT } from '../../lib/register'
import type { MoveProfileDto, UpdateMoveProfileRequest } from '../../types'

interface SettingsFamilyAgesProps {
  profile: MoveProfileDto
  onPatch: (req: UpdateMoveProfileRequest) => void
  pending: boolean
}

const AGES = Array.from({ length: 15 }, (_, i) => i + 3) // 3 … 17

export function SettingsFamilyAges({ profile, onPatch, pending }: SettingsFamilyAgesProps) {
  const { t } = useMoveT()
  const [age, setAge] = useState<number>(6)
  const ages = profile.familySessionAges.slice().sort((a, b) => a - b)

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{t('settings.family.hint')}</p>
      {ages.length === 0 ? (
        <p className="text-sm text-gray-500">{t('settings.family.empty')}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {ages.map((a, i) => (
            <li key={`${a}-${i}`} className="inline-flex items-center gap-1 rounded-[12px] border border-[#e5e4e7] bg-white pl-4 pr-1 min-h-12 text-sm text-[#1A1A1A]">
              {t('settings.family.age', { age: a })}
              <button
                type="button"
                aria-label={t('settings.family.remove')}
                disabled={pending}
                onClick={() => {
                  const next = ages.slice()
                  next.splice(i, 1)
                  onPatch({ familySessionAges: next })
                }}
                className="inline-flex items-center justify-center rounded-lg text-gray-600 hover:bg-black/5"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="move-settings-family-age">{t('settings.family.ageLabel')}</Label>
          <Select id="move-settings-family-age" className="h-12 w-32" value={age} onChange={(e) => setAge(Number(e.target.value))}>
            {AGES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        </div>
        <Button variant="secondary" className="min-h-12" disabled={pending} onClick={() => onPatch({ familySessionAges: [...ages, age] })}>
          {t('settings.family.add')}
        </Button>
      </div>
    </div>
  )
}
