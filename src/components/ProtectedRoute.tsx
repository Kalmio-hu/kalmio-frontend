import { Navigate, Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { SnoozeActionHandler } from '@/components/notification/SnoozeActions'
import { useInvestorPreview } from '@/lib/investorPreview'

export function ProtectedRoute() {
  const { session, initialized } = useAuthStore()
  const { isValid: isInvestorPreview, isLoading: isVerifyingToken } = useInvestorPreview()

  if (!initialized || isVerifyingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-soft-sand">
        <Loader2 className="animate-spin text-energy-orange" size={32} />
      </div>
    )
  }

  if (!session && !isInvestorPreview) {
    return <Navigate to="/auth" replace />
  }

  return (
    <>
      {/* KALMIO-316: relay service worker notification action messages to the API */}
      <SnoozeActionHandler />
      <Outlet />
    </>
  )
}
