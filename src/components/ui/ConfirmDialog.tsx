/**
 * ConfirmDialog — shared destructive-action confirmation component.
 *
 * Usage:
 *   const [open, setOpen] = useState(false)
 *   <ConfirmDialog
 *     open={open}
 *     onOpenChange={setOpen}
 *     title="Töröljem ezt a tételt?"
 *     description="Ez nem vonható vissza."
 *     destructiveLabel="Törlés"
 *     onConfirm={() => doDelete()}
 *   />
 *
 * Mobile (375px): renders as a bottom sheet anchored to the viewport bottom.
 * Desktop (md+): centered modal, max-w-sm.
 *
 * Keyboard: Escape closes without confirming (Radix default).
 * Focus is trapped inside the dialog while open (Radix default).
 */
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  destructiveLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  isPending?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  destructiveLabel,
  cancelLabel,
  onConfirm,
  isPending = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation()

  function handleConfirm() {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Content — bottom sheet on mobile, centered on md+ */}
        <DialogPrimitive.Content
          className={cn(
            // Base
            'fixed z-50 w-full bg-white focus:outline-none',
            // Mobile: bottom sheet
            'bottom-0 left-0 right-0 rounded-t-[20px] px-5 pb-8 pt-6',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
            // md+: centered modal
            'md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2',
            'md:max-w-sm md:rounded-[20px] md:px-6 md:pb-6 md:pt-6',
            'md:data-[state=closed]:slide-out-to-bottom-0 md:data-[state=open]:slide-in-from-bottom-0',
            'md:data-[state=closed]:zoom-out-95 md:data-[state=open]:zoom-in-95',
            'md:data-[state=closed]:fade-out-0 md:data-[state=open]:fade-in-0'
          )}
        >
          {/* Drag handle indicator — mobile only */}
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-gray-200 md:hidden" aria-hidden="true" />

          <DialogPrimitive.Title className="text-base font-headline font-bold text-[#1A1A1A]">
            {title}
          </DialogPrimitive.Title>

          {description && (
            <DialogPrimitive.Description className="mt-1.5 text-sm text-gray-500">
              {description}
            </DialogPrimitive.Description>
          )}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" className="w-full sm:w-auto" disabled={isPending}>
                {cancelLabel ?? t('common.cancel')}
              </Button>
            </DialogPrimitive.Close>
            <Button
              variant="danger"
              className="w-full sm:w-auto"
              onClick={handleConfirm}
              disabled={isPending}
            >
              {destructiveLabel ?? t('common.delete')}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
