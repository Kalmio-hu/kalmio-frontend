/**
 * DiofaNameField — lets FIATAL+ users name their diófa tree.
 *
 * Renders a small "elnevezem" affordance card. Clicking it opens a Radix Dialog
 * with a 30-char text input. Saves via PUT /api/users/me/diofa-name.
 * Hidden entirely for pre-FIATAL users.
 *
 * Only shown when:
 *   - stage query resolves to FIATAL or TERMO
 *   - (Pre-FIATAL users never reach here — Settings renders this conditionally)
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, TreePine } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { usersService, USERS_ME_QUERY_KEY } from '@/services/users'

const MAX_NAME_LENGTH = 30

interface DiofaNameFieldProps {
  /** Current diófa name from the USERS_ME_QUERY_KEY query. Null = not yet named. */
  currentName: string | null
}

export function DiofaNameField({ currentName }: DiofaNameFieldProps) {
  const { t } = useTranslation()
  const qc = useQueryClient()

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(currentName ?? '')
  const [fieldError, setFieldError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (name: string) => usersService.updateDiofaName(name),
    onSuccess: () => {
      // Optimistically patch the cached 'me' data so the name shows immediately.
      qc.setQueryData<{ diofaName: string | null } & Record<string, unknown>>(
        USERS_ME_QUERY_KEY,
        (old) => (old ? { ...old, diofaName: draft.trim() } : old)
      )
      qc.invalidateQueries({ queryKey: USERS_ME_QUERY_KEY })
      toast({ title: t('settings.diofaName.success'), variant: 'success' })
      setOpen(false)
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 400) {
        setFieldError(t('settings.diofaName.inappropriate'))
      } else {
        setFieldError(t('settings.diofaName.saveFailed'))
      }
    },
  })

  const handleOpen = () => {
    setDraft(currentName ?? '')
    setFieldError(null)
    setOpen(true)
  }

  const handleSave = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    if (trimmed.length > MAX_NAME_LENGTH) {
      setFieldError(t('settings.diofaName.tooLong', { max: MAX_NAME_LENGTH }))
      return
    }
    setFieldError(null)
    mutation.mutate(trimmed)
  }

  const remaining = MAX_NAME_LENGTH - draft.length

  return (
    <>
      {/* Affordance card */}
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-3 w-full rounded-xl border border-[#4F7942]/30 bg-[#F3F8F2] px-4 py-3 hover:bg-[#4F7942]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7942]/50 text-left"
        aria-label={
          currentName
            ? t('settings.diofaName.editAria', { name: currentName })
            : t('settings.diofaName.nameAria')
        }
      >
        <TreePine size={18} className="text-[#4F7942] shrink-0" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#4F7942] uppercase tracking-wider">
            {t('settings.diofaName.label')}
          </p>
          <p className="text-sm text-[#1A1A1A] truncate mt-0.5">
            {currentName
              ? currentName
              : <span className="text-gray-400 italic">{t('settings.diofaName.unnamed')}</span>}
          </p>
        </div>
        <Pencil size={14} className="text-[#4F7942]/60 shrink-0" aria-hidden />
      </button>

      {/* Naming modal */}
      <Dialog open={open} onOpenChange={(o) => { if (!o) setOpen(false) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('settings.diofaName.modalTitle')}</DialogTitle>
            <DialogDescription>{t('settings.diofaName.modalDesc')}</DialogDescription>
          </DialogHeader>

          {/* Real-time preview */}
          {draft.trim() && (
            <div className="rounded-lg bg-[#F3F8F2] border border-[#4F7942]/20 px-4 py-2 mb-1">
              <p className="text-xs text-[#4F7942] font-semibold uppercase tracking-wider mb-0.5">
                {t('settings.diofaName.preview')}
              </p>
              <p className="text-sm font-medium text-[#1A1A1A]">{draft.trim()}</p>
            </div>
          )}

          <div className="space-y-1 mt-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="diofa-name-input">{t('settings.diofaName.inputLabel')}</Label>
              <span
                className={[
                  'text-[10px] tabular-nums',
                  remaining < 5 ? 'text-red-500' : 'text-gray-400',
                ].join(' ')}
              >
                {remaining}
              </span>
            </div>
            <Input
              id="diofa-name-input"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                setFieldError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSave()
                }
                if (e.key === 'Escape') {
                  setOpen(false)
                }
              }}
              placeholder={t('settings.diofaName.placeholder')}
              maxLength={MAX_NAME_LENGTH}
              autoFocus
              aria-describedby={fieldError ? 'diofa-name-error' : undefined}
            />
            {fieldError && (
              <p id="diofa-name-error" role="alert" className="text-xs text-red-500 mt-1">
                {fieldError}
              </p>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              className="flex-1 bg-[#4F7942] hover:bg-[#4F7942]/90 text-white rounded-xl"
              onClick={handleSave}
              disabled={mutation.isPending || !draft.trim() || draft.trim().length > MAX_NAME_LENGTH}
            >
              {mutation.isPending ? <Spinner /> : t('settings.diofaName.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
