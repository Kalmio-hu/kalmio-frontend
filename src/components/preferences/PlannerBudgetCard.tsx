import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { usersService, USERS_ME_QUERY_KEY } from '@/services/users'
import type { UserSettings } from '@/services/users'

/** Suggested daily grocery budget for two meals a day, in HUF. */
const SUGGESTED_DAILY_BUDGET = 4500

interface Props {
  user: UserSettings
}

/**
 * Daily grocery budget. The solver keeps the plan under it (hard cap at +20 %) and the
 * "Költségkeret" weight decides how hard it tries below the cap.
 */
export function PlannerBudgetCard({ user }: Props) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const stored = user.mealPlanPreferences?.budgetMax ?? null
  const [value, setValue] = useState<string>(stored != null ? String(Math.round(stored)) : '')
  const [seenStored, setSeenStored] = useState(stored)
  const [saving, setSaving] = useState(false)
  const costSaver = user.mealPlanPreferences?.costSaverSubstitutions === true
  const [togglingSaver, setTogglingSaver] = useState(false)

  async function toggleCostSaver(next: boolean) {
    setTogglingSaver(true)
    try {
      const updated = await usersService.updateSettings({ mealPlanPreferences: { costSaverSubstitutions: next } })
      qc.setQueryData(USERS_ME_QUERY_KEY, updated)
      qc.invalidateQueries({ queryKey: USERS_ME_QUERY_KEY })
    } catch {
      toast({ title: t('settings.saveError'), variant: 'destructive' })
    } finally {
      setTogglingSaver(false)
    }
  }

  // Re-sync the field when the stored value changes (adjusting state during render, not in an effect).
  if (seenStored !== stored) {
    setSeenStored(stored)
    setValue(stored != null ? String(Math.round(stored)) : '')
  }

  const parsed = value.trim() === '' ? null : Number(value)
  const valid = parsed === null || (Number.isFinite(parsed) && parsed >= 500 && parsed <= 50000)
  const dirty = (parsed ?? null) !== (stored != null ? Math.round(stored) : null)

  async function save() {
    if (!valid || parsed === null) return
    setSaving(true)
    try {
      const updated = await usersService.updateSettings({ mealPlanPreferences: { budgetMax: parsed } })
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
          <h2 className="font-semibold text-sm text-[#1A1A1A]">{t('settings.plannerBudget.title')}</h2>
          <p className="text-xs text-gray-400 mt-1">{t('settings.plannerBudget.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="daily-budget" className="text-sm font-medium text-[#1A1A1A] whitespace-nowrap">
            {t('settings.plannerBudget.label')}
          </label>
          <Input
            id="daily-budget"
            type="number"
            inputMode="numeric"
            min={500}
            max={50000}
            step={100}
            value={value}
            placeholder={String(SUGGESTED_DAILY_BUDGET)}
            onChange={e => setValue(e.target.value)}
            aria-invalid={!valid}
            className="max-w-[140px] tabular-nums"
          />
          <span className="text-sm text-gray-500">{t('settings.plannerBudget.unit')}</span>
        </div>
        {stored == null && (
          <button
            type="button"
            className="text-xs text-[#4F7942] underline underline-offset-2"
            onClick={() => setValue(String(SUGGESTED_DAILY_BUDGET))}
          >
            {t('settings.plannerBudget.suggest', { amount: SUGGESTED_DAILY_BUDGET.toLocaleString('hu-HU') })}
          </button>
        )}
        {!valid && <p className="text-xs text-red-600">{t('settings.plannerBudget.invalid')}</p>}
        <label className="flex items-start gap-3 text-sm text-[#1A1A1A] pt-1">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-[#4F7942]"
            checked={costSaver}
            disabled={togglingSaver}
            onChange={e => void toggleCostSaver(e.target.checked)}
          />
          <span>
            <span className="font-medium">{t('settings.plannerBudget.costSaver')}</span>
            <span className="block text-xs text-gray-400">{t('settings.plannerBudget.costSaverHint')}</span>
          </span>
        </label>
        <Button size="sm" onClick={save} disabled={saving || !dirty || !valid || parsed === null}>
          {t('common.save')}
        </Button>
      </CardContent>
    </Card>
  )
}
