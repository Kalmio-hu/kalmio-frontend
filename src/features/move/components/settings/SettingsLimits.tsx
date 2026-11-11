/**
 * Settings — limits in the user's words ("térdelni fáj") mapped to tags.
 * `GET/POST/DELETE /api/move/limits`.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { moveService } from '../../services/moveService'
import { moveKeys } from '../../lib/queryKeys'
import { useMoveT } from '../../lib/register'
import { LIMIT_STATEMENTS, statementForTag } from '../../lib/limits'
import type { ContraindicationTag } from '../../types'

export function SettingsLimits() {
  const { t } = useMoveT()
  const qc = useQueryClient()
  const q = useQuery({ queryKey: moveKeys.limits, queryFn: moveService.getLimits, staleTime: 60_000 })
  const add = useMutation({
    mutationFn: (tag: ContraindicationTag) => moveService.addLimit({ tag }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: moveKeys.limits })
      toast({ title: t('settings.saved'), variant: 'success' })
    },
    onError: () => toast({ title: t('settings.error'), variant: 'destructive' }),
  })
  const remove = useMutation({
    mutationFn: (id: string) => moveService.removeLimit(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: moveKeys.limits }),
    onError: () => toast({ title: t('settings.error'), variant: 'destructive' }),
  })

  if (q.isPending) {
    return (
      <div className="flex justify-center py-4" role="status">
        <Spinner className="border-[#2A9D8F]" />
      </div>
    )
  }
  const limits = q.data ?? []
  const free = LIMIT_STATEMENTS.filter((s) => !limits.some((l) => l.tag === s.tag))

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{t('settings.limits.hint')}</p>
      {limits.length === 0 ? (
        <p className="text-sm text-gray-500">{t('settings.limits.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {limits.map((l) => {
            const s = statementForTag(l.tag)
            return (
              <li key={l.id} className="flex items-center justify-between gap-3 rounded-[12px] border border-[#e5e4e7] bg-white px-4 py-2">
                <div>
                  <p className="text-base text-[#1A1A1A]">{s ? t(`settings.limits.statements.${s.key}`) : l.tag}</p>
                  <p className="text-xs text-gray-500">{t(`settings.limits.source.${l.source}`)}</p>
                </div>
                <Button variant="ghost" size="sm" className="min-h-12" disabled={remove.isPending} onClick={() => remove.mutate(l.id)}>
                  {t('settings.limits.remove')}
                </Button>
              </li>
            )
          })}
        </ul>
      )}
      {free.length > 0 && (
        <div className="space-y-1">
          <Label htmlFor="move-settings-limit-pick">{t('settings.limits.pick')}</Label>
          <Select id="move-settings-limit-pick" className="h-12" value="" disabled={add.isPending} onChange={(e) => e.target.value && add.mutate(e.target.value as ContraindicationTag)}>
            <option value="">{t('settings.limits.add')}…</option>
            {free.map((s) => (
              <option key={s.tag} value={s.tag}>
                {t(`settings.limits.statements.${s.key}`)}
              </option>
            ))}
          </Select>
        </div>
      )}
    </div>
  )
}
