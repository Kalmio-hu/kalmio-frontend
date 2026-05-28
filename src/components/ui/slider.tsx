import { cn } from '@/lib/utils'
import { hapticSelection } from '@/lib/haptics'

interface SliderProps {
  value: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  onChange: (value: number) => void
  className?: string
}

export function Slider({ value, min = 0, max = 100, step = 1, disabled, onChange, className }: SliderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={e => { hapticSelection(); onChange(Number(e.target.value)) }}
      className={cn(
        'w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#4F7942]',
        disabled && 'opacity-40 cursor-not-allowed',
        className,
      )}
    />
  )
}
