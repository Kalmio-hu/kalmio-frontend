import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { X, ArrowLeft, Send, MessageSquare, ChevronRight, Trash2 } from 'lucide-react'
import { feedbackService } from '@/services/feedback'
import { useAuthStore } from '@/store/auth'
import { toast } from '@/components/ui/toast'
import { cn, formatLocalDate } from '@/lib/utils'
import { capture } from '@/lib/analytics'
import type { FeedbackSummary, FeedbackType } from '@/types'

type View = { kind: 'list' } | { kind: 'create' } | { kind: 'detail'; id: string; isAdmin: boolean }

const STATUS_COLORS: Record<string, string> = {
  OPEN:     'bg-blue-500/20 text-blue-300',
  FIXED:    'bg-green-500/20 text-green-300',
  REJECTED: 'bg-red-500/20 text-red-300',
}

const TYPE_COLORS: Record<string, string> = {
  BUG:        'bg-orange-500/20 text-orange-300',
  SUGGESTION: 'bg-purple-500/20 text-purple-300',
  OTHER:      'bg-white/10 text-white/60',
}

interface FeedbackPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeedbackPanel({ open, onOpenChange }: FeedbackPanelProps) {
  const isAdmin = useAuthStore(s => s.isAdmin)
  const [view, setView] = useState<View>({ kind: 'list' })

  function handleClose() {
    onOpenChange(false)
    setView({ kind: 'list' })
  }

  return (
    <Dialog.Root open={open} onOpenChange={v => { if (!v) handleClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed z-50 right-0 top-0 h-full w-full max-w-md bg-[#1A1A1A] text-white shadow-2xl',
            'flex flex-col',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
            'duration-300'
          )}
        >
          {view.kind === 'list' && (
            <ListView
              isAdmin={isAdmin}
              onNew={() => setView({ kind: 'create' })}
              onOpen={(id) => setView({ kind: 'detail', id, isAdmin })}
              onClose={handleClose}
            />
          )}
          {view.kind === 'create' && (
            <CreateView
              onBack={() => setView({ kind: 'list' })}
              onClose={handleClose}
            />
          )}
          {view.kind === 'detail' && (
            <DetailView
              id={view.id}
              isAdmin={view.isAdmin}
              onBack={() => setView({ kind: 'list' })}
              onClose={handleClose}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── List view ────────────────────────────────────────────────────────────────

function ListView({
  isAdmin,
  onNew,
  onOpen,
  onClose,
}: {
  isAdmin: boolean
  onNew: () => void
  onOpen: (id: string) => void
  onClose: () => void
}) {
  const { t } = useTranslation()

  const { data: items = [], isLoading } = useQuery({
    queryKey: isAdmin ? ['feedback', 'all'] : ['feedback', 'mine'],
    queryFn: isAdmin ? feedbackService.listAll : feedbackService.listMine,
    enabled: true,
  })

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['feedback', 'unread'],
    queryFn: isAdmin ? feedbackService.getAdminUnreadCount : feedbackService.getUnreadCount,
    refetchInterval: 30_000,
  })

  function handleOpen(item: FeedbackSummary) {
    onOpen(item.id)
  }

  return (
    <>
      <PanelHeader onClose={onClose}>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-white/60" />
          <span className="font-semibold">{t('feedback.panelTitle')}</span>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center h-4.5 min-w-[1.125rem] px-1 rounded-full bg-[#F28C28] text-[10px] font-bold text-white leading-none">
              {unreadCount}
            </span>
          )}
        </div>
        {!isAdmin && (
          <button
            onClick={onNew}
            className="text-xs text-[#F28C28] hover:text-orange-300 transition-colors font-medium"
          >
            {t('feedback.new')}
          </button>
        )}
      </PanelHeader>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center h-32 text-white/40 text-sm">
            {t('common.loading', 'Loading…')}
          </div>
        )}
        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-white/40 text-sm gap-2">
            <MessageSquare className="h-8 w-8 opacity-40" />
            <p>{t('feedback.empty')}</p>
            {!isAdmin && (
              <button onClick={onNew} className="text-[#F28C28] hover:underline text-xs mt-1">
                {t('feedback.submitFirst')}
              </button>
            )}
          </div>
        )}
        {items.map(item => (
          <FeedbackListItem key={item.id} item={item} isAdmin={isAdmin} onClick={() => handleOpen(item)} />
        ))}
      </div>
    </>
  )
}

function FeedbackListItem({
  item,
  isAdmin,
  onClick,
}: {
  item: FeedbackSummary
  isAdmin: boolean
  onClick: () => void
}) {
  const { t, i18n } = useTranslation()
  const updatedAt = new Date(item.updatedAt)

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors group"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide', TYPE_COLORS[item.type] ?? TYPE_COLORS.OTHER)}>
              {t(`feedback.types.${item.type}`, item.type)}
            </span>
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide', STATUS_COLORS[item.status] ?? STATUS_COLORS.OPEN)}>
              {t(`feedback.statuses.${item.status}`, item.status)}
            </span>
            {item.messageCount > 0 && (
              <span className="text-[10px] text-white/40 flex items-center gap-0.5">
                <MessageSquare className="h-3 w-3" />{item.messageCount}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-white/90 truncate">{item.title}</p>
          {isAdmin && item.userEmail && (
            <p className="text-xs text-white/40 mt-0.5 truncate">{item.userEmail}</p>
          )}
          <p className="text-xs text-white/30 mt-1">
            {formatLocalDate(updatedAt, i18n.language)}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/50 shrink-0 mt-0.5 transition-colors" />
      </div>
    </button>
  )
}

// ── Create view ──────────────────────────────────────────────────────────────

function CreateView({ onBack, onClose }: { onBack: () => void; onClose: () => void }) {
  const { t } = useTranslation()
  const location = useLocation()
  const qc = useQueryClient()
  const [type, setType] = useState<FeedbackType>('BUG')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const mutation = useMutation({
    mutationFn: () => feedbackService.create({
      type,
      title: title.trim(),
      description: description.trim(),
      page: location.pathname,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback'] })
      capture('feedback_submitted', { feedback_type: type, page: location.pathname })
      toast({ title: t('feedback.sent'), variant: 'success' })
      onBack()
    },
    onError: () => {
      toast({ title: t('feedback.error'), variant: 'destructive' })
    },
  })

  const canSubmit = title.trim().length > 0 && description.trim().length > 0

  return (
    <>
      <PanelHeader onClose={onClose}>
        <button onClick={onBack} className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">{t('feedback.panelTitle')}</span>
        </button>
      </PanelHeader>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="text-xs text-white/50 uppercase tracking-wide mb-1.5 block">
            {t('feedback.typeLabel')}
          </label>
          <div className="flex gap-2">
            {(['BUG', 'SUGGESTION', 'OTHER'] as FeedbackType[]).map(t2 => (
              <button
                key={t2}
                onClick={() => setType(t2)}
                className={cn(
                  'flex-1 py-1.5 rounded text-xs font-medium transition-colors',
                  type === t2
                    ? 'bg-[#F28C28] text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                )}
              >
                {t(`feedback.types.${t2}`)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-white/50 uppercase tracking-wide mb-1.5 block">
            {t('feedback.titleLabel')} *
          </label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={t('feedback.titlePlaceholder')}
            maxLength={255}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#F28C28] transition-colors"
          />
        </div>

        <div>
          <label className="text-xs text-white/50 uppercase tracking-wide mb-1.5 block">
            {t('feedback.descriptionLabel')} *
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={t('feedback.descriptionPlaceholder')}
            rows={5}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#F28C28] transition-colors resize-none"
          />
        </div>
      </div>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => mutation.mutate()}
          disabled={!canSubmit || mutation.isPending}
          className="w-full py-2.5 rounded-lg bg-[#F28C28] text-white text-sm font-medium disabled:opacity-40 hover:bg-orange-500 transition-colors"
        >
          {mutation.isPending ? t('feedback.sending') : t('feedback.send')}
        </button>
      </div>
    </>
  )
}

// ── Detail / thread view ─────────────────────────────────────────────────────

function DetailView({
  id,
  isAdmin,
  onBack,
  onClose,
}: {
  id: string
  isAdmin: boolean
  onBack: () => void
  onClose: () => void
}) {
  const { t, i18n } = useTranslation()
  const qc = useQueryClient()
  const [reply, setReply] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [showStatusChange, setShowStatusChange] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const { data: detail, isLoading } = useQuery({
    queryKey: ['feedback', 'detail', id],
    queryFn: () => isAdmin ? feedbackService.getDetail(id) : feedbackService.getMine(id),
  })

  useEffect(() => {
    if (detail) {
      feedbackService.markRead(id).catch(() => {})
      qc.invalidateQueries({ queryKey: ['feedback', 'unread'] })
    }
    // Intentional: re-run only when the loaded item's identity changes,
    // not on every re-render of detail/qc. markRead is fire-and-forget.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.id])

  const replyMutation = useMutation({
    mutationFn: (body: string) =>
      isAdmin
        ? feedbackService.addAdminMessage(id, body)
        : feedbackService.addMessage(id, body),
    onSuccess: () => {
      setReply('')
      qc.invalidateQueries({ queryKey: ['feedback', 'detail', id] })
      qc.invalidateQueries({ queryKey: isAdmin ? ['feedback', 'all'] : ['feedback', 'mine'] })
    },
    onError: () => toast({ title: t('feedback.error'), variant: 'destructive' }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ status, note }: { status: string; note: string }) =>
      feedbackService.updateStatus(id, status, note || undefined),
    onSuccess: () => {
      setStatusNote('')
      setShowStatusChange(false)
      qc.invalidateQueries({ queryKey: ['feedback', 'detail', id] })
      qc.invalidateQueries({ queryKey: ['feedback', 'all'] })
      qc.invalidateQueries({ queryKey: ['feedback', 'unread'] })
      toast({ title: t('feedback.statusUpdated'), variant: 'success' })
    },
    onError: () => toast({ title: t('feedback.error'), variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => feedbackService.deleteFeedback(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback', 'all'] })
      qc.invalidateQueries({ queryKey: ['feedback', 'unread'] })
      toast({ title: t('feedback.deleteSuccess'), variant: 'success' })
      onBack()
    },
    onError: () => toast({ title: t('feedback.error'), variant: 'destructive' }),
  })

  if (isLoading || !detail) {
    return (
      <>
        <PanelHeader onClose={onClose}>
          <button onClick={onBack} className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">{t('feedback.panelTitle')}</span>
          </button>
        </PanelHeader>
        <div className="flex-1 flex items-center justify-center text-white/40 text-sm">
          {t('common.loading', 'Loading…')}
        </div>
      </>
    )
  }

  return (
    <>
      <PanelHeader onClose={onClose}>
        <button onClick={onBack} className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">{t('feedback.panelTitle')}</span>
        </button>
      </PanelHeader>

      {/* Meta */}
      <div className="px-4 py-3 border-b border-white/10 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide', TYPE_COLORS[detail.type] ?? TYPE_COLORS.OTHER)}>
            {t(`feedback.types.${detail.type}`, detail.type)}
          </span>
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide', STATUS_COLORS[detail.status] ?? STATUS_COLORS.OPEN)}>
            {t(`feedback.statuses.${detail.status}`, detail.status)}
          </span>
          {isAdmin && detail.userEmail && (
            <span className="text-xs text-white/40">{detail.userEmail}</span>
          )}
        </div>
        <p className="text-sm font-semibold text-white">{detail.title}</p>
        <p className="text-sm text-white/70 leading-relaxed">{detail.description}</p>
        {detail.page && (
          <p className="text-[10px] text-white/30 font-mono">{detail.page}</p>
        )}
      </div>

      {/* Admin status control */}
      {isAdmin && (
        <div className="px-4 py-2 border-b border-white/10">
          {!showStatusChange ? (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowStatusChange(true)}
                className="text-xs text-white/50 hover:text-white/80 transition-colors"
              >
                {t('feedback.changeStatus')} →
              </button>
              <button
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-1 text-xs text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('common.delete')}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                {(['OPEN', 'FIXED', 'REJECTED'] as const).map(s => (
                  <button
                    key={s}
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate({ status: s, note: statusNote })}
                    className={cn(
                      'flex-1 py-1 rounded text-[11px] font-medium transition-colors disabled:opacity-50',
                      detail.status === s
                        ? 'ring-1 ring-white/30 bg-white/10 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    )}
                  >
                    {t(`feedback.statuses.${s}`, s)}
                  </button>
                ))}
              </div>
              <input
                value={statusNote}
                onChange={e => setStatusNote(e.target.value)}
                placeholder={t('feedback.replyNotePlaceholder')}
                className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              />
              <button
                onClick={() => setShowStatusChange(false)}
                className="text-[11px] text-white/40 hover:text-white/60"
              >
                {t('common.cancel')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {detail.messages.length === 0 && (
          <p className="text-center text-white/30 text-xs py-4">{t('feedback.noMessages')}</p>
        )}
        {detail.messages.map(msg => (
          <div
            key={msg.id}
            className={cn(
              'max-w-[85%] rounded-xl px-3 py-2',
              msg.admin
                ? 'ml-auto bg-[#F28C28]/20 border border-[#F28C28]/20'
                : 'mr-auto bg-white/5 border border-white/10'
            )}
          >
            <p className="text-[10px] font-medium mb-1 text-white/40">
              {msg.admin ? t('feedback.admin') : t('feedback.you')}
            </p>
            <p className="text-sm text-white/90 whitespace-pre-wrap">{msg.body}</p>
            <p className="text-[10px] text-white/25 mt-1">
              {formatLocalDate(msg.createdAt, i18n.language, { dateStyle: 'short', timeStyle: 'short' })}
            </p>
          </div>
        ))}
      </div>

      {/* Reply input */}
      <div className="p-3 border-t border-white/10 flex gap-2">
        <textarea
          value={reply}
          onChange={e => setReply(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && reply.trim()) {
              e.preventDefault()
              replyMutation.mutate(reply.trim())
            }
          }}
          placeholder={t('feedback.replyPlaceholder')}
          rows={2}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 resize-none transition-colors"
        />
        <button
          onClick={() => reply.trim() && replyMutation.mutate(reply.trim())}
          disabled={!reply.trim() || replyMutation.isPending}
          className="self-end p-2 rounded-lg bg-[#F28C28] text-white disabled:opacity-40 hover:bg-orange-500 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={t('confirm.delete.feedback.title')}
        description={t('confirm.delete.feedback.body')}
        destructiveLabel={t('confirm.delete.feedback.confirm')}
        cancelLabel={t('confirm.delete.feedback.cancel')}
        onConfirm={() => deleteMutation.mutate()}
        isPending={deleteMutation.isPending}
      />
    </>
  )
}

// ── Shared header ────────────────────────────────────────────────────────────

function PanelHeader({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
      {children}
      <Dialog.Close asChild>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          aria-label={t('common.cancel')}
        >
          <X className="h-4 w-4" />
        </button>
      </Dialog.Close>
    </div>
  )
}
