import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Truck, Upload, RefreshCw, DatabaseZap, Power } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { retailService, RETAIL_PROVIDERS_QUERY_KEY } from '@/services/retail'
import { adminService } from '@/services/admin'
import type { RetailProvider } from '@/types'

/**
 * Admin — retail partners. The global switch per provider (this is how Tesco gets turned off
 * once multi-provider operation is verified), the Kifli catalogue sync and price refresh, and the
 * monthly partner export trigger.
 */
export function RetailProviders() {
  const { t } = useTranslation()
  const qc = useQueryClient()

  const { data: providers = [], isLoading } = useQuery({
    queryKey: RETAIL_PROVIDERS_QUERY_KEY,
    queryFn: retailService.listProviders,
  })

  const refreshList = () => void qc.invalidateQueries({ queryKey: RETAIL_PROVIDERS_QUERY_KEY })

  const activeMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => adminService.setRetailProviderActive(id, active),
    onSuccess: refreshList,
    onError: () => toast({ title: t('retail.providers.error'), variant: 'destructive' }),
  })

  const syncMutation = useMutation({
    mutationFn: ({ id, force }: { id: string; force: boolean }) => adminService.syncRetailProvider(id, force),
    onSuccess: (res) => toast({ title: res.started ? t('retail.providers.syncStarted') : t('retail.providers.syncAlreadyRunning') }),
    onError: () => toast({ title: t('retail.providers.error'), variant: 'destructive' }),
  })

  const refreshMutation = useMutation({
    mutationFn: (id: string) => adminService.refreshRetailPrices(id),
    onSuccess: (res) => { toast({ title: t('retail.providers.pricesRefreshed', { count: res.updated }) }); refreshList() },
    onError: () => toast({ title: t('retail.providers.error'), variant: 'destructive' }),
  })

  const [exportResult, setExportResult] = useState<string | null>(null)
  const exportMutation = useMutation({
    mutationFn: adminService.triggerPartnerExport,
    onSuccess: (result) => setExportResult(result),
    onError: () => toast({ title: t('retail.partnerExport.error'), variant: 'destructive' }),
  })

  return (
    <div>
      <Header
        title={t('retail.providers.title')}
        subtitle={t('retail.providers.subtitle', { count: providers.length })}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : providers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-[#6B6460]">
            {t('retail.providers.empty')}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {providers.map((p) => (
            <ProviderCard
              key={p.id}
              provider={p}
              onToggleActive={() => activeMutation.mutate({ id: p.id, active: !p.active })}
              onSync={(force) => syncMutation.mutate({ id: p.id, force })}
              onRefreshPrices={() => refreshMutation.mutate(p.id)}
              busy={activeMutation.isPending || syncMutation.isPending || refreshMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Partner export — manual trigger for the monthly graduation export (KALMIO-142) */}
      <Card className="mt-6">
        <CardContent className="py-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-1.5">
              <Upload className="h-4 w-4 text-[#6B6460]" aria-hidden />
              {t('retail.partnerExport.title')}
            </h2>
            <p className="text-xs text-[#6B6460] mt-0.5">{t('retail.partnerExport.subtitle')}</p>
            {exportResult && (
              <pre className="mt-2 text-xs text-[#1A1A1A] bg-[#F9F7F2] rounded-lg px-3 py-2 whitespace-pre-wrap break-words" role="status">
                {exportResult}
              </pre>
            )}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="shrink-0"
          >
            {exportMutation.isPending ? t('retail.partnerExport.running') : t('retail.partnerExport.cta')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function ProviderCard({
  provider: p, onToggleActive, onSync, onRefreshPrices, busy,
}: {
  provider: RetailProvider
  onToggleActive: () => void
  onSync: (force: boolean) => void
  onRefreshPrices: () => void
  busy: boolean
}) {
  const { t } = useTranslation()
  const syncable = p.code === 'KIFLI'

  const { data: status } = useQuery({
    queryKey: ['retail-sync-status', p.id],
    queryFn: () => adminService.retailSyncStatus(p.id),
    enabled: syncable,
    refetchInterval: (q) => (q.state.data?.running ? 5_000 : false),
  })
  const report = status?.report

  return (
    <Card>
      <CardContent className="flex items-start gap-3 py-4">
        <Truck className="h-5 w-5 shrink-0 text-[#6B6460]" aria-hidden />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-[#1A1A1A] truncate">{p.name}</h2>
            {p.code && <Badge variant="black">{p.code}</Badge>}
            {!p.active && <Badge variant="gray">{t('retail.providers.inactive')}</Badge>}
            <Badge variant={p.handoffType === 'MCP' ? 'green' : 'gray'}>
              {p.handoffType === 'MCP' ? t('retail.providers.handoffMcp') : t('retail.providers.handoffNone')}
            </Badge>
          </div>
          <p className="text-xs text-[#6B6460]">
            {p.country} · {p.currency} · {t('retail.providers.products', { count: p.productCount })}
          </p>
          {p.baseUrl && (
            <a
              href={p.baseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#F28C28] underline-offset-2 hover:underline inline-block break-all"
            >
              {p.baseUrl}
            </a>
          )}
          {syncable && report && (report.finishedAt || status?.running) && (
            <p className="text-xs text-[#6B6460]" role="status">
              {status?.running
                ? t('retail.providers.syncRunning')
                : t('retail.providers.lastSync', { matched: report.matched ?? 0, unmatched: report.unmatched ?? 0, failed: report.failed ?? 0 })}
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              variant={p.active ? 'ghost' : 'secondary'}
              size="sm"
              onClick={onToggleActive}
              disabled={busy}
              className="text-xs"
            >
              <Power className="h-3.5 w-3.5" aria-hidden />
              {p.active ? t('retail.providers.setInactive') : t('retail.providers.setActive')}
            </Button>
            {syncable && (
              <>
                <Button variant="secondary" size="sm" onClick={() => onSync(false)} disabled={busy || !!status?.running} className="text-xs">
                  <DatabaseZap className="h-3.5 w-3.5" aria-hidden /> {t('retail.providers.sync')}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onSync(true)} disabled={busy || !!status?.running} className="text-xs">
                  {t('retail.providers.syncForce')}
                </Button>
                <Button variant="ghost" size="sm" onClick={onRefreshPrices} disabled={busy} className="text-xs">
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden /> {t('retail.providers.refreshPrices')}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
