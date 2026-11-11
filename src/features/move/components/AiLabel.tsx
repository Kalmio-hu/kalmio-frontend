import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

/**
 * "MI által készített bemutató" — rendered under every generated image
 * (build contract §1, PRD §16 AI transparency). Never burned into the image.
 */
export function AiLabel({ className }: { className?: string }) {
  const { t } = useTranslation('move')
  return (
    <p className={cn('flex items-center gap-1 text-xs text-gray-500', className)}>
      <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
      {t('brand.aiLabel')}
    </p>
  )
}
