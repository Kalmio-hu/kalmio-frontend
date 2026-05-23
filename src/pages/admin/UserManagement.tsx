import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, ShieldOff, Sparkles, UserCheck } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { adminService } from '@/services/admin'
import { useAuthStore } from '@/store/auth'
import { formatLocalDate } from '@/lib/utils'

export function UserManagement() {
  const { t, i18n } = useTranslation()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const currentUserId = useAuthStore((s) => s.user?.id)

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.getStats,
    staleTime: 60_000,
  })

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminService.listUsers,
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'USER' | 'ADMIN' }) =>
      adminService.updateRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const premiumMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      adminService.togglePremium(id, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const impersonateMutation = useMutation({
    mutationFn: (userId: string) => adminService.impersonate(userId),
    onSuccess: (data) => {
      useAuthStore.getState().startImpersonation(data.accessToken, data.email)
      qc.clear()
      navigate('/app')
    },
  })

  return (
    <div>
      <Header
        title={t('admin.users.title')}
        subtitle={t('admin.users.subtitle', { count: users.length })}
      />

      {/* DB-side health snapshot (KALMIO-281 / GET /api/admin/stats) */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card>
            <CardContent className="py-3 text-center">
              <p className="text-2xl font-bold text-[#1A1A1A]">{stats.totalRealUsers}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('admin.stats.totalRealUsers')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 text-center">
              <p className="text-2xl font-bold text-[#4f7942]">{stats.foundingMembers}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('admin.stats.foundingMembers')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 text-center">
              <p className="text-2xl font-bold text-[#1A1A1A]">{stats.totalFridgeItems}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('admin.stats.totalFridgeItems')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 text-center">
              <div className="flex flex-wrap justify-center gap-1">
                {Object.entries(stats.stageDistribution).map(([stage, count]) => (
                  <span key={stage} className="text-xs bg-gray-100 rounded px-1.5 py-0.5">
                    {stage}: {count}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('admin.stats.stageDistribution')}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="space-y-2">
          {users.map(user => (
            <Card key={user.id}>
              <CardContent className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A] truncate">{user.email}</p>
                  <p className="text-xs text-gray-400">{formatLocalDate(user.createdAt, i18n.language)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={user.role === 'ADMIN' ? 'orange' : 'gray'}>
                    {user.role}
                  </Badge>
                  {user.premiumEnabled && (
                    <Badge variant="amber">{t('admin.users.premiumBadge')}</Badge>
                  )}
                  {user.id !== currentUserId && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={roleMutation.isPending && roleMutation.variables?.id === user.id}
                        onClick={() =>
                          roleMutation.mutate({
                            id: user.id,
                            role: user.role === 'ADMIN' ? 'USER' : 'ADMIN',
                          })
                        }
                      >
                        {user.role === 'ADMIN' ? (
                          <><ShieldOff className="h-3.5 w-3.5" /> {t('admin.users.demote')}</>
                        ) : (
                          <><ShieldCheck className="h-3.5 w-3.5" /> {t('admin.users.promote')}</>
                        )}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={premiumMutation.isPending && premiumMutation.variables?.id === user.id}
                        onClick={() =>
                          premiumMutation.mutate({
                            id: user.id,
                            enabled: !user.premiumEnabled,
                          })
                        }
                      >
                        <Sparkles className="h-3.5 w-3.5" />{' '}
                        {user.premiumEnabled
                          ? t('admin.users.revokePremium')
                          : t('admin.users.grantPremium')}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={impersonateMutation.isPending && impersonateMutation.variables === user.id}
                        onClick={() => impersonateMutation.mutate(user.id)}
                      >
                        <UserCheck className="h-3.5 w-3.5" /> {t('admin.users.impersonate')}
                      </Button>
                    </>
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
