import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'

export function AdminRoute() {
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const initialized = useAuthStore((s) => s.initialized)
  const session = useAuthStore((s) => s.session)
  const appRole = useAuthStore((s) => s.appRole)

  if (!initialized) return null
  // A direct load of an admin URL: the session is restored before GET /api/users/me answers with the role.
  // Wait for the role instead of bouncing an admin to /app.
  if (session && appRole === null) return null

  if (!isAdmin) {
    return <Navigate to="/app" replace />
  }

  return <Outlet />
}
