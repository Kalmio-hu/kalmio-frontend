import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Shield } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { InvestorNav } from '@/components/InvestorNav'
import { ipVaultService } from '@/services/ipVault'

export function CaptainsBridge() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''

  const { data, isLoading, isError } = useQuery({
    queryKey: ['ip-vault-timeline', token],
    queryFn: () => ipVaultService.fetchTimelineHtml(token),
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

  // srcDoc inlines the HTML so the iframe is same-origin (avoids X-Frame-Options
  // friction) and the document's inline <script> can populate the dynamic numbers.
  return (
    <>
      <InvestorNav token={token} />
      <iframe
        srcDoc={data}
        title="Kalmio Captain's Bridge"
        className="fixed inset-0 w-full h-full border-0"
      />
    </>
  )
}
