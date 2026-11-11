/**
 * Minimal chrome for the start flow and the public landing: wordmark, an
 * optional back control, no navigation. The player uses its own full screen.
 */
import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { LegalFooter } from '@/components/layout/LegalFooter'
import { MoveWordmark } from '../components/MoveWordmark'
import { MOVE_ACCENT } from '../lib/constants'
import '../move.css'

interface MoveBareLayoutProps {
  children: ReactNode
  onBack?: () => void
  backLabel?: string
  large?: boolean
  actions?: ReactNode
}

export function MoveBareLayout({ children, onBack, backLabel, large, actions }: MoveBareLayoutProps) {
  const { t } = useTranslation('move')
  return (
    <div
      className={cn('move-shell min-h-screen w-full flex flex-col bg-[#F9F7F2]', large && 'move-large-text')}
      style={{ ['--move-accent' as string]: MOVE_ACCENT }}
      data-space="move"
    >
      <header className="h-16 border-b border-[#1A1A1A]/8 bg-[#F9F7F2]">
        <div className="max-w-3xl mx-auto px-4 h-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label={backLabel ?? t('common.back')}
                className="inline-flex items-center justify-center p-3 rounded-lg text-gray-600 hover:bg-black/5"
              >
                <ArrowLeft className="h-5 w-5" aria-hidden />
              </button>
            )}
            <MoveWordmark />
          </div>
          {actions}
        </div>
      </header>
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 move-body">{children}</main>
      <LegalFooter variant="light" />
    </div>
  )
}
