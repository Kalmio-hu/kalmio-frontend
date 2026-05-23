import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Shield } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { ipVaultService } from '@/services/ipVault'

export function Valuation() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''

  const { data, isLoading, isError } = useQuery({
    queryKey: ['ip-vault-valuation', token],
    queryFn: () => ipVaultService.fetchValuationHtml(token),
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  })

  if (!token) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Access token required.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-10 w-10 text-red-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Access denied</p>
          <p className="text-sm text-gray-400 mt-1">This link may be invalid or expired.</p>
        </div>
      </div>
    )
  }

  // The HTML is server-controlled (IpVaultService.getValuationHtml renders a
  // classpath resource for investor-token holders). We render via iframe srcDoc
  // rather than dangerouslySetInnerHTML because the valuation document relies on
  // its own inline <script> (the render() call that populates every number) —
  // scripts inserted via innerHTML do not execute, so an inline injection
  // shows the markup but leaves all values blank.
  //
  // srcDoc inlines the HTML into the iframe instead of fetching it cross-origin,
  // which sidesteps Spring Security's default X-Frame-Options: DENY entirely.
  return (
    <iframe
      srcDoc={data}
      title="Kalmio Valuation"
      className="fixed inset-0 w-full h-full border-0"
    />
  )
}
