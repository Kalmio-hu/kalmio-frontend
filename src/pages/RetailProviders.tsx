import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Truck, Upload } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { retailService } from '@/services/retail'
import { adminService } from '@/services/admin'

export function RetailProviders() {
  const { t } = useTranslation()

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['retail-providers'],
    queryFn: retailService.listProviders,
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
            <Card key={p.id}>
              <CardContent className="flex items-start gap-3 py-4">
                <Truck className="h-5 w-5 shrink-0 text-[#6B6460]" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-[#1A1A1A] truncate">{p.name}</h2>
                    {!p.active && (
                      <Badge variant="gray">{t('retail.providers.inactive')}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-[#6B6460] mt-0.5">
                    {p.country} · {p.currency}
                  </p>
                  {p.baseUrl && (
                    <a
                      href={p.baseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#F28C28] underline-offset-2 hover:underline mt-1 inline-block break-all"
                    >
                      {p.baseUrl}
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
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
