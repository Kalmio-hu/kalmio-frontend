import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { hapticLight } from '@/lib/haptics'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] font-sans font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        primary: 'bg-[#F28C28] text-white hover:bg-[#d97a20] focus-visible:ring-[#F28C28]',
        secondary: 'bg-white text-[#1A1A1A] border border-[#e5e4e7] hover:bg-[#F9F7F2]',
        ghost: 'hover:bg-[#F28C28]/10 text-[#1A1A1A]',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        outline: 'border border-[#F28C28] text-[#F28C28] hover:bg-[#F28C28] hover:text-white',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        hapticLight()
        onClick?.(e)
      },
      [onClick],
    )
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} onClick={handleClick} {...props} />
  }
)
Button.displayName = 'Button'
