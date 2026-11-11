import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { MOVE_ACCENT } from '../lib/constants'

/**
 * Same logo and type as the nutrition shell with a "Move" suffix (D8 rule 8).
 */
export function MoveWordmark({ className, dark = false }: { className?: string; dark?: boolean }) {
  const { t } = useTranslation('move')
  return (
    <span className={cn('inline-flex items-end gap-1.5', className)} aria-label={t('brand.name')}>
      <img
        src="/assets/images/logo.png"
        alt="Kalmio"
        className={cn('h-9 object-contain object-left', dark ? '' : 'brightness-0')}
      />
      <span
        className="font-headline font-bold text-lg leading-none pb-1 tracking-tight"
        style={{ color: MOVE_ACCENT }}
      >
        {t('brand.suffix')}
      </span>
    </span>
  )
}
