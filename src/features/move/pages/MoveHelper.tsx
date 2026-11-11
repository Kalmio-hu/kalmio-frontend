/**
 * Helper (PRD §7.10), both directions.
 *  - As helper: invite by email or family member → POST /api/move/helper/invite;
 *    per consented person the weekly summary (done of planned, last self-test,
 *    "Elestem" yes/no — nothing else), three prepared encouragements, and
 *    "Megvolt, én rögzítem" for one of their planned sessions.
 *  - As helped person: pending requests with "Elfogadom" (consent is recorded
 *    on their own tap) and "Visszavonom", which removes everything the helper sees.
 * No free chat.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Heart, Printer, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { familyService } from '@/services/family'
import { MovePageFrame } from '../components/MovePageFrame'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { useMoveT } from '../lib/register'
import { MOVE_ACCENT, MOVE_HOME } from '../lib/constants'
import type { EncourageTemplateCode, HelperLinkDto } from '../types'

const ENCOURAGEMENTS: EncourageTemplateCode[] = ['ENC_PROUD', 'ENC_KEEP_GOING', 'ENC_SEE_YOU']
const ACCENT_BUTTON = 'bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F]'

export function MoveHelper() {
  const { t } = useMoveT()
  const qc = useQueryClient()
  const q = useQuery({ queryKey: moveKeys.helper, queryFn: moveService.getHelper, staleTime: 60_000 })
  const invalidate = () => void qc.invalidateQueries({ queryKey: moveKeys.helper })

  const consent = useMutation({
    mutationFn: (linkId: string) => moveService.consentHelper(linkId),
    onSuccess: () => {
      toast({ title: t('helper.consent.accepted'), variant: 'success' })
      invalidate()
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })
  const revoke = useMutation({
    mutationFn: (linkId: string) => moveService.revokeHelperConsent(linkId),
    onSuccess: () => {
      toast({ title: t('helper.consent.revoked'), variant: 'success' })
      invalidate()
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  return (
    <MovePageFrame
      title={t('helper.title')}
      subtitle={t('helper.subtitle')}
      isLoading={q.isPending}
      isError={q.isError}
      onRetry={() => void q.refetch()}
    >
      {q.data && (
        <div className="space-y-8">
          {/* As the helped person */}
          {q.data.helpedBy.length > 0 && (
            <section aria-labelledby="move-helper-helped" className="space-y-3">
              <h2 id="move-helper-helped" className="text-xl font-headline font-bold text-[#1A1A1A]">{t('helper.asHelped')}</h2>
              <ul className="space-y-3">
                {q.data.helpedBy.map((link) => (
                  <li key={link.id} className="bg-white rounded-[16px] border border-[#e5e4e7] p-5 space-y-3">
                    <p className="font-headline font-bold text-[#1A1A1A]">{link.helperName ?? t('helper.title')}</p>
                    {link.consented ? (
                      <>
                        <p className="text-base text-gray-700">{t('helper.consent.active')}</p>
                        <Button variant="secondary" onClick={() => revoke.mutate(link.id)} disabled={revoke.isPending}>
                          {t('helper.consent.revoke')}
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-base text-gray-700">{t('helper.consent.request', { name: link.helperName ?? t('helper.title') })}</p>
                        <div className="flex gap-2 flex-wrap">
                          <Button className={ACCENT_BUTTON} onClick={() => consent.mutate(link.id)} disabled={consent.isPending}>
                            {t('helper.consent.accept')}
                          </Button>
                          <Button variant="ghost" onClick={() => revoke.mutate(link.id)} disabled={revoke.isPending}>
                            {t('helper.consent.revoke')}
                          </Button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* As the helper */}
          <section aria-labelledby="move-helper-helping" className="space-y-3">
            <h2 id="move-helper-helping" className="text-xl font-headline font-bold text-[#1A1A1A]">{t('helper.asHelper')}</h2>
            <p className="text-sm text-gray-600">{t('helper.noChat')}</p>
            {q.data.helping.map((link) => (
              <HelpedPersonCard key={link.id} link={link} />
            ))}
            <InviteCard onInvited={invalidate} />
          </section>
        </div>
      )}
    </MovePageFrame>
  )
}

function InviteCard({ onInvited }: { onInvited: () => void }) {
  const { t } = useMoveT()
  const [email, setEmail] = useState('')
  const [memberId, setMemberId] = useState('')
  const family = useQuery({ queryKey: ['family', 'mine'], queryFn: familyService.getMine, staleTime: 5 * 60_000, retry: false })
  const members = family.data?.members ?? []

  const invite = useMutation({
    mutationFn: () => moveService.inviteHelper(memberId ? { memberId } : { email: email.trim() }),
    onSuccess: () => {
      toast({ title: t('helper.invite.sent'), variant: 'success' })
      setEmail('')
      setMemberId('')
      onInvited()
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  const valid = !!memberId || /\S+@\S+\.\S+/.test(email)

  return (
    <form
      className="bg-white rounded-[16px] border border-[#e5e4e7] p-5 space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid && !invite.isPending) invite.mutate()
      }}
    >
      <p className="flex items-center gap-2 font-headline font-bold text-[#1A1A1A]">
        <UserPlus className="h-5 w-5" aria-hidden style={{ color: MOVE_ACCENT }} />
        {t('helper.invite.title')}
      </p>
      <p className="text-sm text-gray-600">{t('helper.invite.hint')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
        <div className="space-y-1.5">
          <Label htmlFor="move-helper-email">{t('helper.invite.email')}</Label>
          <Input id="move-helper-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setMemberId('') }} className="min-h-12 text-base" autoComplete="email" />
        </div>
        <span className="text-sm text-gray-600 text-center pb-3">{t('helper.invite.or')}</span>
        <div className="space-y-1.5">
          <Label htmlFor="move-helper-member">{t('helper.invite.member')}</Label>
          <Select id="move-helper-member" value={memberId} onChange={(e) => { setMemberId(e.target.value); setEmail('') }} className="min-h-12" disabled={members.length === 0}>
            <option value="">{t('helper.invite.memberPlaceholder')}</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>{m.displayName}</option>
            ))}
          </Select>
        </div>
      </div>
      <Button type="submit" className={ACCENT_BUTTON} disabled={!valid || invite.isPending}>
        {t('helper.invite.submit')}
      </Button>
    </form>
  )
}

function HelpedPersonCard({ link }: { link: HelperLinkDto }) {
  const { t } = useMoveT()
  const qc = useQueryClient()
  const name = link.helpedName ?? t('helper.someone')
  const summary = useQuery({
    queryKey: moveKeys.helperSummary(link.helpedUserId),
    queryFn: () => moveService.getHelperSummary(link.helpedUserId),
    enabled: link.consented,
    staleTime: 60_000,
    retry: false,
  })
  const [pickedSession, setPickedSession] = useState('')

  const encourage = useMutation({
    mutationFn: (templateCode: EncourageTemplateCode) => moveService.encourage(link.helpedUserId, { templateCode }),
    onSuccess: () => toast({ title: t('helper.encourage.sent'), variant: 'success' }),
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })
  const logOnBehalf = useMutation({
    mutationFn: () => moveService.logOnBehalf(link.helpedUserId, { sessionId: pickedSession }),
    onSuccess: () => {
      toast({ title: t('helper.logOnBehalf.saved'), variant: 'success' })
      setPickedSession('')
      void qc.invalidateQueries({ queryKey: moveKeys.helperSummary(link.helpedUserId) })
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  const openSessions = (summary.data?.sessions ?? []).filter((s) => s.status === 'PLANNED' || s.status === 'MISSED')

  return (
    <article className="bg-white rounded-[16px] border border-[#e5e4e7] p-5 space-y-4" aria-label={name}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-headline font-bold text-[#1A1A1A]">{name}</p>
        {link.consented && (
          <Button asChild variant="ghost" size="sm">
            <Link to={`${MOVE_HOME}/sheet?for=${encodeURIComponent(link.helpedUserId)}`}>
              <Printer className="h-4 w-4" aria-hidden />
              {t('helper.sheetFor')}
            </Link>
          </Button>
        )}
      </div>

      {!link.consented ? (
        <p className="text-base text-gray-700">{t('helper.pending')} {t('helper.summary.notConsented')}</p>
      ) : summary.isPending ? (
        <div className="flex justify-center py-4" role="status"><Spinner className="border-[#2A9D8F]" /></div>
      ) : summary.isError ? (
        <p className="text-base text-gray-700">{t('common.error')}</p>
      ) : (
        <>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">{t('helper.summary.title')}</p>
            <p className="text-lg text-[#1A1A1A]">{t('helper.summary.done', { done: summary.data.done, planned: summary.data.planned })}</p>
            <p className="text-base text-gray-700">
              {summary.data.lastSelfTest
                ? t('helper.summary.lastSelfTest', { value: summary.data.lastSelfTest.value, date: summary.data.lastSelfTest.date })
                : t('helper.summary.noSelfTest')}
            </p>
            <p className="text-base text-gray-700">{summary.data.fallReported ? t('helper.summary.fallYes') : t('helper.summary.fallNo')}</p>
          </div>

          <div className="space-y-2">
            <p className="flex items-center gap-2 text-base font-medium text-[#1A1A1A]">
              <Heart className="h-4 w-4" aria-hidden style={{ color: MOVE_ACCENT }} />
              {t('helper.encourage.title')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {ENCOURAGEMENTS.map((code) => (
                <Button key={code} variant="secondary" className="h-auto min-h-12 py-2 whitespace-normal text-left" onClick={() => encourage.mutate(code)} disabled={encourage.isPending}>
                  {t(`helper.encourage.${code}`)}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-base font-medium text-[#1A1A1A]">{t('helper.logOnBehalf.title')}</p>
            {openSessions.length === 0 ? (
              <p className="text-sm text-gray-600">{t('helper.logOnBehalf.none')}</p>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={pickedSession} onChange={(e) => setPickedSession(e.target.value)} className="min-h-12 flex-1" aria-label={t('helper.logOnBehalf.pick')}>
                  <option value="">{t('helper.logOnBehalf.pick')}</option>
                  {openSessions.map((s) => (
                    <option key={s.id} value={s.id}>{s.date} · {s.modalityName} · {t('common.minutes', { count: s.durationMin })}</option>
                  ))}
                </Select>
                <Button className={ACCENT_BUTTON} disabled={!pickedSession || logOnBehalf.isPending} onClick={() => logOnBehalf.mutate()}>
                  {t('helper.logOnBehalf.submit')}
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </article>
  )
}
