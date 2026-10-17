import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Store, Link2, Unlink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { retailService, RETAIL_PROVIDERS_QUERY_KEY } from '@/services/retail'
import { useRetailConnect } from '@/hooks/useRetailConnect'
import { RetailConnectManualDialog } from '@/components/retail/RetailConnectManualDialog'
import type { RetailProvider } from '@/types'

/**
 * Settings card: which stores price the shopping list (per-user switch) and, for partners with a
 * basket handoff, linking / unlinking the user's partner account.
 */
export function RetailProvidersSection() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const connect = useRetailConnect()

  const { data: providers = [], isLoading } = useQuery({
    queryKey: RETAIL_PROVIDERS_QUERY_KEY,
    queryFn: retailService.listProviders,
    staleTime: 30_000,
  })

  const toggle = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => retailService.updatePreference(id, enabled),
    onSuccess: (updated) => {
      qc.setQueryData<RetailProvider[]>(RETAIL_PROVIDERS_QUERY_KEY, (old) =>
        old ? old.map(p => (p.id === updated.id ? updated : p)) : old)
      void qc.invalidateQueries({ queryKey: ['shopping-cart'] })
    },
    onError: () => toast({ title: t('settings.retailProviders.saveError'), variant: 'destructive' }),
  })

  const visible = providers.filter(p => p.active)

  return (
    <div className="max-w-lg mt-6">
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center gap-2">
            <Store size={15} className="text-gray-400 shrink-0" aria-hidden="true" />
            <h2 className="font-semibold text-sm text-[#1A1A1A]">{t('settings.retailProviders.title')}</h2>
          </div>
          <p className="text-xs text-[#6B6460]">{t('settings.retailProviders.description')}</p>

          {isLoading ? (
            <div className="flex justify-center py-2"><Spinner /></div>
          ) : (
            <ul className="space-y-2">
              {visible.map((p) => (
                <li key={p.id} className="rounded-xl border border-gray-100 bg-white px-3 py-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#1A1A1A] truncate">{p.name}</span>
                        {p.handoffType === 'MCP' && p.connected && (
                          <Badge variant="green">{t('settings.retailProviders.connected')}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {t('settings.retailProviders.products', { count: p.productCount })}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={p.enabled}
                      aria-label={`${p.name}: ${p.enabled ? t('settings.retailProviders.enabled') : t('settings.retailProviders.disabled')}`}
                      disabled={toggle.isPending}
                      onClick={() => toggle.mutate({ id: p.id, enabled: !p.enabled })}
                      className={[
                        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1A1A1A]',
                        p.enabled ? 'bg-[#4F7942]' : 'bg-gray-300',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                          p.enabled ? 'translate-x-6' : 'translate-x-1',
                        ].join(' ')}
                      />
                    </button>
                  </div>

                  {p.handoffType === 'MCP' && (
                    <div className="flex justify-end">
                      {p.connected ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => connect.disconnect.mutate(p.id)}
                          disabled={connect.disconnect.isPending}
                          className="text-xs text-[#6B6460]"
                        >
                          <Unlink size={14} aria-hidden /> {t('settings.retailProviders.disconnect')}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => connect.start.mutate(p.id)}
                          disabled={connect.start.isPending}
                          className="text-xs"
                        >
                          <Link2 size={14} aria-hidden />
                          {connect.start.isPending ? t('settings.retailProviders.connecting') : t('settings.retailProviders.connect')}
                        </Button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <RetailConnectManualDialog
        manual={connect.manual}
        onClose={() => connect.setManual(null)}
        onSubmit={(args) => connect.finish.mutate(args)}
        pending={connect.finish.isPending}
      />
    </div>
  )
}
