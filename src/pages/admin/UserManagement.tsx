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
