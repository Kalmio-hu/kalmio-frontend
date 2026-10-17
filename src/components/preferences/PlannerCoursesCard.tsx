import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { usersService, USERS_ME_QUERY_KEY } from '@/services/users'
import type { UserSettings } from '@/services/users'
import type { MealType } from '@/types'

const PLATE_MEALS: MealType[] = ['LUNCH', 'DINNER']

interface Props {
  user: UserSettings
}

/**
 * One course per slot by default; lunch and dinner can opt into a soup course in front of the
 * main. Two courses roughly double the shopping and the prep of a week.
 */
export function PlannerCoursesCard({ user }: Props) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const stored = (user.mealPlanPreferences?.twoCourseMealTypes ?? []) as MealType[]
  const storedKey = [...stored].sort().join()
  const [selected, setSelected] = useState<MealType[]>(stored)
  const [seenKey, setSeenKey] = useState(storedKey)
  const [saving, setSaving] = useState(false)

  // Re-sync when the stored selection changes (adjusting state during render, not in an effect).
  if (seenKey !== storedKey) {
    setSeenKey(storedKey)
    setSelected(stored)
  }

  const dirty = [...selected].sort().join() !== [...stored].sort().join()

  function toggle(meal: MealType) {
    setSelected(prev => (prev.includes(meal) ? prev.filter(m => m !== meal) : [...prev, meal]))
  }

  async function save() {
    setSaving(true)
    try {
      const updated = await usersService.updateSettings({
        mealPlanPreferences: { twoCourseMealTypes: selected },
      })
      qc.setQueryData(USERS_ME_QUERY_KEY, updated)
      qc.invalidateQueries({ queryKey: USERS_ME_QUERY_KEY })
      toast({ title: t('settings.saveSuccess'), variant: 'success' })
    } catch {
      toast({ title: t('settings.saveError'), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-5 space-y-4">
        <div>
          <h2 className="font-semibold text-sm text-[#1A1A1A]">{t('settings.plannerCourses.title')}</h2>
          <p className="text-xs text-gray-400 mt-1">{t('settings.plannerCourses.subtitle')}</p>
        </div>
        <div className="space-y-2">
          {PLATE_MEALS.map(meal => (
            <label key={meal} className="flex items-center gap-3 text-sm text-[#1A1A1A]">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#4F7942]"
                checked={selected.includes(meal)}
                onChange={() => toggle(meal)}
              />
              {t(`settings.plannerCourses.${meal === 'LUNCH' ? 'lunch' : 'dinner'}`)}
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-400">{t('settings.plannerCourses.note')}</p>
        <Button size="sm" onClick={save} disabled={saving || !dirty}>
          {t('common.save')}
        </Button>
      </CardContent>
    </Card>
  )
}
