import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Shield } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { ipVaultService } from '@/services/ipVault'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export function Valuation() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''

  const { isLoading, isError, isSuccess } = useQuery({
    queryKey: ['ip-vault-verify', token],
    queryFn: () => ipVaultService.verifyToken(token),
    enabled: !!token,
    retry: false,
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

  if (isError) {
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

  if (!isSuccess) return null

  const src = `${API_BASE}/api/ip-vault/public/valuation?token=${encodeURIComponent(token)}`

  return (
    <iframe
      src={src}
      title="Kalmio Valuation"
      className="fixed inset-0 w-full h-full border-0"
    />
  )
}
