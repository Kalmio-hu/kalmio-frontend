import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { parseCallbackUrl, type ManualConnect } from '@/hooks/useRetailConnect'

interface Props {
  manual: ManualConnect | null
  onClose: () => void
  onSubmit: (args: { code: string; state: string }) => void
  pending: boolean
}

/** Paste-the-address fallback for partners whose redirect cannot land in this app. */
export function RetailConnectManualDialog({ manual, onClose, onSubmit, pending }: Props) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const [invalid, setInvalid] = useState(false)

  const submit = () => {
    const parsed = parseCallbackUrl(value)
    if (!parsed) { setInvalid(true); return }
    setInvalid(false)
    onSubmit(parsed)
  }

  return (
    <Dialog open={!!manual} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('settings.retailProviders.manual.title')}</DialogTitle>
          <DialogDescription>{t('settings.retailProviders.manual.body')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {manual && (
            <a
              href={manual.authorizeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#4F7942] px-4 py-3 text-sm font-semibold text-white"
            >
              <ExternalLink size={16} aria-hidden />
              {t('settings.retailProviders.manual.openLogin', { provider: manual.providerCode === 'KIFLI' ? 'Kifli.hu' : manual.providerCode })}
            </a>
          )}
          <p className="text-xs text-[#6B6460]">{t('settings.retailProviders.manual.steps')}</p>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t('settings.retailProviders.manual.placeholder')}
            aria-invalid={invalid}
            autoFocus
          />
          {invalid && <p className="text-sm text-red-600">{t('settings.retailProviders.manual.invalid')}</p>}
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={onClose}>{t('common.cancel')}</Button>
            <Button className="flex-1" onClick={submit} disabled={pending || !value.trim()}>
              {pending ? <Spinner /> : t('settings.retailProviders.manual.submit')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
