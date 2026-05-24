import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Truck } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { retailService } from '@/services/retail'

export function RetailProviders() {
  const { t } = useTranslation()

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['retail-providers'],
    queryFn: retailService.listProviders,
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
    </div>
  )
}
