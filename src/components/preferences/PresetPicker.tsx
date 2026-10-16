/**
 * PresetPicker — eating-pattern presets above the detailed meal preferences
 * (docs/product/composable-meals.md §5). Two rows: időzítés (which slots, what split) and
 * stílus (macro split). Applying a card is the same settings write the form below does, so
 * the form refreshes in place and every field stays editable afterwards.
 *
 * Every card carries one honest evidence sentence; the OMAD card says what the only RCT found.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { presetsService, PRESETS_QUERY_KEY } from '@/services/presets'
import { USERS_ME_QUERY_KEY } from '@/services/users'
import type { EatingPatternPreset, EatingPatternPresetId } from '@/types'

export function PresetPicker() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [pendingId, setPendingId] = useState<EatingPatternPresetId | null>(null)

  const { data: presets = [], isLoading } = useQuery({
    queryKey: PRESETS_QUERY_KEY,
    queryFn: presetsService.list,
    staleTime: 60 * 1000,
  })

  const applyMutation = useMutation({
    mutationFn: (id: EatingPatternPresetId) => presetsService.apply(id),
    onMutate: (id) => setPendingId(id),
    onSuccess: (updated) => {
      qc.setQueryData(USERS_ME_QUERY_KEY, updated)
      qc.invalidateQueries({ queryKey: USERS_ME_QUERY_KEY })
      qc.invalidateQueries({ queryKey: PRESETS_QUERY_KEY })
      toast({ title: t('preferences.presets.applied'), variant: 'success' })
    },
    onError: () => toast({ title: t('preferences.presets.applyError'), variant: 'destructive' }),
    onSettled: () => setPendingId(null),
  })

  const timing = presets.filter(p => p.axis === 'TIMING')
  const style = presets.filter(p => p.axis === 'STYLE')

  return (
    <Card>
      <CardContent className="pt-5 space-y-5">
        <div>
          <h2 className="font-semibold text-sm text-[#1A1A1A]">{t('preferences.presets.title')}</h2>
          <p className="text-xs text-gray-500 mt-1">{t('preferences.presets.subtitle')}</p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-6"><Spinner className="h-5 w-5" /></div>
        )}

        {!isLoading && (
          <>
            <PresetRow
              title={t('preferences.presets.timingTitle')}
              presets={timing}
              pendingId={pendingId}
              onApply={id => applyMutation.mutate(id)}
              t={t}
            />
            <PresetRow
              title={t('preferences.presets.styleTitle')}
              presets={style}
              pendingId={pendingId}
              onApply={id => applyMutation.mutate(id)}
              t={t}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}

interface PresetRowProps {
  title: string
  presets: EatingPatternPreset[]
  pendingId: EatingPatternPresetId | null
  onApply: (id: EatingPatternPresetId) => void
  t: (key: string, options?: Record<string, unknown>) => string
}

function PresetRow({ title, presets, pendingId, onApply, t }: PresetRowProps) {
  if (presets.length === 0) return null
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {presets.map(p => {
          const busy = pendingId === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => !p.active && onApply(p.id)}
              disabled={busy || pendingId != null}
              aria-pressed={p.active}
              className={`
                text-left rounded-[12px] border px-3 py-2.5 transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7942]
                ${p.active
                  ? 'border-[#4F7942] bg-[#4F7942]/5'
                  : 'border-[#e5e7eb] bg-white hover:border-[#4F7942]'}
                disabled:opacity-60
              `}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1A1A1A] leading-snug">
                    {t(`preferences.presets.items.${p.id}.name`)}
                  </p>
                  <p className="text-xs text-[#4F7942] font-medium mt-0.5">
                    {t(`preferences.presets.items.${p.id}.tagline`)}
                  </p>
                </div>
                {p.active ? (
                  <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#4F7942]">
                    <Check className="h-3 w-3" aria-hidden />
                    {t('preferences.presets.active')}
                  </span>
                ) : busy ? (
                  <Spinner className="h-4 w-4 shrink-0" />
                ) : (
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    {t('preferences.presets.apply')}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">
                {t(`preferences.presets.items.${p.id}.evidence`)}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
