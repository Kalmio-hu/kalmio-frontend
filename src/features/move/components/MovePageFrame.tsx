import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MOVE_ACCENT } from '../lib/constants'

interface MovePageFrameProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  /** When true the empty-state card is shown instead of the children. */
  isEmpty?: boolean
  emptyText?: string
  children?: ReactNode
}

/**
 * Page frame shared by every Move destination: header, title, loading / error /
 * empty state. Feature pages keep their body between the comment markers.
 */
export function MovePageFrame({
  title,
  subtitle,
  actions,
  isLoading,
  isError,
  onRetry,
  isEmpty,
  emptyText,
  children,
}: MovePageFrameProps) {
  const { t } = useTranslation('move')
  return (
    <section aria-labelledby="move-page-title">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 id="move-page-title" className="text-2xl font-headline font-bold text-[#1A1A1A]">
            {title}
          </h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12" role="status" aria-live="polite">
          <Spinner className="border-[var(--move-accent)]" />
          <span className="sr-only">{t('common.loading')}</span>
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <p className="text-sm text-gray-600">{t('common.error')}</p>
            {onRetry && (
              <Button variant="secondary" onClick={onRetry} style={{ color: MOVE_ACCENT }}>
                {t('common.retry')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : isEmpty ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-gray-500">{emptyText}</CardContent>
        </Card>
      ) : (
        children
      )}
    </section>
  )
}
