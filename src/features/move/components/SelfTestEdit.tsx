/**
 * Correct or delete one self-test result (founder, 2026-11-12) →
 * `PATCH /api/move/self-tests/{id}` / `DELETE …`. Inline, no browser dialogs.
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { useMoveT } from '../lib/register'
import type { SelfTestDto } from '../types'

export function SelfTestEdit({ test }: { test: SelfTestDto }) {
  const { t } = useMoveT()
  const qc = useQueryClient()
  const [mode, setMode] = useState<'idle' | 'edit' | 'delete'>('idle')
  const [value, setValue] = useState(String(test.value))
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: moveKeys.today })
    void qc.invalidateQueries({ queryKey: moveKeys.progress })
    void qc.invalidateQueries({ queryKey: moveKeys.selfTests })
  }
  const save = useMutation({
    mutationFn: () => moveService.updateSelfTest(test.id, Number(value)),
    onSuccess: () => {
      toast({ title: t('selfTestEdit.saved'), variant: 'success' })
      setMode('idle')
      invalidate()
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })
  const remove = useMutation({
    mutationFn: () => moveService.deleteSelfTest(test.id),
    onSuccess: () => {
      toast({ title: t('selfTestEdit.deleted'), variant: 'success' })
      invalidate()
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })
  const n = Number(value)
  const valid = value !== '' && Number.isInteger(n) && n >= 0 && n <= 60

  if (mode === 'edit') {
    return (
      <form
        className="inline-flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) save.mutate()
        }}
      >
        <Input type="number" inputMode="numeric" min={0} max={60} value={value} onChange={(e) => setValue(e.target.value)} className="h-10 w-20" aria-label={t('today.selfTest.input')} autoFocus />
        <Button type="submit" size="sm" className="min-h-10 bg-[#2A9D8F] hover:bg-[#21867A]" disabled={!valid || save.isPending}>
          {t('common.save')}
        </Button>
        <Button type="button" size="sm" variant="ghost" className="min-h-10" onClick={() => setMode('idle')}>
          {t('common.cancel')}
        </Button>
      </form>
    )
  }
  if (mode === 'delete') {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-sm text-gray-700">{t('selfTestEdit.deleteConfirm')}</span>
        <Button size="sm" variant="secondary" className="min-h-10" disabled={remove.isPending} onClick={() => remove.mutate()}>
          {t('selfTestEdit.delete')}
        </Button>
        <Button size="sm" variant="ghost" className="min-h-10" onClick={() => setMode('idle')}>
          {t('common.cancel')}
        </Button>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1">
      <Button size="sm" variant="ghost" className="min-h-10 underline underline-offset-4" onClick={() => setMode('edit')}>
        {t('selfTestEdit.edit')}
      </Button>
      <Button size="sm" variant="ghost" className="min-h-10 text-gray-600" onClick={() => setMode('delete')}>
        {t('selfTestEdit.delete')}
      </Button>
    </span>
  )
}
