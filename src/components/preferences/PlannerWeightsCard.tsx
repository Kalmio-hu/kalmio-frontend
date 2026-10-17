import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { toast } from '@/components/ui/toast'
import { usersService, USERS_ME_QUERY_KEY } from '@/services/users'
import type { UserSettings } from '@/services/users'
import type { ConstraintWeights } from '@/types'

const KEYS: (keyof ConstraintWeights)[] = ['leftovers', 'budget', 'prepTime', 'recipeRepeat']
const DEFAULTS: ConstraintWeights = { leftovers: 25, budget: 25, prepTime: 25, recipeRepeat: 25 }

/**
 * Scales the four sliders to whole percentages that sum to exactly 100 (largest remainder),
 * which is what the backend validates. All-zero falls back to the even default.
 */
function normalizeWeights(raw: ConstraintWeights): ConstraintWeights {
  const total = KEYS.reduce((sum, k) => sum + Math.max(0, raw[k] || 0), 0)
  if (total <= 0) return { ...DEFAULTS }
  const exact = KEYS.map(k => (Math.max(0, raw[k] || 0) * 100) / total)
  const floored = exact.map(v => Math.floor(v))
  let remainder = 100 - floored.reduce((a, b) => a + b, 0)
  const order = exact
    .map((v, i) => ({ i, frac: v - floored[i] }))
    .sort((a, b) => b.frac - a.frac)
  for (const { i } of order) {
    if (remainder <= 0) break
    floored[i] += 1
    remainder -= 1
  }
  return { leftovers: floored[0], budget: floored[1], prepTime: floored[2], recipeRepeat: floored[3] }
}

interface Props {
  user: UserSettings
}

/**
 * "Mire figyeljen a tervező?" — the four soft-constraint weights the solver scales its
 * leftovers / budget / prep-time / variety penalties with. Saved into
 * meal_plan_preferences.constraintWeights and frozen into every plan snapshot at solve time.
 */
export function PlannerWeightsCard({ user }: Props) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [weights, setWeights] = useState<ConstraintWeights>(
    user.mealPlanPreferences?.constraintWeights ?? DEFAULTS,
  )
  const [saving, setSaving] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setWeights(user.mealPlanPreferences?.constraintWeights ?? DEFAULTS)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])
  /* eslint-enable react-hooks/set-state-in-effect */

  const normalized = normalizeWeights(weights)

  async function save() {
    setSaving(true)
    try {
      const updated = await usersService.updateSettings({
        mealPlanPreferences: { constraintWeights: normalized },
      })
      qc.setQueryData(USERS_ME_QUERY_KEY, updated)
      qc.invalidateQueries({ queryKey: USERS_ME_QUERY_KEY })
      setWeights(normalized)
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
          <h2 className="font-semibold text-sm text-[#1A1A1A]">{t('settings.plannerWeights.title')}</h2>
          <p className="text-xs text-gray-400 mt-1">{t('settings.plannerWeights.subtitle')}</p>
        </div>

        {KEYS.map(key => (
          <div key={key}>
            <div className="flex items-baseline justify-between mb-1">
              <label htmlFor={`weight-${key}`} className="text-sm font-medium text-[#1A1A1A]">
                {t(`settings.plannerWeights.${key}`)}
              </label>
              <span className="text-xs tabular-nums text-gray-500">{normalized[key]}%</span>
            </div>
            <Slider
              value={weights[key]}
              min={0}
              max={100}
              step={5}
              onChange={v => setWeights(prev => ({ ...prev, [key]: v }))}
              className="mt-1"
            />
            <p className="text-[10px] text-gray-400 mt-1">{t(`settings.plannerWeights.${key}Hint`)}</p>
          </div>
        ))}

        <p className="text-[10px] text-gray-400">{t('settings.plannerWeights.hint')}</p>

        <Button type="button" onClick={save} disabled={saving} className="w-full">
          {saving ? `${t('common.save')}…` : t('common.save')}
        </Button>
      </CardContent>
    </Card>
  )
}
